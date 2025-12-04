'use client';

import React, { useEffect } from 'react';
import { useProposalStore, ModuleTier, BusinessModel } from '../lib/store';
import styles from './Step4_Simulation.module.css';
import {
  LucideTruck,
  LucideZap,
  LucideSettings,
  LucideTrendingUp,
  LucideInfo,
  LucideAlertTriangle,
  LucideCheckCircle2,
  LucideTable,
} from 'lucide-react';

// [Helper] 반올림 함수
const round2 = (num: number) => Math.round(num * 100) / 100;

export default function Step4_Simulation() {
  const store = useProposalStore();
  const { config } = store;

  useEffect(() => {
    store.recalculateInvestment();
  }, [
    store.capacityKw,
    store.selectedModel,
    store.moduleTier,
    store.useEc,
    store.config,
  ]);

  // --------------------------------------------------------------------------
  // [1] 수익 계산 로직
  // --------------------------------------------------------------------------
  const initialAnnualGen = store.monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + store.capacityKw * 3.64 * days;
  }, 0);

  const annualSelfConsumption = store.monthlyData.reduce(
    (acc, cur) => acc + cur.selfConsumption,
    0
  );
  const annualSurplus = Math.max(0, initialAnnualGen - annualSelfConsumption);

  // 단가 결정
  const appliedSavingsPrice =
    store.unitPriceSavings || config.unit_price_savings;
  let appliedSellPrice = config.unit_price_kepco;
  if (store.selectedModel === 'RE100')
    appliedSellPrice = config.unit_price_ec_1_5;
  if (store.selectedModel === 'REC5')
    appliedSellPrice = config.unit_price_ec_5_0;

  // 수익 상세
  let revenue_saving = 0;
  let revenue_ec = 0;
  let revenue_surplus = 0;

  // 엑셀 물량 표시용 변수
  const volume_self = annualSelfConsumption;
  const volume_surplus = annualSurplus;
  let volume_ec = 0;

  if (store.selectedModel === 'KEPCO') {
    revenue_surplus = initialAnnualGen * config.unit_price_kepco;
  } else {
    revenue_saving =
      Math.min(initialAnnualGen, annualSelfConsumption) * appliedSavingsPrice;
    const sellPrice = store.useEc ? appliedSellPrice : config.unit_price_kepco;

    if (store.useEc) {
      revenue_ec = annualSurplus * sellPrice;
      volume_ec = annualSurplus; // EC 모드면 잉여전력 = EC물량
    } else {
      revenue_surplus = annualSurplus * sellPrice;
    }
  }

  const totalRevenue = revenue_saving + revenue_ec + revenue_surplus;

  // 비용
  const maintenanceCost = totalRevenue * (store.maintenanceRate / 100);
  let fixedLaborCost = 0;
  if (store.useEc && store.selectedModel !== 'KEPCO') {
    fixedLaborCost = config.price_labor_ec * 100000000;
  }
  const totalAnnualCost = maintenanceCost + fixedLaborCost;
  const netProfit = totalRevenue - totalAnnualCost;

  // --------------------------------------------------------------------------
  // [2] 투자비 데이터
  // --------------------------------------------------------------------------
  let solarPrice = config.price_solar_standard;
  if (store.moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
  if (store.moduleTier === 'ECONOMY') solarPrice = config.price_solar_economy;

  const solarCount = store.capacityKw / 100;
  const solarCost = solarCount * solarPrice;

  const rawEcCount = Math.floor(store.capacityKw / 100);
  const ecCount = Math.min(3, rawEcCount); // Max 3대

  const useEcReal = store.useEc && store.selectedModel !== 'KEPCO';

  const ecCost = useEcReal ? ecCount * config.price_ec_unit : 0;
  const tractorCost = useEcReal && ecCount > 0 ? 1 * config.price_tractor : 0;
  const platformCost = useEcReal && ecCount > 0 ? 1 * config.price_platform : 0;

  // 유지보수비 (초기 견적서 표시용, 1년치 예비비 성격)
  const maintenanceTableValue = totalAnnualCost / 100000000;

  const totalInitialInvestment =
    solarCost + ecCost + tractorCost + platformCost;

  // 20년 분할 및 총액
  const solarSplit = round2(solarCost / 20);
  const ecSplit = round2(ecCost / 20);
  const tractorSplit = round2(tractorCost / 20);
  const platformSplit = round2(platformCost / 20);
  const maintenanceSplit = round2(maintenanceTableValue);

  const totalInvestment20Years =
    totalInitialInvestment + maintenanceTableValue * 20;

  // --------------------------------------------------------------------------
  // [3] 20년 누적
  // --------------------------------------------------------------------------
  let totalNetProfit20Years = 0;
  let firstYearNetProfit = 0;
  let currentGen = initialAnnualGen;

  for (let year = 1; year <= 20; year++) {
    const ratio = currentGen / initialAnnualGen;
    const yearRevenue = totalRevenue * ratio;
    const yearCost =
      yearRevenue * (store.maintenanceRate / 100) + fixedLaborCost;
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
  if (store.selectedModel !== 'KEPCO' && store.useEc) {
    if (rawEcCount > 3) {
      adviceType = 'warning';
      adviceMessage = (
        <span>
          <b>⚠️ 과잉 설비 주의:</b> 잉여전력이 트럭 3대 용량을 초과합니다.
        </span>
      );
    } else if (rawEcCount < 2) {
      adviceType = 'warning';
      adviceMessage = (
        <span>
          <b>⚠️ 경제성 주의:</b> 에너지 캐리어 2대 미만 시 효율이 낮습니다.
        </span>
      );
    } else {
      adviceType = 'success';
      adviceMessage = (
        <span>
          <b>✅ 최적 설계 구간:</b> 에너지 캐리어 {ecCount}대 운용에 최적입니다.
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
          <input
            type="checkbox"
            className="w-5 h-5 text-blue-600 cursor-pointer"
            checked={store.useEc}
            onChange={(e) =>
              store.setSimulationOption('useEc', e.target.checked)
            }
          />
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
          className={`p-3 rounded-lg border text-sm flex items-start gap-2 
          ${
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

      {/* =====================================================================================
          [1. 상세 견적서 테이블]
      ===================================================================================== */}
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2 text-blue-800">
          <LucideTable size={16} />{' '}
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
                <td>{ecCount} ea</td>
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

      {/* =====================================================================================
          ✅ [2. 연간 수익 상세 분석] (엑셀 스타일 완벽 재현)
      ===================================================================================== */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2 text-green-800">
          <LucideTrendingUp size={16} />{' '}
          <span className="text-sm font-bold">연간 수익 상세 분석</span>
        </div>

        <div className={styles.detailBox}>
          {/* 1. 물량 분석 (핑크색 영역) */}
          <div className={styles.row}>
            <span className={styles.dLabel}>자가소비 / 최대부하 (년)</span>
            <span>
              <span className={styles.dVal}>
                {Math.round(volume_self).toLocaleString()}
              </span>{' '}
              <span className={styles.dUnit}>kWh</span>
            </span>
          </div>
          <div className={`${styles.row} ${styles.bgPink}`}>
            <span className={styles.dLabel}>잉여 전력량 (년)</span>
            <span>
              <span className={styles.dVal}>
                {Math.round(volume_surplus).toLocaleString()}
              </span>{' '}
              <span className={styles.dUnit}>kWh</span>
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.dLabel}>EC-전력 (년)</span>
            <span>
              <span className={styles.dVal}>
                {Math.round(volume_ec).toLocaleString()}
              </span>{' '}
              <span className={styles.dUnit}>kWh</span>
            </span>
          </div>

          {/* 2. 단가 분석 (헤더 뱃지 + 노란색 강조) */}
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
              </span>{' '}
              <span className={styles.dUnit}>원</span>
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.dLabel}>잉여 한전 판매 단가</span>
            <span>
              <span className={styles.dVal}>
                {config.unit_price_kepco.toLocaleString()}
              </span>{' '}
              <span className={styles.dUnit}>원</span>
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.dLabel}>EC-전력 판매 단가</span>
            <span>
              <span className={styles.dVal}>
                {appliedSellPrice.toLocaleString()}
              </span>{' '}
              <span className={styles.dUnit}>원</span>
            </span>
          </div>

          <div className="border-t border-slate-200 my-1"></div>

          {/* 3. 수익 금액 (하단부) */}
          <div className={`${styles.row} font-bold text-slate-800`}>
            <span>연간 수익총액</span>
            <span>
              <span className={styles.dVal}>
                {(totalRevenue / 100000000).toFixed(2)}
              </span>{' '}
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
              ○ 잉여 한전판매 수익
            </span>
            <span className="text-xs">
              {(revenue_surplus / 100000000).toFixed(2)} 억원
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

          {/* 최종 결론 (강조) */}
          <div className={styles.finalResult}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-800">연간 실제 수익</span>
              <span className="text-xl font-extrabold text-blue-600">
                {(netProfit / 100000000).toFixed(2)}{' '}
                <span className="text-sm">억원</span>
              </span>
            </div>
            <div className="flex justify-between text-xs text-red-500 mb-1">
              <span>○ O&M ({store.maintenanceRate}%)</span>
              <span>-{(maintenanceCost / 100000000).toFixed(2)} 억원</span>
            </div>
            {fixedLaborCost > 0 && (
              <div className="flex justify-between text-xs text-red-500">
                <span>○ EC 운영 인건비</span>
                <span>-{(fixedLaborCost / 100000000).toFixed(2)} 억원</span>
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
