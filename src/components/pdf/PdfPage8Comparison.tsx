/**
 * [PDF 페이지 8] 05. 금융 모델별 수익성 비교 분석 (7컬럼 큰 표)
 * 자기자본 / RPS / 팩토링 / RE100연계 / 구독 / 수익배분형
 */
import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles as s, PDF_COLORS, PAGE_SIZE, PAGE_ORIENTATION } from './pdfTheme';

export interface Page8Data {
  totalInvestment: number;
  rpsEquityRatio: number;
  facLoanRatio: number;
  rpsInterestRate: number;
  facInterestRate: number;
  rpsGracePeriod: number;
  rpsRepaymentPeriod: number;
  facGracePeriod: number;
  facRepaymentPeriod: number;
  recAveragePrice: number;

  displayedAnnualGross: number;
  displayedAnnualNet: number;
  annualMaintenanceCost: number;

  rentalRevenueYr: number;
  subRevenueYr: number;
  shareRevenuePartnerYr: number;
  shareRevenuePartnerAfterYr: number;
  shareRevenueAvgYr: number;
  shareRecCount: number;
  shareRecAnnual: number;
  shareTransferYears: number;

  rpsInterestOnly: number;
  rpsPmt: number;
  facInterestOnly: number;
  facPmt: number;
  rpsNet15: number;
  rpsNet615: number;
  facNet1: number;
  facNet210: number;

  rec1000Common: number;
  rec1000Rent: number;
  rec1000Sub: number;
  recAnnualCommon: number;
  recAnnualRent: number;
  recAnnualSub: number;

  selfFinalProfit: number;
  rpsFinalProfit: number;
  facFinalProfit: number;
  rentalFinalProfit: number;
  subFinalProfit: number;
  shareFinalProfitPartner: number;

  selfAvg: number;
  rpsAvg: number;
  facAvg: number;
  rentalFinalProfitOver20: number;
  subFinalProfitOver20: number;

  selfRoiYears: number;
  rpsRoiYears: number;
  facRoiYears: number;

  shareCompanyPct: number;
  sharePartnerPct: number;
  showRentSub: boolean;

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

const fmtWon = (v: number) => Math.round(v).toLocaleString();
const fmtUk = (v: number) => (v / 100000000).toFixed(2);

const tcell = {
  paddingVertical: 3,
  paddingHorizontal: 3,
  border: `0.5px solid ${PDF_COLORS.border}`,
  fontSize: 6.5,
  color: PDF_COLORS.text,
  textAlign: 'right' as const,
};
const tcellCenter = { ...tcell, textAlign: 'center' as const };
const tcellMuted = { ...tcellCenter, backgroundColor: '#d1d5db', color: '#6b7280' };

// 컬럼 폭 (라벨 12% + 6컬럼 = 100%)
const colW = {
  label: '12%',
  self: '15%',
  rps: '15%',
  fac: '15%',
  rent: '14%',
  sub: '15%',
  share: '14%',
};

export const PdfPage8Comparison: React.FC<{ data: Page8Data }> = ({ data }) => {
  const Empty = ({ w }: { w: string }) => (
    <Text style={[tcellMuted, { width: w }]}>-</Text>
  );

  return (
    <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
      <HeaderRow />
      <Text style={s.sectionTitlePill}>05. 금융 모델별 수익성 비교 분석</Text>

      {/* 헤더 */}
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <Text
          style={[
            tcellCenter,
            { width: colW.label, backgroundColor: PDF_COLORS.borderDark, color: 'white', fontWeight: 700 },
          ]}
        >
          구분
        </Text>
        <Text
          style={[
            tcellCenter,
            { width: colW.self, backgroundColor: '#1e3a8a', color: 'white', fontWeight: 700 },
          ]}
        >
          자기자본{'\n'}(전액투자)
        </Text>
        <Text
          style={[
            tcellCenter,
            { width: colW.rps, backgroundColor: '#475569', color: 'white', fontWeight: 700 },
          ]}
        >
          RPS 정책자금{'\n'}{data.rpsInterestRate}%
        </Text>
        <Text
          style={[
            tcellCenter,
            { width: colW.fac, backgroundColor: '#475569', color: 'white', fontWeight: 700 },
          ]}
        >
          팩토링{'\n'}{data.facInterestRate}%
        </Text>
        {data.showRentSub && (
          <>
            <Text
              style={[
                tcellCenter,
                { width: colW.rent, backgroundColor: '#0f766e', color: 'white', fontWeight: 700 },
              ]}
            >
              RE100연계{'\n'}임대형
            </Text>
            <Text
              style={[
                tcellCenter,
                { width: colW.sub, backgroundColor: '#059669', color: 'white', fontWeight: 700 },
              ]}
            >
              구독{'\n'}서비스
            </Text>
            <Text
              style={[
                tcellCenter,
                { width: colW.share, backgroundColor: '#047857', color: 'white', fontWeight: 700 },
              ]}
            >
              수익배분형{'\n'}고객 {data.sharePartnerPct}% / {data.shareTransferYears}년 이전
            </Text>
          </>
        )}
      </View>

      {/* 1. 초기 투자비 */}
      <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc' }}>
        <Text style={[tcellCenter, { width: colW.label, fontWeight: 800 }]}>
          초기 투자비
        </Text>
        <Text style={[tcell, { width: colW.self, fontWeight: 800 }]}>
          {fmtWon(data.totalInvestment)} 원{'\n'}(자부담 100%)
        </Text>
        <Text style={[tcell, { width: colW.rps }]}>
          {fmtWon(data.totalInvestment)} 원{'\n'}(자부담 {data.rpsEquityRatio}%)
        </Text>
        <Text style={[tcell, { width: colW.fac }]}>
          {fmtWon(data.totalInvestment)} 원{'\n'}(자부담 {100 - data.facLoanRatio}%)
        </Text>
        {data.showRentSub && (
          <>
            <Text style={[tcell, { width: colW.rent, fontWeight: 800 }]}>
              0 원{'\n'}(자부담 0%)
            </Text>
            <Text style={[tcell, { width: colW.sub, fontWeight: 800 }]}>
              0 원{'\n'}(자부담 0%)
            </Text>
            <Text style={[tcell, { width: colW.share, fontWeight: 800 }]}>
              0 원{'\n'}(자부담 0%)
            </Text>
          </>
        )}
      </View>

      {/* 2. 연간 수입 (Gross) */}
      <View style={{ flexDirection: 'row' }}>
        <Text style={[tcellCenter, { width: colW.label, fontWeight: 800 }]}>
          연간 수입 (Gross)
        </Text>
        <Text style={[tcell, { width: colW.self }]}>{fmtWon(data.displayedAnnualGross)} 원</Text>
        <Text style={[tcell, { width: colW.rps }]}>{fmtWon(data.displayedAnnualGross)} 원</Text>
        <Text style={[tcell, { width: colW.fac }]}>{fmtWon(data.displayedAnnualGross)} 원</Text>
        {data.showRentSub && (
          <>
            <Text style={[tcell, { width: colW.rent }]}>{fmtWon(data.rentalRevenueYr)} 원</Text>
            <Text style={[tcell, { width: colW.sub }]}>{fmtWon(data.subRevenueYr)} 원</Text>
            <Text style={[tcell, { width: colW.share, fontSize: 5.5 }]}>
              1~{data.shareTransferYears}년 ({data.sharePartnerPct}%){'\n'}
              {fmtWon(data.shareRevenuePartnerYr)}원{'\n'}
              {data.shareTransferYears + 1}~20년 (100%){'\n'}
              {fmtWon(data.shareRevenuePartnerAfterYr)}원
            </Text>
          </>
        )}
      </View>

      {/* O&M */}
      <View style={{ flexDirection: 'row' }}>
        <Text style={[tcellCenter, { width: colW.label, fontSize: 6, color: PDF_COLORS.textMuted }]}>
          O&M (17년 유상)
        </Text>
        <Text style={[tcell, { width: colW.self, color: PDF_COLORS.danger }]}>
          -{fmtWon(data.annualMaintenanceCost)} 원
        </Text>
        <Text style={[tcell, { width: colW.rps, color: PDF_COLORS.danger }]}>
          -{fmtWon(data.annualMaintenanceCost)} 원
        </Text>
        <Text style={[tcell, { width: colW.fac, color: PDF_COLORS.danger }]}>
          -{fmtWon(data.annualMaintenanceCost)} 원
        </Text>
        {data.showRentSub && (
          <>
            <Empty w={colW.rent} />
            <Empty w={colW.sub} />
            <Empty w={colW.share} />
          </>
        )}
      </View>

      {/* 연간 영업이익 (Net) */}
      <View style={{ flexDirection: 'row', backgroundColor: '#dbeafe' }}>
        <Text style={[tcellCenter, { width: colW.label, fontWeight: 800, color: PDF_COLORS.primary }]}>
          연간 영업이익(Net)
        </Text>
        <Text style={[tcell, { width: colW.self, color: PDF_COLORS.primary, fontWeight: 700 }]}>
          {fmtWon(data.displayedAnnualNet)} 원
        </Text>
        <Text style={[tcell, { width: colW.rps, color: PDF_COLORS.primary, fontWeight: 700 }]}>
          {fmtWon(data.displayedAnnualNet)} 원
        </Text>
        <Text style={[tcell, { width: colW.fac, color: PDF_COLORS.primary, fontWeight: 700 }]}>
          {fmtWon(data.displayedAnnualNet)} 원
        </Text>
        {data.showRentSub && (
          <>
            <Text style={[tcell, { width: colW.rent }]}>{fmtWon(data.rentalRevenueYr)} 원</Text>
            <Text style={[tcell, { width: colW.sub }]}>{fmtWon(data.subRevenueYr)} 원</Text>
            <Text style={[tcell, { width: colW.share, fontSize: 6 }]}>
              {fmtWon(data.shareRevenueAvgYr)}{'\n'}20년 가중평균
            </Text>
          </>
        )}
      </View>

      {/* 금융 비용 4행 */}
      {[
        {
          label: `RPS / 연 이자(1~${data.rpsGracePeriod}년)`,
          rps: `-${fmtWon(data.rpsInterestOnly)} 원`,
        },
        {
          label: `RPS / 연 상환액(${data.rpsGracePeriod + 1}~${data.rpsGracePeriod + data.rpsRepaymentPeriod}년)`,
          rps: `-${fmtWon(Math.abs(data.rpsPmt))} 원`,
        },
        {
          label: `팩토링 / 연 이자(1~${data.facGracePeriod}년)`,
          fac: `-${fmtWon(data.facInterestOnly)} 원`,
        },
        {
          label: `팩토링 / 연 상환액(${data.facGracePeriod + 1}~${data.facGracePeriod + data.facRepaymentPeriod}년)`,
          fac: `-${fmtWon(Math.abs(data.facPmt))} 원`,
        },
      ].map((row, i) => (
        <View key={i} style={{ flexDirection: 'row' }}>
          <Text style={[tcellCenter, { width: colW.label, fontSize: 6, color: PDF_COLORS.textMuted }]}>
            {row.label}
          </Text>
          <Empty w={colW.self} />
          <Text
            style={[
              row.rps ? { ...tcell, color: PDF_COLORS.danger } : tcellMuted,
              { width: colW.rps },
            ]}
          >
            {row.rps || '-'}
          </Text>
          <Text
            style={[
              row.fac ? { ...tcell, color: PDF_COLORS.danger } : tcellMuted,
              { width: colW.fac },
            ]}
          >
            {row.fac || '-'}
          </Text>
          {data.showRentSub && (
            <>
              <Empty w={colW.rent} />
              <Empty w={colW.sub} />
              <Empty w={colW.share} />
            </>
          )}
        </View>
      ))}

      {/* 1 REC */}
      <View style={{ flexDirection: 'row', backgroundColor: '#dbeafe' }}>
        <Text style={[tcellCenter, { width: colW.label, fontWeight: 800 }]}>1 REC (1,000kW)</Text>
        <Text style={[tcell, { width: colW.self, color: PDF_COLORS.primary }]}>
          {data.rec1000Common.toFixed(1)}
        </Text>
        <Text style={[tcell, { width: colW.rps, color: PDF_COLORS.primary }]}>
          {data.rec1000Common.toFixed(1)}
        </Text>
        <Text style={[tcell, { width: colW.fac, color: PDF_COLORS.primary }]}>
          {data.rec1000Common.toFixed(1)}
        </Text>
        {data.showRentSub && (
          <>
            <Text style={[tcell, { width: colW.rent, color: PDF_COLORS.primary }]}>
              {data.rec1000Rent.toFixed(1)}
            </Text>
            <Text style={[tcell, { width: colW.sub, color: PDF_COLORS.primary }]}>
              {data.rec1000Sub.toFixed(1)}
            </Text>
            <Text style={[tcell, { width: colW.share, color: PDF_COLORS.primary }]}>
              {data.shareRecCount.toFixed(1)}
            </Text>
          </>
        )}
      </View>

      {/* REC 수익/연간 */}
      <View style={{ flexDirection: 'row' }}>
        <Text style={[tcellCenter, { width: colW.label, fontWeight: 800, color: '#1d4ed8' }]}>
          REC수익/연간
        </Text>
        <Text style={[tcell, { width: colW.self }]}>{fmtWon(data.recAnnualCommon)} 원</Text>
        <Text style={[tcell, { width: colW.rps }]}>{fmtWon(data.recAnnualCommon)} 원</Text>
        <Text style={[tcell, { width: colW.fac }]}>{fmtWon(data.recAnnualCommon)} 원</Text>
        {data.showRentSub && (
          <>
            <Text style={[tcell, { width: colW.rent }]}>{fmtWon(data.recAnnualRent)} 원</Text>
            <Text style={[tcell, { width: colW.sub }]}>{fmtWon(data.recAnnualSub)} 원</Text>
            <Text style={[tcell, { width: colW.share }]}>{fmtWon(data.shareRecAnnual)} 원</Text>
          </>
        )}
      </View>

      {/* 실제 수익 (20년) */}
      <View style={{ flexDirection: 'row', backgroundColor: '#312e81' }}>
        <Text style={[tcellCenter, { width: colW.label, color: 'white', fontWeight: 800 }]}>
          실제 수익 (20년)
        </Text>
        <Text style={[tcell, { width: colW.self, color: 'white', fontWeight: 800 }]}>
          {fmtUk(data.selfFinalProfit)} 억원
        </Text>
        <Text style={[tcell, { width: colW.rps, color: 'white', fontWeight: 800 }]}>
          {fmtUk(data.rpsFinalProfit)} 억원
        </Text>
        <Text style={[tcell, { width: colW.fac, color: 'white', fontWeight: 800 }]}>
          {fmtUk(data.facFinalProfit)} 억원
        </Text>
        {data.showRentSub && (
          <>
            <Text style={[tcell, { width: colW.rent, color: 'white', fontWeight: 800 }]}>
              {fmtUk(data.rentalFinalProfit)} 억원
            </Text>
            <Text style={[tcell, { width: colW.sub, color: 'white', fontWeight: 800 }]}>
              {fmtUk(data.subFinalProfit)} 억원
            </Text>
            <Text style={[tcell, { width: colW.share, color: 'white', fontWeight: 800 }]}>
              {fmtUk(data.shareFinalProfitPartner)} 억원
            </Text>
          </>
        )}
      </View>

      {/* 20년 수익 평균치 */}
      <View style={{ flexDirection: 'row', backgroundColor: '#f1f5f9' }}>
        <Text style={[tcellCenter, { width: colW.label, fontSize: 6, color: PDF_COLORS.textMuted }]}>
          20년 수익 평균치
        </Text>
        <Text style={[tcell, { width: colW.self }]}>{fmtWon(data.selfAvg)} 원</Text>
        <Text style={[tcell, { width: colW.rps }]}>{fmtWon(data.rpsAvg)} 원</Text>
        <Text style={[tcell, { width: colW.fac }]}>{fmtWon(data.facAvg)} 원</Text>
        {data.showRentSub && (
          <>
            <Text style={[tcell, { width: colW.rent }]}>{fmtWon(data.rentalFinalProfitOver20)} 원</Text>
            <Text style={[tcell, { width: colW.sub }]}>{fmtWon(data.subFinalProfitOver20)} 원</Text>
            <Text style={[tcell, { width: colW.share }]}>{fmtWon(data.shareRevenueAvgYr)} 원</Text>
          </>
        )}
      </View>

      {/* ROI */}
      <View style={{ flexDirection: 'row', backgroundColor: '#e2e8f0' }}>
        <Text style={[tcellCenter, { width: colW.label, fontWeight: 800 }]}>
          ROI (회수기간)
        </Text>
        <Text style={[tcell, { width: colW.self, fontWeight: 800 }]}>
          {data.selfRoiYears.toFixed(2)} 년
        </Text>
        <Text style={[tcell, { width: colW.rps, fontWeight: 800 }]}>
          {data.rpsRoiYears.toFixed(2)} 년
        </Text>
        <Text style={[tcell, { width: colW.fac, fontWeight: 800 }]}>
          {data.facRoiYears.toFixed(2)} 년
        </Text>
        {data.showRentSub && (
          <>
            <Empty w={colW.rent} />
            <Empty w={colW.sub} />
            <Empty w={colW.share} />
          </>
        )}
      </View>

      {/* 안내 박스: 수익배분형 */}
      {data.showRentSub && (
        <View
          style={{
            marginTop: 4,
            padding: 5,
            backgroundColor: PDF_COLORS.bgLightGreen,
            border: `1px solid #6ee7b7`,
            borderLeft: `3px solid ${PDF_COLORS.share}`,
            borderRadius: 2,
          }}
        >
          <Text style={{ fontSize: 7, color: '#065f46', lineHeight: 1.4 }}>
            🤝{' '}
            <Text style={{ fontWeight: 800 }}>수익배분형:</Text> 고객사는 자가소비 없이{' '}
            <Text style={{ fontWeight: 800 }}>지붕만 임대</Text>하고, 설치된 태양광
            패널의 발전 전력을{' '}
            <Text style={{ fontWeight: 800 }}>전량 한전에 판매</Text>합니다. 초기 투자비 부담 없이 1~
            {data.shareTransferYears}년차 판매 매출의{' '}
            <Text style={{ fontWeight: 800 }}>{data.sharePartnerPct}%를 지붕임대인</Text>이
            수령하며,{' '}
            <Text style={{ fontWeight: 800 }}>{data.shareTransferYears}년 후</Text> 발전설비
            소유권을 무상으로 이전받아{' '}
            <Text style={{ fontWeight: 800 }}>
              {data.shareTransferYears + 1}~20년차는 판매 매출 전액(100%)이 귀속
            </Text>
            됩니다.
          </Text>
        </View>
      )}

      <View style={s.footer} fixed>
        <Text>- {data.pageNumber} -</Text>
        <Text>{data.fileName}</Text>
      </View>
    </Page>
  );
};
