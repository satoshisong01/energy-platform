/**
 * [공통] 이미지 기반 PDF 페이지
 *
 * 페이지 3-7은 웹 미리보기에서 html2canvas-pro 로 캡처한 PNG dataURL을
 * 그대로 A4 가로에 fit-to-width 로 박아넣는다. 차트·표 모양이 웹과 100% 동일.
 *
 * 캡처 dataURL 이 없으면 (캡처 실패·SSR 등) 회색 안내 박스로 폴백.
 */
import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles as s, PDF_COLORS, PAGE_SIZE, PAGE_ORIENTATION } from './pdfTheme';

export interface PdfImagePageData {
  imageDataUrl: string;
  pageNumber: number;
  fileName: string;
}

export const PdfImagePage: React.FC<{ data: PdfImagePageData }> = ({ data }) => (
  <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'flex-start',
      }}
    >
      {data.imageDataUrl ? (
        <Image
          src={data.imageDataUrl}
          style={{
            width: '100%',
            height: 'auto',
            objectFit: 'contain',
          }}
        />
      ) : (
        <View
          style={{
            width: '100%',
            paddingVertical: 80,
            alignItems: 'center',
            backgroundColor: PDF_COLORS.bgGray,
          }}
        >
          <Text style={{ fontSize: 12, color: PDF_COLORS.textMuted }}>
            웹 화면 캡처를 사용할 수 없어 본 페이지가 비어 있습니다.
          </Text>
          <Text
            style={{ fontSize: 9, color: PDF_COLORS.textLight, marginTop: 6 }}
          >
            웹 미리보기 화면을 켠 상태로 PDF 다운로드 버튼을 다시 클릭해 주세요.
          </Text>
        </View>
      )}
    </View>

    <View style={s.footer} fixed>
      <Text>- {data.pageNumber} -</Text>
      <Text>{data.fileName}</Text>
    </View>
  </Page>
);
