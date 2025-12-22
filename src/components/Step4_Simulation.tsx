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
} from 'lucide-react';

// [Helper] 반올림 함수
const round2 = (num: number) => Math.round(num * 100) / 100;

export default function Step4_Simulation() {
  const store = useProposalStore();
  const { config, rationalization, truckCount } = store;

  const [showRationalization, setShowRationalization] = useState(false);

  // [NEW] 알림 중복 방지를 위한 ref
  const isCheckingCostRef = useRef(false);

  // 시뮬레이션 옵션 변경 시 투자비 재계산
  useEffect(() => {
    store.recalculateInvestment();
  }, [
    store.capacityKw,
    store.selectedModel,
    store.moduleTier,
    store.useEc,
    store.truckCount,
    store.config,
  ]);

  // [Helper] 합리화 계산기 Input 렌더링 함수
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

  // --------------------------------------------------------------------------
  // [0] 기초 데이터 설정
  // --------------------------------------------------------------------------
  const isKepco = store.selectedModel === 'KEPCO';
  const isEul = store.contractType.includes('(을)');

  // 합리화 절감액 (KEPCO 모델은 미사용, 그 외는 사용)
  const diff_base = rationalization.base_eul - rationalization.base_gap;
  const saving_base = diff_base * 300 * 12;

  const diff_light = rationalization.light_eul - rationalization.light_gap;
  const diff_mid = rationalization.mid_eul - rationalization.mid_gap;
  const diff_max = rationalization.max_eul - rationalization.max_gap;

  const saving_light = diff_light * rationalization.light_usage;
  const saving_mid = diff_mid * rationalization.mid_usage;
  const saving_max = diff_max * rationalization.max_usage;

  const totalRationalizationSavings = isEul
    ? saving_base + saving_light + saving_mid + saving_max
    : 0;

  // --------------------------------------------------------------------------
  // [1] 물량 및 수익 계산
  // --------------------------------------------------------------------------
  const initialAnnualGen = store.monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + store.capacityKw * 3.64 * days;
  }, 0);

  let volume_self = 0;
  let volume_ec = 0;
  let volume_surplus = 0;
  let rawSurplus = 0;

  if (isKepco) {
    volume_self = 0;
    rawSurplus = initialAnnualGen;
    volume_ec = 0;
    volume_surplus = initialAnnualGen;
  } else {
    const annualSelfConsumption = store.monthlyData.reduce(
      (acc, cur) => acc + cur.selfConsumption,
      0
    );
    volume_self = Math.min(initialAnnualGen, annualSelfConsumption);
    rawSurplus = Math.max(0, initialAnnualGen - annualSelfConsumption);

    const ecCapacityAnnual = truckCount * 100 * 4 * 365;
    if (store.useEc) {
      volume_ec = Math.min(rawSurplus, ecCapacityAnnual);
    }
    volume_surplus = Math.max(0, rawSurplus - volume_ec);
  }

  // ----------------------------------------------------------------
  // [NEW] 일일 잉여 전력량 및 자동 대수 추천 로직
  // ----------------------------------------------------------------
  const dailySurplus = rawSurplus / 365;

  // 체크박스 핸들러: 체크 시 최적 대수 자동 설정
  const handleEcToggle = (checked: boolean) => {
    store.setSimulationOption('useEc', checked);

    if (checked) {
      let optimalCount = 1;
      if (dailySurplus >= 1200) {
        optimalCount = 3;
      } else if (dailySurplus >= 800) {
        optimalCount = 2;
      } else {
        optimalCount = 1; // 800 미만이라도 기본 1대 설정 (경고는 표시됨)
      }
      store.setTruckCount(optimalCount);
    }
  };

  // 추천 가이드 텍스트 생성
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

  // ----------------------------------------------------------------
  // 수익 및 비용 계산
  // ----------------------------------------------------------------
  const appliedSavingsPrice =
    store.unitPriceSavings || config.unit_price_savings;
  let appliedSellPrice = config.unit_price_kepco;
  if (store.selectedModel === 'RE100')
    appliedSellPrice = config.unit_price_ec_1_5;
  if (store.selectedModel === 'REC5')
    appliedSellPrice = config.unit_price_ec_5_0;

  const revenue_saving = volume_self * appliedSavingsPrice;
  const revenue_ec = volume_ec * appliedSellPrice;
  const revenue_surplus = volume_surplus * config.unit_price_kepco;

  const totalRevenue =
    revenue_saving +
    revenue_ec +
    revenue_surplus +
    (isKepco ? 0 : totalRationalizationSavings);

  const laborCostWon =
    truckCount > 0 && store.useEc && !isKepco
      ? config.price_labor_ec * 100000000
      : 0;

  const maintenanceBase = totalRevenue * (store.maintenanceRate / 100);
  const totalAnnualCost = maintenanceBase + laborCostWon;
  const netProfit = totalRevenue - totalAnnualCost;

  let solarPrice = config.price_solar_standard;
  if (store.moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
  if (store.moduleTier === 'ECONOMY') solarPrice = config.price_solar_economy;

  const solarCount = store.capacityKw / 100;
  const solarCost = solarCount * solarPrice;

  const ecCost =
    !isKepco && store.useEc ? truckCount * config.price_ec_unit : 0;
  const tractorCost =
    !isKepco && truckCount > 0 && store.useEc ? 1 * config.price_tractor : 0;
  const platformCost =
    !isKepco && truckCount > 0 && store.useEc ? 1 * config.price_platform : 0;

  const totalInitialInvestment =
    solarCost + ecCost + tractorCost + platformCost;
  const maintenanceTableValue = totalAnnualCost / 100000000;

  let totalInvestment20Years = 0;
  if (isKepco) {
    const annualInvestSplit = totalInitialInvestment / 20;
    totalInvestment20Years = (annualInvestSplit + maintenanceTableValue) * 20;
  } else {
    totalInvestment20Years =
      totalInitialInvestment + maintenanceTableValue * 20;
  }

  const solarSplit = round2(solarCost / 20);
  const ecSplit = round2(ecCost / 20);
  const tractorSplit = round2(tractorCost / 20);
  const platformSplit = round2(platformCost / 20);
  const maintenanceSplit = round2(maintenanceTableValue);

  // --------------------------------------------------------------------------
  // [NEW] 비용 초과 체크 및 자동 조정 로직
  // --------------------------------------------------------------------------
  useEffect(() => {
    // 8,000만 원 초과 체크 (단위: 원)
    const MAX_COST_LIMIT = 80000000;

    if (totalAnnualCost > MAX_COST_LIMIT && !isCheckingCostRef.current) {
      // 이미 체크 중이면 패스 (무한루프 방지)
      isCheckingCostRef.current = true;

      // 목표 O&M 비용 = 8000만 - 인건비
      const targetMaintenanceCost = Math.max(0, MAX_COST_LIMIT - laborCostWon);

      // 목표 비율 계산
      let targetRate = 0;
      if (totalRevenue > 0) {
        targetRate = (targetMaintenanceCost / totalRevenue) * 100;
      }

      // 소수점 2자리까지만
      const formattedTargetRate = Math.floor(targetRate * 100) / 100;

      // 알림 메시지 구성
      const currentCostEok = (totalAnnualCost / 100000000).toFixed(2);
      const limitCostEok = (MAX_COST_LIMIT / 100000000).toFixed(2);

      const confirmMsg = `[비용 조정 알림]
현재 유지보수 및 운영비용 합계가 ${currentCostEok}억원입니다.
설정된 제한선(${limitCostEok}억원)을 초과하였습니다.

O&M 비율을 현재 ${store.maintenanceRate}%에서 ${formattedTargetRate}%로 조정하여
총 비용을 8,000만원 이하로 맞추시겠습니까?`;

      if (window.confirm(confirmMsg)) {
        store.setSimulationOption('maintenanceRate', formattedTargetRate);
      }

      // 체크 완료 후 플래그 해제
      setTimeout(() => {
        isCheckingCostRef.current = false;
      }, 500);
    }
  }, [
    totalAnnualCost,
    totalRevenue,
    laborCostWon,
    store.maintenanceRate,
    store,
  ]);

  // --------------------------------------------------------------------------
  // [3] ROI 및 어드바이스
  // --------------------------------------------------------------------------
  const degradationRateDecimal = -(store.degradationRate / 100);
  const R = 1 + degradationRateDecimal;
  const n = 20;
  const totalNetProfit20Years = (netProfit * (1 - Math.pow(R, n))) / (1 - R);

  const roiYears =
    netProfit > 0 ? totalInitialInvestment / (netProfit / 100000000) : 0;
  const roiPercent =
    totalInvestment20Years > 0
      ? (totalNetProfit20Years / 100000000 / totalInvestment20Years) * 100
      : 0;

  let adviceMessage = null;
  let adviceType = 'info';
  const maxTruckCapacity = truckCount * 100 * 4 * 365;

  if (!isKepco && store.useEc) {
    if (truckCount > 0 && rawSurplus > maxTruckCapacity) {
      adviceType = 'warning';
      adviceMessage = (
        <span>
          <b>⚠️ 설비 부족:</b> 잉여전력이 트럭 용량을 초과합니다. 트럭 추가를
          고려하세요.
        </span>
      );
    } else if (truckCount > 0 && rawSurplus < maxTruckCapacity * 0.5) {
      adviceType = 'warning';
      adviceMessage = (
        <span>
          <b>⚠️ 과잉 설비:</b> 트럭 용량이 잉여전력보다 너무 큽니다. 줄이는 것을
          추천합니다.
        </span>
      );
    } else {
      adviceType = 'success';
      adviceMessage = (
        <span>
          <b>✅ 최적 설계:</b> 잉여전력과 트럭 운용({truckCount}대) 밸런스가
          양호합니다.
        </span>
      );
    }
  }

  // --------------------------------------------------------------------------
  // UI 렌더링
  // --------------------------------------------------------------------------
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
              <span className={styles.toggleLabel}>에너지 캐리어(EC) 운용</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                className="w-5 h-5 text-blue-600 cursor-pointer"
                checked={store.useEc}
                // [수정] 체크 시 자동 계산 로직 실행
                onChange={(e) => handleEcToggle(e.target.checked)}
              />
              {store.useEc && (
                <select
                  className="ml-2 border rounded p-1 text-sm bg-white border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={truckCount}
                  onChange={(e) => store.setTruckCount(Number(e.target.value))}
                >
                  <option value={1}>1대 (100kW)</option>
                  <option value={2}>2대 (200kW)</option>
                  <option value={3}>3대 (300kW)</option>
                </select>
              )}
            </div>
          </div>

          {/* [NEW] 일일 잉여 전력량 및 추천 가이드 표시 */}
          <div className="w-full mt-2 pl-6 text-xs text-slate-500 flex justify-between items-center bg-slate-50 p-2 rounded">
            <span>
              일일 잉여 전력:{' '}
              <b>{Math.round(dailySurplus).toLocaleString()} kWh</b>
            </span>
            <span className={ecRecColor}>{ecRecommendation}</span>
          </div>
        </div>
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center text-xs text-slate-500 mt-2">
        <div className="flex items-center gap-1">
          <LucideInfo size={14} />
          <span>
            적용 기준: 유지보수 <b>{store.maintenanceRate}%</b> / 발전감소{' '}
            <b>-{store.degradationRate}%</b>
          </span>
        </div>
        <div className="text-slate-400">(설정에서 변경 가능)</div>
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

      {/* 합리화 절감액 설정창 (isEul일 때만 표시) */}
      {isEul && (
        <div className="mt-4 border border-slate-300 rounded-lg overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 transition"
            onClick={() => setShowRationalization(!showRationalization)}
          >
            <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
              ⚡ 전기요금 합리화 절감액 계산
            </span>
            {showRationalization ? (
              <LucideChevronUp size={16} />
            ) : (
              <LucideChevronDown size={16} />
            )}
          </button>

          {showRationalization && (
            <div className="p-4 bg-white text-xs">
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 border-b">
                    <th className="p-2 border-r">구분</th>
                    <th className="p-2 border-r">을 (원)</th>
                    <th className="p-2 border-r">갑 (원)</th>
                    <th className="p-2 border-r bg-yellow-50">차이</th>
                    <th className="p-2 border-r">연간사용량 (kW)</th>
                    <th className="p-2 bg-blue-50">절감액 (원)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* 기본료 */}
                  <tr>
                    <td className="p-2 font-bold bg-slate-50 border-r">
                      기본료
                    </td>
                    <td className="p-1 border-r">
                      {renderRationalizationInput('base_eul')}
                    </td>
                    <td className="p-1 border-r">
                      {renderRationalizationInput('base_gap')}
                    </td>
                    <td className="p-2 border-r font-bold text-red-500 bg-yellow-50">
                      {(
                        rationalization.base_eul - rationalization.base_gap
                      ).toLocaleString()}
                    </td>
                    <td className="p-1 border-r text-gray-500">
                      3,600 (300×12)
                    </td>
                    <td className="p-2 bg-blue-50 font-bold text-blue-600">
                      {Math.round(saving_base).toLocaleString()}
                    </td>
                  </tr>

                  {/* 경부하 */}
                  <tr>
                    <td className="p-2 font-bold bg-slate-50 border-r">
                      경부하
                    </td>
                    <td className="p-1 border-r">
                      {renderRationalizationInput('light_eul')}
                    </td>
                    <td className="p-1 border-r">
                      {renderRationalizationInput('light_gap')}
                    </td>
                    <td className="p-2 border-r font-bold bg-yellow-50">
                      {(
                        rationalization.light_eul - rationalization.light_gap
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </td>
                    <td className="p-1 border-r">
                      {renderRationalizationInput('light_usage')}
                    </td>
                    <td className="p-2 bg-blue-50 font-bold text-blue-600">
                      {Math.round(saving_light).toLocaleString()}
                    </td>
                  </tr>
                  {/* 중간부하 */}
                  <tr>
                    <td className="p-2 font-bold bg-slate-50 border-r">
                      중간부하
                    </td>
                    <td className="p-1 border-r">
                      {renderRationalizationInput('mid_eul')}
                    </td>
                    <td className="p-1 border-r">
                      {renderRationalizationInput('mid_gap')}
                    </td>
                    <td className="p-2 border-r font-bold bg-yellow-50">
                      {(
                        rationalization.mid_eul - rationalization.mid_gap
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </td>
                    <td className="p-1 border-r">
                      {renderRationalizationInput('mid_usage')}
                    </td>
                    <td className="p-2 bg-blue-50 font-bold text-blue-600">
                      {Math.round(saving_mid).toLocaleString()}
                    </td>
                  </tr>
                  {/* 최대부하 */}
                  <tr>
                    <td className="p-2 font-bold bg-slate-50 border-r">
                      최대부하
                    </td>
                    <td className="p-1 border-r">
                      {renderRationalizationInput('max_eul')}
                    </td>
                    <td className="p-1 border-r">
                      {renderRationalizationInput('max_gap')}
                    </td>
                    <td className="p-2 border-r font-bold bg-yellow-50">
                      {(
                        rationalization.max_eul - rationalization.max_gap
                      ).toLocaleString(undefined, {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      })}
                    </td>
                    <td className="p-1 border-r">
                      {renderRationalizationInput('max_usage')}
                    </td>
                    <td className="p-2 bg-blue-50 font-bold text-blue-600">
                      {Math.round(saving_max).toLocaleString()}
                    </td>
                  </tr>
                  <tr className="border-t-2 border-slate-300">
                    <td
                      colSpan={5}
                      className="p-2 font-bold text-right bg-slate-100"
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
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2 text-blue-800">
          <LucideTable size={16} />
          <span className="text-sm font-bold">초기 투자비 상세 (VAT 별도)</span>
        </div>

        {isKepco ? (
          <div className="border rounded-lg overflow-hidden text-xs bg-white">
            <table className="w-full text-center">
              <thead className="bg-blue-100 text-blue-900 font-bold border-b border-blue-200">
                <tr>
                  <th className="py-2">투자비용</th>
                  <th>유지보수(년간)</th>
                  <th>20년 투자금</th>
                </tr>
              </thead>
              <tbody>
                <tr className="font-bold text-lg">
                  <td className="py-3 text-blue-700">
                    {totalInitialInvestment.toFixed(2)} 억원
                  </td>
                  <td className="text-slate-600">{store.maintenanceRate}%</td>
                  <td className="text-slate-800">
                    {totalInvestment20Years.toFixed(2)} 억원
                  </td>
                </tr>
                <tr className="text-xs text-gray-400 bg-slate-50 border-t">
                  <td>** 운영플랫폼 0.0 억원</td>
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
                  <th className="py-2">구분</th>
                  <th>태양광</th>
                  <th>에너지캐리어</th>
                  <th>이동트랙터</th>
                  <th>운영플랫폼</th>
                  <th className="text-gray-500">유지보수(년)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="bg-slate-50 text-slate-500">
                  <td className="font-bold text-slate-700">용량/규격</td>
                  <td>100 kW</td>
                  <td>100 kW</td>
                  <td>1 ton</td>
                  <td>1 set</td>
                  <td>1 set</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-700">수량</td>
                  <td className="text-blue-600 font-bold">
                    {solarCount.toFixed(2)} ea
                  </td>
                  <td>{store.useEc ? truckCount : 0} ea</td>
                  <td>{tractorCost > 0 ? 1 : 0} ea</td>
                  <td>{platformCost > 0 ? 1 : 0} set</td>
                  <td>1 set</td>
                </tr>
                <tr>
                  <td className="font-bold text-slate-700">단가</td>
                  <td>{solarPrice.toFixed(2)} 억</td>
                  <td>{config.price_ec_unit.toFixed(2)} 억</td>
                  <td>{config.price_tractor.toFixed(2)} 억</td>
                  <td>{config.price_platform.toFixed(2)} 억</td>
                  <td>{maintenanceTableValue.toFixed(2)} 억</td>
                </tr>
                <tr className="font-bold text-slate-800 bg-slate-50">
                  <td>합계</td>
                  <td>{solarCost.toFixed(2)} 억원</td>
                  <td>{ecCost.toFixed(2)} 억원</td>
                  <td>{tractorCost.toFixed(2)} 억원</td>
                  <td>{platformCost.toFixed(2)} 억원</td>
                  <td>{maintenanceTableValue.toFixed(2)} 억원</td>
                </tr>
                <tr className="border-t-2 border-slate-300">
                  <td className="font-bold py-2 text-blue-900">
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
                  <td>20년 분할(참고)</td>
                  <td>{solarSplit.toFixed(2)}</td>
                  <td>{ecSplit.toFixed(2)}</td>
                  <td>{tractorSplit.toFixed(2)}</td>
                  <td>{platformSplit.toFixed(2)}</td>
                  <td>{maintenanceSplit.toFixed(2)}</td>
                </tr>
                <tr className="bg-purple-50 border-t border-purple-100 font-bold text-purple-900">
                  <td className="py-2">20년 투자총액</td>
                  <td colSpan={5} className="text-center text-lg">
                    {totalInvestment20Years.toFixed(2)} 억원
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 수익 상세 분석 */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2 text-green-800">
          <LucideTrendingUp size={16} />
          <span className="text-sm font-bold">연간 수익 상세 분석</span>
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
                    {(totalRevenue / 100000000).toFixed(2)}
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
                {/* [수정됨] 잉여 전력량 표시를 'net surplus (raw - ec)'로 변경 */}
                <span className={styles.dLabel}>잉여 전력량 (년)</span>
                <span>
                  <span className={styles.dVal}>
                    {Math.round(volume_surplus).toLocaleString()}
                  </span>{' '}
                  kWh
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
                <span className={styles.dLabel}>EC-전력 판매 단가</span>
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
                <span>
                  <span className={styles.dVal}>
                    {(totalRevenue / 100000000).toFixed(2)}
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
                  ○ 전기요금합리화절감액{isEul ? '(을)' : '(갑)'}
                </span>
                <span className="text-xs">
                  {(totalRationalizationSavings / 100000000).toFixed(2)} 억원
                </span>
              </div>
              <div className={styles.row}>
                <span className="text-xs text-gray-500 pl-2">
                  ○ 잉여 한전판매 수익
                </span>
                <span className="text-xs">
                  {(revenue_surplus / 100000000).toFixed(2)} 억원
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
                {(netProfit / 100000000).toFixed(2)}
                <span className="text-sm">억원</span>
              </span>
            </div>
            <div className="flex justify-between text-xs text-red-500 mb-1">
              <span>○ O&M ({store.maintenanceRate}%)</span>
              <span>-{(maintenanceBase / 100000000).toFixed(2)} 억원</span>
            </div>
            {laborCostWon > 0 && (
              <div className="flex justify-between text-xs text-red-500">
                <span>○ EC 운영 인건비 ({truckCount}대)</span>
                <span>-{(laborCostWon / 100000000).toFixed(2)} 억원</span>
              </div>
            )}
          </div>

          <div className="flex justify-between p-3 bg-green-50 border-t border-green-100">
            <span className="font-bold text-green-900">20년 수익총액</span>
            <span className="font-bold text-green-800">
              {(totalNetProfit20Years / 100000000).toFixed(2)} 억원
            </span>
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
