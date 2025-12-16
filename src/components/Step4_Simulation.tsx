'use client';

import React, { useEffect, useState } from 'react';
import { useProposalStore, ModuleTier } from '../lib/store';
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
  const { config, rationalization, truckCount } = store; // [수정] truckCount 가져오기

  const [showRationalization, setShowRationalization] = useState(false);

  // 시뮬레이션 옵션 변경 시 투자비 재계산
  useEffect(() => {
    store.recalculateInvestment();
  }, [
    store.capacityKw,
    store.selectedModel,
    store.moduleTier,
    store.useEc,
    store.truckCount, // [수정] 트럭 수 변경 시에도 반응
    store.config,
  ]);

  // --------------------------------------------------------------------------
  // [0] 공통 변수 및 합리화 절감액 선행 계산
  // --------------------------------------------------------------------------
  const isEul = store.contractType.includes('(을)');

  const diff_light = rationalization.light_eul - rationalization.light_gap;
  const diff_mid = rationalization.mid_eul - rationalization.mid_gap;
  const diff_max = rationalization.max_eul - rationalization.max_gap;

  const saving_light = diff_light * rationalization.light_usage;
  const saving_mid = diff_mid * rationalization.mid_usage;
  const saving_max = diff_max * rationalization.max_usage;

  const totalRationalizationSavings = isEul
    ? rationalization.base_savings_manual +
      saving_light +
      saving_mid +
      saving_max
    : 0;

  // --------------------------------------------------------------------------
  // [1] 물량 및 수익 계산 로직
  // --------------------------------------------------------------------------

  // 1. 연간 총 발전량
  const initialAnnualGen = store.monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + store.capacityKw * 3.64 * days;
  }, 0);

  // 2. 연간 총 자가소비량
  const annualSelfConsumption = store.monthlyData.reduce(
    (acc, cur) => acc + cur.selfConsumption,
    0
  );

  // 3. 자가소비 인정 물량 (Min(발전량, 소비량))
  const volume_self = Math.min(initialAnnualGen, annualSelfConsumption);

  // 4. 자가소비 후 잉여전력량 (기초)
  const rawSurplus = Math.max(0, initialAnnualGen - annualSelfConsumption);

  // 5. EC 운반 전력량 계산
  // 식: 트럭수 * 100kW * 4회 * 365일
  const ecCapacityAnnual = truckCount * 100 * 4 * 365;

  let volume_ec = 0;
  if (store.useEc && store.selectedModel !== 'KEPCO') {
    volume_ec = Math.min(rawSurplus, ecCapacityAnnual);
  }

  // 6. 최종 잉여 전력량 (한전 판매용)
  const volume_surplus = Math.max(0, rawSurplus - volume_ec);

  // --- 단가 적용 및 수익 계산 ---
  const appliedSavingsPrice =
    store.unitPriceSavings || config.unit_price_savings;
  let appliedSellPrice = config.unit_price_kepco;
  if (store.selectedModel === 'RE100')
    appliedSellPrice = config.unit_price_ec_1_5;
  if (store.selectedModel === 'REC5')
    appliedSellPrice = config.unit_price_ec_5_0;

  // 수익 1: 자가소비 절감
  const revenue_saving = volume_self * appliedSavingsPrice;

  // 수익 2: EC 판매
  const revenue_ec = volume_ec * appliedSellPrice;

  // 수익 3: 잉여 한전 판매
  let revenue_surplus = 0;
  if (store.selectedModel === 'KEPCO') {
    revenue_surplus = rawSurplus * config.unit_price_kepco; // EC 미사용
  } else {
    revenue_surplus = volume_surplus * config.unit_price_kepco;
  }

  // 총 수익 (합리화 절감액 포함)
  const totalRevenue =
    revenue_saving + revenue_ec + revenue_surplus + totalRationalizationSavings;

  // --------------------------------------------------------------------------
  // [2] 비용 계산 (유지보수비 + 인건비)
  // --------------------------------------------------------------------------

  // EC 인건비: 트럭 1대 이상일 때 0.4억 (설정값 사용)
  const laborCostWon =
    truckCount > 0 && store.useEc && store.selectedModel !== 'KEPCO'
      ? config.price_labor_ec * 100000000
      : 0;

  // 유지보수비: (총수익 * 요율) + 인건비
  const maintenanceBase = totalRevenue * (store.maintenanceRate / 100);
  const totalAnnualCost = maintenanceBase + laborCostWon;

  // 순수익
  const netProfit = totalRevenue - totalAnnualCost;

  // --------------------------------------------------------------------------
  // [3] 투자비 데이터
  // --------------------------------------------------------------------------
  let solarPrice = config.price_solar_standard;
  if (store.moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
  if (store.moduleTier === 'ECONOMY') solarPrice = config.price_solar_economy;

  const solarCount = store.capacityKw / 100;
  const solarCost = solarCount * solarPrice;

  // EC 관련 투자비 (트럭 수 비례)
  const ecCost =
    store.useEc && store.selectedModel !== 'KEPCO'
      ? truckCount * config.price_ec_unit
      : 0;

  // 트랙터/플랫폼 (트럭 있으면 1식)
  const tractorCost =
    truckCount > 0 && store.useEc && store.selectedModel !== 'KEPCO'
      ? 1 * config.price_tractor
      : 0;
  const platformCost =
    truckCount > 0 && store.useEc && store.selectedModel !== 'KEPCO'
      ? 1 * config.price_platform
      : 0;

  const maintenanceTableValue = totalAnnualCost / 100000000; // 억 단위 표시용

  const totalInitialInvestment =
    solarCost + ecCost + tractorCost + platformCost;

  const solarSplit = round2(solarCost / 20);
  const ecSplit = round2(ecCost / 20);
  const tractorSplit = round2(tractorCost / 20);
  const platformSplit = round2(platformCost / 20);
  const maintenanceSplit = round2(maintenanceTableValue);

  const totalInvestment20Years =
    totalInitialInvestment + maintenanceTableValue * 20;

  // --------------------------------------------------------------------------
  // [4] 20년 누적 시뮬레이션
  // --------------------------------------------------------------------------
  let totalNetProfit20Years = 0;
  let firstYearNetProfit = 0;
  let currentGen = initialAnnualGen;

  for (let year = 1; year <= 20; year++) {
    const ratio = currentGen / initialAnnualGen;
    const yearRevenue = totalRevenue * ratio;
    const yearCost = yearRevenue * (store.maintenanceRate / 100) + laborCostWon;
    const yearNetProfit = yearRevenue - yearCost;

    totalNetProfit20Years += yearNetProfit;
    if (year === 1) firstYearNetProfit = yearNetProfit;
    currentGen = currentGen * (1 - store.degradationRate / 100);
  }

  const roiYears = totalInitialInvestment / (firstYearNetProfit / 100000000);
  const roiPercent =
    totalInvestment20Years > 0
      ? (totalNetProfit20Years / 100000000 / totalInvestment20Years) * 100
      : 0;

  // Advice Message
  let adviceMessage = null;
  let adviceType = 'info';

  const maxTruckCapacity = truckCount * 100 * 4 * 365;

  if (store.selectedModel !== 'KEPCO' && store.useEc) {
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

  return (
    <div className={styles.container}>
      <h3 className={styles.sectionTitle}>
        <span className={styles.stepBadge}>4</span> 투자비 및 수익 분석 상세
      </h3>

      {/* --- 옵션 선택 UI --- */}
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

      {store.selectedModel !== 'KEPCO' && (
        <div className={styles.toggleRow}>
          <div className="flex items-center gap-2">
            <LucideTruck size={18} className="text-blue-600" />
            <span className={styles.toggleLabel}>에너지 캐리어(EC) 운용</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className="w-5 h-5 text-blue-600 cursor-pointer"
              checked={store.useEc}
              onChange={(e) =>
                store.setSimulationOption('useEc', e.target.checked)
              }
            />
            {/* [수정] 트럭 수량 조절 (EC 사용 시에만 노출) */}
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
      )}

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center text-xs text-slate-500">
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

      {/* 투자비 상세 테이블 */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2 text-blue-800">
          <LucideTable size={16} />
          <span className="text-sm font-bold">초기 투자비 상세 (VAT 별도)</span>
        </div>
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
                {/* [수정] 트럭 수 store.truckCount 반영 */}
                <td>
                  {store.useEc && store.selectedModel !== 'KEPCO'
                    ? truckCount
                    : 0}{' '}
                  ea
                </td>
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
                <td className="font-bold py-2 text-blue-900">초기투자비 합</td>
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
      </div>

      {/* 수익 상세 분석 */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2 text-green-800">
          <LucideTrendingUp size={16} />
          <span className="text-sm font-bold">연간 수익 상세 분석</span>
        </div>

        <div className={styles.detailBox}>
          <div className={styles.row}>
            <span className={styles.dLabel}>자가소비 / 최대부하 (년)</span>
            <span>
              <span className={styles.dVal}>
                {Math.round(volume_self).toLocaleString()}
              </span>
              <span className={styles.dUnit}>kWh</span>
            </span>
          </div>
          <div className={`${styles.row} ${styles.bgPink}`}>
            <span className={styles.dLabel}>잉여 전력량 (년)</span>
            <span>
              <span className={styles.dVal}>
                {Math.round(volume_surplus).toLocaleString()}
              </span>
              <span className={styles.dUnit}>kWh</span>
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.dLabel}>EC-전력 (년)</span>
            <span>
              <span className={styles.dVal}>
                {Math.round(volume_ec).toLocaleString()}
              </span>
              <span className={styles.dUnit}>kWh</span>
            </span>
          </div>

          <div className={styles.detailHeader}>
            {store.selectedModel === 'KEPCO'
              ? '한전 판매 기준'
              : store.selectedModel === 'REC5'
              ? 'REC 5.0 기준'
              : 'REC 1.5 기준'}
          </div>

          <div className={`${styles.row} ${styles.bgYellow}`}>
            <span className={styles.dLabel}>최대부하 절감 단가</span>
            <span>
              <span className={styles.dVal}>
                {appliedSavingsPrice.toLocaleString()}
              </span>
              <span className={styles.dUnit}>원</span>
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.dLabel}>잉여 한전 판매 단가</span>
            <span>
              <span className={styles.dVal}>
                {config.unit_price_kepco.toLocaleString()}
              </span>
              <span className={styles.dUnit}>원</span>
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.dLabel}>EC-전력 판매 단가</span>
            <span>
              <span className={styles.dVal}>
                {appliedSellPrice.toLocaleString()}
              </span>
              <span className={styles.dUnit}>원</span>
            </span>
          </div>

          <div className="border-t border-slate-200 my-1"></div>

          <div className={`${styles.row} font-bold text-slate-800`}>
            <span>연간 수익총액</span>
            <span>
              <span className={styles.dVal}>
                {(totalRevenue / 100000000).toFixed(2)}
              </span>
              <span className={styles.dUnit}>억원</span>
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

          <div className={styles.finalResult}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-800">연간 실제 수익</span>
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

          {/* 합리화 절감액 토글 */}
          {isEul ? (
            <div className="mt-4 border border-slate-300 rounded-lg overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 transition"
                onClick={() => setShowRationalization(!showRationalization)}
              >
                <span className="font-bold text-slate-700 text-sm flex items-center gap-2">
                  ⚡ 전기요금 합리화 절감액 계산 (을 ↔ 갑 비교)
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
                      {/* 1. 기본료 */}
                      <tr>
                        <td className="p-2 font-bold bg-slate-50 border-r">
                          기본료
                        </td>
                        <td className="p-1 border-r">
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.base_eul}
                            onChange={(e) =>
                              store.updateRationalization(
                                'base_eul',
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-1 border-r">
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.base_gap}
                            onChange={(e) =>
                              store.updateRationalization(
                                'base_gap',
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-2 border-r font-bold text-red-500 bg-yellow-50">
                          {(
                            rationalization.base_eul - rationalization.base_gap
                          ).toLocaleString()}
                        </td>
                        <td className="p-1 border-r">
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.base_usage ?? 0}
                            onChange={(e) =>
                              store.updateRationalization(
                                'base_usage',
                                Number(e.target.value)
                              )
                            }
                            placeholder="0"
                          />
                        </td>
                        <td className="p-1 bg-blue-50">
                          <input
                            type="number"
                            className="w-full text-center border border-blue-200 rounded p-1 bg-white text-blue-600 font-bold"
                            value={rationalization.base_savings_manual}
                            onChange={(e) =>
                              store.updateRationalization(
                                'base_savings_manual',
                                Number(e.target.value)
                              )
                            }
                            placeholder="직접입력"
                          />
                        </td>
                      </tr>
                      {/* 2. 경부하 */}
                      <tr>
                        <td className="p-2 font-bold bg-slate-50 border-r">
                          경부하
                        </td>
                        <td className="p-1 border-r">
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.light_eul}
                            onChange={(e) =>
                              store.updateRationalization(
                                'light_eul',
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-1 border-r">
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.light_gap}
                            onChange={(e) =>
                              store.updateRationalization(
                                'light_gap',
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-2 border-r font-bold bg-yellow-50">
                          {(
                            rationalization.light_eul -
                            rationalization.light_gap
                          ).toLocaleString(undefined, {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                          })}
                        </td>
                        <td className="p-1 border-r">
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.light_usage}
                            onChange={(e) =>
                              store.updateRationalization(
                                'light_usage',
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-2 bg-blue-50 font-bold text-blue-600">
                          {Math.round(saving_light).toLocaleString()}
                        </td>
                      </tr>
                      {/* 3. 중간부하 */}
                      <tr>
                        <td className="p-2 font-bold bg-slate-50 border-r">
                          중간부하
                        </td>
                        <td className="p-1 border-r">
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.mid_eul}
                            onChange={(e) =>
                              store.updateRationalization(
                                'mid_eul',
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-1 border-r">
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.mid_gap}
                            onChange={(e) =>
                              store.updateRationalization(
                                'mid_gap',
                                Number(e.target.value)
                              )
                            }
                          />
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
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.mid_usage}
                            onChange={(e) =>
                              store.updateRationalization(
                                'mid_usage',
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-2 bg-blue-50 font-bold text-blue-600">
                          {Math.round(saving_mid).toLocaleString()}
                        </td>
                      </tr>
                      {/* 4. 최대부하 */}
                      <tr>
                        <td className="p-2 font-bold bg-slate-50 border-r">
                          최대부하
                        </td>
                        <td className="p-1 border-r">
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.max_eul}
                            onChange={(e) =>
                              store.updateRationalization(
                                'max_eul',
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-1 border-r">
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.max_gap}
                            onChange={(e) =>
                              store.updateRationalization(
                                'max_gap',
                                Number(e.target.value)
                              )
                            }
                          />
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
                          <input
                            type="number"
                            className="w-full text-center border rounded p-1"
                            value={rationalization.max_usage}
                            onChange={(e) =>
                              store.updateRationalization(
                                'max_usage',
                                Number(e.target.value)
                              )
                            }
                          />
                        </td>
                        <td className="p-2 bg-blue-50 font-bold text-blue-600">
                          {Math.round(saving_max).toLocaleString()}
                        </td>
                      </tr>
                      {/* 총계 */}
                      <tr className="border-t-2 border-slate-300">
                        <td
                          colSpan={5}
                          className="p-2 font-bold text-right bg-slate-100"
                        >
                          합계 (절감액)
                        </td>
                        <td className="p-2 font-extrabold text-blue-700 bg-blue-100">
                          {Math.round(
                            totalRationalizationSavings
                          ).toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
