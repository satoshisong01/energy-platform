/**
 * [PDF 페이지 3] 월별 설치 전/후 전기요금 라인 차트
 *
 * recharts 는 PDF 에서 직접 사용 불가 → @react-pdf 의 <Svg> 로 SVG 직접 그림.
 */
import React from 'react';
import { Page, View, Text, Svg, Line, Polyline, Circle, Text as SvgText } from '@react-pdf/renderer';
import { pdfStyles as s, PDF_COLORS, PAGE_SIZE, PAGE_ORIENTATION } from './pdfTheme';

export interface Page3Data {
  monthly: Array<{
    name: string;
    설치전: number; // 만원 단위
    설치후: number;
  }>;
  savingRate: number;
  customSavingRate: number;
  contractType: string;
  baseRate: number;
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

/** 라인 차트 SVG 직접 렌더 */
const LineChartSvg: React.FC<{ data: Page3Data['monthly'] }> = ({ data }) => {
  const WIDTH = 720;
  const HEIGHT = 240;
  const PAD_L = 50;
  const PAD_R = 20;
  const PAD_T = 20;
  const PAD_B = 30;
  const innerW = WIDTH - PAD_L - PAD_R;
  const innerH = HEIGHT - PAD_T - PAD_B;

  if (data.length === 0) {
    return (
      <Svg width={WIDTH} height={HEIGHT}>
        <SvgText x={WIDTH / 2} y={HEIGHT / 2} style={{ fontSize: 10, color: PDF_COLORS.textLight }}>
          데이터 없음
        </SvgText>
      </Svg>
    );
  }

  const allVals = data.flatMap((d) => [d.설치전, d.설치후]);
  const maxY = Math.max(...allVals, 1);
  const yStep = innerH / maxY;
  const xStep = innerW / (data.length - 1 || 1);

  const buildPoints = (key: '설치전' | '설치후') =>
    data
      .map((d, i) => `${PAD_L + i * xStep},${PAD_T + innerH - d[key] * yStep}`)
      .join(' ');

  const yTicks = 5;
  const tickVals = Array.from({ length: yTicks + 1 }, (_, i) =>
    Math.round((maxY / yTicks) * i)
  );

  return (
    <Svg width={WIDTH} height={HEIGHT}>
      {/* Y축 grid + 라벨 */}
      {tickVals.map((v, i) => {
        const y = PAD_T + innerH - (v / maxY) * innerH;
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
              x={PAD_L - 5}
              y={y + 3}
              style={{ fontSize: 7, color: PDF_COLORS.textLight }}
            >
              {`${v}만`}
            </SvgText>
          </React.Fragment>
        );
      })}

      {/* X축 라벨 */}
      {data.map((d, i) => (
        <SvgText
          key={i}
          x={PAD_L + i * xStep}
          y={HEIGHT - PAD_B + 12}
          style={{ fontSize: 7, color: PDF_COLORS.textLight }}
        >
          {d.name}
        </SvgText>
      ))}

      {/* 설치전 라인 (blue) */}
      <Polyline
        points={buildPoints('설치전')}
        fill="none"
        stroke={PDF_COLORS.primary}
        strokeWidth={1.5}
      />
      {data.map((d, i) => (
        <Circle
          key={`pre-${i}`}
          cx={PAD_L + i * xStep}
          cy={PAD_T + innerH - d.설치전 * yStep}
          r={2}
          fill={PDF_COLORS.primary}
        />
      ))}

      {/* 설치후 라인 (orange) */}
      <Polyline
        points={buildPoints('설치후')}
        fill="none"
        stroke="#f97316"
        strokeWidth={1.5}
      />
      {data.map((d, i) => (
        <Circle
          key={`post-${i}`}
          cx={PAD_L + i * xStep}
          cy={PAD_T + innerH - d.설치후 * yStep}
          r={2}
          fill="#f97316"
        />
      ))}
    </Svg>
  );
};

export const PdfPage3Chart: React.FC<{ data: Page3Data }> = ({ data }) => (
  <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
    <HeaderRow />
    <Text style={s.sectionTitlePill}>03. 월별 전기요금 절감 효과 분석</Text>

    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
        marginBottom: 4,
      }}
    >
      <Text style={{ fontSize: 8, color: PDF_COLORS.textMuted }}>
        예상 절감율{' '}
        <Text style={{ color: '#22c55e', fontWeight: 800 }}>
          {data.savingRate.toFixed(1)}% ▼
        </Text>
      </Text>
      <Text style={{ fontSize: 8, color: PDF_COLORS.textMuted }}>
        전기 절감율{' '}
        <Text style={{ color: '#22c55e', fontWeight: 800 }}>
          {data.customSavingRate.toFixed(1)}% ▼
        </Text>
      </Text>
    </View>

    {/* 차트 영역 */}
    <View
      style={{
        border: `1px solid ${PDF_COLORS.border}`,
        borderRadius: 4,
        padding: 8,
        backgroundColor: PDF_COLORS.bgWhite,
        alignItems: 'center',
      }}
    >
      <LineChartSvg data={data.monthly} />

      {/* 범례 */}
      <View
        style={{
          flexDirection: 'row',
          gap: 14,
          marginTop: 6,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View
            style={{
              width: 10,
              height: 3,
              backgroundColor: PDF_COLORS.primary,
            }}
          />
          <Text style={{ fontSize: 7, color: PDF_COLORS.text }}>설치 전</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <View
            style={{ width: 10, height: 3, backgroundColor: '#f97316' }}
          />
          <Text style={{ fontSize: 7, color: PDF_COLORS.text }}>
            설치 후 (예상)
          </Text>
        </View>
      </View>
    </View>

    <Text
      style={{
        fontSize: 7,
        color: PDF_COLORS.textLight,
        marginTop: 6,
        textAlign: 'right',
      }}
    >
      * 적용 단가: {data.contractType} ({data.baseRate.toLocaleString()}원) 기준
      시뮬레이션
    </Text>

    <View style={s.footer} fixed>
      <Text>- {data.pageNumber} -</Text>
      <Text>{data.fileName}</Text>
    </View>
  </Page>
);
