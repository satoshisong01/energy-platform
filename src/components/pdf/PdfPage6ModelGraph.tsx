/**
 * [PDF 페이지 6] RE100 에너지 발전 수익 분석 그래프 (일일 평균)
 * 시간대별 (24시간) 발전·사용·EC 방전 패턴 차트 (부드러운 곡선)
 */
import React from 'react';
import {
  Page,
  View,
  Text,
  Svg,
  Path,
  Rect,
  Line,
  Text as SvgText,
} from '@react-pdf/renderer';
import { pdfStyles as s, PDF_COLORS, PAGE_SIZE, PAGE_ORIENTATION } from './pdfTheme';

export interface Page6HourlyData {
  hour: number;
  usage: number;
  generation: number;
  surplusVal: number;
  ecDischarge: number;
}

export interface Page6Data {
  hourly: Page6HourlyData[];
  isEcActive: boolean;
  fileName: string;
  pageNumber: number;
}

const HeaderRow = () => (
  <View style={s.headerRow}>
    <Text style={s.logoBox}>FIRST C&D</Text>
    <View style={s.companyInfo}>
      <Text style={s.companyName}>(주)퍼스트씨앤디</Text>
      <Text style={s.companySub}>FIRST C&D Inc.</Text>
    </View>
  </View>
);

/** Catmull-Rom 스플라인 → 베지어 변환으로 부드러운 곡선 생성 */
const buildSmoothPath = (points: Array<[number, number]>): string => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]},${points[0][1]}`;
  if (points.length === 2) {
    return `M ${points[0][0]},${points[0][1]} L ${points[1][0]},${points[1][1]}`;
  }

  let d = `M ${points[0][0]},${points[0][1]}`;
  const tension = 0.5;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1[0] + ((p2[0] - p0[0]) / 6) * tension * 2;
    const cp1y = p1[1] + ((p2[1] - p0[1]) / 6) * tension * 2;
    const cp2x = p2[0] - ((p3[0] - p1[0]) / 6) * tension * 2;
    const cp2y = p2[1] - ((p3[1] - p1[1]) / 6) * tension * 2;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
};

const HourlyChartSvg: React.FC<{
  data: Page6HourlyData[];
  isEcActive: boolean;
}> = ({ data, isEcActive }) => {
  const WIDTH = 760;
  const HEIGHT = 320;
  const PAD_L = 50;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 30;
  const innerW = WIDTH - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;

  const all = data.flatMap((d) => [d.usage, d.generation, d.ecDischarge]);
  const maxY = Math.max(...all, 1);
  const xStep = innerW / (data.length - 1 || 1);

  const yPos = (val: number) => PAD_T + innerH - (val / maxY) * innerH;

  const buildSmoothLine = (key: keyof Page6HourlyData) =>
    buildSmoothPath(
      data.map<[number, number]>((d, i) => [
        PAD_L + i * xStep,
        yPos(d[key] as number),
      ])
    );

  const yTicks = 5;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxY / yTicks) * i)
  );

  return (
    <Svg width={WIDTH} height={HEIGHT}>
      {/* Y축 grid + 라벨 */}
      {tickVals.map((v, i) => {
        const y = yPos(v);
        return (
          <React.Fragment key={i}>
            <Line
              x1={PAD_L}
              y1={y}
              x2={WIDTH - PAD_R}
              y2={y}
              stroke="#f1f5f9"
              strokeWidth={0.5}
              strokeDasharray="2 2"
            />
            <SvgText
              x={PAD_L - 8}
              y={y + 3}
              style={{ fontSize: 7, color: PDF_COLORS.textLight, textAlign: 'right' }}
            >
              {`${v}`}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* X축 라벨 (3시간 간격, 중앙 정렬) */}
      {data.map((d, i) =>
        i % 3 === 0 ? (
          <SvgText
            key={i}
            x={PAD_L + i * xStep - 6}
            y={HEIGHT - PAD_B + 12}
            style={{ fontSize: 7, color: PDF_COLORS.textLight }}
          >
            {`${d.hour}시`}
          </SvgText>
        ) : null
      )}

      {/* 잉여 영역 (빨강 옅은) */}
      {data.map((d, i) => {
        if (d.generation <= d.usage) return null;
        const x = PAD_L + i * xStep - xStep / 2;
        const yTop = yPos(d.generation);
        const yBot = yPos(d.usage);
        return (
          <Rect
            key={`surp-${i}`}
            x={x}
            y={yTop}
            width={xStep}
            height={yBot - yTop}
            fill="#ef4444"
            fillOpacity={0.18}
          />
        );
      })}

      {/* 발전량 곡선 (orange) */}
      <Path
        d={buildSmoothLine('generation')}
        fill="none"
        stroke="#f97316"
        strokeWidth={2}
      />

      {/* 사용량 곡선 (blue) */}
      <Path
        d={buildSmoothLine('usage')}
        fill="none"
        stroke={PDF_COLORS.primary}
        strokeWidth={2}
      />

      {/* EC 방전 곡선 (초록, isEcActive일 때만, 점선) */}
      {isEcActive && (
        <Path
          d={buildSmoothLine('ecDischarge')}
          fill="none"
          stroke="#16a34a"
          strokeWidth={2}
          strokeDasharray="4 2"
        />
      )}
    </Svg>
  );
};

export const PdfPage6ModelGraph: React.FC<{ data: Page6Data }> = ({ data }) => (
  <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
    <HeaderRow />
    <Text style={s.sectionTitlePill}>
      RE100 에너지 발전 수익 분석 그래프 (일일 평균)
    </Text>

    <View
      style={{
        border: `1px solid ${PDF_COLORS.border}`,
        borderRadius: 4,
        padding: 8,
        marginTop: 4,
        alignItems: 'center',
        backgroundColor: PDF_COLORS.bgWhite,
      }}
    >
      <Text
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: PDF_COLORS.text,
          marginBottom: 4,
        }}
      >
        시간대별 전력 수급 패턴 (kW)
      </Text>
      <HourlyChartSvg data={data.hourly} isEcActive={data.isEcActive} />

      {/* 범례 */}
      <View
        style={{
          flexDirection: 'row',
          gap: 16,
          marginTop: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 12, height: 3, backgroundColor: PDF_COLORS.primary }} />
          <Text style={{ fontSize: 8 }}>전력 사용량</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View style={{ width: 12, height: 3, backgroundColor: '#f97316' }} />
          <Text style={{ fontSize: 8 }}>태양광 발전량</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View
            style={{ width: 12, height: 8, backgroundColor: '#ef4444', opacity: 0.18 }}
          />
          <Text style={{ fontSize: 8 }}>잉여 전력</Text>
        </View>
        {data.isEcActive && (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View
              style={{
                width: 12,
                height: 3,
                backgroundColor: '#16a34a',
              }}
            />
            <Text style={{ fontSize: 8 }}>EC 방전</Text>
          </View>
        )}
      </View>
    </View>

    <Text
      style={{
        fontSize: 7,
        color: PDF_COLORS.textLight,
        marginTop: 6,
      }}
    >
      * 시간대별 패턴은 일반 산업용 사용 패턴 + 태양광 발전 패턴 기반 추정치입니다.
    </Text>

    <View style={s.footer} fixed>
      <Text>- {data.pageNumber} -</Text>
      <Text>{data.fileName}</Text>
    </View>
  </Page>
);
