/**
 * [공통] 이미지 기반 PDF 페이지
 *
 * 페이지 3-7은 웹 미리보기에서 html2canvas-pro 로 캡처한 PNG dataURL을
 * 그대로 A4 가로에 fit-to-page 로 박아넣는다. 차트·표 모양이 웹과 100% 동일.
 *
 * 빈 페이지 방지: 이미지의 자연 width/height 를 캡처 시점에 측정해서
 * A4 가로 content 영역(782pt × 535pt) 에 비율 유지로 맞춘 명시 사이즈를
 * <Image> 에 직접 지정한다. (height: 'auto' 사용 시 페이지 높이를 초과해
 * 다음 페이지로 흘러넘치는 문제를 차단)
 */
import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles as s, PDF_COLORS, PAGE_SIZE, PAGE_ORIENTATION } from './pdfTheme';

export interface PdfImagePageData {
  imageDataUrl: string;
  /** 캡처된 PNG 의 자연 width (px) */
  imageWidth: number;
  /** 캡처된 PNG 의 자연 height (px) */
  imageHeight: number;
  pageNumber: number;
  fileName: string;
}

// A4 가로 page (842 × 595 pt) - padding(30pt) * 2 - 푸터 여유(20pt)
const CONTENT_W = 842 - 60;
const CONTENT_H = 595 - 60 - 20;

/** 이미지 자연 크기를 content 영역에 비율 유지로 맞춘 pt 사이즈 계산 */
const computeFit = (
  imgW: number,
  imgH: number
): { width: number; height: number } => {
  if (imgW <= 0 || imgH <= 0) return { width: CONTENT_W, height: CONTENT_H };
  const imgAspect = imgW / imgH;
  const pageAspect = CONTENT_W / CONTENT_H;
  if (imgAspect > pageAspect) {
    // 이미지가 페이지보다 가로로 더 넓음 → 가로폭 기준으로 축소
    return { width: CONTENT_W, height: CONTENT_W / imgAspect };
  }
  // 이미지가 세로로 더 길거나 같음 → 세로높이 기준으로 축소
  return { width: CONTENT_H * imgAspect, height: CONTENT_H };
};

export const PdfImagePage: React.FC<{ data: PdfImagePageData }> = ({ data }) => {
  const fit = computeFit(data.imageWidth, data.imageHeight);

  return (
    <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
      <View
        style={{
          width: '100%',
          height: CONTENT_H,
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}
      >
        {data.imageDataUrl ? (
          <Image
            src={data.imageDataUrl}
            style={{ width: fit.width, height: fit.height }}
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
};
