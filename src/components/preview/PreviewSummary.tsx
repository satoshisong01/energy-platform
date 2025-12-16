'use client';

import React, { useState } from 'react';
import { useProposalStore } from '../../lib/store';
import styles from './PreviewSummary.module.css';
import {
  LucideArrowRight,
  LucideWallet,
  LucideChevronsDown,
} from 'lucide-react';

export default function PreviewSummary() {
  const store = useProposalStore();
  const { config, rationalization } = store;

  const [showExpansion, setShowExpansion] = useState(false);

  // ----------------------------------------------------------------
  // 1. 공통 기본 데이터 계산
  // ----------------------------------------------------------------
  const capacity = store.capacityKw;
  const daysInYear = 365; // 기본 365일 (단순 계산용)

  // 연간 발전량 (단순 계산)
  const annualGen = capacity * 3.64 * daysInYear;

  // 연간 자가소비량 합계
  const annualSelf = store.monthlyData.reduce(
    (acc, cur) => acc + cur.selfConsumption,
    0
  );

  // 연간 잉여전력
  const annualSurplus = Math.max(0, annualGen - annualSelf);
  const unitPriceSavings = store.unitPriceSavings || config.unit_price_savings;

  // [중요] 태양광 설치 전 연간 총 전기요금 (B24)
  const totalBillBefore = store.monthlyData.reduce(
    (acc, cur) => acc + cur.totalBill,
    0
  );

  // ----------------------------------------------------------------
  // 2. 시나리오별 데이터 준비 (표준/확장 플랜) - 기존 로직 유지
  // ----------------------------------------------------------------
  // (A) Standard Data (REC 1.5)
  const getStandardData = () => {
    const invest = store.totalInvestment;
    const ecCount =
      store.useEc && store.selectedModel !== 'KEPCO'
        ? Math.min(3, Math.floor(capacity / 100))
        : 0;

    const revenue_saving = Math.min(annualGen, annualSelf) * unitPriceSavings;
    let revenue_sales = 0;
    if (store.useEc && store.selectedModel !== 'KEPCO') {
      revenue_sales = annualSurplus * config.unit_price_ec_1_5;
    } else {
      revenue_sales = annualSurplus * config.unit_price_kepco;
    }

    // 합리화 절감액 추가 (수익에 포함)
    const isEul = store.contractType.includes('(을)');
    const totalRationalization = isEul
      ? rationalization.base_savings_manual +
        (rationalization.light_eul - rationalization.light_gap) *
          rationalization.light_usage +
        (rationalization.mid_eul - rationalization.mid_gap) *
          rationalization.mid_usage +
        (rationalization.max_eul - rationalization.max_gap) *
          rationalization.max_usage
      : 0;

    const grossRevenue = revenue_saving + revenue_sales + totalRationalization;

    const laborCost =
      store.useEc && ecCount > 0
        ? (config.price_labor_ec || 0.24) * 100000000
        : 0;
    const initialAnnualCost =
      (grossRevenue * store.maintenanceRate) / 100 + laborCost;
    const totalInvest20YearsWon = invest * 100000000 + initialAnnualCost * 20;
    const netProfit = grossRevenue - initialAnnualCost;

    let totalNet20 = 0;
    let currentGen = annualGen;
    for (let i = 0; i < 20; i++) {
      const ratio = currentGen / annualGen;
      const yrRev =
        (revenue_saving + revenue_sales) * ratio + totalRationalization;
      const yrCost = (yrRev * store.maintenanceRate) / 100 + laborCost;
      totalNet20 += yrRev - yrCost;
      currentGen *= 1 - store.degradationRate / 100;
    }

    const roiPercent =
      totalInvest20YearsWon > 0
        ? (totalNet20 / totalInvest20YearsWon) * 100
        : 0;

    return {
      title: '☀️ Standard Plan (REC 1.5)',
      invest,
      ecCount,
      netProfit,
      totalNet20,
      roiPercent,
      roiYears: netProfit > 0 ? (invest * 100000000) / netProfit : 0,
      isPro: false,
    };
  };

  // (B) Expansion Data (REC 5.0) - 로직 동일 (단가만 변경)
  const getExpansionData = () => {
    const rawEcCount = Math.floor(capacity / 100);
    const ecCount = Math.min(3, rawEcCount);
    let invest = store.totalInvestment;
    if (!store.useEc) {
      const addedCost =
        ecCount * (config.price_ec_unit || 0.7) +
        (config.price_tractor || 0.4) +
        (config.price_platform || 0.3);
      invest += addedCost;
    }

    const revenue_saving = Math.min(annualGen, annualSelf) * unitPriceSavings;
    const unitPriceEc5 = config.unit_price_ec_5_0 || 441.15;
    const revenue_sales = annualSurplus * unitPriceEc5;

    // 합리화 절감액
    const isEul = store.contractType.includes('(을)');
    const totalRationalization = isEul
      ? rationalization.base_savings_manual +
        (rationalization.light_eul - rationalization.light_gap) *
          rationalization.light_usage +
        (rationalization.mid_eul - rationalization.mid_gap) *
          rationalization.mid_usage +
        (rationalization.max_eul - rationalization.max_gap) *
          rationalization.max_usage
      : 0;

    const grossRevenue = revenue_saving + revenue_sales + totalRationalization;
    const laborCost = (config.price_labor_ec || 0.24) * 100000000;
    const initialAnnualCost =
      (grossRevenue * store.maintenanceRate) / 100 + laborCost;
    const totalInvest20YearsWon = invest * 100000000 + initialAnnualCost * 20;
    const netProfit = grossRevenue - initialAnnualCost;

    let totalNet20 = 0;
    let currentGen = annualGen;
    for (let i = 0; i < 20; i++) {
      const ratio = currentGen / annualGen;
      const yrRev =
        (revenue_saving + revenue_sales) * ratio + totalRationalization;
      const yrCost = (yrRev * store.maintenanceRate) / 100 + laborCost;
      totalNet20 += yrRev - yrCost;
      currentGen *= 1 - store.degradationRate / 100;
    }

    const roiPercent =
      totalInvest20YearsWon > 0
        ? (totalNet20 / totalInvest20YearsWon) * 100
        : 0;

    return {
      title: '🚀 Premium Plan (REC 5.0 / 설비확장)',
      invest,
      ecCount,
      netProfit,
      totalNet20,
      roiPercent,
      roiYears: netProfit > 0 ? (invest * 100000000) / netProfit : 0,
      isPro: true,
    };
  };

  const stdData = getStandardData();
  const expData = getExpansionData();

  // ----------------------------------------------------------------
  // 3. 하단 비교 데이터 (무투자 모델) 계산 [수정됨]
  // ----------------------------------------------------------------

  // (1) 단순 지붕 임대형
  // 식: 용량(kW) * 0.4 / 1000 (억 원 단위)
  const simpleRentalRevenueUk = (capacity * 0.4) / 1000;
  // 절감율: (수익 억원 * 1억) / 설치전 총 전기요금
  const simpleRentalSavingRate =
    totalBillBefore > 0
      ? ((simpleRentalRevenueUk * 100000000) / totalBillBefore) * 100
      : 0;

  // (2) RE100 연계 임대형 (Step5의 rental_revenue_yr 로직 사용)
  // 식: (용량 * 0.2 * 한전단가 * 3.64 * 365) + (용량 * 0.8 * 임대단가)
  const rental_revenue_part1 =
    capacity * 0.2 * config.unit_price_kepco * 3.64 * 365;
  const rental_revenue_part2 = capacity * 0.8 * config.rental_price_per_kw;
  const re100RentalRevenue = rental_revenue_part1 + rental_revenue_part2;
  const re100RentalRevenueUk = re100RentalRevenue / 100000000;
  // 절감율
  const re100RentalSavingRate =
    totalBillBefore > 0 ? (re100RentalRevenue / totalBillBefore) * 100 : 0;

  // (3) 구독 서비스형 (Step5의 sub_revenue_yr 로직 사용)
  // 식: (자가소비량 * (210.5 - 구독자가단가)) + (잉여전력 * 구독잉여단가)
  const price_standard = 210.5;
  const sub_benefit_savings =
    annualSelf * (price_standard - config.sub_price_self);
  const sub_revenue_surplus = annualSurplus * config.sub_price_surplus;
  const subRevenue = sub_benefit_savings + sub_revenue_surplus;
  const subRevenueUk = subRevenue / 100000000;
  // 절감율
  const subSavingRate =
    totalBillBefore > 0 ? (subRevenue / totalBillBefore) * 100 : 0;

  // ----------------------------------------------------------------
  // UI 렌더링
  // ----------------------------------------------------------------
  const toUk = (val: number) => val.toFixed(2);
  const toUkFromWon = (val: number) => (val / 100000000).toFixed(2);

  const renderRow = (d: typeof stdData) => (
    <div className={`${styles.flowContainer} ${d.isPro ? styles.proRow : ''}`}>
      {/* 1. 투자 */}
      <div className={`${styles.card} ${styles.cardInvest}`}>
        <div
          className={`${styles.cardHeader} ${d.isPro ? styles.headerPro : ''}`}
        >
          투자 (Investment)
        </div>
        <div className={styles.cardBody}>
          <div className={styles.mainValue}>
            {toUk(d.invest)} <span className={styles.unit}>억원</span>
          </div>
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <span>용량</span>
              <strong>{capacity} kW</strong>
            </div>
            <div className={styles.detailItem}>
              <span>EC설비</span>
              <span>
                {d.ecCount} 대 {d.isPro && '(확장)'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.arrowWrapper}>
        <LucideArrowRight
          size={24}
          strokeWidth={3}
          color={d.isPro ? '#f59e0b' : '#cbd5e1'}
        />
      </div>

      {/* 2. 연간 수익 */}
      <div className={`${styles.card} ${styles.cardAnnual}`}>
        <div
          className={`${styles.cardHeader} ${d.isPro ? styles.headerPro : ''}`}
        >
          연간 수익 (1차년)
        </div>
        <div className={styles.cardBody}>
          <div className={styles.mainValue}>
            {toUkFromWon(d.netProfit)} <span className={styles.unit}>억원</span>
          </div>
          <div className={styles.detailList}>
            <div className={styles.detailItem}>
              <span>수익모델</span>
              <span
                style={{
                  fontWeight: 'bold',
                  color: d.isPro ? '#d97706' : 'inherit',
                }}
              >
                {d.isPro ? 'REC 5.0' : 'REC 1.5'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.arrowWrapper}>
        <LucideArrowRight
          size={24}
          strokeWidth={3}
          color={d.isPro ? '#f59e0b' : '#cbd5e1'}
        />
      </div>

      {/* 3. 20년 수익 */}
      <div
        className={`${styles.card} ${styles.cardTotal} ${
          d.isPro ? styles.cardHighlight : ''
        }`}
      >
        <div
          className={`${styles.cardHeader} ${d.isPro ? styles.headerPro : ''}`}
        >
          20년 누적 수익
        </div>
        <div className={styles.cardBody}>
          <div
            className={`${styles.mainValue} ${
              d.isPro ? styles.textHighlight : ''
            }`}
          >
            {toUkFromWon(d.totalNet20)}{' '}
            <span className={styles.unit}>억원</span>
          </div>
          <div className={styles.roiBadge}>
            ROI {d.roiPercent.toFixed(1)}% ({d.roiYears.toFixed(1)}년)
          </div>
          {d.isPro && (
            <div className={styles.deltaText}>
              (Basic 대비 +{toUkFromWon(d.totalNet20 - stdData.totalNet20)}억)
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {/* 상단 헤더 & 컨트롤 */}
      <div className={styles.headerWrapper}>
        <div className={styles.headerTitle}>
          01. RE100 에너지 발전 수익 분석 (종합)
        </div>
        <button
          className={`${styles.expandBtn} ${
            showExpansion ? styles.active : ''
          }`}
          onClick={() => setShowExpansion(!showExpansion)}
        >
          {showExpansion ? '➖ 비교 닫기' : '➕ REC 5.0 확장 플랜 비교'}
        </button>
      </div>

      {/* 1. 기본 플랜 */}
      <div className={styles.planSection}>
        <div className={styles.sectionTitle}>
          TYPE A. Standard Plan (안정형)
        </div>
        {renderRow(stdData)}
      </div>

      {/* 2. 확장 플랜 */}
      {showExpansion && (
        <div className={`${styles.planSection} ${styles.fadeIn}`}>
          <div className={styles.connector}>
            <div className={styles.connectorLine}></div>
            <div className={styles.connectorIcon}>
              <LucideChevronsDown size={20} /> 설비 확장 시 수익 극대화
            </div>
            <div className={styles.connectorLine}></div>
          </div>
          <div className={styles.sectionTitle} style={{ color: '#d97706' }}>
            TYPE B. Premium Plan (수익 극대화형)
          </div>
          {renderRow(expData)}
        </div>
      )}

      {/* [수정] 하단 비교 섹션 (3가지 모델 표시) */}
      <div className={styles.comparisonSection}>
        <div className={styles.compHeader}>
          <LucideWallet size={16} /> 초기 투자가 없는 모델 비교 (연간 수익 /
          전기요금 절감율)
        </div>

        {/* 1. 단순 지붕 임대형 */}
        <div className={styles.compRow}>
          <span className={styles.compLabel}>1. 단순 지붕 임대형</span>
          <span className={styles.compValue}>
            {simpleRentalRevenueUk.toFixed(3)} 억원
          </span>
          <span className={styles.compSub}>
            (전기요금 절감율{' '}
            <span className="font-bold text-blue-600">
              {simpleRentalSavingRate.toFixed(1)}%
            </span>
            )
          </span>
        </div>

        {/* 2. RE100 연계 임대형 (Highlight) */}
        <div className={`${styles.compRow}`}>
          <span className={styles.compLabel}>2. RE100 연계 임대형</span>
          <span className={styles.compValue}>
            {re100RentalRevenueUk.toFixed(3)} 억원
          </span>
          <span className={styles.compSub}>
            (전기요금 절감율{' '}
            <span className="font-bold text-blue-600">
              {re100RentalSavingRate.toFixed(1)}%
            </span>
            )
          </span>
        </div>

        {/* 3. 구독 서비스형 */}
        <div className={styles.compRow}>
          <span className={styles.compLabel}>3. 구독 서비스형</span>
          <span className={styles.compValue}>
            {subRevenueUk.toFixed(3)} 억원
          </span>
          <span className={styles.compSub}>
            (전기요금 절감율{' '}
            <span className="font-bold text-blue-600">
              {subSavingRate.toFixed(1)}%
            </span>
            )
          </span>
        </div>
      </div>
    </div>
  );
}
