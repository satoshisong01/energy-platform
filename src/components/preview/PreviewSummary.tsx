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
  const { config } = store;

  // 스토어에서 "물량 데이터"를 가져오기 위해 호출 (단가는 무시하고 물량만 씀)
  const results = store.getSimulationResults();

  const [showExpansion, setShowExpansion] = useState(false);

  // ----------------------------------------------------------------
  // 1. 공통 지표 (RE100 충족률, 절감률) - 시나리오와 무관하게 동일
  // ----------------------------------------------------------------
  const capacity = store.capacityKw;

  // (1) RE100 충족률
  const totalUsage = store.monthlyData.reduce(
    (acc, cur) => acc + cur.usageKwh,
    0
  );
  const re100Rate =
    totalUsage > 0 ? (results.initialAnnualGen / totalUsage) * 100 : 0;

  // (2) 전기요금 절감률 (Step3 방식 정밀 계산)
  const totalBillBefore = store.monthlyData.reduce(
    (acc, cur) => acc + cur.totalBill,
    0
  );

  let totalBillSavings = 0;
  store.monthlyData.forEach((data) => {
    const days = new Date(2025, data.month, 0).getDate();
    const autoGen = capacity * 3.64 * days;
    const solarGen = data.solarGeneration > 0 ? data.solarGeneration : autoGen;
    const selfConsum = data.selfConsumption;

    // 전력량 요금 절감
    const usageSaving =
      Math.min(solarGen, selfConsum) *
      (store.unitPriceSavings || config.unit_price_savings);

    // 기본요금 절감
    const totalUsageYear = store.monthlyData.reduce(
      (acc, cur) => acc + cur.usageKwh,
      0
    );
    const totalSelfYear = store.monthlyData.reduce(
      (acc, cur) => acc + cur.selfConsumption,
      0
    );
    const dynamicPeakRatio =
      totalUsageYear > 0 ? totalSelfYear / totalUsageYear : 0;

    let baseBillSaving = 0;
    if (data.peakKw > 0) {
      baseBillSaving = Math.max(
        0,
        data.baseBill - store.baseRate * data.peakKw
      );
    } else {
      baseBillSaving = data.baseBill * dynamicPeakRatio;
    }
    totalBillSavings += usageSaving + baseBillSaving;
  });

  const savingRate =
    totalBillBefore > 0 ? (totalBillSavings / totalBillBefore) * 100 : 0;

  // ----------------------------------------------------------------
  // 2. 시나리오별 계산 함수 (1.5 vs 5.0 강제 적용)
  // ----------------------------------------------------------------
  const calculateScenario = (isPremium: boolean) => {
    // 1. 단가 설정 (핵심: 여기서 강제로 갈라짐)
    // Premium이면 5.0 단가, 아니면 1.5 단가 사용
    const targetEcPrice = isPremium
      ? config.unit_price_ec_5_0
      : config.unit_price_ec_1_5;
    const modelName = isPremium ? 'REC 5.0' : 'REC 1.5';

    // 2. 수익 재계산
    // results에 있는 물량(volume_ec, volume_self 등)은 이미 트럭 수 등이 반영된 값임
    // 단, "설비 확장" 개념이라면 트럭 수를 늘려야 하지만,
    // 여기서는 "현재 설정 기준"에서 단가 차이를 보여주는 것이 1차 목표
    // (사용자가 5.0을 보고 싶으면 트럭을 늘려서 볼 것이므로 현재 설정을 따름)

    const revenue_saving = results.revenue_saving; // 자가소비 수익 (동일)
    const revenue_ec = results.volume_ec * targetEcPrice; // EC 수익 (단가 적용)

    // 잉여 한전 판매 (EC로 못 간 나머지)
    // KEPCO 모델일 경우 volume_ec가 0이므로 전체가 한전 판매로 잡힘 -> 비교를 위해 EC 모델 가정
    // *만약 사용자가 KEPCO 모델을 선택했더라도 비교표에서는 EC 가능 물량을 가정해서 보여줄지 여부 결정 필요
    // *여기서는 store.useEc가 true일 때의 물량을 그대로 쓴다고 가정 (results.volume_ec)
    const revenue_surplus =
      results.volume_surplus_final * config.unit_price_kepco;

    // 합리화 절감액
    const totalRationalization = results.totalRationalizationSavings;

    // 총 수익 (Gross)
    const grossRevenue =
      revenue_saving + revenue_ec + revenue_surplus + totalRationalization;

    // 3. 비용 계산
    const laborCostWon = results.laborCostWon; // 인건비 (동일)
    const maintenanceCost =
      (grossRevenue * store.maintenanceRate) / 100 + laborCostWon;

    // 4. 순수익 (Net)
    const annualNetProfitWon = grossRevenue - maintenanceCost;
    const annualNetProfitUk = annualNetProfitWon / 100000000;

    // 5. 20년 누적 (등비수열 합)
    const degradationRateDecimal = -(store.degradationRate / 100);
    const R = 1 + degradationRateDecimal;
    const n = 20;
    const totalNet20Won = (annualNetProfitWon * (1 - Math.pow(R, n))) / (1 - R);
    const totalNet20Uk = totalNet20Won / 100000000;

    // 6. 투자비 (동일)
    const investUk = results.totalInvestmentUk;
    const investWon = results.totalInvestment;

    // ROI (년)
    const roiYears =
      annualNetProfitWon > 0 ? investWon / annualNetProfitWon : 0;

    // 수익률 (%)
    // 20년 총 비용 = 초기투자 + (연간비용 * 20)
    const totalCost20 = investWon + maintenanceCost * 20;
    const profitRate =
      totalCost20 > 0 ? (totalNet20Won / totalCost20) * 100 : 0;

    return {
      title: isPremium
        ? 'TYPE B. Premium Plan (수익 극대화형)'
        : 'TYPE A. Standard Plan (안정형)',
      invest: investUk,
      ecCount: store.truckCount,
      annualProfit: annualNetProfitUk,
      totalProfit20: totalNet20Uk,
      roiYears,
      profitRate,
      isPro: isPremium,
      modelName,
    };
  };

  const stdData = calculateScenario(false); // REC 1.5 계산
  const expData = calculateScenario(true); // REC 5.0 계산

  // ----------------------------------------------------------------
  // 3. 하단 무투자 모델 데이터 (기존 로직)
  // ----------------------------------------------------------------
  const simpleRentalRevenueUk = (capacity * 0.4) / 1000;
  const simpleRentalSavingRate =
    totalBillBefore > 0
      ? ((simpleRentalRevenueUk * 100000000) / totalBillBefore) * 100
      : 0;

  const re100RentalRevenueUk = results.rental_revenue_yr / 100000000;
  const re100RentalSavingRate =
    totalBillBefore > 0
      ? (results.rental_revenue_yr / totalBillBefore) * 100
      : 0;

  const subRevenueUk = results.sub_revenue_yr / 100000000;
  const subSavingRate =
    totalBillBefore > 0 ? (results.sub_revenue_yr / totalBillBefore) * 100 : 0;

  // ----------------------------------------------------------------
  // UI Helper
  // ----------------------------------------------------------------
  const toUk = (val: number) => val.toFixed(2);

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
              <span>{d.ecCount} 대</span>
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
            {toUk(d.annualProfit)} <span className={styles.unit}>억원</span>
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
                {d.modelName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* [NEW] 중간 연결부 (RE100% / 절감%) - 카드 사이에 배치 */}
      <div className={styles.middleConnect}>
        <div className={styles.connectArrowLine}></div>
        <div className={styles.connectContent}>
          <div className={styles.connectItem}>
            <span className={styles.connectValueRed}>
              {re100Rate.toFixed(1)} %
            </span>
            <span className={styles.connectLabel}>RE100 충족</span>
          </div>
          <div className={styles.connectItem}>
            <span className={styles.connectValueBlue}>
              {savingRate.toFixed(1)} %
            </span>
            <span className={styles.connectLabel}>전기요금 절감</span>
          </div>
        </div>
        <div className={styles.connectArrowLine}>
          <div className={styles.arrowHead}></div>
        </div>
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
          <div className={styles.totalRow}>
            <div
              className={`${styles.mainValue} ${
                d.isPro ? styles.textHighlight : ''
              }`}
            >
              {toUk(d.totalProfit20)} <span className={styles.unit}>억원</span>
            </div>
            <div className={styles.profitRateBadge}>
              {d.profitRate.toFixed(1)}%
            </div>
          </div>

          <div className={styles.roiBox}>
            <span className={styles.roiLabel}>ROI (회수)</span>
            <span className={styles.roiValue}>{d.roiYears.toFixed(2)} 년</span>
          </div>

          {d.isPro && (
            <div className={styles.deltaText}>
              (Basic 대비 +{toUk(d.totalProfit20 - stdData.totalProfit20)}억)
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
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

      {/* 1. 기본 플랜 (REC 1.5) */}
      <div className={styles.planSection}>
        <div className={styles.sectionTitle}>{stdData.title}</div>
        {renderRow(stdData)}
      </div>

      {/* 2. 확장 플랜 (REC 5.0) */}
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
            {expData.title}
          </div>
          {renderRow(expData)}
        </div>
      )}

      {/* 하단 비교 섹션 */}
      <div className={styles.comparisonSection}>
        <div className={styles.compHeader}>
          <LucideWallet size={16} /> 초기 투자가 없는 모델 비교 (연간 수익 /
          전기요금 절감율)
        </div>

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
