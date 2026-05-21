/**
 * [PDF 페이지 7] 모델 시각화 이미지
 *
 * 원본 PreviewModelImage는 사업모델 9가지(태양광+EC, RE100, 전력구매형 등)를
 * 비디오/이미지로 표시하는 인터랙티브 컴포넌트. PDF에서는:
 *   - 비디오는 표시 불가
 *   - 이미지인 경우만 표시
 *   - 둘 다 아니면 모델명·설명만 텍스트 안내
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

export const PdfPage7ModelImage: React.FC<{ data: Page7Data }> = ({ data }) => (
  <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
    <HeaderRow />
    <Text style={s.sectionTitlePill}>운영 모델 비주얼</Text>

    <View
      style={{
        marginTop: 6,
        flexDirection: 'row',
        gap: 8,
      }}
    >
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          border: `1px solid ${PDF_COLORS.border}`,
          borderRadius: 4,
          backgroundColor: PDF_COLORS.bgGray,
          height: 380,
          overflow: 'hidden',
        }}
      >
        {data.modelType === 'image' && data.modelSrc ? (
          <Image
            src={data.modelSrc}
            style={{ width: '95%', height: '95%', objectFit: 'contain' }}
          />
        ) : (
          <View style={{ alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 12, fontWeight: 700, color: PDF_COLORS.textMuted }}>
              {data.modelLabel}
            </Text>
            <Text
              style={{
                fontSize: 9,
                color: PDF_COLORS.textLight,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              영상 콘텐츠는 PDF 형식에서 표시할 수 없습니다.{'\n'}
              실제 운영 모델 영상은 웹 화면에서 확인하실 수 있습니다.
            </Text>
          </View>
        )}
      </View>
    </View>

    <Text
      style={{
        fontSize: 8,
        color: PDF_COLORS.textMuted,
        marginTop: 8,
        textAlign: 'center',
      }}
    >
      ※ 본 페이지는 사업 모델 비주얼 자료입니다. 자세한 산식은 페이지 4·5를
      참고하세요.
    </Text>

    <View style={s.footer} fixed>
      <Text>- {data.pageNumber} -</Text>
      <Text>{data.fileName}</Text>
    </View>
  </Page>
);
