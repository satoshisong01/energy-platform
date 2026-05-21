/**
 * 메인 PDF Document — 9 페이지 모두 포함
 *
 * - 페이지 1, 2, 8, 9: @react-pdf 네이티브 컴포넌트 (텍스트 선택 가능)
 * - 페이지 3, 4, 5, 6, 7: 웹 미리보기 화면을 html2canvas-pro 로 캡처한 이미지
 *   → 차트·표 디자인이 웹과 100% 동일 (캡처 dataURL 이 없으면 native 폴백)
 * 청정수소 발전 모드일 때는 페이지 1만 포함 (showHydrogen=true).
 */
import React from 'react';
import { Document } from '@react-pdf/renderer';
import { PdfPage1Summary, Page1Data } from './PdfPage1Summary';
import { PdfPage2SiteAnalysis, Page2Data } from './PdfPage2SiteAnalysis';
import { PdfPage3Chart, Page3Data } from './PdfPage3Chart';
import { PdfPage4DetailTable, Page4Data } from './PdfPage4DetailTable';
import { PdfPage5Financial, Page5Data } from './PdfPage5Financial';
import { PdfPage6ModelGraph, Page6Data } from './PdfPage6ModelGraph';
import { PdfPage7ModelImage, Page7Data } from './PdfPage7ModelImage';
import { PdfPage8Comparison, Page8Data } from './PdfPage8Comparison';
import { PdfPage9Requirements, Page9Data } from './PdfPage9Requirements';
import { PdfImagePage } from './PdfImagePage';

export interface MyEnergyPdfData {
  page1: Page1Data;
  page2: Page2Data;
  page3: Page3Data;
  page4: Page4Data;
  page5: Page5Data;
  page6: Page6Data;
  page7: Page7Data;
  page8: Page8Data;
  page9: Page9Data;
  hydrogenMode: boolean;
  /** 페이지 3~7 의 웹 캡처 — dataURL + 자연 픽셀 크기 (빈 페이지 방지에 사용) */
  captures?: {
    page3?: PdfCapture;
    page4?: PdfCapture;
    page5?: PdfCapture;
    page6?: PdfCapture;
    page7?: PdfCapture;
  };
}

export interface PdfCapture {
  dataUrl: string;
  width: number;
  height: number;
}

export const MyEnergyPdfDocument: React.FC<{ data: MyEnergyPdfData }> = ({
  data,
}) => {
  const cap = data.captures ?? {};
  const fileName = data.page1.fileName;

  return (
    <Document
      title={fileName}
      author="(주)퍼스트씨앤디"
      creator="RE100 Energy Platform"
    >
      <PdfPage1Summary data={data.page1} />
      {/* 청정수소 발전 모드면 페이지 2~9 생략 (PreviewPanel과 동일 동작) */}
      {!data.hydrogenMode && (
        <>
          <PdfPage2SiteAnalysis data={data.page2} />

          {cap.page3 ? (
            <PdfImagePage
              data={{
                imageDataUrl: cap.page3.dataUrl,
                imageWidth: cap.page3.width,
                imageHeight: cap.page3.height,
                pageNumber: 3,
                fileName,
              }}
            />
          ) : (
            <PdfPage3Chart data={data.page3} />
          )}

          {cap.page4 ? (
            <PdfImagePage
              data={{
                imageDataUrl: cap.page4.dataUrl,
                imageWidth: cap.page4.width,
                imageHeight: cap.page4.height,
                pageNumber: 4,
                fileName,
              }}
            />
          ) : (
            <PdfPage4DetailTable data={data.page4} />
          )}

          {cap.page5 ? (
            <PdfImagePage
              data={{
                imageDataUrl: cap.page5.dataUrl,
                imageWidth: cap.page5.width,
                imageHeight: cap.page5.height,
                pageNumber: 5,
                fileName,
              }}
            />
          ) : (
            <PdfPage5Financial data={data.page5} />
          )}

          {cap.page6 ? (
            <PdfImagePage
              data={{
                imageDataUrl: cap.page6.dataUrl,
                imageWidth: cap.page6.width,
                imageHeight: cap.page6.height,
                pageNumber: 6,
                fileName,
              }}
            />
          ) : (
            <PdfPage6ModelGraph data={data.page6} />
          )}

          {cap.page7 ? (
            <PdfImagePage
              data={{
                imageDataUrl: cap.page7.dataUrl,
                imageWidth: cap.page7.width,
                imageHeight: cap.page7.height,
                pageNumber: 7,
                fileName,
              }}
            />
          ) : (
            <PdfPage7ModelImage data={data.page7} />
          )}

          <PdfPage8Comparison data={data.page8} />
          <PdfPage9Requirements data={data.page9} />
        </>
      )}
    </Document>
  );
};
