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
} from 'lucide-react';
import styles from './Step0_Summary.module.css';

// 원 단위 포맷터
const toWon = (val: number) => Math.round(val).toLocaleString();
const toUk = (val: number) => (val / 100000000).toFixed(2);

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
    0,
  );
  const totalUsage = monthlyData.reduce((acc, cur) => acc + cur.usageKwh, 0);

  // RE100 달성률
  const re100Rate = totalUsage > 0 ? (simpleAnnualGen / totalUsage) * 100 : 0;

  const solarRadiation = config.solar_radiation || 3.8;

  // 전기요금 절감률 계산
  let totalBillSavings = 0;
  monthlyData.forEach((data) => {
    const days = new Date(2025, data.month, 0).getDate();
    const autoGen = capacityKw * solarRadiation * days;
    const selfConsum = data.selfConsumption;
    const usageSaving =
      Math.min(autoGen, selfConsum) *
      (store.unitPriceSavings || config.unit_price_savings);

    // 기본료 절감 (피크 감소분)
    const totalUsageYear = monthlyData.reduce(
      (acc, cur) => acc + cur.usageKwh,
      0,
    );
    const totalSelfYear = monthlyData.reduce(
      (acc, cur) => acc + cur.selfConsumption,
      0,
    );
    const dynamicPeakRatio =
      totalUsageYear > 0 ? totalSelfYear / totalUsageYear : 0;

    let baseBillSaving = 0;
    if (data.peakKw > 0) {
      baseBillSaving = Math.max(
        0,
        data.baseBill - store.baseRate * data.peakKw,
      );
    } else {
      baseBillSaving = data.baseBill * dynamicPeakRatio;
    }
    totalBillSavings += usageSaving + baseBillSaving;
  });

  const savingRate =
    totalBillBefore > 0 ? (totalBillSavings / totalBillBefore) * 100 : 0;

  const customSavingRate =
    totalBillBefore > 0
      ? ((totalBillBefore - totalBillSavings) / totalBillBefore) * 100
      : 0;

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
