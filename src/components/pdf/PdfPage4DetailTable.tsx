/**
 * [PDF 페이지 4] 03. 월별 상세 분석 데이터 (12개월 × 10개 컬럼 표)
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
  paddingHorizontal: 4,
  border: `0.5px solid ${PDF_COLORS.border}`,
  fontSize: 7,
  color: PDF_COLORS.text,
  textAlign: 'right' as const,
};
const cellLeft = { ...cellBase, textAlign: 'left' as const };
const cellCenter = { ...cellBase, textAlign: 'center' as const };
const headerCell = {
  ...cellBase,
  fontSize: 7,
  fontWeight: 700 as const,
  textAlign: 'center' as const,
  backgroundColor: '#f1f5f9',
  color: PDF_COLORS.text,
};
const headerBlue = {
  ...headerCell,
  backgroundColor: '#dbeafe',
  color: PDF_COLORS.primary,
};
const headerOrange = {
  ...headerCell,
  backgroundColor: '#fed7aa',
  color: '#9a3412',
};

// 컬럼 폭 (총 100% 기준)
const colW = {
  month: '4%',
  usage: '8%',
  self: '8%',
  gen: '8%',
  surplus: '8%',
  bill: '10%',
  base: '9%',
  saving: '10%',
  baseSaving: '10%',
  after: '11%',
  surplusRev: '10%',
  // 합 = 96% (총합 미세조정 가능)
};

export const PdfPage4DetailTable: React.FC<{ data: Page4Data }> = ({
  data,
}) => (
  <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
    <HeaderRow />
    <Text style={s.sectionTitlePill}>03. 월별 상세 분석 데이터</Text>

    {/* 표 헤더 (2행) */}
    <View style={{ flexDirection: 'row', marginTop: 4 }}>
      <View style={{ width: colW.month, justifyContent: 'center' }}>
        <Text style={headerCell}>월</Text>
      </View>
      <View style={{ flexDirection: 'column', flex: 1 }}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ width: '17.6%' /* 8+8 = 16% of total but normalized */ }}>
            <Text style={headerCell}>사용량 분석</Text>
          </View>
          <View style={{ width: '17.6%' }}>
            <Text style={headerBlue}>태양광 발전</Text>
          </View>
          <View style={{ width: '20.9%' }}>
            <Text style={headerOrange}>요금 분석 (원)</Text>
          </View>
          <View style={{ width: '43.9%' }}>
            <Text style={headerOrange}>경제성 분석 (원)</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row' }}>
          <Text style={[headerCell, { width: '8.8%' }]}>사용량</Text>
          <Text style={[headerCell, { width: '8.8%' }]}>자가소비</Text>
          <Text style={[headerBlue, { width: '8.8%' }]}>발전량</Text>
          <Text style={[headerBlue, { width: '8.8%' }]}>잉여전력</Text>
          <Text style={[headerOrange, { width: '11%' }]}>기존요금</Text>
          <Text style={[headerOrange, { width: '9.9%' }]}>기본요금</Text>
          <Text style={[headerOrange, { width: '11%' }]}>최대부하절감</Text>
          <Text style={[headerOrange, { width: '11%' }]}>기본요금절감</Text>
          <Text style={[headerOrange, { width: '12.1%' }]}>설치후요금</Text>
          <Text style={[headerOrange, { width: '11%' }]}>잉여수익</Text>
        </View>
      </View>
    </View>

    {/* 표 본문 — 12개월 행 */}
    {data.rows.map((row) => (
      <View key={row.month} style={{ flexDirection: 'row' }}>
        <Text style={[cellCenter, { width: colW.month }]}>{row.month}월</Text>
        <Text style={[cellBase, { width: colW.usage }]}>
          {row.usageKwh.toLocaleString()}
        </Text>
        <Text style={[cellBase, { width: colW.self }]}>
          {row.selfConsumption.toLocaleString()}
        </Text>
        <Text
          style={[
            cellBase,
            { width: colW.gen, color: PDF_COLORS.primary, fontWeight: 700 },
          ]}
        >
          {Math.round(row.solarGeneration).toLocaleString()}
        </Text>
        <Text style={[cellBase, { width: colW.surplus }]}>
          {Math.round(row.surplusPower).toLocaleString()}
        </Text>
        <Text style={[cellBase, { width: colW.bill }]}>
          {Math.round(row.totalBill).toLocaleString()}
        </Text>
        <Text style={[cellBase, { width: colW.base }]}>
          {Math.round(row.baseBill).toLocaleString()}
        </Text>
        <Text
          style={[cellBase, { width: colW.saving, color: '#ea580c' }]}
        >
          {Math.round(row.maxLoadSavings).toLocaleString()}
        </Text>
        <Text
          style={[cellBase, { width: colW.baseSaving, color: '#ea580c' }]}
        >
          {Math.round(row.baseBillSavings).toLocaleString()}
        </Text>
        <Text
          style={[
            cellBase,
            { width: colW.after, color: PDF_COLORS.primary, fontWeight: 700 },
          ]}
        >
          {Math.round(row.afterBill).toLocaleString()}
        </Text>
        <Text
          style={[
            cellBase,
            { width: colW.surplusRev, color: '#16a34a', fontWeight: 700 },
          ]}
        >
          {Math.round(row.surplusRevenue).toLocaleString()}
        </Text>
      </View>
    ))}

    {/* 합계 행 */}
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: '#fef3c7',
      }}
    >
      <Text style={[cellCenter, { width: colW.month, fontWeight: 800 }]}>
        합계
      </Text>
      <Text style={[cellBase, { width: colW.usage, fontWeight: 800 }]}>
        {data.totals.usageKwh.toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: colW.self, fontWeight: 800 }]}>
        {data.totals.selfConsumption.toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: colW.gen, fontWeight: 800, color: PDF_COLORS.primary }]}>
        {Math.round(data.totals.solarGeneration).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: colW.surplus, fontWeight: 800 }]}>
        {Math.round(data.totals.surplusPower).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: colW.bill, fontWeight: 800 }]}>
        {Math.round(data.totals.totalBill).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: colW.base, fontWeight: 800 }]}>
        {Math.round(data.totals.baseBill).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: colW.saving, fontWeight: 800, color: '#ea580c' }]}>
        {Math.round(data.totals.maxLoadSavings).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: colW.baseSaving, fontWeight: 800, color: '#ea580c' }]}>
        {Math.round(data.totals.baseBillSavings).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: colW.after, fontWeight: 800, color: PDF_COLORS.primary }]}>
        {Math.round(data.totals.afterBill).toLocaleString()}
      </Text>
      <Text style={[cellBase, { width: colW.surplusRev, fontWeight: 800, color: '#16a34a' }]}>
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

    {/* 요약 박스 */}
    <View
      style={{
        flexDirection: 'row',
        marginTop: 6,
        gap: 4,
      }}
    >
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
