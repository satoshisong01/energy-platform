'use client';

import React, { useState, useEffect } from 'react';
import { useProposalStore } from '../../lib/store';
import styles from './PreviewSummary.module.css';
import {
  LucideArrowRight,
  LucideWallet,
  LucideChevronsDown,
  LucideTruck,
  LucideZap,
} from 'lucide-react';

export default function PreviewSummary() {
  const store = useProposalStore();
  const { config } = store;

  // Store의 중앙 계산 결과를 가져옵니다 (현재 선택된 옵션 기준)
  const results = store.getSimulationResults();

  // [발전량] 엑셀 로직 기준 단순 계산
  const simpleAnnualGen = store.monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + store.capacityKw * 3.64 * days;
  }, 0);

  const [showExpansion, setShowExpansion] = useState(false);
  const [applyEc, setApplyEc] = useState(
    store.useEc && store.selectedModel !== 'KEPCO'
  );

  useEffect(() => {
    setApplyEc(store.useEc && store.selectedModel !== 'KEPCO');
  }, [store.useEc, store.selectedModel]);

  // EC 토글 핸들러 (Store 옵션 변경)
  const handleEcToggle = (checked: boolean) => {
    setApplyEc(checked);
    store.setSimulationOption('useEc', checked);
    // EC 변경 시 Store 내부 로직에 의해 유지보수비 등은 자동 업데이트됨
  };

  // ... (공통 데이터 계산) ...
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

  // 예상 절감액 계산
  let totalBillSavings = 0;
  store.monthlyData.forEach((data) => {
    const days = new Date(2025, data.month, 0).getDate();
    const autoGen = capacity * 3.64 * days;
    const solarGen = autoGen;
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

  // [한전 데이터 계산]
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

    // 한전 모델은 현재 설정된 유지보수 비율을 따름 (보통 고정값이거나 낮음)
    // 필요하다면 여기서도 독립 계산 가능
    const maintenanceCost = annualRevenue * (store.maintenanceRate / 100);
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
  // [핵심] 시나리오별 데이터 독립 계산 (유지보수 비율 자동 보정 포함)
  // --------------------------------------------------------------------------
  const getScenarioData = (isPremium: boolean) => {
    // 1. EC 대수 설정 (체크 여부에 따라)
    const activeTruckCount = applyEc
      ? store.truckCount > 0
        ? store.truckCount
        : 3
      : 0;
    const ecCapacityAnnual = activeTruckCount * 100 * 4 * 365;

    // 2. 발전량 및 물량 배분
    const annualGen = simpleAnnualGen;
    const annualSelf = store.monthlyData.reduce(
      (acc, cur) => acc + cur.selfConsumption,
      0
    );
    const rawSurplus = Math.max(0, annualGen - annualSelf);
    const volume_ec = Math.min(rawSurplus, ecCapacityAnnual);
    const volume_surplus_final = Math.max(0, rawSurplus - volume_ec);

    // 3. 시나리오별 판매 단가
    const targetEcPrice = isPremium
      ? config.unit_price_ec_5_0
      : config.unit_price_ec_1_5;
    const modelName = isPremium ? 'REC 5.0 (예상)' : 'REC 1.5 (현행)';

    // 4. 매출 계산 (Gross)
    const revenue_saving =
      Math.min(annualGen, annualSelf) *
      (store.unitPriceSavings || config.unit_price_savings);
    const revenue_ec = volume_ec * targetEcPrice;
    const revenue_surplus = volume_surplus_final * config.unit_price_kepco;

    // 합리화 절감액은 Store 계산값 재활용 (시나리오별로 다르지 않음)
    const grossRevenue =
      revenue_saving +
      revenue_ec +
      revenue_surplus +
      results.totalRationalizationSavings;

    // 5. 비용 계산 (인건비 + 유지보수비)
    const laborCostWon =
      activeTruckCount > 0 ? config.price_labor_ec * 100000000 : 0;

    // [자동 보정 로직] 해당 시나리오 매출 기준 적정 유지보수 비율 계산
    const MAX_LIMIT = 80000000; // 8천만원 한도
    const DEFAULT_RATE = 25.0; // 기본 비율

    // (1) 일단 기본 25%로 계산해 봄
    let scenarioMaintenanceRate = DEFAULT_RATE;
    let tempTotalCost =
      (grossRevenue * scenarioMaintenanceRate) / 100 + laborCostWon;

    // (2) 한도 초과 시 비율 낮춤
    if (tempTotalCost > MAX_LIMIT) {
      const targetMaintenanceCost = Math.max(0, MAX_LIMIT - laborCostWon);
      if (grossRevenue > 0) {
        scenarioMaintenanceRate = (targetMaintenanceCost / grossRevenue) * 100;
      } else {
        scenarioMaintenanceRate = 0;
      }
    }
    // (만약 한도 이하라면 기본 25% 유지 - Step4 로직과 동일)

    // 최종 유지보수 비용 확정
    const maintenanceCost =
      (grossRevenue * scenarioMaintenanceRate) / 100 + laborCostWon;

    // 6. 순수익 (Net)
    const annualNetProfitWon = grossRevenue - maintenanceCost;

    // 7. 투자비
    let solarPrice = config.price_solar_standard;
    if (store.moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
    else if (store.moduleTier === 'ECONOMY')
      solarPrice = config.price_solar_economy;

    const solarCost = (capacity / 100) * solarPrice;
    const ecCost = activeTruckCount * config.price_ec_unit;
    const infraCost =
      activeTruckCount > 0 ? config.price_tractor + config.price_platform : 0;
    const investUk = solarCost + ecCost + infraCost;
    const investWon = investUk * 100000000;

    // 8. 20년 수익 및 ROI
    const degradationRateDecimal = -(store.degradationRate / 100);
    const R = 1 + degradationRateDecimal;
    const n = 20;
    const totalNet20Won = (annualNetProfitWon * (1 - Math.pow(R, n))) / (1 - R);
    const totalCost20 = investWon + maintenanceCost * 20;
    const roiYears =
      annualNetProfitWon > 0 ? investWon / annualNetProfitWon : 0;
    const profitRate =
      totalCost20 > 0 ? (totalNet20Won / totalCost20) * 100 : 0;

    return {
      title: isPremium
        ? 'TYPE B. Premium Plan (수익 극대화)'
        : 'TYPE A. Standard Plan (자가소비형)',
      invest: investUk,
      ecCount: activeTruckCount,
      annualProfit: annualNetProfitWon / 100000000,
      totalProfit20: totalNet20Won / 100000000,
      roiYears: roiYears,
      profitRate: profitRate,
      isPro: isPremium,
      modelName: modelName,
      // 디버깅용: 적용된 비율 확인 가능
      // maintenanceRateApplied: scenarioMaintenanceRate
    };
  };

  const stdData = getScenarioData(false); // 1.5 시나리오 (자동보정 적용)
  const expData = getScenarioData(true); // 5.0 시나리오 (자동보정 적용)

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

  const toUk = (val: number) => val.toFixed(2);

  // 시나리오 카드 렌더링
  const renderRow = (d: typeof stdData) => (
    <div className={`${styles.flowContainer} ${d.isPro ? styles.proRow : ''}`}>
      {/* 투자 */}
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

      {/* 연간 수익 */}
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

      {/* 20년 수익 */}
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
          <div className={styles.compRow}>
            <span className={styles.compLabel}>단순 지붕 임대</span>
            <span className={styles.compValue}>
              {simpleRentalRevenueUk.toFixed(2)} 억
            </span>
            <span className={styles.compSub}>
              (절감{' '}
              <span className="text-blue-600">
                {simpleRentalSavingRate.toFixed(2)}%
              </span>
              )
            </span>
          </div>
          <div className={styles.compRow}>
            <span className={styles.compLabel}>RE100 임대</span>
            <span className={styles.compValue}>
              {re100RentalRevenueUk.toFixed(2)} 억
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
