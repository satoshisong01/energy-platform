/**
 * [PDF 페이지 9] 06. 사업 조건 및 구비 서류
 * 자기자본 / RPS / 팩토링 / RE100연계 / 구독 / 수익배분형 비교 표
 */
import React from 'react';
import { Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles as s, PDF_COLORS, PAGE_SIZE, PAGE_ORIENTATION } from './pdfTheme';

export interface Page9Data {
  loanRateRps: number;
  loanRateFactoring: number;
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

const colW = {
  label: '11%',
  self: '12%',
  rps: '15%',
  fac: '15%',
  rent: '15%',
  sub: '15%',
  share: '17%',
};

const tcell = {
  paddingVertical: 4,
  paddingHorizontal: 4,
  border: `0.5px solid ${PDF_COLORS.border}`,
  fontSize: 8,
  color: PDF_COLORS.text,
  textAlign: 'center' as const,
};
const tcellLeft = { ...tcell, textAlign: 'left' as const };

export const PdfPage9Requirements: React.FC<{ data: Page9Data }> = ({ data }) => {
  const compareRows = [
    {
      label: '초기투자(자기자본)',
      vals: ['O(100%)', 'O(20%)', 'X', 'X', 'X', 'X'],
      highlight: true,
    },
    { label: '보증보험', vals: ['X', 'O(11%)', 'O(11%)', 'X', 'X', 'X'] },
    { label: '은행잔고증명', vals: ['X', 'O(15%)', 'O(15%)', 'X', 'X', 'X'] },
    { label: 'RE100(REC)', vals: ['O', 'O', 'O', 'O', 'O', 'O'] },
  ];

  const widths = [colW.self, colW.rps, colW.fac, colW.rent, colW.sub, colW.share];

  return (
    <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
      <HeaderRow />
      <Text style={s.sectionTitlePill}>06. 사업 조건 및 구비 서류</Text>

      {/* 헤더 */}
      <View style={{ flexDirection: 'row', marginTop: 4 }}>
        <Text
          style={[
            tcell,
            {
              width: colW.label,
              backgroundColor: PDF_COLORS.bgGray,
              fontWeight: 800,
            },
          ]}
        >
          구분
        </Text>
        <Text
          style={[
            tcell,
            {
              width: colW.self,
              backgroundColor: PDF_COLORS.bgGray,
              fontWeight: 800,
            },
          ]}
        >
          자기자본{'\n'}
          <Text style={{ fontSize: 6 }}>(전액투자)</Text>
        </Text>
        <Text
          style={[
            tcell,
            {
              width: colW.rps,
              backgroundColor: PDF_COLORS.bgGray,
              fontWeight: 800,
            },
          ]}
        >
          RPS 정책자금{'\n'}
          <Text style={{ fontSize: 6 }}>{data.loanRateRps}%</Text>
        </Text>
        <Text
          style={[
            tcell,
            {
              width: colW.fac,
              backgroundColor: PDF_COLORS.bgGray,
              fontWeight: 800,
            },
          ]}
        >
          팩토링{'\n'}
          <Text style={{ fontSize: 6 }}>{data.loanRateFactoring}%</Text>
        </Text>
        {data.showRentSub && (
          <>
            <Text
              style={[
                tcell,
                { width: colW.rent, backgroundColor: PDF_COLORS.bgGray, fontWeight: 800 },
              ]}
            >
              RE100연계{'\n'}
              <Text style={{ fontSize: 6 }}>임대형</Text>
            </Text>
            <Text
              style={[
                tcell,
                { width: colW.sub, backgroundColor: PDF_COLORS.bgGray, fontWeight: 800 },
              ]}
            >
              구독{'\n'}
              <Text style={{ fontSize: 6 }}>서비스</Text>
            </Text>
            <Text
              style={[
                tcell,
                {
                  width: colW.share,
                  backgroundColor: PDF_COLORS.bgLightGreen,
                  color: PDF_COLORS.share,
                  fontWeight: 800,
                },
              ]}
            >
              수익배분형{'\n'}
              <Text style={{ fontSize: 6 }}>50:50 / 15년 이전</Text>
            </Text>
          </>
        )}
      </View>

      {/* 조건 비교 행 */}
      {compareRows.map((row, idx) => {
        const displayVals = data.showRentSub ? row.vals : row.vals.slice(0, 3);
        return (
          <View key={idx} style={{ flexDirection: 'row' }}>
            <Text
              style={[
                tcell,
                {
                  width: colW.label,
                  fontWeight: 800,
                  color: row.highlight ? PDF_COLORS.danger : PDF_COLORS.textMuted,
                },
              ]}
            >
              {row.label}
            </Text>
            {displayVals.map((val, i) => (
              <Text
                key={i}
                style={[
                  tcell,
                  {
                    width: widths[i],
                    color:
                      row.highlight && val.includes('O')
                        ? PDF_COLORS.danger
                        : PDF_COLORS.text,
                    fontWeight: row.highlight ? 800 : 400,
                  },
                ]}
              >
                {val}
              </Text>
            ))}
          </View>
        );
      })}

      {/* 구비서류 / 자격요건 행 */}
      <View style={{ flexDirection: 'row', minHeight: 200 }}>
        <Text
          style={[
            tcell,
            {
              width: colW.label,
              backgroundColor: PDF_COLORS.bgGray,
              fontWeight: 800,
            },
          ]}
        >
          구비서류{'\n'}(자격요건)
        </Text>
        {/* 자기자본 */}
        <Text style={[tcellLeft, { width: colW.self }]}>-</Text>
        {/* RPS */}
        <View
          style={[
            { borderWidth: 0.5, borderColor: PDF_COLORS.border, padding: 4, width: colW.rps },
          ]}
        >
          <Text style={{ fontSize: 7, color: PDF_COLORS.primaryLight, fontWeight: 700, marginBottom: 3 }}>
            주거래은행 사전 확인 필요
          </Text>
          {[
            '사업자등록증 사본',
            '자금추천 신청서',
            '중소기업확인서',
            '신재생E 보급량 산출근거',
            '부지관련확인서류',
            '계통연계 사전 확인서',
            '공장등록증명서',
          ].map((item, i) => (
            <Text key={i} style={{ fontSize: 6.5, color: PDF_COLORS.text, marginBottom: 1 }}>
              • {item}
            </Text>
          ))}
        </View>
        {/* 팩토링 */}
        <View
          style={[
            { borderWidth: 0.5, borderColor: PDF_COLORS.border, padding: 4, width: colW.fac },
          ]}
        >
          <Text style={{ fontSize: 7, color: PDF_COLORS.primaryLight, fontWeight: 700, marginBottom: 2 }}>
            사업가능 여부 확인 신용심사
          </Text>
          <Text style={{ fontSize: 7, color: PDF_COLORS.primaryLight, fontWeight: 700, marginBottom: 3 }}>
            서울보증의 지급보증 발급
          </Text>
          {[
            '사업자등록증 사본',
            '재무제표(최근 3년)',
            '대표이사 지방세 세목별 과세증명원',
            '대표이사 개인정보동의(개인공인인증서)',
          ].map((item, i) => (
            <Text key={i} style={{ fontSize: 6.5, color: PDF_COLORS.text, marginBottom: 1 }}>
              • {item}
            </Text>
          ))}
        </View>
        {data.showRentSub && (
          <>
            {/* RE100 임대형 */}
            <View
              style={[
                { borderWidth: 0.5, borderColor: PDF_COLORS.border, padding: 4, width: colW.rent },
              ]}
            >
              <Text
                style={{ fontSize: 7, color: PDF_COLORS.primaryLight, fontWeight: 700, marginBottom: 3 }}
              >
                ㅇ 자기소유 전체 태양광의 20% - REC 확보
              </Text>
              <Text style={{ fontSize: 6.5, color: PDF_COLORS.text, marginBottom: 1 }}>
                ㅇ 80% 20,000원/kW
              </Text>
              <Text style={{ fontSize: 6.5, color: PDF_COLORS.text, marginBottom: 1 }}>
                ㅇ 일시불 인센티브 지급가능
              </Text>
            </View>
            {/* 구독 */}
            <View
              style={[
                { borderWidth: 0.5, borderColor: PDF_COLORS.border, padding: 4, width: colW.sub },
              ]}
            >
              {[
                '신용등급 BB 이상',
                '매출규모 상위',
                '산업단지내 기업',
                '사용요금 : 150원/kWh',
                '발전용량 : 250kW 이상',
              ].map((item, i) => (
                <Text key={i} style={{ fontSize: 6.5, color: PDF_COLORS.text, marginBottom: 1 }}>
                  • {item}
                </Text>
              ))}
            </View>
            {/* 수익배분형 */}
            <View
              style={[
                {
                  borderWidth: 0.5,
                  borderColor: PDF_COLORS.border,
                  padding: 4,
                  width: colW.share,
                  backgroundColor: '#f0fdf4',
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 7,
                  color: PDF_COLORS.share,
                  fontWeight: 700,
                  marginBottom: 3,
                }}
              >
                ㅇ 지붕 임대 + 발전매출 50:50 배분
              </Text>
              {[
                '초기 투자비 회사 부담',
                '유지보수(O&M) 회사 부담',
                '15년 후 발전설비 무상 이전',
                '이전 후 16~20년 매출 100% 고객',
                '발전용량 : 250kW 이상 권장',
              ].map((item, i) => (
                <Text key={i} style={{ fontSize: 6.5, color: PDF_COLORS.text, marginBottom: 1 }}>
                  • {item}
                </Text>
              ))}
            </View>
          </>
        )}
      </View>

      {/* 연락처 푸터 */}
      <View
        style={{
          marginTop: 16,
          paddingTop: 8,
          borderTop: `1px solid ${PDF_COLORS.border}`,
          alignItems: 'center',
        }}
      >
        <Text style={{ fontSize: 9, fontWeight: 700, color: PDF_COLORS.text }}>
          김 종 우 | 010.5617.9500
        </Text>
        <Text style={{ fontSize: 8, color: PDF_COLORS.textMuted, marginTop: 2 }}>
          jongwoo@firstcorea.com
        </Text>
        <Text style={{ fontSize: 8, color: PDF_COLORS.textMuted, marginTop: 1 }}>
          www.firstcorea.com
        </Text>
      </View>

      <View style={s.footer} fixed>
        <Text>- {data.pageNumber} -</Text>
        <Text>{data.fileName}</Text>
      </View>
    </Page>
  );
};
