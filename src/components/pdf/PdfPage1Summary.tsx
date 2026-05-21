/**
 * [PDF 페이지 1] 표지 + 01. RE100 에너지 발전 수익 분석 (종합)
 *
 * 화면 미리보기의 PreviewPanel + PreviewSummary 페이지 1과 동일 정보를
 * react-pdf 컴포넌트로 재구성. 청정수소 발전 모드도 동일하게 처리.
 */
import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import {
  pdfStyles as s,
  PDF_COLORS,
  fmt,
  PAGE_SIZE,
  PAGE_ORIENTATION,
} from './pdfTheme';
import type { HydrogenComparisonResult } from '../../lib/hydrogenCalculations';

export interface Page1Data {
  clientName: string;
  contractType: string;
  capacityKw: number;
  isSurplusDiscarded: boolean;
  isEcSelfConsumption: boolean;
  ecSelfConsumptionCount: number;
  useEc: boolean;
  truckCount: number;
  solarRadiation: number;
  showHydrogen: boolean;
  hydrogenPriceNormal: number;
  hydrogenPriceClean: number;
  pricePerMwUk: number;
  hydrogenMaterialCost: number;
  hydrogenOmRate: number;
  // 한전 박스용
  kepcoInvestUk: number;
  kepcoAnnualGen: number;
  kepcoAnnualProfitUk: number;
  kepcoAnnualRatio: number;
  kepcoTotal20Uk: number;
  kepcoTotalRatio: number;
  kepcoRoiYears: number;
  // TYPE A 카드용 (RE100 1.5)
  stdInvest: number;
  stdAnnualProfit: number;
  stdTotalProfit20: number;
  stdRoiYears: number;
  stdProfitRate: number;
  stdEcCount: number;
  // RE100 % / 절감 %
  re100Rate: number;
  customSavingRate: number;
  // 비교 섹션
  simpleRentalUk: number;
  simpleRentalSaveRate: number;
  re100RentalUk: number;
  re100RentalSaveRate: number;
  subRevenueUk: number;
  subSaveRate: number;
  shareRevenueAvgUk: number;
  shareSaveRate: number;
  showRentSub: boolean;
  // 수소 모드용
  hydrogen?: HydrogenComparisonResult;
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

const TitleSection: React.FC<{ d: Page1Data }> = ({ d }) => {
  const ecText = d.isEcSelfConsumption
    ? `, 자가소비 EC ${d.ecSelfConsumptionCount}대`
    : d.useEc && d.truckCount > 0
    ? `, 이동형 EC ${d.truckCount}대`
    : '';
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
      <View>
        <Text style={s.mainTitle}>
          <Text style={s.mainTitleHighlight}>RE100</Text>{' '}
          {d.showHydrogen ? '청정수소 발전 분석자료' : '에너지 발전시스템 분석자료'}
        </Text>
        <Text style={s.subTitle}>
          - {d.clientName} (
          {d.showHydrogen
            ? '청정수소 발전'
            : `태양광발전 ${d.capacityKw.toLocaleString()}kW${ecText}`}
          ) -
        </Text>
        {!d.showHydrogen && (
          <Text style={s.noteText}>* 적용 일조량: {d.solarRadiation} 시간/일</Text>
        )}
      </View>
      {!d.showHydrogen && (
        <View
          style={{
            border: `1px solid ${PDF_COLORS.borderStrong}`,
            borderRadius: 3,
            padding: 5,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 6, color: PDF_COLORS.textMuted }}>적용 계약 종별</Text>
          <Text style={{ fontSize: 8, fontWeight: 700, color: PDF_COLORS.text }}>
            {d.contractType}
          </Text>
        </View>
      )}
    </View>
  );
};

// 청정수소 발전 박스 (수소 모드에서만 표시)
const HydrogenBox: React.FC<{ d: Page1Data }> = ({ d }) => {
  const h = d.hydrogen;
  if (!h || !h.isValid) return null;
  return (
    <View
      style={{
        backgroundColor: PDF_COLORS.bgLightCyan,
        border: `1px solid #67e8f9`,
        borderRadius: 4,
        padding: 6,
        marginVertical: 6,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginBottom: 4,
        }}
      >
        <Text
          style={{
            backgroundColor: PDF_COLORS.hydrogen,
            color: 'white',
            paddingVertical: 2,
            paddingHorizontal: 6,
            borderRadius: 8,
            fontSize: 7,
            fontWeight: 700,
          }}
        >
          수소발전 역산 비교 (24·365 베이스로드)
        </Text>
        <Text style={{ fontSize: 7, color: '#0e7490' }}>
          1MW당 {d.pricePerMwUk}억
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 4 }}>
        <View style={[s.kepcoCol, { flex: 1.2 }]}>
          <Text style={s.kepcoLabel}>연간 필요 발전량</Text>
          <Text style={[s.kepcoValue, { fontSize: 8 }]}>
            {Math.round(h.annualNeededKwh).toLocaleString()} kWh
          </Text>
          <Text style={{ fontSize: 5, color: PDF_COLORS.textMuted }}>
            ≈ {Math.round(h.dailyNeededKwh).toLocaleString()} kWh/일
          </Text>
        </View>
        <View style={s.kepcoCol}>
          <Text style={s.kepcoLabel}>필요 용량</Text>
          <Text style={[s.kepcoValue, { color: PDF_COLORS.hydrogen, fontSize: 11 }]}>
            {h.requiredCapacityMw.toFixed(2)} MW
          </Text>
          <Text style={{ fontSize: 5, color: PDF_COLORS.textMuted }}>
            ≈ {Math.round(h.requiredCapacityKw).toLocaleString()} kW
          </Text>
          <Text style={{ fontSize: 5, color: PDF_COLORS.textMuted }}>
            {h.rawCapacityKw.toFixed(1)} kW (시간당)
          </Text>
        </View>
        <View style={[s.kepcoCol, { flex: 1.3 }]}>
          <Text style={s.kepcoLabel}>매출 / 비용</Text>
          <View
            style={{
              backgroundColor: PDF_COLORS.bgLightCyan,
              border: '1px solid #67e8f9',
              borderRadius: 3,
              padding: 3,
              marginBottom: 2,
              width: '100%',
            }}
          >
            <Text style={{ fontSize: 5, color: '#0e7490', textAlign: 'center' }}>
              일반수소 {d.hydrogenPriceNormal}원
            </Text>
            <Text
              style={{ fontSize: 8, fontWeight: 800, color: '#0e7490', textAlign: 'center' }}
            >
              {fmt.uk(h.annualRevenueNormal)} 억
            </Text>
            <Text style={{ fontSize: 4, color: '#92400e', textAlign: 'right' }}>
              -재료비 {fmt.uk(h.annualMaterialCost)}억{'\n'}
              -O&M {d.hydrogenOmRate}% ({fmt.uk(h.annualOmCostNormal)}억)
            </Text>
          </View>
          <View
            style={{
              backgroundColor: PDF_COLORS.bgLightGreen,
              border: '1px solid #6ee7b7',
              borderRadius: 3,
              padding: 3,
              width: '100%',
            }}
          >
            <Text style={{ fontSize: 5, color: PDF_COLORS.hydrogenClean, textAlign: 'center' }}>
              청정수소 {d.hydrogenPriceClean}원
            </Text>
            <Text
              style={{
                fontSize: 8,
                fontWeight: 800,
                color: PDF_COLORS.hydrogenClean,
                textAlign: 'center',
              }}
            >
              {fmt.uk(h.annualRevenueClean)} 억
            </Text>
            <Text style={{ fontSize: 4, color: '#92400e', textAlign: 'right' }}>
              -재료비 {fmt.uk(h.annualMaterialCost)}억{'\n'}
              -O&M {d.hydrogenOmRate}% ({fmt.uk(h.annualOmCostClean)}억)
            </Text>
          </View>
        </View>
        <View style={s.kepcoCol}>
          <Text style={s.kepcoLabel}>순수익 / ROI</Text>
          <View
            style={{
              backgroundColor: h.isProfitableNormal ? PDF_COLORS.hydrogen : PDF_COLORS.danger,
              borderRadius: 3,
              padding: 3,
              alignItems: 'center',
              marginBottom: 2,
              width: '100%',
            }}
          >
            <Text style={{ fontSize: 5, color: 'white' }}>
              일반 {fmt.uk(h.annualNetNormal)}억
            </Text>
            <Text style={{ fontSize: 9, fontWeight: 800, color: 'white' }}>
              {h.isProfitableNormal ? `${h.roiYearsNormal.toFixed(2)}년` : '적자'}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: h.isProfitableClean ? PDF_COLORS.hydrogenClean : PDF_COLORS.danger,
              borderRadius: 3,
              padding: 3,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <Text style={{ fontSize: 5, color: 'white' }}>
              청정 {fmt.uk(h.annualNetClean)}억
            </Text>
            <Text style={{ fontSize: 9, fontWeight: 800, color: 'white' }}>
              {h.isProfitableClean ? `${h.roiYearsClean.toFixed(2)}년` : '적자'}
            </Text>
          </View>
        </View>
      </View>
      <Text style={{ fontSize: 5, color: '#0e7490', marginTop: 3 }}>
        * ROI = 투자비 ÷ (매출 - 재료비 - 유지보수). 단가는 [설정]에서 변경 가능.
      </Text>
    </View>
  );
};

// 한전 박스
const KepcoBox: React.FC<{ d: Page1Data }> = ({ d }) => (
  <View style={s.kepcoBox}>
    <Text
      style={{
        backgroundColor: PDF_COLORS.kepco,
        color: 'white',
        paddingVertical: 2,
        paddingHorizontal: 6,
        borderRadius: 8,
        fontSize: 7,
        fontWeight: 700,
        marginRight: 6,
      }}
    >
      한전 장기 계약 (20년)
    </Text>
    <View style={s.kepcoCol}>
      <Text style={s.kepcoLabel}>투자</Text>
      <Text style={s.kepcoValue}>{d.kepcoInvestUk.toFixed(2)} 억</Text>
      <Text style={{ fontSize: 6, color: PDF_COLORS.textLight }}>{d.capacityKw} kW</Text>
    </View>
    <View style={s.kepcoCol}>
      <Text style={s.kepcoLabel}>연간 발전량</Text>
      <Text style={[s.kepcoValue, { fontSize: 8 }]}>
        {Math.round(d.kepcoAnnualGen).toLocaleString()} kWh
      </Text>
    </View>
    <View style={s.kepcoCol}>
      <Text style={s.kepcoLabel}>연간 수익/수익률</Text>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Text style={s.kepcoValue}>{d.kepcoAnnualProfitUk.toFixed(2)} 억</Text>
        <Text style={{ fontSize: 7, color: PDF_COLORS.primaryLight, fontWeight: 700 }}>
          {d.kepcoAnnualRatio.toFixed(2)}%
        </Text>
      </View>
    </View>
    <View style={s.kepcoCol}>
      <Text style={s.kepcoLabel}>20년간 수익</Text>
      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'baseline' }}>
        <Text style={s.kepcoValue}>{d.kepcoTotal20Uk.toFixed(2)} 억</Text>
        <Text style={{ fontSize: 7, color: PDF_COLORS.primaryLight, fontWeight: 700 }}>
          {d.kepcoTotalRatio.toFixed(0)}%
        </Text>
      </View>
      <Text
        style={{
          fontSize: 6,
          color: PDF_COLORS.textMuted,
          backgroundColor: PDF_COLORS.bgGray,
          paddingHorizontal: 4,
          paddingVertical: 1,
          borderRadius: 2,
          marginTop: 1,
        }}
      >
        ROI {d.kepcoRoiYears.toFixed(2)}년
      </Text>
    </View>
  </View>
);

// TYPE A REC 1.5 Plan
const PlanCard: React.FC<{ d: Page1Data }> = ({ d }) => (
  <View>
    <Text
      style={{
        fontSize: 8,
        fontWeight: 800,
        color: PDF_COLORS.primaryLight,
        marginBottom: 3,
      }}
    >
      TYPE A. REC 1.5 Plan
    </Text>
    <View style={s.flowRow}>
      <View style={s.flowCard}>
        <Text style={s.flowCardHeader}>투자 (Investment)</Text>
        <View style={s.flowCardBody}>
          <Text style={s.flowCardValue}>
            {fmt.uk(d.stdInvest * 100000000)} <Text style={s.flowCardUnit}>억원</Text>
          </Text>
          <Text style={s.flowCardUnit}>용량 {d.capacityKw} kW</Text>
          <Text style={s.flowCardUnit}>
            EC설비 {d.stdEcCount > 0 ? `${d.stdEcCount} 대` : '미적용'}
          </Text>
        </View>
      </View>
      <View style={s.flowCard}>
        <Text style={s.flowCardHeader}>연간 수익 (1차년)</Text>
        <View style={s.flowCardBody}>
          <Text style={s.flowCardValue}>
            {d.stdAnnualProfit.toFixed(2)} <Text style={s.flowCardUnit}>억원</Text>
          </Text>
          <Text style={s.flowCardUnit}>REC 1.5 (현행)</Text>
        </View>
      </View>
      <View
        style={{
          width: 50,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 7, color: PDF_COLORS.danger, fontWeight: 800 }}>
          {d.re100Rate.toFixed(0)}% RE100
        </Text>
        <Text style={{ fontSize: 7, color: PDF_COLORS.primaryLight, fontWeight: 800 }}>
          {d.customSavingRate.toFixed(0)}% 절감
        </Text>
      </View>
      <View style={s.flowCard}>
        <Text style={s.flowCardHeader}>20년 누적 수익</Text>
        <View style={s.flowCardBody}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={s.flowCardValue}>
              {d.stdTotalProfit20.toFixed(2)} <Text style={s.flowCardUnit}>억원</Text>
            </Text>
            <Text
              style={{
                fontSize: 7,
                color: PDF_COLORS.primary,
                backgroundColor: '#dbeafe',
                paddingHorizontal: 3,
                paddingVertical: 1,
                borderRadius: 4,
                fontWeight: 800,
              }}
            >
              {d.stdProfitRate.toFixed(0)}%
            </Text>
          </View>
          <Text style={s.flowCardUnit}>ROI {d.stdRoiYears.toFixed(2)}년</Text>
        </View>
      </View>
    </View>
  </View>
);

// 하단 비교 섹션 (단순임대/RE100임대/구독/수익배분형)
const CompSection: React.FC<{ d: Page1Data }> = ({ d }) => (
  <View style={{ marginTop: 4 }}>
    <Text
      style={{
        fontSize: 7,
        fontWeight: 700,
        color: PDF_COLORS.textMuted,
        marginBottom: 3,
      }}
    >
      초기 투자가 없는 모델 (연간 수익 / 절감율)
    </Text>
    <View style={s.compRow}>
      <View style={s.compCard}>
        <Text style={s.compLabel}>단순 지붕 임대</Text>
        <Text style={s.compValue}>{d.simpleRentalUk.toFixed(2)} 억</Text>
        <Text style={{ fontSize: 5, color: PDF_COLORS.textMuted }}>REC 0.0</Text>
        <Text style={{ fontSize: 5, color: PDF_COLORS.primaryLight }}>
          (절감 {d.simpleRentalSaveRate.toFixed(2)}%)
        </Text>
      </View>
      {d.showRentSub && (
        <>
          <View style={s.compCard}>
            <Text style={s.compLabel}>RE100 임대</Text>
            <Text style={s.compValue}>{d.re100RentalUk.toFixed(2)} 억</Text>
            <Text style={{ fontSize: 5, color: PDF_COLORS.primaryLight }}>
              (절감 {d.re100RentalSaveRate.toFixed(2)}%)
            </Text>
          </View>
          <View style={s.compCard}>
            <Text style={s.compLabel}>구독 서비스</Text>
            <Text style={s.compValue}>{d.subRevenueUk.toFixed(2)} 억</Text>
            <Text style={{ fontSize: 5, color: PDF_COLORS.primaryLight }}>
              (절감 {d.subSaveRate.toFixed(2)}%)
            </Text>
          </View>
          <View
            style={[
              s.compCard,
              { backgroundColor: PDF_COLORS.bgLightGreen, borderColor: '#a7f3d0' },
            ]}
          >
            <Text style={[s.compLabel, { color: PDF_COLORS.share, fontWeight: 700 }]}>
              수익배분형
            </Text>
            <Text style={s.compValue}>{d.shareRevenueAvgUk.toFixed(2)} 억</Text>
            <Text style={{ fontSize: 5, color: PDF_COLORS.share }}>
              (절감 {d.shareSaveRate.toFixed(2)}%)
            </Text>
          </View>
        </>
      )}
    </View>
  </View>
);

// 메인 Page 1
export const PdfPage1Summary: React.FC<{ data: Page1Data }> = ({ data }) => (
  <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
    <HeaderRow />
    <TitleSection d={data} />
    <Text style={s.sectionTitlePill}>01. RE100 에너지 발전 수익 분석 (종합)</Text>

    {data.showHydrogen ? (
      // 청정수소 발전 모드: 수소 박스만
      <HydrogenBox d={data} />
    ) : (
      // 일반 모드: 한전 박스 + TYPE A + 비교 섹션
      <>
        {!data.isSurplusDiscarded && <KepcoBox d={data} />}
        <PlanCard d={data} />
        <CompSection d={data} />
      </>
    )}

    {/* 푸터 */}
    <View style={s.footer} fixed>
      <Text>- {data.pageNumber} -</Text>
      <Text>{data.fileName}</Text>
    </View>
  </Page>
);
