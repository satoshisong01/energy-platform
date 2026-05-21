/**
 * PDF 전용 공통 스타일/유틸리티 (@react-pdf/renderer)
 *
 * 한글 폰트: Pretendard (jsDelivr CDN .otf 파일 사용)
 * - Regular + Bold 두 가지 weight 등록
 * - 영어/한글 모두 지원
 */
import { Font, StyleSheet } from '@react-pdf/renderer';

// --- 한글 폰트 등록 (앱 첫 PDF 생성 시 1회 fetch, 이후 캐시) ---
Font.register({
  family: 'Pretendard',
  fonts: [
    {
      src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Regular.otf',
      fontWeight: 400,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.otf',
      fontWeight: 700,
    },
    {
      src: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-ExtraBold.otf',
      fontWeight: 800,
    },
  ],
});

// --- 컬러 팔레트 (영업 자료 톤 통일) ---
export const PDF_COLORS = {
  // 텍스트
  text: '#1e293b', // slate-800
  textMuted: '#64748b', // slate-500
  textLight: '#94a3b8', // slate-400

  // 강조
  primary: '#1e40af', // blue-800 (RE100 메인)
  primaryLight: '#3b82f6', // blue-500
  accent: '#d97706', // amber-600 (강조)
  danger: '#dc2626', // red-600 (적자/경고)
  success: '#16a34a', // green-600

  // 박스 배경
  bgWhite: '#ffffff',
  bgGray: '#f8fafc', // slate-50
  bgLightBlue: '#eff6ff', // blue-50
  bgLightGreen: '#ecfdf5', // emerald-50
  bgLightCyan: '#ecfeff', // cyan-50

  // 보더
  border: '#e2e8f0', // slate-200
  borderStrong: '#cbd5e1', // slate-300
  borderDark: '#334155', // slate-700

  // 컬럼 색상 (PreviewComparisonTable과 통일)
  kepco: '#94a3b8',
  re100: '#0f766e', // teal-700
  sub: '#059669', // emerald-600
  share: '#047857', // emerald-700
  hydrogen: '#0891b2', // cyan-600
  hydrogenClean: '#047857', // emerald-700
};

// --- 페이지 사이즈 (mm) ---
export const PAGE_SIZE = 'A4'; // 210mm × 297mm
export const PAGE_ORIENTATION = 'landscape' as const; // 가로 방향 (297mm × 210mm)

// --- 공통 스타일 ---
export const pdfStyles = StyleSheet.create({
  // 페이지 기본
  page: {
    padding: 30,
    fontFamily: 'Pretendard',
    fontSize: 9,
    color: PDF_COLORS.text,
    backgroundColor: PDF_COLORS.bgWhite,
  },

  // 페이지 상단 헤더 (FIRST C&D 로고 + 회사명)
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottom: `1px solid ${PDF_COLORS.border}`,
  },
  logoBox: {
    backgroundColor: PDF_COLORS.primary,
    color: 'white',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 3,
    fontSize: 9,
    fontWeight: 700,
  },
  companyInfo: {
    textAlign: 'right',
  },
  companyName: {
    fontSize: 10,
    fontWeight: 700,
    color: PDF_COLORS.text,
  },
  companySub: {
    fontSize: 7,
    color: PDF_COLORS.textMuted,
  },

  // 메인 타이틀
  mainTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: PDF_COLORS.primary,
    marginBottom: 4,
  },
  mainTitleHighlight: {
    color: PDF_COLORS.primaryLight,
  },
  subTitle: {
    fontSize: 10,
    color: PDF_COLORS.text,
    marginBottom: 2,
  },
  noteText: {
    fontSize: 7,
    color: PDF_COLORS.textMuted,
  },

  // 섹션 타이틀 (Pill)
  sectionTitlePill: {
    backgroundColor: PDF_COLORS.primary,
    color: 'white',
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    fontSize: 10,
    fontWeight: 800,
    alignSelf: 'flex-start',
    marginVertical: 6,
  },

  // 한전 박스 (가로 정보바)
  kepcoBox: {
    flexDirection: 'row',
    backgroundColor: PDF_COLORS.bgGray,
    border: `1px solid ${PDF_COLORS.borderStrong}`,
    borderRadius: 4,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kepcoCol: {
    flex: 1,
    alignItems: 'center',
  },
  kepcoLabel: {
    fontSize: 6,
    color: PDF_COLORS.textMuted,
    marginBottom: 1,
  },
  kepcoValue: {
    fontSize: 10,
    fontWeight: 800,
    color: PDF_COLORS.text,
  },

  // 카드 그리드 (TYPE A/B 박스)
  flowRow: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 6,
  },
  flowCard: {
    flex: 1,
    border: `1px solid ${PDF_COLORS.border}`,
    borderRadius: 4,
    backgroundColor: PDF_COLORS.bgWhite,
  },
  flowCardHeader: {
    backgroundColor: PDF_COLORS.bgGray,
    padding: 4,
    fontSize: 7,
    fontWeight: 700,
    color: PDF_COLORS.textMuted,
    textAlign: 'center',
  },
  flowCardBody: {
    padding: 6,
    alignItems: 'center',
  },
  flowCardValue: {
    fontSize: 12,
    fontWeight: 800,
    color: PDF_COLORS.text,
  },
  flowCardUnit: {
    fontSize: 7,
    color: PDF_COLORS.textMuted,
  },

  // 비교 섹션 (단순임대/RE100/구독/수익배분)
  compRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: PDF_COLORS.bgGray,
    border: `1px solid ${PDF_COLORS.border}`,
    borderRadius: 4,
    padding: 5,
  },
  compCard: {
    flex: 1,
    backgroundColor: PDF_COLORS.bgWhite,
    border: `1px solid ${PDF_COLORS.border}`,
    borderRadius: 3,
    padding: 4,
    alignItems: 'center',
  },
  compLabel: {
    fontSize: 6,
    color: PDF_COLORS.textMuted,
    marginBottom: 1,
  },
  compValue: {
    fontSize: 9,
    fontWeight: 800,
    color: PDF_COLORS.text,
  },

  // 페이지 푸터
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 7,
    color: PDF_COLORS.textLight,
  },
});

// --- 포맷 유틸 ---
export const fmt = {
  /** 원 → 콤마 (123,456,789) */
  won: (val: number): string => Math.round(val).toLocaleString(),

  /** 원 → 억 (둘째 자리, "12.34") */
  uk: (val: number): string => (val / 100_000_000).toFixed(2),

  /** 원 → "12.34 억" */
  ukLabel: (val: number): string => `${(val / 100_000_000).toFixed(2)} 억`,

  /** 정수 + "년" */
  years: (val: number): string => `${val.toFixed(2)}년`,

  /** % 표기 */
  pct: (val: number): string => `${val.toFixed(2)}%`,
};
