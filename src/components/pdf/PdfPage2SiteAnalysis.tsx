/**
 * [PDF 페이지 2] 02. RE100 에너지 발전 설치 공간 분석
 *
 * 좌측: 공장 지붕 면적 + 위성사진 + 주소
 * 우측: 태양광 설치 가능 공간 (최대 가능 발전 → 최적 설치 공간 → 한전 최대)
 */
import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles as s, PDF_COLORS, PAGE_SIZE, PAGE_ORIENTATION } from './pdfTheme';

export interface Page2Data {
  totalAreaPyeong: number;
  totalAreaM2: number;
  address: string;
  siteImage: string | null;
  maxPotentialKw: number;
  capacityKw: number;
  panelWatt: number;
  moduleCount: number;
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

export const PdfPage2SiteAnalysis: React.FC<{ data: Page2Data }> = ({
  data,
}) => (
  <Page size={PAGE_SIZE} orientation={PAGE_ORIENTATION} style={s.page}>
    <HeaderRow />

    <Text style={s.sectionTitlePill}>
      02. RE100 에너지 발전 설치 공간 분석
    </Text>

    <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
      {/* 좌측 — 공장 지붕 */}
      <View style={{ flex: 1.2 }}>
        <View
          style={{
            backgroundColor: PDF_COLORS.primary,
            color: 'white',
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderRadius: 10,
            alignSelf: 'flex-start',
            marginBottom: 6,
          }}
        >
          <Text style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>
            공장 지붕
          </Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: PDF_COLORS.bgGray,
            border: `1px solid ${PDF_COLORS.border}`,
            borderRadius: 4,
            padding: 6,
            marginBottom: 6,
          }}
        >
          <Text
            style={{
              fontSize: 8,
              color: PDF_COLORS.textMuted,
              fontWeight: 700,
              marginRight: 8,
            }}
          >
            공장 지붕 면적
          </Text>
          <Text
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: PDF_COLORS.text,
              backgroundColor: '#dcfce7',
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: 3,
            }}
          >
            {Math.round(data.totalAreaPyeong).toLocaleString()} 평
          </Text>
          <Text
            style={{
              fontSize: 7,
              color: PDF_COLORS.textMuted,
              marginLeft: 6,
            }}
          >
            ({data.totalAreaM2.toLocaleString()} m²)
          </Text>
        </View>

        {/* 위성사진 또는 안내 */}
        <View
          style={{
            border: `1px solid ${PDF_COLORS.border}`,
            borderRadius: 4,
            height: 230,
            backgroundColor: PDF_COLORS.bgGray,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {data.siteImage ? (
            // react-pdf <Image>는 src로 data URL 또는 URL 받음. base64 data URL 권장.
            <Image
              src={data.siteImage}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <Text
              style={{
                fontSize: 8,
                color: PDF_COLORS.textLight,
                textAlign: 'center',
              }}
            >
              위성사진이 등록되지 않았습니다.{'\n'}
              (입력 패널 Step 2에서 등록해주세요)
            </Text>
          )}
        </View>

        <Text
          style={{
            fontSize: 7,
            color: PDF_COLORS.textMuted,
            textAlign: 'center',
            marginTop: 4,
          }}
        >
          &lt; {data.address || '주소 미입력'} &gt;
        </Text>
      </View>

      {/* 우측 — 태양광 설치 가능 공간 */}
      <View style={{ flex: 1 }}>
        <View
          style={{
            backgroundColor: PDF_COLORS.primary,
            color: 'white',
            paddingVertical: 5,
            paddingHorizontal: 10,
            borderRadius: 10,
            alignSelf: 'flex-start',
            marginBottom: 6,
          }}
        >
          <Text style={{ color: 'white', fontSize: 9, fontWeight: 700 }}>
            태양광설치 가능 공간
          </Text>
        </View>

        {/* 최대 가능 발전 */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 6,
            paddingHorizontal: 8,
            borderBottom: `1px solid ${PDF_COLORS.border}`,
          }}
        >
          <Text style={{ fontSize: 9, color: PDF_COLORS.text }}>
            최대가능발전
          </Text>
          <Text style={{ fontSize: 11, fontWeight: 800, color: PDF_COLORS.text }}>
            {data.maxPotentialKw.toLocaleString()} kW
          </Text>
        </View>

        {/* 화살표 */}
        <View style={{ alignItems: 'center', paddingVertical: 4 }}>
          <Text style={{ fontSize: 14, color: PDF_COLORS.textLight }}>↓</Text>
        </View>

        {/* 최적 설치 공간 (강조) */}
        <View
          style={{
            backgroundColor: '#fecaca', // red-200
            borderRadius: 4,
            padding: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              color: '#991b1b', // red-900
              fontWeight: 700,
            }}
          >
            최적 설치 공간
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: '#991b1b',
            }}
          >
            {data.capacityKw.toLocaleString()} kW
          </Text>
        </View>

        {/* 한전 최대 발전 */}
        <View
          style={{
            backgroundColor: '#dcfce7', // green-100
            borderRadius: 4,
            padding: 8,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <Text
            style={{
              fontSize: 9,
              color: '#166534', // green-900
              fontWeight: 700,
            }}
          >
            한전최대발전
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#166534',
            }}
          >
            {data.capacityKw.toLocaleString()} kW
          </Text>
        </View>

        {/* 모듈 정보 */}
        <View
          style={{
            borderTop: `1px solid ${PDF_COLORS.border}`,
            paddingTop: 6,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 8, color: PDF_COLORS.text, fontWeight: 700 }}>
              모듈 출력
            </Text>
            <Text style={{ fontSize: 9, color: PDF_COLORS.text }}>
              {data.panelWatt} W
            </Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 8, color: PDF_COLORS.text, fontWeight: 700 }}>
              설치 수량
            </Text>
            <Text style={{ fontSize: 9, color: PDF_COLORS.text }}>
              {data.moduleCount.toLocaleString()} ea
            </Text>
          </View>
        </View>
      </View>
    </View>

    {/* 푸터 */}
    <View style={s.footer} fixed>
      <Text>- {data.pageNumber} -</Text>
      <Text>{data.fileName}</Text>
    </View>
  </Page>
);
