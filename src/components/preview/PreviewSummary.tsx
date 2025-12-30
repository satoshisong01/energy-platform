'use client';

import React, { useState, useEffect } from 'react';
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

  // [수정] 합리화 절감액 직접 계산 (Step4 선택 무시 및 독립성 확보)
  const calculateRationalizationSavings = () => {
    const isEul = store.contractType.includes('(을)');
    if (!isEul) return 0;

    // Step4와 동일하게 manual 값 우선 적용
    const saving_base = rationalization.base_savings_manual || 0;

    const diff_light = rationalization.light_eul - rationalization.light_gap;
    const saving_light = diff_light * rationalization.light_usage;

    const diff_mid = rationalization.mid_eul - rationalization.mid_gap;
    const saving_mid = diff_mid * rationalization.mid_usage;

    const diff_max = rationalization.max_eul - rationalization.max_gap;
    const saving_max = diff_max * rationalization.max_usage;

    return saving_base + saving_light + saving_mid + saving_max;
  };

  const fixedRationalizationSavings = calculateRationalizationSavings();

  // Store 결과 (참고용)
  const results = store.getSimulationResults();

  // [공통] 발전량 (단순 계산)
  const simpleAnnualGen = store.monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + store.capacityKw * 3.64 * days;
  }, 0);

  const [showExpansion, setShowExpansion] = useState(false);

  // EC 적용 여부 (Preview 내부용)
  const [applyEc, setApplyEc] = useState(
    store.useEc && store.selectedModel !== 'KEPCO'
  );

  useEffect(() => {
    setApplyEc(store.useEc && store.selectedModel !== 'KEPCO');
  }, [store.useEc, store.selectedModel]);

  const handleEcToggle = (checked: boolean) => {
    setApplyEc(checked);
    store.setSimulationOption('useEc', checked);
  };

  // ... (기초 데이터) ...
  const capacity = store.capacityKw;
  const totalUsage = store.monthlyData.reduce(
    (acc, cur) => acc + cur.usageKwh,
    0
  );
  const re100Rate = totalUsage > 0 ? (simpleAnnualGen / totalUsage) * 100 : 0;
  const totalBillBefore = store.monthlyData.reduce(
    (acc, cur) => acc + cur.totalBill,
    0
  );

  let totalBillSavings = 0;
  store.monthlyData.forEach((data) => {
    const days = new Date(2025, data.month, 0).getDate();
    const autoGen = capacity * 3.64 * days;
    const selfConsum = data.selfConsumption;
    const usageSaving =
      Math.min(autoGen, selfConsum) *
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

  // [상수] 비용 한도
  const MAX_LIMIT = 80000000;

  // --------------------------------------------------------------------------
  // [1] 한전 데이터 독립 계산
  // --------------------------------------------------------------------------
  const calculateKepcoData = () => {
    // 한전도 Step4에서 선택한 모듈 가격을 그대로 사용 (독립적이지만 기준은 통일)
    let solarPrice = config.price_solar_standard;
    if (store.moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
    else if (store.moduleTier === 'ECONOMY')
      solarPrice = config.price_solar_economy;

    const solarCost = (capacity / 100) * solarPrice;
    const investWon = solarCost * 100000000;
    const investUk = solarCost;
    const annualGen = simpleAnnualGen;

    // 수익
    const annualRevenue = annualGen * config.unit_price_kepco;

    // 유지보수 비용 (기본 25%) - 8천만원 한도 적용
    const KEPCO_DEFAULT_RATE = 25.0;
    let appliedRate = KEPCO_DEFAULT_RATE;
    let tempCost = annualRevenue * (appliedRate / 100);

    if (tempCost > MAX_LIMIT) {
      if (annualRevenue > 0) {
        const rawRate = (MAX_LIMIT / annualRevenue) * 100;
        appliedRate = Math.floor(rawRate * 100) / 100;
      } else {
        appliedRate = 0;
      }
    }

    const maintenanceCost = annualRevenue * (appliedRate / 100);
    const annualNetProfit = annualRevenue - maintenanceCost;

    const degradationRateDecimal = -(store.degradationRate / 100);
    const R = 1 + degradationRateDecimal;
    const n = 20;
    const totalNet20Won = (annualNetProfit * (1 - Math.pow(R, n))) / (1 - R);
    const roiYears = annualNetProfit > 0 ? investWon / annualNetProfit : 0;
    const profitRate =
      (totalNet20Won / (investWon + maintenanceCost * 20)) * 100;

    return {
      title: '한전 장기 계약 (20년)',
      investUk: investUk,
      capacity: capacity,
      annualGen: annualGen,
      annualProfitUk: annualNetProfit / 100000000,
      annualRevenueRatio: (annualNetProfit / investWon) * 100,
      totalProfit20Uk: totalNet20Won / 100000000,
      totalProfitRatio: profitRate,
      roiYears: roiYears,
    };
  };
  const kepcoData = calculateKepcoData();

  // --------------------------------------------------------------------------
  // [2] 시나리오별 데이터 독립 계산
  // --------------------------------------------------------------------------
  const getScenarioData = (isPremium: boolean) => {
    const forcedTruckCount = store.truckCount > 0 ? store.truckCount : 3;
    const ecCapacityAnnual = forcedTruckCount * 100 * 4 * 365;

    const annualGen = simpleAnnualGen;
    const annualSelf = store.monthlyData.reduce(
      (acc, cur) => acc + cur.selfConsumption,
      0
    );
    const rawSurplus = Math.max(0, annualGen - annualSelf);

    const volume_ec = Math.min(rawSurplus, ecCapacityAnnual);
    const volume_surplus_final = Math.max(0, rawSurplus - volume_ec);

    let targetEcPrice = 0;
    let modelName = '';

    // [중요] 모듈 가격(투자비)은 1.5든 5.0이든 Step4에서 선택한 것과 '동일'하게 적용
    let currentSolarPrice = config.price_solar_standard;
    if (store.moduleTier === 'PREMIUM')
      currentSolarPrice = config.price_solar_premium;
    else if (store.moduleTier === 'ECONOMY')
      currentSolarPrice = config.price_solar_economy;

    if (isPremium) {
      // 5.0 모델: 단가만 변경, 투자비는 동일
      targetEcPrice = config.unit_price_ec_5_0;
      modelName = 'REC 5.0 (예상)';
    } else {
      // 1.5 모델: 현행 단가
      targetEcPrice = config.unit_price_ec_1_5;
      modelName = 'REC 1.5 (현행)';
    }

    const revenue_saving =
      Math.min(annualGen, annualSelf) *
      (store.unitPriceSavings || config.unit_price_savings);
    const revenue_ec = volume_ec * targetEcPrice;
    const revenue_surplus = volume_surplus_final * config.unit_price_kepco;

    // [중요] fixedRationalizationSavings 사용 (Step4 수동입력 연동)
    const grossRevenue =
      revenue_saving +
      revenue_ec +
      revenue_surplus +
      fixedRationalizationSavings;

    const laborCostWon =
      forcedTruckCount > 0 ? config.price_labor_ec * 100000000 : 0;

    // [자동 보정 로직] 8천만원 한도
    const DEFAULT_RATE = 25.0;
    let scenarioMaintenanceRate = DEFAULT_RATE;
    let tempTotalCost =
      (grossRevenue * scenarioMaintenanceRate) / 100 + laborCostWon;

    if (tempTotalCost > MAX_LIMIT) {
      const targetMaintenanceCost = Math.max(0, MAX_LIMIT - laborCostWon);
      if (grossRevenue > 0) {
        const rawRate = (targetMaintenanceCost / grossRevenue) * 100;
        // 소수점 버림 처리 (Step4와 동일)
        scenarioMaintenanceRate = Math.floor(rawRate * 100) / 100;
      } else {
        scenarioMaintenanceRate = 0;
      }
    }

    const maintenanceCost =
      (grossRevenue * scenarioMaintenanceRate) / 100 + laborCostWon;
    const annualNetProfitWon = grossRevenue - maintenanceCost;

    // 투자비 계산 (공통 모듈 가격 적용)
    const solarCost = (capacity / 100) * currentSolarPrice;
    const ecCost = forcedTruckCount * config.price_ec_unit;
    const infraCost =
      forcedTruckCount > 0 ? config.price_tractor + config.price_platform : 0;

    const investUk = solarCost + ecCost + infraCost;
    const investWon = investUk * 100000000;

    // 20년 수익 및 ROI
    const degradationRateDecimal = -(store.degradationRate / 100);
    const R = 1 + degradationRateDecimal;
    const n = 20;
    const totalNet20Won = (annualNetProfitWon * (1 - Math.pow(R, n))) / (1 - R);
    const totalCost20 = investWon + maintenanceCost * 20;
    const roiYears =
      annualNetProfitWon > 0 ? investWon / annualNetProfitWon : 0;
    const profitRate =
      totalCost20 > 0 ? (totalNet20Won / totalCost20) * 100 : 0;

    // [수정] 타이틀 변경: 하드웨어 구분이 아닌 REC 구분으로 명시
    return {
      title: isPremium
        ? 'TYPE B. REC 5.0 Plan (수익 극대화)'
        : 'TYPE A. REC 1.5 Plan (자가소비형)',
      invest: investUk,
      ecCount: forcedTruckCount,
      annualProfit: annualNetProfitWon / 100000000,
      totalProfit20: totalNet20Won / 100000000,
      roiYears: roiYears,
      profitRate: profitRate,
      isPro: isPremium,
      modelName: modelName,
    };
  };

  const stdData = getScenarioData(false);
  const expData = getScenarioData(true);

  // 하단 무투자 모델
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

  // REC 값
  const simpleRec = 0.0;
  const re100Rec = results.rec_1000_rent;
  const subRec = results.rec_1000_sub;

  const toUk = (val: number) => val.toFixed(2);

  const renderRow = (d: typeof stdData) => (
    <div className={`${styles.flowContainer} ${d.isPro ? styles.proRow : ''}`}>
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
                  fontWeight: 'bold',
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
          size={20}
          strokeWidth={3}
          color={d.isPro ? '#f59e0b' : '#cbd5e1'}
        />
      </div>

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

      <div className={styles.middleConnect}>
        <div className={styles.connectContent}>
          <div className={styles.connectItem}>
            <span className={styles.connectValueRed}>
              {re100Rate.toFixed(0)}%
            </span>
            <span className={styles.connectLabel}>RE100</span>
          </div>
          <div className={styles.connectItem}>
            <span className={styles.connectValueBlue}>
              {savingRate.toFixed(0)}%
            </span>
            <span className={styles.connectLabel}>절감</span>
          </div>
        </div>
        <div className={styles.connectArrowLine}>
          <div className={styles.arrowHead}></div>
        </div>
      </div>

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
              {d.profitRate.toFixed(0)}%
            </div>
          </div>
          <div className={styles.roiBox}>
            <span className={styles.roiLabel}>ROI</span>
            <span className={styles.roiValue}>{d.roiYears.toFixed(2)}년</span>
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
        <div className="flex items-center gap-2 no-print">
          <label className="flex items-center gap-1 cursor-pointer bg-white px-2 py-1 rounded border hover:bg-slate-50 text-xs">
            <input
              type="checkbox"
              className="w-3 h-3"
              checked={applyEc}
              onChange={(e) => handleEcToggle(e.target.checked)}
            />
            <span className="font-bold text-slate-700">EC 적용</span>
          </label>
          <button
            className={`${styles.expandBtn} ${
              showExpansion ? styles.active : ''
            }`}
            onClick={() => setShowExpansion(!showExpansion)}
          >
            {showExpansion ? '닫기' : 'REC 5.0 비교'}
          </button>
        </div>
      </div>

      {/* 한전 장기 계약 섹션 */}
      <div className={styles.kepcoSection}>
        <div className={styles.kepcoBadge}>한전 장기 계약 (20년)</div>
        <div className={styles.kepcoContent}>
          <div className={styles.kepcoItem}>
            <span className={styles.kLabel}>투자</span>
            <span className={styles.kValue}>
              {kepcoData.investUk.toFixed(2)} 억
            </span>
            <span className={styles.kSub}>{kepcoData.capacity} kW</span>
          </div>
          <div className={styles.kArrow}>
            <LucideArrowRight size={14} />
          </div>

          <div className={styles.kepcoItem}>
            <span className={styles.kLabel}>연간 발전량</span>
            <span className={styles.kValueSm}>
              {Math.round(kepcoData.annualGen).toLocaleString()} kWh
            </span>
          </div>
          <div className={styles.kArrow}>
            <LucideArrowRight size={14} />
          </div>

          <div className={styles.kepcoItem}>
            <span className={styles.kLabel}>연간 수익/수익률</span>
            <div className="flex gap-2">
              <span className={styles.kValue}>
                {kepcoData.annualProfitUk.toFixed(2)} 억
              </span>
              <span className={styles.kSubBlue}>
                {kepcoData.annualRevenueRatio.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className={styles.kArrow}>
            <LucideArrowRight size={14} />
          </div>

          <div className={styles.kepcoItem}>
            <span className={styles.kLabel}>20년간 수익</span>
            <div className="flex items-center gap-2">
              <span className={styles.kValue}>
                {kepcoData.totalProfit20Uk.toFixed(2)} 억
              </span>
              <span className={styles.kSubBlue}>
                {kepcoData.totalProfitRatio.toFixed(0)}%
              </span>
            </div>
            <div className="mt-1 px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-500 text-center">
              ROI {kepcoData.roiYears.toFixed(2)}년
            </div>
          </div>
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
              <LucideChevronsDown size={16} /> 수익 극대화
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
          <LucideWallet size={14} /> 초기 투자가 없는 모델 (연간 수익 / 절감율)
        </div>
        <div className={styles.compGrid}>
          {/* 단순 지붕 임대 */}
          <div className={styles.compRow}>
            <span className={styles.compLabel}>단순 지붕 임대</span>
            <span className={styles.compValue}>
              {simpleRentalRevenueUk.toFixed(2)} 억
            </span>
            <span className="text-xs font-bold text-slate-500 mx-2">
              REC {simpleRec.toFixed(1)}
            </span>
            <span className={styles.compSub}>
              (절감{' '}
              <span className="text-blue-600">
                {simpleRentalSavingRate.toFixed(2)}%
              </span>
              )
            </span>
          </div>

          {/* RE100 임대 */}
          <div className={styles.compRow}>
            <span className={styles.compLabel}>RE100 임대</span>
            <span className={styles.compValue}>
              {re100RentalRevenueUk.toFixed(2)} 억
            </span>
            <span className="text-xs font-bold text-blue-600 mx-2">
              REC {re100Rec.toFixed(1)}
            </span>
            <span className={styles.compSub}>
              (절감{' '}
              <span className="text-blue-600">
                {re100RentalSavingRate.toFixed(2)}%
              </span>
              )
            </span>
          </div>

          {/* 구독 서비스 */}
          <div className={styles.compRow}>
            <span className={styles.compLabel}>구독 서비스</span>
            <span className={styles.compValue}>
              {subRevenueUk.toFixed(2)} 억
            </span>
            <span className="text-xs font-bold text-blue-600 mx-2">
              REC {subRec.toFixed(1)}
            </span>
            <span className={styles.compSub}>
              (절감{' '}
              <span className="text-blue-600">{subSavingRate.toFixed(2)}%</span>
              )
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
