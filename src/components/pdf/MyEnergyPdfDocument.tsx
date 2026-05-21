/**
 * 메인 PDF Document
 * 페이지 1을 포함하며, 향후 페이지 2~9를 점진적으로 추가 가능.
 */
import React from 'react';
import { Document } from '@react-pdf/renderer';
import { PdfPage1Summary, Page1Data } from './PdfPage1Summary';

export interface MyEnergyPdfData {
  page1: Page1Data;
  // page2, page3, ... 향후 추가
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
    {/* 향후 추가: <PdfPage2SiteAnalysis />, <PdfPage3Chart /> 등 */}
  </Document>
);
