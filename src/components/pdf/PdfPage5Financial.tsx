/**
 * [PDF 페이지 5] 04. 투자 및 수익성 분석 상세
 * A. 초기 투자비 표 + B. 연간 수익 분석 표 + 20년 누적 결론
 */
import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles as s, PDF_COLORS, PAGE_SIZE, PAGE_ORIENTATION } from './pdfTheme';

export interface Page5Data {
  selectedModel: 'KEPCO' | 'RE100' | 'REC5';
  moduleTier: string;
  ecStatus: string;
  maintenanceRate: number;

  // A. 초기 투자비
  solarCount: number;
  solarPrice: number;
  solarCost: number;
  activeEcCount: number;
  ecUnitPrice: number;
  ecCost: number;
  tractorCount: number;
  tractorPrice: number;
  tractorCost: number;
  platformCount: number;
  platformPrice: number;
  platformCost: number;
  totalInvestmentUk: number;
  totalInvest20Uk: number;

  // B. 연간 수익
  volumeSelf: number;
  appliedSavingsPrice: number;
  revenueSaving: number;
  surplusVolume: number;
  kepcoUnitPrice: number;
  revenueSurplus: number;
  volumeEc: number;
  appliedSellPrice: number;
  revenueEc: number;
  revenueBaseBillSavings: number;
  displayedAnnualGross: number;
  annualMaintenanceCost: number;
  laborCostWon: number;
  displayedAnnualNet: number;

  // 20년 누적
  totalSolarRevenue20: number;
  totalRationalization20: number;
  totalMaintenance20: number;
  selfFinalProfit: number;
  profitRate: number;

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

const tcell = {
  paddingVertical: 3,
  paddingHorizontal: 4,
  border: `0.5px solid ${PDF_COLORS.border}`,
  fontSize: 8,
  color: PDF_COLORS.text,
  textAlign: 'right' as const,
};
const tcellLeft = { ...tcell, textAlign: 'left' as const };
const tcellCenter = { ...tcell, textAlign: 'center' as const };
const thead = {
  ...tcellCenter,
  fontWeight: 700 as const,
  color: 'white',
};
const fmtUk = (v: number) => (v / 100000000).toFixed(2);

export const PdfPage5Financial: React.FC<{ data: Page5Data }> = ({ data }) => (
  <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
    <HeaderRow />
    <Text style={s.sectionTitlePill}>04. 투자 및 수익성 분석 상세</Text>

    {/* 요약 박스 4개 */}
    <View
      style={{
        flexDirection: 'row',
        gap: 4,
        marginBottom: 6,
      }}
    >
      {[
        { label: '사업 모델', value: data.selectedModel },
        { label: '모듈 등급', value: data.moduleTier },
        { label: 'EC 운용', value: data.ecStatus },
        { label: '유지보수율', value: `${data.maintenanceRate}%` },
      ].map((item, i) => (
        <View
          key={i}
          style={{
            flex: 1,
            padding: 4,
            backgroundColor: PDF_COLORS.bgGray,
            borderRadius: 3,
            alignItems: 'center',
          }}
        >
          <Text style={{ fontSize: 7, color: PDF_COLORS.textMuted }}>
            {item.label}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: 800, color: PDF_COLORS.text }}>
            {item.value}
          </Text>
        </View>
      ))}
    </View>

    <View style={{ flexDirection: 'row', gap: 6 }}>
      {/* A. 초기 투자비 표 */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: PDF_COLORS.text,
            backgroundColor: '#e9d5ff',
            paddingVertical: 3,
            paddingHorizontal: 4,
            marginBottom: 2,
          }}
        >
          A. 초기 투자비 (단위: 억원)
        </Text>
        <View style={{ flexDirection: 'row', backgroundColor: '#7c3aed' }}>
          <Text style={[thead, { width: '24%' }]}>구분</Text>
          <Text style={[thead, { width: '18%' }]}>규격</Text>
          <Text style={[thead, { width: '15%' }]}>수량</Text>
          <Text style={[thead, { width: '20%' }]}>단가(억)</Text>
          <Text style={[thead, { width: '23%' }]}>합계(억)</Text>
        </View>
        {[
          {
            구분: '태양광',
            규격: '100 kW',
            수량: `${data.solarCount.toFixed(2)} ea`,
            단가: data.solarPrice.toFixed(2),
            합계: data.solarCost.toFixed(2),
          },
          {
            구분: '에너지캐리어',
            규격: '100 kW',
            수량: `${data.activeEcCount} ea`,
            단가: data.ecUnitPrice.toFixed(2),
            합계: data.ecCost.toFixed(2),
          },
          {
            구분: '이동트랙터',
            규격: '1 ton',
            수량: `${data.tractorCount} ea`,
            단가: data.tractorPrice.toFixed(2),
            합계: data.tractorCost.toFixed(2),
          },
          {
            구분: '운영플랫폼',
            규격: '1 set',
            수량: `${data.platformCount} set`,
            단가: data.platformPrice.toFixed(2),
            합계: data.platformCost.toFixed(2),
          },
        ].map((row, i) => (
          <View key={i} style={{ flexDirection: 'row' }}>
            <Text style={[tcellLeft, { width: '24%' }]}>{row.구분}</Text>
            <Text style={[tcellCenter, { width: '18%' }]}>{row.규격}</Text>
            <Text style={[tcellCenter, { width: '15%' }]}>{row.수량}</Text>
            <Text style={[tcell, { width: '20%' }]}>{row.단가}</Text>
            <Text style={[tcell, { width: '23%', fontWeight: 800 }]}>{row.합계}</Text>
          </View>
        ))}
        {/* 합계 행 */}
        <View style={{ flexDirection: 'row', backgroundColor: '#312e81' }}>
          <Text
            style={[
              tcellCenter,
              { width: '77%', color: 'white', fontWeight: 800 },
            ]}
          >
            초기 투자비 합계
          </Text>
          <Text
            style={[
              tcell,
              { width: '23%', color: 'white', fontWeight: 800 },
            ]}
          >
            {data.totalInvestmentUk.toFixed(2)}
          </Text>
        </View>
        <View style={{ flexDirection: 'row', backgroundColor: '#334155' }}>
          <Text
            style={[
              tcellCenter,
              { width: '77%', color: 'white', fontWeight: 800 },
            ]}
          >
            20년 투자총액 (유지보수 포함)
          </Text>
          <Text
            style={[
              tcell,
              { width: '23%', color: 'white', fontWeight: 800 },
            ]}
          >
            {data.totalInvest20Uk.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* B. 연간 수익 분석 표 */}
      <View style={{ flex: 1.2 }}>
        <Text
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: PDF_COLORS.text,
            backgroundColor: '#bfdbfe',
            paddingVertical: 3,
            paddingHorizontal: 4,
            marginBottom: 2,
          }}
        >
          B. 연간 수익 분석 (합리화 제외)
        </Text>
        <View style={{ flexDirection: 'row', backgroundColor: '#1e40af' }}>
          <Text style={[thead, { width: '12%' }]}>구분</Text>
          <Text style={[thead, { width: '36%' }]}>상세 내역</Text>
          <Text style={[thead, { width: '17%' }]}>물량 (kWh)</Text>
          <Text style={[thead, { width: '15%' }]}>단가 (원)</Text>
          <Text style={[thead, { width: '20%' }]}>금액 (억원)</Text>
        </View>
        {/* 수익 4행 — '수익' 라벨이 4행을 세로로 잇는 rowSpan 효과 */}
        <View style={{ flexDirection: 'row' }}>
          {/* 좌측 '수익' 통합 라벨 (rowSpan=4) */}
          <View
            style={{
              width: '12%',
              border: `0.5px solid ${PDF_COLORS.border}`,
              backgroundColor: '#f8fafc',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 9, fontWeight: 800, color: PDF_COLORS.text }}>
              수익
            </Text>
          </View>
          {/* 우측 4행 */}
          <View style={{ width: '88%' }}>
            {[
              {
                상세: '① 자가소비(최대부하) 절감',
                물량: data.volumeSelf,
                단가: data.appliedSavingsPrice,
                금액: data.revenueSaving,
              },
              {
                상세: '② 잉여 한전 판매 수익',
                물량: data.surplusVolume,
                단가: data.kepcoUnitPrice,
                금액: data.revenueSurplus,
              },
              {
                상세: '③ EC-전력 판매 수익',
                물량: data.volumeEc,
                단가: data.appliedSellPrice,
                금액: data.revenueEc,
              },
              {
                상세: '④ 기본료 절감',
                물량: 0,
                단가: 0,
                금액: data.revenueBaseBillSavings,
                isBaseBill: true,
              },
            ].map((row, i) => (
              <View key={i} style={{ flexDirection: 'row' }}>
                <Text style={[tcellLeft, { width: `${(36 / 88) * 100}%` }]}>
                  {row.상세}
                </Text>
                <Text
                  style={[
                    tcell,
                    { width: `${(17 / 88) * 100}%`, backgroundColor: '#fce7f3' },
                  ]}
                >
                  {row.isBaseBill ? '-' : Math.round(row.물량).toLocaleString()}
                </Text>
                <Text
                  style={[
                    tcell,
                    { width: `${(15 / 88) * 100}%`, backgroundColor: '#fef9c3' },
                  ]}
                >
                  {row.isBaseBill ? '-' : row.단가.toLocaleString()}
                </Text>
                <Text style={[tcell, { width: `${(20 / 88) * 100}%` }]}>
                  {fmtUk(row.금액)}
                </Text>
              </View>
            ))}
          </View>
        </View>
        {/* 연간 수익 총액 */}
        <View style={{ flexDirection: 'row', backgroundColor: '#dcfce7' }}>
          <Text
            style={[
              tcellCenter,
              { width: '80%', fontWeight: 800 },
            ]}
          >
            연간 수익 총액
          </Text>
          <Text style={[tcell, { width: '20%', fontWeight: 800, color: PDF_COLORS.primary }]}>
            {fmtUk(data.displayedAnnualGross)}
          </Text>
        </View>
        {/* 유지보수 */}
        <View style={{ flexDirection: 'row' }}>
          <Text style={[tcellCenter, { width: '12%', fontWeight: 800 }]}>비용</Text>
          <Text style={[tcellLeft, { width: '36%' }]}>
            (-) 유지보수비 및 인건비
            {data.laborCostWon > 0 && (
              <Text style={{ fontSize: 6, color: PDF_COLORS.textLight }}>
                {' '}
                (EC운영인건비 포함)
              </Text>
            )}
          </Text>
          <Text style={[tcellCenter, { width: '17%' }]}>-</Text>
          <Text style={[tcellCenter, { width: '15%' }]}>-</Text>
          <Text style={[tcell, { width: '20%', color: PDF_COLORS.danger }]}>
            -{fmtUk(data.annualMaintenanceCost)}
          </Text>
        </View>
        {/* 연간 실제 순수익 */}
        <View style={{ flexDirection: 'row', backgroundColor: '#312e81' }}>
          <Text style={[tcellCenter, { width: '80%', color: 'white', fontWeight: 800 }]}>
            연간 실제 순수익 (Net Profit)
          </Text>
          <Text style={[tcell, { width: '20%', color: '#fbbf24', fontWeight: 800, fontSize: 10 }]}>
            {fmtUk(data.displayedAnnualNet)} 억
          </Text>
        </View>
      </View>
    </View>

    {/* 최종 결론 */}
    <View
      style={{
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          padding: 8,
          border: `1px solid ${PDF_COLORS.borderStrong}`,
          borderRadius: 4,
          backgroundColor: PDF_COLORS.bgGray,
          flex: 1.4,
        }}
      >
        <Text style={{ fontSize: 8, color: PDF_COLORS.textMuted, fontWeight: 700 }}>
          20년 누적 수익
        </Text>
        <Text style={{ fontSize: 16, fontWeight: 800, color: '#16a34a' }}>
          {fmtUk(data.selfFinalProfit)} <Text style={{ fontSize: 9 }}>억</Text>
        </Text>
        <View style={{ marginTop: 4, paddingTop: 4, borderTop: `1px solid ${PDF_COLORS.border}` }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 7, color: PDF_COLORS.textMuted }}>
              태양광발전수익(20년)
            </Text>
            <Text style={{ fontSize: 7, color: PDF_COLORS.text }}>
              +{fmtUk(data.totalSolarRevenue20)}억
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 7, color: PDF_COLORS.primary }}>
              전기요금합리화절감액(20년)
            </Text>
            <Text style={{ fontSize: 7, color: PDF_COLORS.primary }}>
              +{fmtUk(data.totalRationalization20)}억
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 7, color: PDF_COLORS.danger }}>
              유지보수 및 운영비(17년, 3년 무상)
            </Text>
            <Text style={{ fontSize: 7, color: PDF_COLORS.danger }}>
              -{fmtUk(data.totalMaintenance20)}억
            </Text>
          </View>
        </View>
      </View>
      <View
        style={{
          padding: 8,
          border: `1px solid ${PDF_COLORS.borderStrong}`,
          borderRadius: 4,
          backgroundColor: PDF_COLORS.bgGray,
          flex: 1,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 8, color: PDF_COLORS.textMuted, fontWeight: 700 }}>
          총 수익률 (ROI)
        </Text>
        <Text style={{ fontSize: 22, fontWeight: 800, color: PDF_COLORS.primary }}>
          {data.profitRate.toFixed(1)} <Text style={{ fontSize: 10 }}>%</Text>
        </Text>
      </View>
    </View>

    <View style={s.footer} fixed>
      <Text>- {data.pageNumber} -</Text>
      <Text>{data.fileName}</Text>
    </View>
  </Page>
);
