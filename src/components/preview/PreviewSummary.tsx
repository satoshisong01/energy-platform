'use client';

import React, { useState, useEffect } from 'react';
import { useProposalStore } from '../../lib/store';
import styles from './PreviewSummary.module.css';
import {
  LucideArrowRight,
  LucideWallet,
  LucideChevronsDown,
  LucideTruck,
} from 'lucide-react';

export default function PreviewSummary() {
  const store = useProposalStore();
  const { config } = store;

  // [핵심] Store의 중앙 계산 로직 결과 가져오기
  const results = store.getSimulationResults();

  const [showExpansion, setShowExpansion] = useState(false);
  const [applyEc, setApplyEc] = useState(
    store.useEc && store.selectedModel !== 'KEPCO'
  );

  useEffect(() => {
    setApplyEc(store.useEc && store.selectedModel !== 'KEPCO');
  }, [store.useEc, store.selectedModel]);

  // ----------------------------------------------------------------
  // 1. 공통 데이터 (Store 값 사용)
  // ----------------------------------------------------------------
  const capacity = store.capacityKw;
  const re100Rate =
    (results.initialAnnualGen /
      store.monthlyData.reduce((acc, cur) => acc + cur.usageKwh, 0)) *
      100 || 0;

  // 전기요금 절감율 (기존 로직 유지하되 results 값 활용 가능하면 활용)
  // 다만 절감율 계산은 월별 데이터 합산이 필요하므로 기존 로직 유지 (단, 기본료 절감액 공식은 Store와 동일해야 함)
  const totalBillBefore = store.monthlyData.reduce(
    (acc, cur) => acc + cur.totalBill,
    0
  );

  // 절감율 계산을 위한 간단 로직 (Store와 동일하게 맞춤)
  let totalBillSavings = 0;
  store.monthlyData.forEach((data) => {
    const days = new Date(2025, data.month, 0).getDate();
    const autoGen = capacity * 3.64 * days;
    const solarGen = data.solarGeneration > 0 ? data.solarGeneration : autoGen;
    const selfConsum = data.selfConsumption;

    // 사용량 요금 절감
    const usageSaving =
      Math.min(solarGen, selfConsum) *
      (store.unitPriceSavings || config.unit_price_savings);

    // 기본요금 절감 (피크치 또는 부하율 기반)
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
  // 2. 시나리오 데이터 구성 (Store의 results 활용)
  // ----------------------------------------------------------------
  // * 참고: 현재 Store의 results는 '현재 설정된 상태' 기준의 값만 반환합니다.
  //   따라서 '확장 플랜(REC 5.0)' 등의 비교 데이터를 보여주려면
  //   Store 내부 로직과 동일한 계산을 여기서 일부 수행해야 합니다.
  //   (단, 기본 플랜은 results 값을 그대로 씁니다.)

  const getScenarioData = (isPremium: boolean) => {
    // A. 기본 플랜 (현재 설정 상태)
    if (!isPremium) {
      return {
        title: 'TYPE A. Standard Plan (안정형)',
        invest: results.totalInvestmentUk, // 억원 단위
        ecCount: applyEc ? (store.truckCount > 0 ? store.truckCount : 3) : 0,
        annualProfit: results.annualOperatingProfit / 100000000, // 억원 변환
        totalProfit20: results.self_final_profit / 100000000, // 억원 변환
        roiYears: results.self_roi_years,
        profitRate:
          (results.self_final_profit /
            (results.totalInvestment + results.annualMaintenanceCost * 20)) *
          100, // 대략적 수익률
        isPro: false,
        modelName: 'REC 1.5', // 기본
      };
    }

    // B. 확장 플랜 (Premium / REC 5.0 가정)
    // 여기서는 '가상 계산'이 필요하므로 간략하게직접 계산하거나, Store 구조를 바꿔야 하지만
    // 기존 로직을 최대한 활용하여 '단가'만 바꿔서 계산합니다.

    // (기존 코드의 calculateScenario 로직을 가져오되, Store와 수식 일치시킴)
    const targetEcPrice = config.unit_price_ec_5_0; // Premium 단가

    const activeTruckCount = applyEc
      ? store.truckCount > 0
        ? store.truckCount
        : 3
      : 0;
    const ecCapacityAnnual = activeTruckCount * 100 * 4 * 365;

    // 물량 계산 (Store와 동일)
    const annualGen = results.initialAnnualGen;
    const annualSelf = store.monthlyData.reduce(
      (acc, cur) => acc + cur.selfConsumption,
      0
    );
    const rawSurplus = Math.max(0, annualGen - annualSelf);
    const volume_ec = Math.min(rawSurplus, ecCapacityAnnual);
    const volume_surplus_final = Math.max(0, rawSurplus - volume_ec);

    // 수익 계산
    const revenue_saving =
      Math.min(annualGen, annualSelf) *
      (store.unitPriceSavings || config.unit_price_savings);
    const revenue_ec = volume_ec * targetEcPrice; // 여기가 다름 (5.0 단가)
    const revenue_surplus = volume_surplus_final * config.unit_price_kepco;

    const grossRevenue =
      revenue_saving +
      revenue_ec +
      revenue_surplus +
      results.totalRationalizationSavings; // 합리화 절감액은 동일

    // 비용 계산
    const laborCostWon =
      activeTruckCount > 0 ? config.price_labor_ec * 100000000 : 0;
    const maintenanceCost =
      (grossRevenue * store.maintenanceRate) / 100 + laborCostWon;

    const annualNetProfitWon = grossRevenue - maintenanceCost;

    // 투자비 (Premium 모듈 가정)
    const solarPrice = config.price_solar_premium;
    const solarCost = (capacity / 100) * solarPrice;
    const ecCost = activeTruckCount * config.price_ec_unit;
    const infraCost =
      activeTruckCount > 0 ? config.price_tractor + config.price_platform : 0;
    const investUk = solarCost + ecCost + infraCost;
    const investWon = investUk * 100000000;

    // 20년 수익
    const degradationRateDecimal = -(store.degradationRate / 100);
    const R = 1 + degradationRateDecimal;
    const n = 20;
    const totalNet20Won = (annualNetProfitWon * (1 - Math.pow(R, n))) / (1 - R);

    const totalCost20 = investWon + maintenanceCost * 20;

    return {
      title: 'TYPE B. Premium Plan (수익 극대화형)',
      invest: investUk,
      ecCount: activeTruckCount,
      annualProfit: annualNetProfitWon / 100000000,
      totalProfit20: totalNet20Won / 100000000,
      roiYears: annualNetProfitWon > 0 ? investWon / annualNetProfitWon : 0,
      profitRate: totalCost20 > 0 ? (totalNet20Won / totalCost20) * 100 : 0,
      isPro: true,
      modelName: 'REC 5.0',
    };
  };

  const stdData = getScenarioData(false);
  const expData = getScenarioData(true);

  // ----------------------------------------------------------------
  // 3. 하단 무투자 모델 데이터 (Store의 results값 그대로 사용)
  // ----------------------------------------------------------------
  // Store에서 이미 계산된 값을 가져옵니다. (단위: 원 -> 억원 변환 필요)

  // 1) 단순 지붕 임대형
  // (기존 코드: const simpleRentalRevenueUk = (capacity * 0.4) / 1000;)
  // Store에는 이 값이 없으므로 여기서 계산 유지 (단순 계산이라 오차 적음)
  const simpleRentalRevenueUk = (capacity * 0.4) / 1000;
  const simpleRentalSavingRate =
    totalBillBefore > 0
      ? ((simpleRentalRevenueUk * 100000000) / totalBillBefore) * 100
      : 0;

  // 2) RE100 연계 임대형
  const re100RentalRevenueUk = results.rental_revenue_yr / 100000000;
  const re100RentalSavingRate =
    totalBillBefore > 0
      ? (results.rental_revenue_yr / totalBillBefore) * 100
      : 0;

  // 3) 구독 서비스형
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
              <span
                style={{
                  color: d.ecCount > 0 ? '#2563eb' : '#94a3b8',
                  fontWeight: d.ecCount > 0 ? 'bold' : 'normal',
                }}
              >
                {d.ecCount > 0 ? `${d.ecCount} 대` : '미적용'}
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

      {/* 중간 연결부 */}
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

        <div className="flex items-center gap-3 no-print">
          <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition shadow-sm select-none">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              checked={applyEc}
              onChange={(e) => setApplyEc(e.target.checked)}
            />
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-700">
              <LucideTruck
                size={16}
                className={applyEc ? 'text-blue-600' : 'text-slate-400'}
              />
              <span>에너지 캐리어(EC) 적용 비교</span>
            </div>
          </label>

          <button
            className={`${styles.expandBtn} ${
              showExpansion ? styles.active : ''
            }`}
            onClick={() => setShowExpansion(!showExpansion)}
          >
            {showExpansion ? '➖ 비교 닫기' : '➕ REC 5.0 확장 플랜 비교'}
          </button>
        </div>
      </div>

      <div className={styles.planSection}>
        <div className={styles.sectionTitle}>{stdData.title}</div>
        {renderRow(stdData)}
      </div>

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
          <span className={styles.compRec}>
            REC <span className={styles.recValue}>0.00</span>
          </span>
        </div>

        {/* 2. RE100 연계 임대형 */}
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
          <span className={styles.compRec}>
            REC{' '}
            <span className={styles.recValue}>
              {results.rec_1000_rent.toFixed(2)}
            </span>
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
          <span className={styles.compRec}>
            REC{' '}
            <span className={styles.recValue}>
              {results.rec_1000_sub.toFixed(2)}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
