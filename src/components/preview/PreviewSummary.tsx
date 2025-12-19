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
  const { config, rationalization } = store;

  // REC 값을 가져오기 위해 results 호출
  const results = store.getSimulationResults();

  const [showExpansion, setShowExpansion] = useState(false);
  const [applyEc, setApplyEc] = useState(
    store.useEc && store.selectedModel !== 'KEPCO'
  );

  useEffect(() => {
    setApplyEc(store.useEc && store.selectedModel !== 'KEPCO');
  }, [store.useEc, store.selectedModel]);

  // ----------------------------------------------------------------
  // 1. 기본 물량 재계산 (RE100 가정)
  // ----------------------------------------------------------------
  const capacity = store.capacityKw;

  const annualGen = store.monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + capacity * 3.64 * days;
  }, 0);

  const annualSelf = store.monthlyData.reduce(
    (acc, cur) => acc + cur.selfConsumption,
    0
  );

  const totalUsage = store.monthlyData.reduce(
    (acc, cur) => acc + cur.usageKwh,
    0
  );

  const rawSurplus = Math.max(0, annualGen - annualSelf);

  // ----------------------------------------------------------------
  // 2. 공통 지표 계산
  // ----------------------------------------------------------------
  const re100Rate = totalUsage > 0 ? (annualGen / totalUsage) * 100 : 0;

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

    const usageSaving =
      Math.min(solarGen, selfConsum) *
      (store.unitPriceSavings || config.unit_price_savings);

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

  const isEul = store.contractType.includes('(을)');
  const totalRationalizationSavings = isEul
    ? rationalization.base_savings_manual +
      (rationalization.light_eul - rationalization.light_gap) *
        rationalization.light_usage +
      (rationalization.mid_eul - rationalization.mid_gap) *
        rationalization.mid_usage +
      (rationalization.max_eul - rationalization.max_gap) *
        rationalization.max_usage
    : 0;

  // ----------------------------------------------------------------
  // 3. 시나리오별 계산 함수
  // ----------------------------------------------------------------
  const calculateScenario = (isPremium: boolean) => {
    const targetEcPrice = isPremium
      ? config.unit_price_ec_5_0
      : config.unit_price_ec_1_5;
    const modelName = isPremium ? 'REC 5.0' : 'REC 1.5';

    const activeTruckCount = applyEc
      ? store.truckCount > 0
        ? store.truckCount
        : 3
      : 0;

    const ecCapacityAnnual = activeTruckCount * 100 * 4 * 365;
    const volume_ec = Math.min(rawSurplus, ecCapacityAnnual);
    const volume_surplus_final = Math.max(0, rawSurplus - volume_ec);

    const revenue_saving =
      Math.min(annualGen, annualSelf) *
      (store.unitPriceSavings || config.unit_price_savings);
    const revenue_ec = volume_ec * targetEcPrice;
    const revenue_surplus = volume_surplus_final * config.unit_price_kepco;

    const grossRevenue =
      revenue_saving +
      revenue_ec +
      revenue_surplus +
      totalRationalizationSavings;

    const laborCostWon =
      activeTruckCount > 0 ? config.price_labor_ec * 100000000 : 0;
    const maintenanceCost =
      (grossRevenue * store.maintenanceRate) / 100 + laborCostWon;

    const annualNetProfitWon = grossRevenue - maintenanceCost;
    const annualNetProfitUk = annualNetProfitWon / 100000000;

    let solarPrice = config.price_solar_standard;
    if (store.moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
    if (store.moduleTier === 'ECONOMY') solarPrice = config.price_solar_economy;

    const solarCost = (capacity / 100) * solarPrice;
    const ecCost = activeTruckCount * config.price_ec_unit;
    const infraCost =
      activeTruckCount > 0 ? config.price_tractor + config.price_platform : 0;

    const investUk = solarCost + ecCost + infraCost;
    const investWon = investUk * 100000000;

    const degradationRateDecimal = -(store.degradationRate / 100);
    const R = 1 + degradationRateDecimal;
    const n = 20;
    const totalNet20Won = (annualNetProfitWon * (1 - Math.pow(R, n))) / (1 - R);
    const totalNet20Uk = totalNet20Won / 100000000;

    const totalCost20 = investWon + maintenanceCost * 20;
    const roiYears =
      annualNetProfitWon > 0 ? investWon / annualNetProfitWon : 0;
    const profitRate =
      totalCost20 > 0 ? (totalNet20Won / totalCost20) * 100 : 0;

    return {
      title: isPremium
        ? 'TYPE B. Premium Plan (수익 극대화형)'
        : 'TYPE A. Standard Plan (안정형)',
      invest: investUk,
      ecCount: activeTruckCount,
      annualProfit: annualNetProfitUk,
      totalProfit20: totalNet20Uk,
      roiYears,
      profitRate,
      isPro: isPremium,
      modelName,
    };
  };

  const stdData = calculateScenario(false);
  const expData = calculateScenario(true);

  // ----------------------------------------------------------------
  // 3. 하단 무투자 모델 데이터
  // ----------------------------------------------------------------
  const simpleRentalRevenueUk = (capacity * 0.4) / 1000;
  const simpleRentalSavingRate =
    totalBillBefore > 0
      ? ((simpleRentalRevenueUk * 100000000) / totalBillBefore) * 100
      : 0;

  const rental_revenue_won =
    capacity * 0.2 * config.unit_price_kepco * 3.64 * 365 +
    capacity * 0.8 * config.rental_price_per_kw;
  const re100RentalRevenueUk = rental_revenue_won / 100000000;
  const re100RentalSavingRate =
    totalBillBefore > 0 ? (rental_revenue_won / totalBillBefore) * 100 : 0;

  const price_standard = 210.5;
  const sub_revenue_won =
    annualSelf * (price_standard - config.sub_price_self) +
    rawSurplus * config.sub_price_surplus;
  const subRevenueUk = sub_revenue_won / 100000000;
  const subSavingRate =
    totalBillBefore > 0 ? (sub_revenue_won / totalBillBefore) * 100 : 0;

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

        {/* 1. 단순 지붕 임대형 (REC 0.00 고정) */}
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

        {/* 2. RE100 연계 임대형 (results.rec_1000_rent) */}
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

        {/* 3. 구독 서비스형 (results.rec_1000_sub) */}
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
