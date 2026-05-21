/**
 * [PDF 페이지 7] 모델 시각화
 *
 * 비디오 콘텐츠는 PDF 표시 불가 → 이미지인 경우만 표시.
 * 비디오 모델인 경우 컴팩트 안내 카드 + 모델 설명/특장점 텍스트 형태로 대체.
 */
import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles as s, PDF_COLORS, PAGE_SIZE, PAGE_ORIENTATION } from './pdfTheme';

export interface Page7Data {
  modelLabel: string;
  modelType: 'image' | 'video';
  modelSrc: string;
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

const MODEL_DESCRIPTIONS: Record<string, { tagline: string; bullets: string[] }> = {
  '태양광 + EC (에너지 캐리어)': {
    tagline:
      '낮 시간 잉여 발전을 EC(이동형 에너지 캐리어)에 저장하여 야간/피크시간에 자가소비 또는 외부 판매',
    bullets: [
      '잉여 전력 손실 최소화 — 한전 역송 단가 대비 EC 활용 단가가 높아 ROI 개선',
      'EC는 운영 플랫폼을 통해 인근 수요처(공장·창고 등)로 이동 판매 가능',
      '피크 컷(최대부하 절감) 효과로 기본요금 추가 절감',
    ],
  },
  'RE100 (PPA·REC 연계)': {
    tagline:
      'RE100 가입 기업 대상 PPA 계약 또는 REC 거래를 통한 친환경 전력 공급 모델',
    bullets: [
      '20년 장기 PPA로 안정적 매출 확보 (수요처와 직접 계약)',
      'REC 인증 발급으로 추가 수익원 확보',
      '발전 사업자 — 수요 기업 양측 RE100 달성에 기여',
    ],
  },
  '전력구매형 (자가소비)': {
    tagline: '자체 부지에 발전 설비를 설치하여 100% 자가소비로 전기요금 절감',
    bullets: [
      '한전 요금 대비 발전 단가가 낮아 즉시 절감 효과',
      '잉여분은 한전 역송으로 추가 수익',
      '20년 운영 시 누적 절감액이 초기 투자비를 크게 상회',
    ],
  },
};

const fallbackDescription = (label: string) => ({
  tagline: `${label} 모델은 사이트 환경과 부하 패턴에 맞춰 최적화된 사업 구조입니다.`,
  bullets: [
    '초기 투자비 회수 기간 단축 설계',
    '20년 운영 기준 누적 ROI 분석 제공',
    '계통 연계·REC 인증 등 후속 절차 일괄 지원',
  ],
});

export const PdfPage7ModelImage: React.FC<{ data: Page7Data }> = ({ data }) => {
  const desc = MODEL_DESCRIPTIONS[data.modelLabel] ?? fallbackDescription(data.modelLabel);
  const isImage = data.modelType === 'image' && data.modelSrc;

  return (
    <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
      <HeaderRow />
      <Text style={s.sectionTitlePill}>운영 모델 비주얼</Text>

      <View style={{ marginTop: 6, flexDirection: 'row', gap: 8 }}>
        {/* 좌측: 이미지 또는 컴팩트 아이콘 카드 */}
        <View
          style={{
            flex: 1,
            border: `1px solid ${PDF_COLORS.border}`,
            borderRadius: 4,
            backgroundColor: isImage ? PDF_COLORS.bgWhite : PDF_COLORS.bgLightBlue,
            height: 220,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 12,
          }}
        >
          {isImage ? (
            <Image
              src={data.modelSrc}
              style={{ width: '95%', height: '95%', objectFit: 'contain' }}
            />
          ) : (
            <View style={{ alignItems: 'center' }}>
              <View
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: 30,
                  backgroundColor: PDF_COLORS.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 22, color: 'white', fontWeight: 800 }}>▶</Text>
              </View>
              <Text style={{ fontSize: 10, fontWeight: 800, color: PDF_COLORS.primary }}>
                실제 운영 영상 제공
              </Text>
              <Text
                style={{
                  fontSize: 8,
                  color: PDF_COLORS.textMuted,
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                {'PDF에서는 영상 재생이 불가합니다.\n웹 화면(미리보기 패널)에서 실시간 영상으로 확인하세요.'}
              </Text>
            </View>
          )}
        </View>

        {/* 우측: 모델 설명 + 핵심 포인트 */}
        <View style={{ flex: 1.3 }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: PDF_COLORS.text,
              marginBottom: 4,
            }}
          >
            {data.modelLabel}
          </Text>
          <Text
            style={{
              fontSize: 9,
              color: PDF_COLORS.textMuted,
              lineHeight: 1.5,
              marginBottom: 10,
            }}
          >
            {desc.tagline}
          </Text>

          <View
            style={{
              padding: 10,
              backgroundColor: PDF_COLORS.bgGray,
              borderLeft: `3px solid ${PDF_COLORS.primary}`,
              borderRadius: 2,
            }}
          >
            <Text
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: PDF_COLORS.primary,
                marginBottom: 6,
              }}
            >
              핵심 포인트
            </Text>
            {desc.bullets.map((bullet, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  marginBottom: 4,
                  alignItems: 'flex-start',
                }}
              >
                <Text
                  style={{
                    fontSize: 9,
                    color: PDF_COLORS.primary,
                    marginRight: 4,
                    fontWeight: 800,
                  }}
                >
                  ●
                </Text>
                <Text
                  style={{
                    fontSize: 8.5,
                    color: PDF_COLORS.text,
                    flex: 1,
                    lineHeight: 1.4,
                  }}
                >
                  {bullet}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <Text
        style={{
          fontSize: 7,
          color: PDF_COLORS.textMuted,
          marginTop: 10,
          textAlign: 'center',
        }}
      >
        ※ 본 페이지는 사업 모델 개요 자료입니다. 자세한 산식은 04·05 페이지를 참고하세요.
      </Text>

      <View style={s.footer} fixed>
        <Text>- {data.pageNumber} -</Text>
        <Text>{data.fileName}</Text>
      </View>
    </Page>
  );
};
