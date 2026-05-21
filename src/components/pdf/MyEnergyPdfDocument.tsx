/**
 * 메인 PDF Document
 * 페이지 1을 포함하며, 향후 페이지 2~9를 점진적으로 추가 가능.
 */
import React from 'react';
import { Document } from '@react-pdf/renderer';
import { PdfPage1Summary, Page1Data } from './PdfPage1Summary';
import { PdfPage2SiteAnalysis, Page2Data } from './PdfPage2SiteAnalysis';

export interface MyEnergyPdfData {
  page1: Page1Data;
  page2: Page2Data;
  // page3, page4, ... 향후 추가
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
    <PdfPage2SiteAnalysis data={data.page2} />
    {/* 향후: <PdfPage3Chart />, <PdfPage4Detail /> 등 */}
  </Document>
);
