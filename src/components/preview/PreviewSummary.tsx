'use client';

import React, { useState } from 'react';
import { useProposalStore } from '../../lib/store';
import styles from './PreviewSummary.module.css';
import {
  LucideArrowRight,
  LucideWallet,
  LucideZap,
  LucideChevronsDown,
} from 'lucide-react';

export default function PreviewSummary() {
  const store = useProposalStore();
  const { config } = store;

  // [Toggle State] false: 기본만 보기, true: 확장플랜 함께 보기
  const [showExpansion, setShowExpansion] = useState(false);

  // ----------------------------------------------------------------
  // 1. 공통 기본 데이터 계산
  // ----------------------------------------------------------------
  const capacity = store.capacityKw;
  const daysInYear = 365;
  const annualGen = capacity * 3.64 * daysInYear;
  const annualSelf = store.monthlyData.reduce(
    (acc, cur) => acc + cur.selfConsumption,
    0
  );
  const annualSurplus = Math.max(0, annualGen - annualSelf);
  const unitPriceSavings = store.unitPriceSavings || config.unit_price_savings;

  // ----------------------------------------------------------------
  // 2. 시나리오별 데이터 준비 Function
  // ----------------------------------------------------------------

  // (A) Standard Data (REC 1.5)
  const getStandardData = () => {
    // 투자비
    const invest = store.totalInvestment; // 억원
    const ecCount =
      store.useEc && store.selectedModel !== 'KEPCO'
        ? Math.min(3, Math.floor(capacity / 100))
        : 0;

    // 연간 수익
    const revenue_saving = Math.min(annualGen, annualSelf) * unitPriceSavings;
    let revenue_sales = 0;
    if (store.useEc && store.selectedModel !== 'KEPCO') {
      revenue_sales = annualSurplus * config.unit_price_ec_1_5;
    } else {
      revenue_sales = annualSurplus * config.unit_price_kepco;
    }
    const grossRevenue = revenue_saving + revenue_sales;

    // 비용
    const laborCost =
      store.useEc && ecCount > 0
        ? (config.price_labor_ec || 0.24) * 100000000
        : 0;
    const annualCost = (grossRevenue * store.maintenanceRate) / 100 + laborCost;
    const netProfit = grossRevenue - annualCost;

    // 20년 누적
    let totalNet20 = 0;
    let currentGen = annualGen;
    for (let i = 0; i < 20; i++) {
      const ratio = currentGen / annualGen;
      const yrRev = grossRevenue * ratio;
      const yrCost = (yrRev * store.maintenanceRate) / 100 + laborCost;
      totalNet20 += yrRev - yrCost;
      currentGen *= 1 - store.degradationRate / 100;
    }

    return {
      title: '☀️ Standard Plan (REC 1.5)',
      invest,
      ecCount,
      netProfit,
      totalNet20,
      roiPercent: invest > 0 ? (totalNet20 / (invest * 100000000)) * 100 : 0,
      roiYears: netProfit > 0 ? (invest * 100000000) / netProfit : 0,
      isPro: false,
    };
  };

  // (B) Expansion Data (REC 5.0)
  const getExpansionData = () => {
    // 추가 설비 가정
    const rawEcCount = Math.floor(capacity / 100);
    const ecCount = Math.min(3, rawEcCount); // 확장 시 강제 적용

    // 투자비 증가분 (Standard에 EC가 없을 경우 추가)
    let invest = store.totalInvestment;
    if (!store.useEc) {
      const addedCost =
        ecCount * (config.price_ec_unit || 0.7) +
        (config.price_tractor || 0.4) +
        (config.price_platform || 0.3);
      invest += addedCost;
    }

    // 연간 수익 (REC 5.0 단가 적용)
    const revenue_saving = Math.min(annualGen, annualSelf) * unitPriceSavings;
    const unitPriceEc5 = config.unit_price_ec_5_0 || 441.15;
    const revenue_sales = annualSurplus * unitPriceEc5; // 잉여 전체에 5.0 적용 가정
    const grossRevenue = revenue_saving + revenue_sales;

    // 비용 (EC 인건비 필수로 포함)
    const laborCost = (config.price_labor_ec || 0.24) * 100000000;
    const annualCost = (grossRevenue * store.maintenanceRate) / 100 + laborCost;
    const netProfit = grossRevenue - annualCost;

    // 20년 누적
    let totalNet20 = 0;
    let currentGen = annualGen;
    for (let i = 0; i < 20; i++) {
      const ratio = currentGen / annualGen;
      const yrRev = grossRevenue * ratio;
      const yrCost = (yrRev * store.maintenanceRate) / 100 + laborCost;
      totalNet20 += yrRev - yrCost;
      currentGen *= 1 - store.degradationRate / 100;
    }

    return {
      title: '🚀 Premium Plan (REC 5.0 / 설비확장)',
      invest,
      ecCount,
      netProfit,
      totalNet20,
      roiPercent: invest > 0 ? (totalNet20 / (invest * 100000000)) * 100 : 0,
      roiYears: netProfit > 0 ? (invest * 100000000) / netProfit : 0,
      isPro: true,
    };
  };

  const stdData = getStandardData();
  const expData = getExpansionData();

  // ----------------------------------------------------------------
  // 3. UI 헬퍼 & 렌더링
  // ----------------------------------------------------------------
  const toUk = (val: number) => val.toFixed(2);
  const toUkFromWon = (val: number) => (val / 100000000).toFixed(2);

  // 반복되는 카드 행(Row)을 그려주는 함수
  const renderRow = (d: typeof stdData) => (
    <div className={`${styles.flowContainer} ${d.isPro ? styles.proRow : ''}`}>
      {/* 타이틀 (Row 좌측에 작게 표시하거나, 상단에 표시) */}
      {/* {d.isPro && <div className={styles.rowLabelBadge}>Extended</div>} */}

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
            ROI {d.roiPercent.toFixed(0)}% ({d.roiYears.toFixed(1)}년)
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

  // 비교군 데이터 (지붕임대 / 구독형) - 변동 없음
  const rentalProfit20y =
    capacity * 0.8 * config.rental_price_per_kw * 20 +
    capacity * 0.2 * 192.79 * 3.6 * 365 * 20;
  const subProfit20y =
    (annualSelf * (210.5 - config.sub_price_self) +
      annualSurplus * config.sub_price_surplus) *
    20;

  return (
    <div className={styles.container}>
      {/* 상단 헤더 & 컨트롤 */}
      <div className={styles.headerWrapper}>
        <div className={styles.headerTitle}>
          01. RE100 에너지 발전 수익 분석 (종합)
        </div>

        {/* 버튼: 토글 형태지만 '추가' 개념 */}
        <button
          className={`${styles.expandBtn} ${
            showExpansion ? styles.active : ''
          }`}
          onClick={() => setShowExpansion(!showExpansion)}
        >
          {showExpansion ? '➖ 비교 닫기' : '➕ REC 5.0 확장 플랜 비교'}
        </button>
      </div>

      {/* 1. 기본 플랜 (항상 보임) */}
      <div className={styles.planSection}>
        <div className={styles.sectionTitle}>
          TYPE A. Standard Plan (안정형)
        </div>
        {renderRow(stdData)}
      </div>

      {/* 2. 확장 플랜 (버튼 누르면 아래에 추가됨) */}
      {showExpansion && (
        <div className={`${styles.planSection} ${styles.fadeIn}`}>
          {/* 구분선 및 연결 고리 */}
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

      {/* 하단 비교 섹션 */}
      <div className={styles.comparisonSection}>
        <div className={styles.compHeader}>
          <LucideWallet size={16} /> 초기 투자가 없는 모델 비교 (20년 누적)
        </div>
        <div className={styles.compRow}>
          <span className={styles.compLabel}>1. 단순 지붕 임대형</span>
          <span className={styles.compValue}>
            {(rentalProfit20y / 100000000).toFixed(2)} 억원
          </span>
          <span className={styles.compRate}>Low</span>
        </div>
        <div className={styles.compRow}>
          <span className={styles.compLabel}>2. 구독 서비스형</span>
          <span className={styles.compValue}>
            {(subProfit20y / 100000000).toFixed(2)} 억원
          </span>
          <span className={styles.compRate}>High</span>
        </div>
      </div>
    </div>
  );
}
