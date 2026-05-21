/**
 * [PDF 페이지 6] RE100 에너지 발전 수익 분석 그래프 (일일 평균)
 * 시간대별 (24시간) 발전·사용·EC 방전 패턴 차트
 *
 * 주의: SVG <Text>는 Pretendard(한글) 폰트 fallback이 깨져 한글이 '0' 등으로
 *       잘못 렌더되므로, X축 라벨은 SVG 밖에서 일반 <Text>로 오버레이.
 */
import React from 'react';
import {
  Page,
  View,
  Text,
  Svg,
  Path,
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

const WIDTH = 760;
const HEIGHT = 320;
const PAD_L = 50;
const PAD_R = 20;
const PAD_T = 20;
const PAD_B = 30;
const innerW = WIDTH - PAD_L - PAD_R;
const innerH = HEIGHT - PAD_T - PAD_B;

/** Catmull-Rom 스플라인 → 베지어 변환 (부드러운 열린 곡선) */
const buildSmoothPath = (points: Array<[number, number]>): string => {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0][0]},${points[0][1]}`;
  if (points.length === 2) {
    return `M ${points[0][0]},${points[0][1]} L ${points[1][0]},${points[1][1]}`;
  }
  let d = `M ${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
};

/** 부드러운 닫힌 영역 path: top 곡선 → 끝점에서 bottom 곡선 역방향 → 닫기 */
const buildClosedAreaPath = (
  topPoints: Array<[number, number]>,
  bottomPoints: Array<[number, number]>
): string => {
  if (topPoints.length === 0 || bottomPoints.length === 0) return '';
  const topPath = buildSmoothPath(topPoints);
  // bottom을 역순으로 → L 명령으로 끝점 이동 → 부드러운 역방향 곡선
  const reversedBottom = [...bottomPoints].reverse();
  const last = topPoints[topPoints.length - 1];
  const firstBot = reversedBottom[0];
  // 끝점에서 bottom 시작점으로 line, 그 후 bottom 곡선
  let path = topPath + ` L ${firstBot[0].toFixed(2)},${firstBot[1].toFixed(2)}`;
  // bottom 곡선 (smooth path를 M부터 다시 만들지 않고 첫 점만 건너뛰고 C 명령만 이어붙임)
  for (let i = 0; i < reversedBottom.length - 1; i++) {
    const p0 = reversedBottom[Math.max(0, i - 1)];
    const p1 = reversedBottom[i];
    const p2 = reversedBottom[i + 1];
    const p3 = reversedBottom[Math.min(reversedBottom.length - 1, i + 2)];
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    path += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  path += ' Z';
  // 안전장치: 사용 안 함
  void last;
  return path;
};

const HourlyChartSvg: React.FC<{
  data: Page6HourlyData[];
  isEcActive: boolean;
}> = ({ data, isEcActive }) => {
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

  // 잉여 영역: generation > usage 인 연속 구간을 찾아 closed smooth area로 채우기
  const surplusSegments: Array<Array<number>> = [];
  let current: Array<number> = [];
  for (let i = 0; i < data.length; i++) {
    if (data[i].generation > data[i].usage) {
      current.push(i);
    } else if (current.length > 0) {
      surplusSegments.push(current);
      current = [];
    }
  }
  if (current.length > 0) surplusSegments.push(current);

  const surplusPaths = surplusSegments
    .filter((seg) => seg.length >= 2)
    .map((seg) => {
      const top = seg.map<[number, number]>((i) => [
        PAD_L + i * xStep,
        yPos(data[i].generation),
      ]);
      const bot = seg.map<[number, number]>((i) => [
        PAD_L + i * xStep,
        yPos(data[i].usage),
      ]);
      return buildClosedAreaPath(top, bot);
    });

  const yTicks = 5;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxY / yTicks) * i)
  );

  return (
    <Svg width={WIDTH} height={HEIGHT}>
      {/* Y축 grid + 라벨 (숫자만 — 한글 fallback 회피) */}
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
              style={{ fontSize: 7, color: PDF_COLORS.textLight }}
            >
              {String(v)}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* 잉여 영역 (부드러운 closed area, 빨강 옅은) */}
      {surplusPaths.map((d, i) => (
        <Path
          key={`surp-${i}`}
          d={d}
          fill="#ef4444"
          fillOpacity={0.18}
          stroke="none"
        />
      ))}

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

      {/* EC 방전 (초록 점선) */}
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

/** SVG 외부에 일반 <Text>로 X축 라벨을 오버레이 (한글 정상 렌더용) */
const XAxisLabelsOverlay: React.FC<{ data: Page6HourlyData[] }> = ({ data }) => {
  const xStep = innerW / (data.length - 1 || 1);
  return (
    <View
      style={{
        position: 'absolute',
        left: 0,
        top: HEIGHT - PAD_B + 4,
        width: WIDTH,
        height: 14,
      }}
    >
      {data.map((d, i) => {
        if (i % 3 !== 0) return null;
        const x = PAD_L + i * xStep;
        return (
          <Text
            key={i}
            style={{
              position: 'absolute',
              left: x - 14,
              top: 0,
              width: 28,
              fontSize: 7,
              color: PDF_COLORS.textLight,
              textAlign: 'center',
            }}
          >
            {`${d.hour}시`}
          </Text>
        );
      })}
    </View>
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

      {/* 차트 + X축 라벨 오버레이를 한 컨테이너에 절대 좌표로 겹침 */}
      <View style={{ position: 'relative', width: WIDTH, height: HEIGHT + 4 }}>
        <HourlyChartSvg data={data.hourly} isEcActive={data.isEcActive} />
        <XAxisLabelsOverlay data={data.hourly} />
      </View>

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
