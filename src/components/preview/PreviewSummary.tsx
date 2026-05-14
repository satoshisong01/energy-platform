'use client';

import React, { useState, useEffect } from 'react';
import { useProposalStore } from '../../lib/store';
import styles from './PreviewSummary.module.css';
import {
  LucideArrowRight,
  LucideWallet,
  LucideChevronsDown,
  LucideBattery,
  LucideFlame,
} from 'lucide-react';
import { computeHydrogenComparison } from '../../lib/hydrogenCalculations';

export default function PreviewSummary() {
  const store = useProposalStore();
  const {
    config,
    rationalization,
    isRationalizationEnabled,
    isSurplusDiscarded,
    contractType,
    isEcSelfConsumption,
    ecSelfConsumptionCount,
    maintenanceCostLimit,
  } = store;

  // 자가소비(고정형) 모드면 임대/구독 숨김 여부
  const showRentSub = !isEcSelfConsumption;

  // [합리화 절감액]
  const calculateRationalizationSavings = () => {
    if (!isRationalizationEnabled) return 0;
    const isEul = contractType.includes('(을)');
    if (!isEul) return 0;
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
  const results = store.getSimulationResults();

  // 일조량 설정값 사용
  const solarRadiation = config.solar_radiation || 3.8;

  const simpleAnnualGen = store.monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + store.capacityKw * solarRadiation * days;
  }, 0);

  const [showExpansion, setShowExpansion] = useState(false);

  const [applyEc, setApplyEc] = useState(
    (store.useEc || store.isEcSelfConsumption) &&
      store.selectedModel !== 'KEPCO'
  );

  // [수소발전 역산 비교] Zustand store에서 토글 상태 공유 (Step0_Summary와 동기화)
  // 기본 OFF, 한 곳에서 체크하면 양쪽 화면 모두에 박스 표시
  const showHydrogen = store.showHydrogen;
  const setShowHydrogen = store.setShowHydrogen;

  useEffect(() => {
    setApplyEc(
      (store.useEc || store.isEcSelfConsumption) &&
        store.selectedModel !== 'KEPCO'
    );
  }, [store.useEc, store.isEcSelfConsumption, store.selectedModel]);

  const handleEcToggle = (checked: boolean) => {
    store.setSimulationOption('useEc', checked);
  };

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
    const autoGen = capacity * solarRadiation * days;
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

  // [기존] 절감율 (참고용으로 남겨둘 수 있음, 하지만 화면 표시는 customSavingRate 사용)
  const savingRate =
    totalBillBefore > 0 ? (totalBillSavings / totalBillBefore) * 100 : 0;

  // [추가] 전기요금 절감 (요청하신 수식 적용)
  // 식: (전체요금 - 총절감액) / 전체요금 * 100
  const customSavingRate =
    totalBillBefore > 0
      ? ((totalBillBefore - totalBillSavings) / totalBillBefore) * 100
      : 0;

  const MAX_LIMIT = maintenanceCostLimit;

  // [1] 한전 데이터
  const calculateKepcoData = () => {
    let solarPrice = config.price_solar_standard;
    if (store.moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
    else if (store.moduleTier === 'ECONOMY')
      solarPrice = config.price_solar_economy;

    const solarCost = (capacity / 100) * solarPrice;
    const investWon = solarCost * 100000000;
    const investUk = solarCost;
    const annualGen = simpleAnnualGen;
    const annualRevenue = annualGen * config.unit_price_kepco;

    let appliedRate = store.isMaintenanceAuto ? 5.0 : store.maintenanceRate;
    let tempCost = annualRevenue * (appliedRate / 100);

    if (store.isMaintenanceAuto && tempCost > MAX_LIMIT) {
      if (annualRevenue > 0) {
        const rawRate = (MAX_LIMIT / annualRevenue) * 100;
        appliedRate = Math.floor(rawRate * 100) / 100;
      } else {
        appliedRate = 0;
      }
    }
    const maintenanceCost = annualRevenue * (appliedRate / 100);
    const annualNetProfit = annualRevenue - maintenanceCost;

    // 수익/비용 분리 적용
    const degradationRateDecimal = -(store.degradationRate / 100);
    const R = 1 + degradationRateDecimal;
    const n = 20;

    const totalRevenue20 = (annualRevenue * (1 - Math.pow(R, n))) / (1 - R);
    const totalCost20 = maintenanceCost * 17; // 3년 무상, 17년 유상
    const totalNet20Won = totalRevenue20 - totalCost20;

    const roiYears = annualNetProfit > 0 ? investWon / annualNetProfit : 0;
    const profitRate = (totalNet20Won / (investWon + totalCost20)) * 100;

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

  // [2] 시나리오 데이터
  const getScenarioData = (isPremium: boolean) => {
    let activeEcCount = 0;
    if (isEcSelfConsumption) {
      activeEcCount = ecSelfConsumptionCount || 1;
    } else if (store.useEc) {
      activeEcCount = store.truckCount > 0 ? store.truckCount : 3;
    }

    const cycles = isEcSelfConsumption ? 1 : 4;
    const ecCapacityAnnual = activeEcCount * 100 * cycles * 365;

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
    let currentSolarPrice = config.price_solar_standard;
    if (store.moduleTier === 'PREMIUM')
      currentSolarPrice = config.price_solar_premium;
    else if (store.moduleTier === 'ECONOMY')
      currentSolarPrice = config.price_solar_economy;

    if (isEcSelfConsumption) {
      targetEcPrice = config.unit_price_ec_self;
      modelName = isPremium
        ? 'EC 자가소비 (수익 극대화)'
        : 'EC 자가소비 (배터리)';
    } else {
      if (isPremium) {
        targetEcPrice = config.unit_price_ec_5_0;
        modelName = 'REC 5.0 (예상)';
      } else {
        targetEcPrice = config.unit_price_ec_1_5;
        modelName = 'REC 1.5 (현행)';
      }
    }

    const revenue_saving =
      Math.min(annualGen, annualSelf) *
      (store.unitPriceSavings || config.unit_price_savings);
    const revenue_ec = volume_ec * targetEcPrice;
    const revenue_surplus = isSurplusDiscarded
      ? 0
      : volume_surplus_final * config.unit_price_kepco;

    // [수정] O&M 비율 계산용 매출 (합리화 + 기본료 절감 포함)
    const grossRevenueForOandM =
      revenue_saving +
      revenue_ec +
      revenue_surplus +
      results.revenue_base_bill_savings +
      fixedRationalizationSavings;

    // [수정] 태양광 기반 변동 매출 (합리화 제외, 매년 감소 반영용)
    const solarBasedRevenue = revenue_saving + revenue_ec + revenue_surplus;

    const isMovingEcMode = activeEcCount > 0 && !isEcSelfConsumption;
    const laborCostWon = isMovingEcMode ? config.price_labor_ec * 100000000 : 0;

    // 유지보수 비율 결정 (합리화 포함 매출 기준)
    let scenarioMaintenanceRate = 0;
    if (!store.isMaintenanceAuto) {
      scenarioMaintenanceRate = store.maintenanceRate;
    } else {
      let targetBaseRate = isMovingEcMode ? 25.0 : 5.0;
      const maxAvailableForOandM = Math.max(0, MAX_LIMIT - laborCostWon);
      let revenueBasedCapRate =
        grossRevenueForOandM > 0
          ? (maxAvailableForOandM / grossRevenueForOandM) * 100
          : 0;
      scenarioMaintenanceRate = Math.min(targetBaseRate, revenueBasedCapRate);
      scenarioMaintenanceRate = Math.floor(scenarioMaintenanceRate * 100) / 100;
    }

    // 유지보수 비용
    const maintenanceCost =
      (grossRevenueForOandM * scenarioMaintenanceRate) / 100 + laborCostWon;

    // [수정] 1차년도 연간 순수익 (표시용) -> 합리화 제외, 기본료 절감 포함
    // Step4의 '연간 실제 순수익'과 맞추기
    const annualNetProfitWon =
      solarBasedRevenue + results.revenue_base_bill_savings - maintenanceCost;

    // --- 투자비 계산 ---
    const solarCost = (capacity / 100) * currentSolarPrice;
    const ecCost = activeEcCount * config.price_ec_unit;
    const calculatedPlatformCost = Math.min((capacity / 100) * 0.1, 0.3);

    let infraCost = 0;
    if (isEcSelfConsumption) {
      infraCost = calculatedPlatformCost;
    } else if (store.useEc && activeEcCount > 0) {
      infraCost = config.price_tractor + calculatedPlatformCost;
    }

    const investUk = solarCost + ecCost + infraCost;
    const investWon = investUk * 100000000;

    // --- 20년 수익 상세 계산 (엑셀 J16과 동일) ---
    const degradationRateDecimal = -(store.degradationRate / 100);
    const R = 1 + degradationRateDecimal;
    const n = 20;

    // 1. 연간 수익총액(J16) 기준 20년 수익 (기본료 포함, 등비수열 적용)
    const annualRevenueFor20Yr =
      solarBasedRevenue + results.revenue_base_bill_savings;
    const totalSolarRevenue20 =
      (annualRevenueFor20Yr * (1 - Math.pow(R, n))) / (1 - R);

    // 2. 합리화 절감액 (고정) -> 20년 총액에는 포함!
    const totalRationalization20 = fixedRationalizationSavings * 20;

    // 3. 유지보수 비용: 3년 무상, 17년 유상만
    const totalMaintenance20 = maintenanceCost * 17;

    // 4. 최종 20년 순수익 (태양광20년 + 합리화20년 - 유지보수17년)
    const totalNet20Won =
      totalSolarRevenue20 + totalRationalization20 - totalMaintenance20;

    const totalCost20 = investWon + totalMaintenance20;
    const roiYears =
      annualNetProfitWon > 0 ? investWon / annualNetProfitWon : 0;
    const profitRate =
      totalCost20 > 0 ? (totalNet20Won / totalCost20) * 100 : 0;

    return {
      title: isPremium
        ? isEcSelfConsumption
          ? 'TYPE B. EC 자가소비 Plan'
          : 'TYPE B. REC 5.0 Plan'
        : isEcSelfConsumption
        ? 'TYPE A. EC 자가소비 Plan'
        : 'TYPE A. REC 1.5 Plan',
      invest: investUk,
      ecCount: activeEcCount,
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

  // [수소발전 역산 비교]
  // - 1순위: 실측 연간 사용량 (totalUsage = monthlyData.usageKwh 합계)
  // - 폴백: 연간 전기료 ÷ 한전단가 (config.unit_price_kepco)
  // 한전 판매가는 ConfigModal에서 수정 시 자동 반영됨.
  const hydrogen = computeHydrogenComparison({
    annualBillWon: totalBillBefore,
    kepcoUnitPrice: config.unit_price_kepco,
    pricePerMwUk: config.price_hydrogen_per_mw,
    annualUsageKwh: totalUsage,
  });

  // 하단 비교 섹션
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
              {customSavingRate.toFixed(0)}%
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
        <div className="flex items-center gap-2">
          {contractType.includes('(을)') && (
            <div
              className={`text-xs font-bold px-2 py-1 rounded border ${
                isRationalizationEnabled
                  ? 'bg-blue-50 text-blue-600 border-blue-200'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
            >
              {isRationalizationEnabled
                ? '요금합리화 가능'
                : '요금합리화 컨설팅 필요'}
            </div>
          )}
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
            <label
              className={`flex items-center gap-1 cursor-pointer px-2 py-1 rounded border text-xs transition-colors ${
                showHydrogen
                  ? 'bg-cyan-50 border-cyan-300 hover:bg-cyan-100'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
              title="연간 사용량 기반 수소발전 역산 비교 표시"
            >
              <input
                type="checkbox"
                className="w-3 h-3 accent-cyan-600"
                checked={showHydrogen}
                onChange={(e) => setShowHydrogen(e.target.checked)}
              />
              <span
                className={`font-bold ${
                  showHydrogen ? 'text-cyan-700' : 'text-slate-700'
                }`}
              >
                수소 비교
              </span>
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
      </div>

      {!applyEc && isEcSelfConsumption && store.selectedModel !== 'KEPCO' && (
        <div className="flex justify-end pr-4 -mt-2 mb-2 animate-pulse">
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded border border-green-200 flex items-center gap-1">
            <LucideBattery size={14} /> EC 자가소비 (배터리형) 적용중 (
            {ecSelfConsumptionCount}대)
          </span>
        </div>
      )}

      {/* 한전 장기 계약 섹션 */}
      {!isSurplusDiscarded && (
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
      )}

      {/* [NEW] 수소발전 역산 비교 섹션 — '수소 비교' 체크박스로 토글 (기본 OFF) */}
      {showHydrogen && hydrogen.isValid && (
        <div
          style={{
            backgroundColor: '#ecfeff',
            border: '1px solid #67e8f9',
            borderRadius: 8,
            padding: '8px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 2,
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div
                style={{
                  backgroundColor: '#0891b2',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  padding: '2px 8px',
                  borderRadius: 12,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <LucideFlame size={12} /> 수소발전 역산 비교 (24·365 베이스로드)
              </div>
              <span
                style={{
                  fontSize: '0.6rem',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 8,
                  backgroundColor: hydrogen.basedOnActualUsage
                    ? '#0891b2'
                    : '#fef3c7',
                  color: hydrogen.basedOnActualUsage ? 'white' : '#92400e',
                  border: hydrogen.basedOnActualUsage
                    ? 'none'
                    : '1px solid #fcd34d',
                }}
              >
                {hydrogen.basedOnActualUsage
                  ? '실측 사용량 기준'
                  : '단순 역산'}
              </span>
              {hydrogen.isUnderscaled && (
                <span
                  style={{
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 8,
                    backgroundColor: '#ffedd5',
                    color: '#c2410c',
                    border: '1px solid #fdba74',
                  }}
                  title="원시 평균 출력이 상용 수소연료전지 최소 단위(100kW) 미만"
                >
                  ⚠ 권장 규모 미만 · 태양광 PV 적합
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#0e7490' }}>
              한전단가 {config.unit_price_kepco.toLocaleString()}원/kWh · 1MW당{' '}
              <strong>{config.price_hydrogen_per_mw}</strong>억
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div className={styles.kepcoItem}>
              <span className={styles.kLabel}>연간 전기료</span>
              <span className={styles.kValue}>
                {(totalBillBefore / 100000000).toFixed(2)} 억
              </span>
              <span className={styles.kSub}>÷ 한전단가</span>
            </div>
            <div className={styles.kArrow}>
              <LucideArrowRight size={14} />
            </div>
            <div className={styles.kepcoItem}>
              <span className={styles.kLabel}>연간 필요 발전량</span>
              <span className={styles.kValueSm}>
                {Math.round(hydrogen.annualNeededKwh).toLocaleString()} kWh
              </span>
              <span className={styles.kSub}>
                ≈ {Math.round(hydrogen.dailyNeededKwh).toLocaleString()} kWh/일
              </span>
              {hydrogen.basedOnActualUsage &&
                hydrogen.simpleEstimateKwh > 0 && (
                  <span
                    style={{
                      fontSize: '0.55rem',
                      color: '#94a3b8',
                      marginTop: 1,
                    }}
                  >
                    단순역산{' '}
                    {Math.round(hydrogen.simpleEstimateKwh).toLocaleString()}
                  </span>
                )}
            </div>
            <div className={styles.kArrow}>
              <LucideArrowRight size={14} />
            </div>
            <div className={styles.kepcoItem}>
              <span className={styles.kLabel}>필요 용량 (베이스로드)</span>
              <span
                className={styles.kValue}
                style={{ color: '#0891b2' }}
              >
                {hydrogen.requiredCapacityMw.toFixed(2)} MW
              </span>
              <span className={styles.kSub}>
                ≈ {Math.round(hydrogen.requiredCapacityKw).toLocaleString()} kW
              </span>
              <span
                style={{
                  fontSize: '0.55rem',
                  color: '#64748b',
                  marginTop: 1,
                }}
              >
                {hydrogen.rawCapacityKw.toFixed(1)} kW{' '}
                <span style={{ color: '#94a3b8' }}>(시간당 실측용량)</span>
              </span>
            </div>
            <div className={styles.kArrow}>
              <LucideArrowRight size={14} />
            </div>
            <div className={styles.kepcoItem}>
              <span className={styles.kLabel}>예상 투자비</span>
              <span
                className={styles.kValue}
                style={{ color: '#d97706' }}
              >
                {hydrogen.investmentUk.toFixed(2)} 억
              </span>
              <span className={styles.kSub}>
                {hydrogen.requiredCapacityMw.toFixed(2)}MW ×{' '}
                {config.price_hydrogen_per_mw}억
              </span>
            </div>
            <div className={styles.kArrow}>
              <LucideArrowRight size={14} />
            </div>
            <div className={styles.kepcoItem}>
              <span className={styles.kLabel}>ROI (전기료 회수)</span>
              <div
                style={{
                  marginTop: 1,
                  padding: '2px 8px',
                  backgroundColor: '#0891b2',
                  color: 'white',
                  borderRadius: 4,
                  fontSize: '0.85rem',
                  fontWeight: 800,
                }}
              >
                {hydrogen.roiYears.toFixed(2)}년
              </div>
            </div>
          </div>

          <div
            style={{
              fontSize: '0.6rem',
              color: '#0e7490',
              marginTop: 2,
              lineHeight: 1.2,
            }}
          >
            *{' '}
            {hydrogen.basedOnActualUsage
              ? '입력된 12개월 실측 사용량(kWh) 합계를 24h·365d 균등 가동 기준으로 환산.'
              : '연간 전기료를 한전 단가로 나눈 필요 발전량을 24h·365d 균등 가동 기준으로 환산 (사용량 미입력 폴백).'}{' '}
            1MW당 단가·한전 단가는 [설정 → 장비 투자비 단가] 및 [수익 분석
            단가]에서 변경 가능합니다.
            {hydrogen.isUnderscaled && (
              <span
                style={{
                  display: 'block',
                  marginTop: 2,
                  color: '#c2410c',
                  fontWeight: 700,
                }}
              >
                ※ 본 사업장 평균 필요 출력은{' '}
                {hydrogen.rawCapacityKw.toFixed(1)} kW로 상용 수소연료전지
                최소 단위(100 kW) 미만 — 태양광 PV가 더 적합한 규모입니다.
              </span>
            )}
          </div>
        </div>
      )}

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
          {showRentSub && (
            <>
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
                  <span className="text-blue-600">
                    {subSavingRate.toFixed(2)}%
                  </span>
                  )
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
