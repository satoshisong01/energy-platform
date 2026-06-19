'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  useProposalStore,
  ModuleTier,
  RationalizationData,
} from '../lib/store';
import styles from './Step4_Simulation.module.css';
import {
  LucideTruck,
  LucideZap,
  LucideInfo,
  LucideAlertTriangle,
  LucideCheckCircle2,
  LucideTable,
  LucideTrendingUp,
  LucideChevronDown,
  LucideChevronUp,
  LucideBattery,
  LucidePencil,
} from 'lucide-react';

const round2 = (num: number) => Math.round(num * 100) / 100;
const toUk = (val: number) => (val / 100000000).toFixed(2);

export default function Step4_Simulation() {
  const store = useProposalStore();
  const { config, rationalization, truckCount, contractType } = store;

  const [showRationalization, setShowRationalization] = useState(false);
  const [suppressCostAlerts, setSuppressCostAlerts] = useState(false);
  // EC 대수: 1·2·3대 드롭다운이 기본, 연필 클릭 시 수기 입력(10·20대, 2.5대 등)으로 전환
  const [manualEc, setManualEc] = useState(false);
  // 수기 입력 텍스트 — 소수점 입력 중 "2." 같은 중간 상태를 보존하기 위해 문자열로 보관
  const [ecText, setEcText] = useState(String(truckCount));
  const ecEditingRef = useRef(false);

  // [중요] 알림창 중복 방지용 Ref
  const isConfirmingRef = useRef(false);

  // 시뮬레이션 결과 실시간 구독
  const results = store.getSimulationResults();

  // 1. 투자비 재계산 (입력값 변경 시)
  useEffect(() => {
    store.recalculateInvestment();
  }, [
    store.capacityKw,
    store.selectedModel,
    store.moduleTier,
    store.useEc,
    store.truckCount,
    store.config,
    store.isEcSelfConsumption,
    store.ecSelfConsumptionCount,
  ]);

  // 외부(드롭다운/불러오기/스냅)에서 truckCount가 바뀌면 수기 입력 텍스트 동기화.
  // 단, 사용자가 입력란을 편집 중일 때는 덮어쓰지 않음(소수점 타이핑 보존).
  useEffect(() => {
    if (!ecEditingRef.current) setEcText(String(truckCount));
  }, [truckCount]);

  // 2. 비용 자동 조정 로직
  useEffect(() => {
    if (!store.isMaintenanceAuto) return;

    // 로직 내부용 변수 (전체 매출 기준)
    const revenueForCalc = results.annualGrossRevenue;

    if (revenueForCalc === 0) return;
    if (isConfirmingRef.current) return;

    const isKepco = store.selectedModel === 'KEPCO';
    const isMovingEcMode =
      !isKepco && store.useEc && !store.isEcSelfConsumption;

    const targetBaseRate = isMovingEcMode ? 25.0 : 5.0;
    const MAX_COST_LIMIT = store.maintenanceCostLimit;

    const currentLaborCost = isMovingEcMode
      ? config.price_labor_ec * 100000000
      : 0;
    const maxAvailableForOandM = Math.max(0, MAX_COST_LIMIT - currentLaborCost);

    const revenueBasedCapRate =
      revenueForCalc > 0 ? (maxAvailableForOandM / revenueForCalc) * 100 : 0;

    let finalRate = Math.min(targetBaseRate, revenueBasedCapRate);
    finalRate = Math.round(finalRate * 10) / 10;

    if (Math.abs(store.maintenanceRate - finalRate) > 0.01) {
      if (suppressCostAlerts) {
        store.setSimulationOption('maintenanceRate', finalRate);
      } else {
        isConfirmingRef.current = true;
        setTimeout(() => {
          const currentCostEok = (
            results.annualMaintenanceCost / 100000000
          ).toFixed(2);
          const limitCostEok = (MAX_COST_LIMIT / 100000000).toFixed(2);

          let msg = '';
          if (finalRate < targetBaseRate) {
            msg = `[비용 한도 초과 알림]\n현재 운영비용(${currentCostEok}억원)이 한도(${limitCostEok}억원)를 초과했습니다.\n유지보수 비율을 ${store.maintenanceRate}% → ${finalRate}%로 하향 조정하시겠습니까?`;
          } else {
            msg = `[유지보수 비율 최적화]\n현재 운용 모드에 맞춰 유지보수 비율을 ${store.maintenanceRate}% → ${finalRate}%로 변경하시겠습니까?`;
          }

          if (window.confirm(msg)) {
            store.setSimulationOption('maintenanceRate', finalRate);
          } else {
            store.setSimulationOption('isMaintenanceAuto', false);
          }

          setTimeout(() => {
            isConfirmingRef.current = false;
          }, 500);
        }, 100);
      }
    }
  }, [
    results.annualGrossRevenue,
    store.selectedModel,
    store.useEc,
    store.isEcSelfConsumption,
    store.isMaintenanceAuto,
    config.price_labor_ec,
    store.maintenanceCostLimit,
    store.maintenanceRate,
    suppressCostAlerts,
  ]);

  // --- UI 렌더링 함수들 ---
  const renderRationalizationInput = (
    field: keyof RationalizationData,
    placeholder: string = '0',
    extraClass: string = ''
  ) => {
    const value = rationalization[field];
    return (
      <input
        type="text"
        className={`w-full text-center border rounded p-1 focus:ring-2 focus:ring-blue-500 outline-none ${extraClass}`}
        value={value !== undefined ? value.toLocaleString() : ''}
        onChange={(e) => {
          const rawValue = e.target.value.replace(/,/g, '');
          const numValue = Number(rawValue);
          if (!isNaN(numValue)) {
            store.updateRationalization(field, numValue);
          }
        }}
        onFocus={(e) => e.target.select()}
        placeholder={placeholder}
      />
    );
  };

  const handleBaseUsageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    const usageVal = Number(rawValue);
    if (!isNaN(usageVal)) {
      store.updateRationalization('base_usage', usageVal);
      const diff = rationalization.base_eul - rationalization.base_gap;
      const autoSavings = diff * usageVal;
      store.updateRationalization('base_savings_manual', autoSavings);
    }
  };

  const handleBaseSavingsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/,/g, '');
    const savingsVal = Number(rawValue);
    if (!isNaN(savingsVal)) {
      store.updateRationalization('base_savings_manual', savingsVal);
    }
  };

  const isKepco = store.selectedModel === 'KEPCO';
  const isEul = contractType.includes('(을)');
  const isGap = contractType.includes('(갑)');

  const saving_base = rationalization.base_savings_manual || 0;
  const diff_light = rationalization.light_eul - rationalization.light_gap;
  const diff_mid = rationalization.mid_eul - rationalization.mid_gap;
  const diff_max = rationalization.max_eul - rationalization.max_gap;
  const saving_light = diff_light * rationalization.light_usage;
  const saving_mid = diff_mid * rationalization.mid_usage;
  const saving_max = diff_max * rationalization.max_usage;

  const totalRationalizationSavings =
    saving_base + saving_light + saving_mid + saving_max;

  const initialAnnualGen = results.initialAnnualGen;
  const volume_self = results.volume_self;
  const volume_ec = results.volume_ec;
  const volume_surplus = results.volume_surplus_final;
  const rawSurplus = results.annualSurplus;

  const revenue_saving = results.revenue_saving;
  const revenue_ec = results.revenue_ec;
  const revenue_surplus = results.revenue_surplus;

  // [수정] 화면 표시용 연간 수익 합계 (합리화 절감액 제외, 기본료 절감 포함)
  const displayedAnnualGrossRevenue =
    revenue_saving +
    revenue_ec +
    revenue_surplus +
    results.revenue_base_bill_savings;

  const laborCostWon = results.laborCostWon;
  const totalAnnualCost = results.annualMaintenanceCost;
  const maintenanceBase = totalAnnualCost - laborCostWon;

  // [수정] 화면 표시용 연간 순수익 (합리화 제외 수익 - 비용)
  const displayedAnnualNetProfit =
    displayedAnnualGrossRevenue - totalAnnualCost;

  const appliedSavingsPrice =
    store.unitPriceSavings || config.unit_price_savings;

  let appliedSellPrice = config.unit_price_kepco;
  let ecPriceLabel = 'EC-전력 판매 단가';

  if (store.isEcSelfConsumption) {
    appliedSellPrice = config.unit_price_ec_self;
    ecPriceLabel = 'EC 자가소비 적용 단가';
  } else {
    if (store.selectedModel === 'RE100')
      appliedSellPrice = config.unit_price_ec_1_5;
    if (store.selectedModel === 'REC5')
      appliedSellPrice = config.unit_price_ec_5_0;
  }

  // 투자비 관련
  const totalInitialInvestment = results.totalInvestment / 100000000;
  const maintenanceTableValue = totalAnnualCost / 100000000;

  let solarPrice = config.price_solar_standard;
  if (store.moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
  if (store.moduleTier === 'ECONOMY') solarPrice = config.price_solar_economy;

  const solarCount = store.capacityKw / 100;
  const solarCost = solarCount * solarPrice;
  const ecCost =
    !isKepco && (store.useEc || store.isEcSelfConsumption)
      ? (store.isEcSelfConsumption
          ? store.ecSelfConsumptionCount
          : truckCount) * config.price_ec_unit
      : 0;

  const tractorCost =
    !isKepco && truckCount > 0 && store.useEc && !store.isEcSelfConsumption
      ? 1 * config.price_tractor
      : 0;

  // 운영 플랫폼 비용 자동 계산 (Min 공식 적용)
  const calculatedPlatformCost = Math.min((store.capacityKw / 100) * 0.1, 0.3);

  const platformCost =
    !isKepco && (store.useEc || store.isEcSelfConsumption)
      ? 1 * calculatedPlatformCost // 1식이므로 그대로 사용
      : 0;

  // 유지보수: 3년 무상, 17년만 유상 반영
  const maintenanceYearsPaid = 17;
  let totalInvestment20Years = 0;
  if (isKepco) {
    const annualInvestSplit = totalInitialInvestment / 20;
    totalInvestment20Years =
      annualInvestSplit * 20 + maintenanceTableValue * maintenanceYearsPaid;
  } else {
    totalInvestment20Years =
      totalInitialInvestment + maintenanceTableValue * maintenanceYearsPaid;
  }

  const solarSplit = round2(solarCost / 20);
  const ecSplit = round2(ecCost / 20);
  const tractorSplit = round2(tractorCost / 20);
  const platformSplit = round2(platformCost / 20);
  const maintenanceSplit = round2(maintenanceTableValue);

  // [수정] 20년 수익 총액 (store에서 계산된 값: 수익감소 + 합리화고정 - 비용고정)
  const totalNetProfit20Years = results.self_final_profit;
  const roiYears = results.self_roi_years;
  const roiPercent =
    totalInvestment20Years > 0
      ? (totalNetProfit20Years / 100000000 / totalInvestment20Years) * 100
      : 0;

  const dailySurplus = rawSurplus / 365;

  const handleEcToggle = (checked: boolean) => {
    store.setSimulationOption('useEc', checked);
  };

  // EC 대수 입력 모드: 프리셋(1·2·3)에 없는 값이면 자동으로 수기 입력 표시
  // (저장된 분석자료에 10·20대가 들어있어도 그대로 보이도록)
  const EC_PRESET_COUNTS = [1, 2, 3];
  const isCustomEcCount = !EC_PRESET_COUNTS.includes(truckCount);
  const showManualEc = manualEc || isCustomEcCount;
  const toggleManualEc = () => {
    if (showManualEc) {
      // 드롭다운으로 복귀 — 프리셋에 없는 값이면 기본 3대로 스냅
      setManualEc(false);
      if (isCustomEcCount) store.setTruckCount(3);
    } else {
      setManualEc(true);
    }
  };

  let ecRecommendation = '';
  let ecRecColor = 'text-gray-500';
  if (dailySurplus < 800) {
    ecRecommendation = '(일일 잉여 부족 - EC 비추천)';
    ecRecColor = 'text-red-500 font-bold';
  } else if (dailySurplus >= 800 && dailySurplus < 1200) {
    ecRecommendation = '(추천: 2대)';
    ecRecColor = 'text-blue-600 font-bold';
  } else if (dailySurplus >= 1200) {
    ecRecommendation = '(추천: 3대 이상)';
    ecRecColor = 'text-blue-600 font-bold';
  }

  let adviceMessage = null;
  let adviceType = 'info';
  const cycles = store.isEcSelfConsumption ? 1 : 4;
  const maxTruckCapacity = truckCount * 100 * cycles * 365;

  if (!isKepco && (store.useEc || store.isEcSelfConsumption)) {
    if (store.useEc) {
      if (truckCount > 0 && rawSurplus > maxTruckCapacity) {
        adviceType = 'warning';
        adviceMessage = (
          <span>
            <b>⚠️ 설비 부족:</b> 잉여전력이 EC 용량을 초과합니다. 대수 추가를
            고려하세요.
          </span>
        );
      } else if (truckCount > 0 && rawSurplus < maxTruckCapacity * 0.5) {
        adviceType = 'warning';
        adviceMessage = (
          <span>
            <b>⚠️ 과잉 설비:</b> EC 용량이 잉여전력보다 너무 큽니다. 대수를
            줄이는 것을 추천합니다.
          </span>
        );
      } else {
        adviceType = 'success';
        adviceMessage = (
          <span>
            <b>✅ 최적 설계:</b> 잉여전력과 EC 운용({truckCount}대) 밸런스가
            양호합니다.
          </span>
        );
      }
    } else {
      adviceType = 'success';
      adviceMessage = (
        <span>
          <b>🔋 자가소비형(배터리):</b> {store.ecSelfConsumptionCount}대 운용
          중입니다. (이동 없음)
        </span>
      );
    }
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.stepBadge}>4</span> 투자비 및 수익 분석 상세
      </h3>

      <div className="space-y-2">
        <div className={styles.grid3}>
          <div
            className={`${styles.optionCard} ${
              store.selectedModel === 'KEPCO' ? styles.active : ''
            }`}
            onClick={() => store.setSimulationOption('selectedModel', 'KEPCO')}
          >
            <div className="font-bold text-lg mb-1">KEPCO</div>
            <div className={styles.cardTitle}>한전 판매형</div>
          </div>
          <div
            className={`${styles.optionCard} ${
              store.selectedModel === 'RE100' ? styles.active : ''
            }`}
            onClick={() => store.setSimulationOption('selectedModel', 'RE100')}
          >
            <LucideZap className={styles.cardIcon} size={20} />
            <div className={styles.cardTitle}>RE100 최적</div>
          </div>
          <div
            className={`${styles.optionCard} ${
              store.selectedModel === 'REC5' ? styles.active : ''
            }`}
            onClick={() => store.setSimulationOption('selectedModel', 'REC5')}
          >
            <div className="font-bold text-lg mb-1 text-purple-600">
              REC 5.0
            </div>
            <div className={styles.cardTitle}>미래 인센티브</div>
          </div>
        </div>
      </div>

      <div className={styles.toggleRow}>
        <span className={styles.toggleLabel}>
          태양광 모듈: <b>{store.moduleTier}</b>
        </span>
        <div className="flex gap-1">
          {(['PREMIUM', 'STANDARD', 'ECONOMY'] as ModuleTier[]).map((tier) => (
            <button
              key={tier}
              onClick={() => store.setSimulationOption('moduleTier', tier)}
              className={`px-2 py-1 text-xs border rounded ${
                store.moduleTier === tier
                  ? 'bg-blue-600 text-white'
                  : 'bg-white'
              }`}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {!isKepco && (
        <div
          className={styles.toggleRow}
          style={{ flexDirection: 'column', alignItems: 'flex-start' }}
        >
          <div className="flex justify-between w-full items-center">
            <div className="flex items-center gap-2">
              <LucideTruck size={18} className="text-blue-600" />
              <span className={styles.toggleLabel}>
                에너지 캐리어(EC) 운용
                {store.isEcSelfConsumption && (
                  <span className="ml-2 text-xs text-green-600 font-bold bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-1 inline-flex">
                    <LucideBattery size={12} /> 배터리형 적용됨
                  </span>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-5 h-5 text-blue-600 cursor-pointer"
                checked={store.useEc}
                onChange={(e) => handleEcToggle(e.target.checked)}
              />
              {(store.useEc || store.isEcSelfConsumption) && (
                <div className="ml-2 flex items-center gap-1">
                  {showManualEc ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        step="any"
                        className="w-16 border rounded p-1 text-sm bg-white border-blue-400 focus:ring-2 focus:ring-blue-500 outline-none text-right"
                        value={ecText}
                        onFocus={() => {
                          ecEditingRef.current = true;
                        }}
                        onChange={(e) => {
                          const raw = e.target.value;
                          setEcText(raw);
                          const n = parseFloat(raw);
                          if (!isNaN(n) && n >= 0) store.setTruckCount(n);
                        }}
                        onBlur={() => {
                          ecEditingRef.current = false;
                          const n = parseFloat(ecText);
                          const safe = !isNaN(n) && n >= 0 ? n : 0;
                          store.setTruckCount(safe);
                          setEcText(String(safe)); // "2." → "2", "" → "0"
                        }}
                      />
                      <span className="text-sm text-slate-600 whitespace-nowrap">
                        대 ({Math.round(truckCount * 100).toLocaleString()}kW)
                      </span>
                    </div>
                  ) : (
                    <select
                      className="border rounded p-1 text-sm bg-white border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={truckCount}
                      onChange={(e) => store.setTruckCount(Number(e.target.value))}
                    >
                      <option value={1}>1대 (100kW)</option>
                      <option value={2}>2대 (200kW)</option>
                      <option value={3}>3대 (300kW)</option>
                    </select>
                  )}
                  <button
                    type="button"
                    onClick={toggleManualEc}
                    title={
                      showManualEc
                        ? '드롭다운 선택으로 전환'
                        : '직접 입력 (10대·20대 등)'
                    }
                    aria-label="EC 대수 직접 입력 전환"
                    className={`p-1 rounded transition-colors ${
                      showManualEc
                        ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                        : 'text-slate-400 hover:text-blue-600 hover:bg-slate-100'
                    }`}
                  >
                    <LucidePencil size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
          <div className="w-full mt-2 pl-6 text-xs text-slate-500 flex justify-between items-center bg-slate-50 p-2 rounded">
            <span>
              일일 잉여 전력:{' '}
              <b>{Math.round(dailySurplus).toLocaleString()} kWh</b>
            </span>
            <span className={ecRecColor}>{ecRecommendation}</span>
          </div>
        </div>
      )}

      {/* 알림 끄기 체크박스 */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center text-xs text-slate-500 mt-2">
        <div className="flex items-center gap-1">
          <LucideInfo size={14} />
          <span>
            적용 기준: 유지보수 <b>{store.maintenanceRate}%</b> / 발전감소{' '}
            <b>-{store.degradationRate}%</b>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-slate-400">(설정에서 변경 가능)</div>
          <label className="flex items-center gap-1 cursor-pointer select-none border-l pl-3 border-slate-300">
            <input
              type="checkbox"
              className="w-3 h-3 accent-blue-600 rounded"
              checked={suppressCostAlerts}
              onChange={(e) => setSuppressCostAlerts(e.target.checked)}
            />
            <span
              className={`font-bold transition-colors ${
                suppressCostAlerts ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              비용 자동 조정 (알림 끄기)
            </span>
          </label>
        </div>
      </div>

      {adviceMessage && (
        <div
          className={`p-3 rounded-lg border text-sm flex items-start gap-2 ${
            adviceType === 'warning'
              ? 'bg-orange-50 border-orange-200 text-orange-800'
              : 'bg-green-50 border-green-200 text-green-800'
          }`}
        >
          {adviceType === 'warning' ? (
            <LucideAlertTriangle size={18} className="shrink-0 mt-0.5" />
          ) : (
            <LucideCheckCircle2 size={18} className="shrink-0 mt-0.5" />
          )}
          <div>{adviceMessage}</div>
        </div>
      )}

      {!isGap && (
        <div className="mt-4 border border-slate-300 rounded-lg overflow-hidden bg-white">
          <div className="p-3 bg-slate-100 flex items-center justify-between border-b border-slate-200">
            <label
              className={`flex items-center gap-2 text-sm font-bold cursor-pointer select-none ${
                isEul ? 'text-slate-700' : 'text-slate-400'
              }`}
            >
              <input
                type="checkbox"
                disabled={!isEul}
                checked={store.isRationalizationEnabled}
                onChange={(e) =>
                  store.setSimulationOption(
                    'isRationalizationEnabled',
                    e.target.checked
                  )
                }
                className="w-4 h-4 accent-blue-600 disabled:bg-slate-200"
              />
              ⚡ 전기요금 합리화 절감액 계산 {isEul ? '' : '(을 전용)'}
            </label>

            {store.isRationalizationEnabled && (
              <button
                className="p-1 hover:bg-slate-200 rounded transition"
                onClick={() => setShowRationalization(!showRationalization)}
              >
                {showRationalization ? (
                  <LucideChevronUp size={16} />
                ) : (
                  <LucideChevronDown size={16} />
                )}
              </button>
            )}
          </div>

          {store.isRationalizationEnabled && showRationalization && (
            <div className="p-4 bg-white text-xs">
              <table className="w-full text-center border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">구분</th>
                    <th className="p-2 border-r border-slate-300">을 (원)</th>
                    <th className="p-2 border-r border-slate-300">갑 (원)</th>
                    <th className="p-2 border-r border-slate-300 bg-yellow-50">
                      차이
                    </th>
                    <th className="p-2 border-r border-slate-300">
                      연간사용량 (kW)
                    </th>
                    <th className="p-2 bg-blue-50">절감액 (원)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* 합리화 표 생략 없이 그대로 유지 */}
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">
                      기본료
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {renderRationalizationInput('base_eul')}
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {renderRationalizationInput('base_gap')}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-bold text-red-500 bg-yellow-50">
                      {(
                        rationalization.base_eul - rationalization.base_gap
                      ).toLocaleString()}
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      <input
                        type="text"
                        className="w-full text-center border rounded p-1"
                        value={rationalization.base_usage.toLocaleString()}
                        onChange={handleBaseUsageChange}
                      />
                    </td>
                    <td className="p-1 bg-blue-50 font-bold text-blue-600 border-l border-slate-300">
                      <input
                        type="text"
                        className="w-full text-center bg-blue-50 font-bold text-blue-600 border rounded p-1"
                        value={Math.round(saving_base).toLocaleString()}
                        onChange={handleBaseSavingsChange}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">
                      경부하
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {renderRationalizationInput('light_eul')}
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {renderRationalizationInput('light_gap')}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-bold bg-yellow-50">
                      {(
                        rationalization.light_eul - rationalization.light_gap
                      ).toLocaleString()}
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {renderRationalizationInput('light_usage')}
                    </td>
                    <td className="p-2 bg-blue-50 font-bold text-blue-600">
                      {Math.round(saving_light).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">
                      중간부하
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {renderRationalizationInput('mid_eul')}
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {renderRationalizationInput('mid_gap')}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-bold bg-yellow-50">
                      {(
                        rationalization.mid_eul - rationalization.mid_gap
                      ).toLocaleString()}
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {renderRationalizationInput('mid_usage')}
                    </td>
                    <td className="p-2 bg-blue-50 font-bold text-blue-600">
                      {Math.round(saving_mid).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-300">
                    <td className="p-2 font-bold bg-slate-50 border-r border-slate-300">
                      최대부하
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {renderRationalizationInput('max_eul')}
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {renderRationalizationInput('max_gap')}
                    </td>
                    <td className="p-2 border-r border-slate-300 font-bold bg-yellow-50">
                      {(
                        rationalization.max_eul - rationalization.max_gap
                      ).toLocaleString()}
                    </td>
                    <td className="p-1 border-r border-slate-300">
                      {renderRationalizationInput('max_usage')}
                    </td>
                    <td className="p-2 bg-blue-50 font-bold text-blue-600">
                      {Math.round(saving_max).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-300">
                    <td
                      colSpan={5}
                      className="p-2 font-bold text-right bg-slate-100 border-r border-slate-300"
                    >
                      합계 (절감액)
                    </td>
                    <td className="p-2 font-extrabold text-blue-700 bg-blue-100">
                      {Math.round(totalRationalizationSavings).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 투자비 테이블 */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3 text-blue-800">
          <LucideTable size={16} />
          <span className="text-sm font-bold">초기 투자비 상세 (VAT 별도)</span>
        </div>
        {isKepco ? (
          <div className="border rounded-lg overflow-hidden text-xs bg-white">
            <table className="w-full text-center">
              <thead className="bg-blue-100 text-blue-900 font-bold border-b border-blue-200">
                <tr>
                  <th className="py-3">투자비용</th>
                  <th>유지보수(년간)</th>
                  <th>20년 투자금</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold text-lg">
                  <td className="py-5 text-blue-700">
                    {totalInitialInvestment.toFixed(2)} 억원
                  </td>
                  <td className="text-slate-600">{store.maintenanceRate}%</td>
                  <td className="text-slate-800">
                    {totalInvestment20Years.toFixed(2)} 억원
                  </td>
                </tr>
                <tr className="text-xs text-gray-400 bg-slate-50 border-t">
                  <td className="py-3">** 운영플랫폼 0.0 억원</td>
                  <td>{maintenanceTableValue.toFixed(2)} 억원</td>
                  <td>(초기비 분할 + 유지보수)</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden text-xs bg-white">
            <table className="w-full text-center">
              <thead className="bg-purple-100 text-purple-900 border-b border-purple-200 font-bold">
                <tr>
                  <th className="py-3">구분</th>
                  <th>태양광</th>
                  <th>에너지캐리어</th>
                  <th>이동트랙터</th>
                  <th>운영플랫폼</th>
                  <th className="text-gray-500">유지보수(년)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50 text-slate-500">
                  <td className="font-bold text-slate-700 py-2">용량/규격</td>
                  <td>100 kW</td>
                  <td>100 kW</td>
                  <td>1 ton</td>
                  <td>1 set</td>
                  <td>1 set</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-700 py-2">수량</td>
                  <td className="text-blue-600 font-bold">
                    {solarCount.toFixed(2)} ea
                  </td>
                  <td>
                    {store.isEcSelfConsumption
                      ? store.ecSelfConsumptionCount
                      : store.useEc
                      ? truckCount
                      : 0}{' '}
                    ea
                  </td>
                  <td>{tractorCost > 0 ? 1 : 0} ea</td>
                  <td>{platformCost > 0 ? 1 : 0} set</td>
                  <td>1 set</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-700 py-2">단가</td>
                  <td>{solarPrice.toFixed(2)} 억</td>
                  <td>{config.price_ec_unit.toFixed(2)} 억</td>
                  <td>{config.price_tractor.toFixed(2)} 억</td>
                  <td>{calculatedPlatformCost.toFixed(2)} 억</td>
                  <td>{maintenanceTableValue.toFixed(2)} 억</td>
                </tr>
                <tr className="font-bold text-slate-800 bg-slate-50">
                  <td className="py-3">합계</td>
                  <td>{solarCost.toFixed(2)} 억원</td>
                  <td>{ecCost.toFixed(2)} 억원</td>
                  <td>{tractorCost.toFixed(2)} 억원</td>
                  <td>{platformCost.toFixed(2)} 억원</td>
                  <td>{maintenanceTableValue.toFixed(2)} 억원</td>
                </tr>
                <tr className="border-t-2 border-slate-300">
                  <td className="font-bold py-4 text-blue-900">
                    초기투자비 합
                  </td>
                  <td
                    colSpan={5}
                    className="text-center font-extrabold text-lg text-blue-900"
                  >
                    {totalInitialInvestment.toFixed(2)} 억원
                  </td>
                </tr>
                <tr className="text-gray-400 text-[10px]">
                  <td className="py-2">20년 분할(참고)</td>
                  <td>{solarSplit.toFixed(2)}</td>
                  <td>{ecSplit.toFixed(2)}</td>
                  <td>{tractorSplit.toFixed(2)}</td>
                  <td>{platformSplit.toFixed(2)}</td>
                  <td>{maintenanceSplit.toFixed(2)}</td>
                </tr>
                <tr className="bg-purple-50 border-t border-purple-100 font-bold text-purple-900">
                  <td className="py-4">20년 투자총액</td>
                  <td colSpan={5} className="text-center text-lg">
                    {totalInvestment20Years.toFixed(2)} 억원
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between gap-2 mb-2 text-green-800">
          <div className="flex items-center gap-2">
            <LucideTrendingUp size={16} />
            <span className="text-sm font-bold">연간 수익 상세 분석</span>
          </div>

          {!isKepco && (
            <label className="flex items-center gap-1 cursor-pointer select-none bg-red-50 px-2 py-1 rounded border border-red-100">
              <input
                type="checkbox"
                className="w-3 h-3 accent-red-500"
                checked={store.isSurplusDiscarded}
                onChange={(e) =>
                  store.setSimulationOption(
                    'isSurplusDiscarded',
                    e.target.checked
                  )
                }
              />
              <span
                className={`text-xs font-bold ${
                  store.isSurplusDiscarded ? 'text-red-600' : 'text-slate-400'
                }`}
              >
                인입 불가능/잉여 전력 폐기 (판매 불가)
              </span>
            </label>
          )}
        </div>

        <div className={styles.detailBox}>
          <div className={styles.row}>
            <span className={styles.dLabel}>연간 태양광 발전량</span>
            <span>
              <span className={styles.dVal}>
                {Math.round(initialAnnualGen).toLocaleString()}
              </span>
              <span className={styles.dUnit}>kWh</span>
            </span>
          </div>

          {isKepco ? (
            <>
              <div className={`${styles.row} ${styles.bgYellow}`}>
                <span className={styles.dLabel}>판매 평균 단가 (SMP+REC)</span>
                <span>
                  <span className={styles.dVal}>
                    {config.unit_price_kepco.toLocaleString()}
                  </span>{' '}
                  원
                </span>
              </div>
              <div className="border-t border-slate-200 my-1"></div>
              <div className={`${styles.row} font-bold text-slate-800`}>
                <span>** 연간 전기판매수익</span>
                <span>
                  <span className={styles.dVal}>
                    {(displayedAnnualGrossRevenue / 100000000).toFixed(2)}
                  </span>{' '}
                  억원
                </span>
              </div>
            </>
          ) : (
            <>
              <div className={styles.row}>
                <span className={styles.dLabel}>자가소비 / 최대부하 (년)</span>
                <span>
                  <span className={styles.dVal}>
                    {Math.round(volume_self).toLocaleString()}
                  </span>{' '}
                  kWh
                </span>
              </div>
              <div className={`${styles.row} ${styles.bgPink}`}>
                <span className={styles.dLabel}>잉여 전력량 (년)</span>
                <span>
                  <span
                    className={`font-bold ${
                      store.isSurplusDiscarded
                        ? 'text-red-500 line-through decoration-red-500'
                        : 'text-slate-800'
                    }`}
                  >
                    {Math.round(volume_surplus).toLocaleString()}
                  </span>
                  {store.isSurplusDiscarded && (
                    <span className="ml-1 text-red-500 font-bold">
                      0 (폐기)
                    </span>
                  )}
                  <span className="ml-1 text-xs text-gray-500">kWh</span>
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.dLabel}>EC-전력 (년)</span>
                <span>
                  <span className={styles.dVal}>
                    {Math.round(volume_ec).toLocaleString()}
                  </span>{' '}
                  kWh
                </span>
              </div>

              <div className={styles.detailHeader}>
                {store.selectedModel === 'REC5'
                  ? 'REC 5.0 기준'
                  : 'REC 1.5 기준'}
              </div>

              <div className={`${styles.row} ${styles.bgYellow}`}>
                <span className={styles.dLabel}>최대부하 절감 단가</span>
                <span>
                  <span className={styles.dVal}>
                    {appliedSavingsPrice.toLocaleString()}
                  </span>{' '}
                  원
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.dLabel}>잉여 한전 판매 단가</span>
                <span>
                  <span className={styles.dVal}>
                    {config.unit_price_kepco.toLocaleString()}
                  </span>{' '}
                  원
                </span>
              </div>
              <div className={styles.row}>
                <span className={styles.dLabel}>{ecPriceLabel}</span>
                <span>
                  <span className={styles.dVal}>
                    {appliedSellPrice.toLocaleString()}
                  </span>{' '}
                  원
                </span>
              </div>

              <div className="border-t border-slate-200 my-1"></div>

              <div className={`${styles.row} font-bold text-slate-800`}>
                <span>연간 수익총액</span>
                {/* [수정] 합리화 제외한 발전 수익만 표시 */}
                <span>
                  <span className={styles.dVal}>
                    {(displayedAnnualGrossRevenue / 100000000).toFixed(2)}
                  </span>{' '}
                  억원
                </span>
              </div>
              <div className={styles.row}>
                <span className="text-xs text-gray-500 pl-2">
                  ○ 자가소비(최대부하) 금액
                </span>
                <span className="text-xs">
                  {(revenue_saving / 100000000).toFixed(2)} 억원
                </span>
              </div>
              <div className={styles.row}>
                <span className="text-xs text-gray-500 pl-2">
                  ○ EC-전력 판매 수익
                </span>
                <span className="text-xs">
                  {(revenue_ec / 100000000).toFixed(2)} 억원
                </span>
              </div>
              <div className={styles.row}>
                <span className="text-xs text-gray-500 pl-2">
                  ○ 기본료 절감
                </span>
                <span className="text-xs">
                  {(results.revenue_base_bill_savings / 100000000).toFixed(2)}{' '}
                  억원
                </span>
              </div>
              <div className={styles.row}>
                <span className="text-xs text-gray-500 pl-2">
                  ○ 잉여 한전판매 수익
                </span>
                <span
                  className={`text-xs ${
                    store.isSurplusDiscarded ? 'text-red-500 font-bold' : ''
                  }`}
                >
                  {(revenue_surplus / 100000000).toFixed(2)} 억원
                  {store.isSurplusDiscarded && ' (폐기)'}
                </span>
              </div>
            </>
          )}

          <div className={styles.finalResult}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-800">
                연간 실제 수익 (Net)
              </span>
              <span className="text-xl font-extrabold text-blue-600">
                {/* [수정] 순수 발전 수익 기준 Net 표시 */}
                {(displayedAnnualNetProfit / 100000000).toFixed(2)}
                <span className="text-sm">억원</span>
              </span>
            </div>
            <div className="flex justify-between text-xs text-red-500 mb-1">
              <span>○ O&M ({store.maintenanceRate}%)</span>
              <span>-{(maintenanceBase / 100000000).toFixed(2)} 억원</span>
            </div>

            {laborCostWon > 0 && !store.isEcSelfConsumption && (
              <div className="flex justify-between text-xs text-red-500">
                <span>○ EC 운영 인건비 ({truckCount}대)</span>
                <span>-{(laborCostWon / 100000000).toFixed(2)} 억원</span>
              </div>
            )}
          </div>

          <div className="flex flex-col p-3 bg-green-50 border-t border-green-100">
            <div className="flex justify-between items-center">
              <span className="font-bold text-green-900">20년 수익총액</span>
              <span className="font-bold text-green-800 text-lg">
                {(totalNetProfit20Years / 100000000).toFixed(2)} 억원
              </span>
            </div>

            {/* [NEW] 20년 수익 상세 내역 (엑셀 형식) */}
            <div className="flex flex-col mt-2 gap-1 text-xs text-slate-500 border-t border-green-200 pt-2">
              <div className="flex justify-between">
                <span>(+) 태양광발전수익 (20년, 효율감소반영)</span>
                <span>{toUk(results.totalSolarRevenue20)} 억원</span>
              </div>
              {/* 엑셀 J16과 동일: 연간 수익총액(기본료 포함)에 등비수열 적용, 기본료 20년 별도 없음 */}
              {/* 항상 표시 (0원이라도 표시) */}
              <div className="flex justify-between text-blue-600">
                <span>(+) 전기요금합리화절감액 (20년)</span>
                <span>+{toUk(results.totalRationalization20)} 억원</span>
              </div>
              <div className="flex justify-between text-red-500">
                <span>(-) 유지보수 및 운영비 (17년, 3년 무상)</span>
                <span>-{toUk(results.totalMaintenance20)} 억원</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-400 text-black font-bold text-center py-2">
            수익률 (ROI) {roiPercent.toFixed(1)}% (회수{' '}
            {isFinite(roiYears) ? roiYears.toFixed(1) : '-'}년)
          </div>
        </div>
      </div>
    </div>
  );
}
