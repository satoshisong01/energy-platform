/**
 * 메인 PDF Document — 9 페이지 모두 포함
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
}

export const MyEnergyPdfDocument: React.FC<{ data: MyEnergyPdfData }> = ({
  data,
}) => (
  <Document
    title={data.page1.fileName}
    author="(주)퍼스트씨앤디"
    creator="RE100 Energy Platform"
  >
    <PdfPage1Summary data={data.page1} />
    {/* 청정수소 발전 모드면 페이지 2~9 생략 (PreviewPanel과 동일 동작) */}
    {!data.hydrogenMode && (
      <>
        <PdfPage2SiteAnalysis data={data.page2} />
        <PdfPage3Chart data={data.page3} />
        <PdfPage4DetailTable data={data.page4} />
        <PdfPage5Financial data={data.page5} />
        <PdfPage6ModelGraph data={data.page6} />
        <PdfPage7ModelImage data={data.page7} />
        <PdfPage8Comparison data={data.page8} />
        <PdfPage9Requirements data={data.page9} />
      </>
    )}
  </Document>
);
