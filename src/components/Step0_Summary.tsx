'use client';

import React from 'react';
import { useProposalStore } from '../lib/store';
import {
  LucideLayoutDashboard,
  LucideZap,
  LucideTruck,
  LucideBattery,
  LucideWrench,
  LucideTrendingUp,
  LucidePiggyBank,
  LucidePercent,
  LucideFlame,
} from 'lucide-react';
import styles from './Step0_Summary.module.css';
import { computeHydrogenComparison } from '../lib/hydrogenCalculations';

// 원 단위 포맷터
const toWon = (val: number) => Math.round(val).toLocaleString();
const toUk = (val: number) =>
  (val / 100000000).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

export default function Step0_Summary() {
  const store = useProposalStore();
  const {
    config,
    contractType,
    useEc,
    isEcSelfConsumption,
    ecSelfConsumptionCount,
    truckCount,
    maintenanceRate,
    maintenanceCostLimit,
    capacityKw,
    monthlyData,
  } = store;

  const results = store.getSimulationResults();

  // 1. EC 운용 현황 텍스트 생성
  let ecStatus = '미운용';
  let ecDetail = '-';
  let ecIcon = <LucideTruck size={24} className="text-gray-400" />;
  let ecColor = 'text-gray-500';

  if (store.selectedModel !== 'KEPCO') {
    if (isEcSelfConsumption) {
      ecStatus = '고정형 (자가소비)';
      ecDetail = `${ecSelfConsumptionCount} 대 (배터리)`;
      ecIcon = <LucideBattery size={24} className="text-green-600" />;
      ecColor = 'text-green-700';
    } else if (useEc) {
      ecStatus = '이동형 (에너지캐리어)';
      ecDetail = `${truckCount} 대 (트럭)`;
      ecIcon = <LucideTruck size={24} className="text-blue-600" />;
      ecColor = 'text-blue-700';
    }
  }

  // 2. 절감률 및 RE100 비율 계산
  const simpleAnnualGen = results.initialAnnualGen;
  const totalBillBefore = monthlyData.reduce(
    (acc, cur) => acc + cur.totalBill,
    0
  );
  const totalUsage = monthlyData.reduce((acc, cur) => acc + cur.usageKwh, 0);

  // RE100 달성률
  const re100Rate = totalUsage > 0 ? (simpleAnnualGen / totalUsage) * 100 : 0;

  const totalBillSavings =
    results.revenue_saving + results.revenue_base_bill_savings;

  const savingRate =
    totalBillBefore > 0 ? (totalBillSavings / totalBillBefore) * 100 : 0;

  const customSavingRate =
    totalBillBefore > 0
      ? ((totalBillBefore - totalBillSavings) / totalBillBefore) * 100
      : 0;

  // [수소발전 역산 비교]
  // - 1순위: 실측 연간 사용량 (totalUsage = monthlyData.usageKwh 합계)
  // - 폴백: 연간 전기료 ÷ 한전단가 (사용량 미입력 시)
  // ROI는 일반수소/청정수소 단가 각각으로 산정.
  const hydrogen = computeHydrogenComparison({
    annualBillWon: totalBillBefore,
    kepcoUnitPrice: config.unit_price_kepco,
    pricePerMwUk: config.price_hydrogen_per_mw,
    annualUsageKwh: totalUsage,
    hydrogenPriceNormal: config.hydrogen_price_normal,
    hydrogenPriceClean: config.hydrogen_price_clean,
    hydrogenMaterialCost: config.hydrogen_material_cost,
    hydrogenOmRate: config.hydrogen_om_rate,
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <LucideLayoutDashboard size={24} className="text-slate-700" />
        <h2 className="text-xl font-extrabold text-slate-800">
          Project Summary (종합 요약)
        </h2>
      </div>

      <div className={styles.gridContainer}>
        {/* Card 1: 설비 및 EC 현황 */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <LucideZap size={18} /> 설비 구성
          </div>
          <div className={styles.cardContent}>
            <div className={styles.row}>
              <span className={styles.label}>태양광 용량</span>
              <span className={styles.value}>{capacityKw} kW</span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.label}>EC 운용 방식</span>
              <div className="flex items-center gap-2">
                {ecIcon}
                <div className="flex flex-col items-end">
                  <span className={`font-bold ${ecColor}`}>{ecStatus}</span>
                  <span className="text-xs text-gray-400">{ecDetail}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: 유지보수 (O&M) */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <LucideWrench size={18} /> 유지보수 (O&M)
          </div>
          <div className={styles.cardContent}>
            <div className={styles.row}>
              <span className={styles.label}>적용 비율</span>
              <span className={`${styles.value} text-red-500`}>
                {maintenanceRate}%
              </span>
            </div>
            <div className={styles.row}>
              <span className={styles.label}>연간 비용</span>
              <span className={styles.value}>
                {toUk(results.annualMaintenanceCost)} 억원
              </span>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.label}>설정 한도액</span>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded">
                Max {toUk(maintenanceCostLimit)} 억원
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: 에너지 효율 지표 */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <LucidePercent size={18} /> 효율 지표
          </div>
          <div className={styles.cardContent}>
            <div className={styles.metricRow}>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>RE100 달성</span>
                <span className="text-xl font-bold text-green-600">
                  {re100Rate.toFixed(1)}%
                </span>
              </div>
              <div className={styles.verticalLine} />
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>요금 절감률</span>
                <span className="text-xl font-bold text-blue-600">
                  {savingRate.toFixed(1)}%
                </span>
              </div>
              <div className={styles.metricItem}>
                <span className={styles.metricLabel}>전기 절감률</span>
                <span className="text-xl font-bold text-blue-600">
                  {customSavingRate.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className={styles.divider} />
            <div className={styles.row}>
              <span className={styles.label}>연간 발전량</span>
              <span className={styles.value}>
                {Math.round(simpleAnnualGen).toLocaleString()} kWh
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: 투자 및 수익성 (Financials) */}
        <div className={`${styles.card} ${styles.highlightCard}`}>
          <div className={`${styles.cardTitle} text-white`}>
            <LucidePiggyBank size={18} /> 투자 경제성 (20년)
          </div>
          <div className={styles.cardContent}>
            <div className={styles.row}>
              <span className={styles.labelDark}>총 투자비</span>
              <span className="text-lg font-bold text-yellow-300">
                {toUk(results.totalInvestment)} 억원
              </span>
            </div>
            <div className={styles.row}>
              {/* 20년 순수익 (자기자본 기준) */}
              <span className={styles.labelDark}>20년 순수익</span>
              <span className="text-lg font-bold text-white">
                {toUk(results.self_final_profit)} 억원
              </span>
            </div>
            <div className="border-t border-white/20 my-2" />
            <div className={styles.row}>
              <span className={styles.labelDark}>ROI (회수)</span>
              <span className="text-2xl font-extrabold text-white flex items-center gap-1">
                {results.self_roi_years.toFixed(1)}{' '}
                <span className="text-sm font-normal">년</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* [수소발전 역산 비교 카드 - 풀폭]
          PreviewSummary 헤더의 '수소 비교' 체크박스와 store.showHydrogen으로 동기화.
          기본 OFF, 체크 시 양쪽(Step0 + Preview 1페이지)에 동시 노출. */}
      {store.showHydrogen && (
      <div
        className="mt-4 rounded-xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-sky-50 overflow-hidden"
        style={{ gridColumn: '1 / -1' }}
      >
        <div className="flex items-center justify-between px-4 py-2 bg-cyan-100/70 border-b border-cyan-200">
          <div className="flex items-center gap-2 text-cyan-800 font-extrabold text-sm">
            <LucideFlame size={16} />
            수소발전 역산 비교 (24·365 베이스로드 기준)
          </div>
          <div className="text-[11px] text-cyan-700 flex items-center gap-2 flex-wrap">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                hydrogen.basedOnActualUsage
                  ? 'bg-cyan-600 text-white'
                  : 'bg-amber-100 text-amber-700 border border-amber-200'
              }`}
            >
              {hydrogen.basedOnActualUsage
                ? '실측 사용량 기준'
                : '단순 역산 (사용량 미입력)'}
            </span>
            {hydrogen.isUnderscaled && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 text-orange-700 border border-orange-300"
                title="원시 평균 출력이 상용 수소연료전지 최소 단위(100kW) 미만 — 태양광 PV 권장"
              >
                ⚠️ 권장 규모 미만 · 태양광 PV 적합
              </span>
            )}
            <span>
              1MW당 <strong>{config.price_hydrogen_per_mw}</strong>억원
            </span>
          </div>
        </div>

        {!hydrogen.isValid ? (
          <div className="px-4 py-3 text-xs text-cyan-700">
            연간 전기료가 입력되어야 수소발전 비교가 계산됩니다.
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-2 px-4 py-3 text-center">
            <div className="bg-white rounded-lg border border-cyan-100 p-2">
              <div className="text-[11px] text-slate-500 mb-1">연간 전기료</div>
              <div className="text-sm font-extrabold text-slate-800">
                {(totalBillBefore / 100000000).toFixed(2)}{' '}
                <span className="text-xs font-bold text-slate-500">억원</span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-cyan-100 p-2">
              <div className="text-[11px] text-slate-500 mb-1">
                필요 발전량 (연/일)
              </div>
              <div className="text-sm font-extrabold text-slate-800">
                {Math.round(hydrogen.annualNeededKwh).toLocaleString()}
                <span className="text-[10px] text-slate-500"> kWh/년</span>
              </div>
              <div className="text-[10px] text-slate-400">
                ≈ {Math.round(hydrogen.dailyNeededKwh).toLocaleString()} kWh/일
              </div>
              {hydrogen.basedOnActualUsage &&
                hydrogen.simpleEstimateKwh > 0 && (
                  <div className="text-[9px] text-slate-400 mt-0.5">
                    단순역산:{' '}
                    {Math.round(hydrogen.simpleEstimateKwh).toLocaleString()}{' '}
                    kWh
                  </div>
                )}
            </div>
            <div className="bg-white rounded-lg border border-cyan-100 p-2">
              <div className="text-[11px] text-slate-500 mb-1">
                필요 발전 용량
              </div>
              <div className="text-sm font-extrabold text-cyan-700">
                {hydrogen.requiredCapacityMw.toFixed(2)}{' '}
                <span className="text-xs font-bold text-cyan-600">MW</span>
              </div>
              <div className="text-[10px] text-slate-400">
                ≈ {Math.round(hydrogen.requiredCapacityKw).toLocaleString()} kW
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {hydrogen.rawCapacityKw.toFixed(1)} kW
                <span className="text-[9px] text-slate-400 ml-1">
                  (시간당 실측용량)
                </span>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-cyan-100 p-2">
              <div className="text-[11px] text-slate-500 mb-1">
                예상 투자비 (수소)
              </div>
              <div className="text-sm font-extrabold text-amber-600">
                {hydrogen.investmentUk.toFixed(2)}{' '}
                <span className="text-xs font-bold text-slate-500">억원</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {hydrogen.requiredCapacityMw.toFixed(2)}MW ×{' '}
                {config.price_hydrogen_per_mw}억
              </div>
            </div>
            {/* [NEW] 매출 / 비용 카드 (단가별 + 재료비/O&M 차감 안내) */}
            <div className="bg-white rounded-lg border border-cyan-100 p-2">
              <div className="text-[11px] text-slate-500 mb-1">매출 / 비용</div>
              <div className="bg-cyan-50 border border-cyan-200 rounded px-1 py-0.5 mb-1">
                <div className="text-[9px] text-cyan-700 leading-tight text-center">
                  일반수소 {config.hydrogen_price_normal}원
                </div>
                <div className="text-sm font-extrabold text-cyan-700 leading-tight text-center">
                  {(hydrogen.annualRevenueNormal / 100000000).toFixed(2)}
                  <span className="text-[10px] font-bold"> 억</span>
                </div>
                <div className="text-[8px] text-amber-700 leading-tight text-right">
                  − 재료비 {(hydrogen.annualMaterialCost / 100000000).toFixed(2)}
                  억<br />− O&M {config.hydrogen_om_rate}% (
                  {(hydrogen.annualOmCostNormal / 100000000).toFixed(2)}억)
                </div>
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded px-1 py-0.5">
                <div className="text-[9px] text-emerald-700 leading-tight text-center">
                  청정수소 {config.hydrogen_price_clean}원
                </div>
                <div className="text-sm font-extrabold text-emerald-700 leading-tight text-center">
                  {(hydrogen.annualRevenueClean / 100000000).toFixed(2)}
                  <span className="text-[10px] font-bold"> 억</span>
                </div>
                <div className="text-[8px] text-amber-700 leading-tight text-right">
                  − 재료비 {(hydrogen.annualMaterialCost / 100000000).toFixed(2)}
                  억<br />− O&M {config.hydrogen_om_rate}% (
                  {(hydrogen.annualOmCostClean / 100000000).toFixed(2)}억)
                </div>
              </div>
            </div>
            {/* 순수익 / ROI 카드 — 매출에서 재료비·O&M 차감 후 */}
            <div className="bg-white rounded-lg border border-cyan-100 p-2">
              <div className="text-[11px] text-slate-500 mb-1">
                순수익 / ROI
              </div>
              {/* 일반수소 */}
              <div
                className={`border rounded px-1 py-0.5 mb-1 ${
                  hydrogen.isProfitableNormal
                    ? 'bg-cyan-50 border-cyan-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div
                  className={`text-[9px] leading-tight ${
                    hydrogen.isProfitableNormal
                      ? 'text-cyan-700'
                      : 'text-red-700'
                  }`}
                >
                  일반수소{' '}
                  {(hydrogen.annualNetNormal / 100000000).toFixed(2)}억
                </div>
                <div
                  className={`text-sm font-extrabold leading-tight ${
                    hydrogen.isProfitableNormal
                      ? 'text-cyan-700'
                      : 'text-red-700'
                  }`}
                >
                  {hydrogen.isProfitableNormal ? (
                    <>
                      {hydrogen.roiYearsNormal.toFixed(2)}{' '}
                      <span className="text-[10px] font-bold">년</span>
                    </>
                  ) : (
                    <span>적자</span>
                  )}
                </div>
              </div>
              {/* 청정수소 */}
              <div
                className={`border rounded px-1 py-0.5 ${
                  hydrogen.isProfitableClean
                    ? 'bg-emerald-50 border-emerald-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div
                  className={`text-[9px] leading-tight ${
                    hydrogen.isProfitableClean
                      ? 'text-emerald-700'
                      : 'text-red-700'
                  }`}
                >
                  청정수소{' '}
                  {(hydrogen.annualNetClean / 100000000).toFixed(2)}억
                </div>
                <div
                  className={`text-sm font-extrabold leading-tight ${
                    hydrogen.isProfitableClean
                      ? 'text-emerald-700'
                      : 'text-red-700'
                  }`}
                >
                  {hydrogen.isProfitableClean ? (
                    <>
                      {hydrogen.roiYearsClean.toFixed(2)}{' '}
                      <span className="text-[10px] font-bold">년</span>
                    </>
                  ) : (
                    <span>적자</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {hydrogen.isValid && (
          <div className="px-4 pb-3 -mt-1 text-[10px] text-slate-500 leading-tight">
            *{' '}
            {hydrogen.basedOnActualUsage
              ? '실측 가정: 입력된 12개월 사용량(kWh) 합계를, 수소 연료전지가 24시간·365일 균등 가동하여 충당한다고 가정합니다.'
              : '역산 가정: 연간 전기료를 한전 단가로 나눈 필요 발전량을, 수소 연료전지가 24시간·365일 균등 가동하여 충당한다고 가정합니다. (실측 사용량을 입력하면 자동으로 정밀 모드로 전환됩니다)'}{' '}
            ROI = 투자비 ÷ 순수익 (순수익 = 매출 − 재료비 − 유지보수).
            실제 설계용량·이용률·연료비는 별도 검토가 필요합니다.
            <span className="ml-1 text-slate-400">
              · 용량은 100kW 단위 올림 적용 (최소 0.1 MW)
            </span>
            {hydrogen.isUnderscaled && (
              <span className="ml-1 text-orange-600 font-bold">
                · 본 사업장 평균 필요 출력은{' '}
                {hydrogen.rawCapacityKw.toFixed(1)} kW로 상용 수소연료전지
                최소 단위(100 kW) 미만입니다. 태양광 PV가 더 적합합니다.
              </span>
            )}
          </div>
        )}
      </div>
      )}

      {/* 하단 계약 정보 바 */}
      <div className={styles.footerInfo}>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500">계약유형:</span>
          <span className="font-bold text-slate-700">{contractType}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500">사업모델:</span>
          <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            {store.selectedModel}
          </span>
        </div>
      </div>
    </div>
  );
}
