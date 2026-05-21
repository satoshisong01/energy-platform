/**
 * [PDF 페이지 4] 03. 월별 상세 분석 데이터
 *
 * 11개 컬럼 (월 포함) — 헤더 그룹과 본문 컬럼이 동일한 % 기준으로 정렬되도록
 * 모든 컬럼 폭을 한 곳(COLS)에서 관리.
 */
import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles as s, PDF_COLORS, PAGE_SIZE, PAGE_ORIENTATION } from './pdfTheme';

export interface Page4Row {
  month: number;
  usageKwh: number;
  selfConsumption: number;
  solarGeneration: number;
  surplusPower: number;
  totalBill: number;
  baseBill: number;
  maxLoadSavings: number;
  baseBillSavings: number;
  afterBill: number;
  surplusRevenue: number;
}

export interface Page4Totals {
  usageKwh: number;
  selfConsumption: number;
  solarGeneration: number;
  surplusPower: number;
  totalBill: number;
  baseBill: number;
  maxLoadSavings: number;
  baseBillSavings: number;
  afterBill: number;
  surplusRevenue: number;
}

export interface Page4Data {
  rows: Page4Row[];
  totals: Page4Totals;
  savingRate: number;
  customSavingRate: number;
  maxLoadRatio: number;
  totalBenefit: number;
  energyNote: string;
  fileName: string;
  pageNumber: number;
}

// 컬럼 폭 정의 (% 단위, 합 = 100%)
const COLS = {
  month: 5,
  usage: 8,
  self: 8,
  gen: 9,
  surplus: 8,
  bill: 11,
  base: 10,
  saving: 11,
  baseSaving: 10,
  after: 11,
  surplusRev: 9,
};
// 그룹 헤더 폭 (자식 컬럼 폭 합)
const GROUP = {
  usage: COLS.usage + COLS.self, // 16%
  solar: COLS.gen + COLS.surplus, // 17%
  fee: COLS.bill + COLS.base, // 21%
  econ: COLS.saving + COLS.baseSaving + COLS.after + COLS.surplusRev, // 41%
};

const HeaderRow = () => (
  <View style={s.headerRow}>
    <Text style={s.logoBox}>FIRST C&D</Text>
    <View style={s.companyInfo}>
      <Text style={s.companyName}>(주)퍼스트씨앤디</Text>
      <Text style={s.companySub}>FIRST C&D Inc.</Text>
    </View>
  </View>
);

const cellBase = {
  paddingVertical: 3,
  paddingHorizontal: 3,
  border: `0.5px solid ${PDF_COLORS.border}`,
  fontSize: 7,
  color: PDF_COLORS.text,
  textAlign: 'right' as const,
};
const cellCenter = { ...cellBase, textAlign: 'center' as const };
const headerCell = {
  ...cellCenter,
  fontWeight: 700 as const,
  backgroundColor: '#f1f5f9',
};
const headerBlue = { ...headerCell, backgroundColor: '#dbeafe', color: PDF_COLORS.primary };
const headerOrange = { ...headerCell, backgroundColor: '#fed7aa', color: '#9a3412' };

export const PdfPage4DetailTable: React.FC<{ data: Page4Data }> = ({ data }) => (
  <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
    <HeaderRow />
    <Text style={s.sectionTitlePill}>03. 월별 상세 분석 데이터</Text>

    {/* === 표 헤더 (2단) — '월' 컬럼은 좌측에서 두 줄 전체 높이를 차지 === */}
    <View style={{ flexDirection: 'row' }}>
      {/* 좌측: 월 컬럼 (rowSpan=2 효과 — 우측 컬럼 두 줄의 자연 높이를 따라감) */}
      <View
        style={{
          width: `${COLS.month}%`,
          border: `0.5px solid ${PDF_COLORS.border}`,
          backgroundColor: '#f1f5f9',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 8, fontWeight: 700, color: PDF_COLORS.text }}>월</Text>
      </View>

      {/* 우측: 2단 헤더 (그룹 → 컬럼 라벨) */}
      <View style={{ width: `${100 - COLS.month}%`, flexDirection: 'column' }}>
        {/* 1단: 4개 그룹 헤더 */}
        <View style={{ flexDirection: 'row' }}>
          <Text style={[headerCell, { width: `${(GROUP.usage / (100 - COLS.month)) * 100}%` }]}>
            사용량 분석
          </Text>
          <Text style={[headerBlue, { width: `${(GROUP.solar / (100 - COLS.month)) * 100}%` }]}>
            태양광 발전
          </Text>
          <Text style={[headerOrange, { width: `${(GROUP.fee / (100 - COLS.month)) * 100}%` }]}>
            요금 분석 (원)
          </Text>
          <Text style={[headerOrange, { width: `${(GROUP.econ / (100 - COLS.month)) * 100}%` }]}>
            경제성 분석 (원)
          </Text>
        </View>
        {/* 2단: 개별 컬럼 라벨 */}
        <View style={{ flexDirection: 'row' }}>
          <Text style={[headerCell, { width: `${(COLS.usage / (100 - COLS.month)) * 100}%` }]}>
            사용량
          </Text>
          <Text style={[headerCell, { width: `${(COLS.self / (100 - COLS.month)) * 100}%` }]}>
            자가소비
          </Text>
          <Text style={[headerBlue, { width: `${(COLS.gen / (100 - COLS.month)) * 100}%` }]}>
            발전량
          </Text>
          <Text style={[headerBlue, { width: `${(COLS.surplus / (100 - COLS.month)) * 100}%` }]}>
            잉여전력
          </Text>
          <Text style={[headerOrange, { width: `${(COLS.bill / (100 - COLS.month)) * 100}%` }]}>
            기존요금
          </Text>
          <Text style={[headerOrange, { width: `${(COLS.base / (100 - COLS.month)) * 100}%` }]}>
            기본요금
          </Text>
          <Text style={[headerOrange, { width: `${(COLS.saving / (100 - COLS.month)) * 100}%` }]}>
            최대부하절감
          </Text>
          <Text style={[headerOrange, { width: `${(COLS.baseSaving / (100 - COLS.month)) * 100}%` }]}>
            기본요금절감
          </Text>
          <Text style={[headerOrange, { width: `${(COLS.after / (100 - COLS.month)) * 100}%` }]}>
            설치후요금
          </Text>
          <Text style={[headerOrange, { width: `${(COLS.surplusRev / (100 - COLS.month)) * 100}%` }]}>
            잉여수익
          </Text>
        </View>
      </View>
    </View>

    {/* === 본문 12개월 === */}
    {data.rows.map((row) => (
      <View key={row.month} style={{ flexDirection: 'row' }}>
        <Text style={[cellCenter, { width: `${COLS.month}%` }]}>{row.month}월</Text>
        <Text style={[cellBase, { width: `${COLS.usage}%` }]}>{row.usageKwh.toLocaleString()}</Text>
        <Text style={[cellBase, { width: `${COLS.self}%` }]}>{row.selfConsumption.toLocaleString()}</Text>
        <Text style={[cellBase, { width: `${COLS.gen}%`, color: PDF_COLORS.primary, fontWeight: 700 }]}>
          {Math.round(row.solarGeneration).toLocaleString()}
        </Text>
        <Text style={[cellBase, { width: `${COLS.surplus}%` }]}>{Math.round(row.surplusPower).toLocaleString()}</Text>
        <Text style={[cellBase, { width: `${COLS.bill}%` }]}>{Math.round(row.totalBill).toLocaleString()}</Text>
        <Text style={[cellBase, { width: `${COLS.base}%` }]}>{Math.round(row.baseBill).toLocaleString()}</Text>
        <Text style={[cellBase, { width: `${COLS.saving}%`, color: '#ea580c' }]}>
          {Math.round(row.maxLoadSavings).toLocaleString()}
        </Text>
        <Text style={[cellBase, { width: `${COLS.baseSaving}%`, color: '#ea580c' }]}>
          {Math.round(row.baseBillSavings).toLocaleString()}
        </Text>
        <Text style={[cellBase, { width: `${COLS.after}%`, color: PDF_COLORS.primary, fontWeight: 700 }]}>
          {Math.round(row.afterBill).toLocaleString()}
        </Text>
        <Text style={[cellBase, { width: `${COLS.surplusRev}%`, color: '#16a34a', fontWeight: 700 }]}>
          {Math.round(row.surplusRevenue).toLocaleString()}
        </Text>
      </View>
    ))}

    {/* 합계 행 */}
    <View style={{ flexDirection: 'row', backgroundColor: '#fef3c7' }}>
      <Text style={[cellCenter, { width: `${COLS.month}%`, fontWeight: 800 }]}>합계</Text>
      <Text style={[cellBase, { width: `${COLS.usage}%`, fontWeight: 800 }]}>
        {data.totals.usageKwh.toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: `${COLS.self}%`, fontWeight: 800 }]}>
        {data.totals.selfConsumption.toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: `${COLS.gen}%`, fontWeight: 800, color: PDF_COLORS.primary }]}>
        {Math.round(data.totals.solarGeneration).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: `${COLS.surplus}%`, fontWeight: 800 }]}>
        {Math.round(data.totals.surplusPower).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: `${COLS.bill}%`, fontWeight: 800 }]}>
        {Math.round(data.totals.totalBill).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: `${COLS.base}%`, fontWeight: 800 }]}>
        {Math.round(data.totals.baseBill).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: `${COLS.saving}%`, fontWeight: 800, color: '#ea580c' }]}>
        {Math.round(data.totals.maxLoadSavings).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: `${COLS.baseSaving}%`, fontWeight: 800, color: '#ea580c' }]}>
        {Math.round(data.totals.baseBillSavings).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: `${COLS.after}%`, fontWeight: 800, color: PDF_COLORS.primary }]}>
        {Math.round(data.totals.afterBill).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: `${COLS.surplusRev}%`, fontWeight: 800, color: '#16a34a' }]}>
        {Math.round(data.totals.surplusRevenue).toLocaleString()}
      </Text>
    </View>

    {/* 분석 메모 */}
    {data.energyNote && (
      <View
        style={{
          marginTop: 8,
          padding: 6,
          backgroundColor: PDF_COLORS.bgLightBlue,
          borderLeft: `3px solid ${PDF_COLORS.primary}`,
          borderRadius: 2,
        }}
      >
        <Text style={{ fontSize: 7, color: PDF_COLORS.primary, fontWeight: 700 }}>
          전력 사용 패턴 메모
        </Text>
        <Text style={{ fontSize: 7, color: PDF_COLORS.text, marginTop: 2 }}>
          {data.energyNote}
        </Text>
      </View>
    )}

    {/* 요약 박스 4개 */}
    <View style={{ flexDirection: 'row', marginTop: 6, gap: 4 }}>
      <View style={{ flex: 1, padding: 4, backgroundColor: '#f1f5f9', borderRadius: 3 }}>
        <Text style={{ fontSize: 6, color: PDF_COLORS.textMuted }}>예상 절감율</Text>
        <Text style={{ fontSize: 11, fontWeight: 800, color: '#22c55e' }}>
          {data.savingRate.toFixed(1)}%
        </Text>
      </View>
      <View style={{ flex: 1, padding: 4, backgroundColor: '#f1f5f9', borderRadius: 3 }}>
        <Text style={{ fontSize: 6, color: PDF_COLORS.textMuted }}>전기 절감율</Text>
        <Text style={{ fontSize: 11, fontWeight: 800, color: '#22c55e' }}>
          {data.customSavingRate.toFixed(1)}%
        </Text>
      </View>
      <View style={{ flex: 1, padding: 4, backgroundColor: '#f1f5f9', borderRadius: 3 }}>
        <Text style={{ fontSize: 6, color: PDF_COLORS.textMuted }}>최대 부하율</Text>
        <Text style={{ fontSize: 11, fontWeight: 800, color: PDF_COLORS.primary }}>
          {data.maxLoadRatio.toFixed(1)}%
        </Text>
      </View>
      <View style={{ flex: 1, padding: 4, backgroundColor: '#f1f5f9', borderRadius: 3 }}>
        <Text style={{ fontSize: 6, color: PDF_COLORS.textMuted }}>연간 총 이익</Text>
        <Text style={{ fontSize: 11, fontWeight: 800, color: '#16a34a' }}>
          {Math.round(data.totalBenefit).toLocaleString()}원
        </Text>
      </View>
    </View>

    <View style={s.footer} fixed>
      <Text>- {data.pageNumber} -</Text>
      <Text>{data.fileName}</Text>
    </View>
  </Page>
);
