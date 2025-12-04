'use client';

import React from 'react';
import { useProposalStore } from '../lib/store';
import styles from './PreviewPanel.module.css';
import { LucidePrinter } from 'lucide-react'; // 프린터 아이콘

// 분리된 컴포넌트 임포트
import PreviewChart from './preview/PreviewChart';
import PreviewDetailTable from './preview/PreviewDetailTable';
import PreviewFinancialTable from './preview/PreviewFinancialTable';
import PreviewModelVisual from './preview/PreviewModelVisual';
import PreviewComparisonTable from './preview/PreviewComparisonTable';
import PreviewSummary from './preview/PreviewSummary';

// [Helper] 반올림
const round2 = (num: number) => Math.round(num * 100) / 100;

export default function PreviewPanel() {
  const store = useProposalStore();
  const { config } = store;

  // [NEW] 프린트 핸들러
  const handlePrint = () => {
    window.print();
  };

  const getDaysInMonth = (month: number) => new Date(2025, month, 0).getDate();

  // ----------------------------------------------------------------
  // [1] 월별 데이터 계산
  // ----------------------------------------------------------------
  const computedData = store.monthlyData.map((data) => {
    const days = getDaysInMonth(data.month);
    const solarGeneration = store.capacityKw * 3.64 * days;
    const surplusPower = Math.max(0, solarGeneration - data.selfConsumption);

    const unitPriceSavings = store.unitPriceSavings || 136.5;
    const maxLoadSavings =
      Math.min(solarGeneration, data.selfConsumption) * unitPriceSavings;

    const totalUsage = store.monthlyData.reduce(
      (acc, cur) => acc + cur.usageKwh,
      0
    );
    const totalSelf = store.monthlyData.reduce(
      (acc, cur) => acc + cur.selfConsumption,
      0
    );
    const dynamicPeakRatio = totalUsage > 0 ? totalSelf / totalUsage : 0;

    let baseBillSavings = 0;
    if (data.peakKw > 0) {
      baseBillSavings = Math.max(
        0,
        data.baseBill - store.baseRate * data.peakKw
      );
    } else {
      baseBillSavings = data.baseBill * dynamicPeakRatio;
    }

    const totalSavings = maxLoadSavings + baseBillSavings;
    const afterBill = Math.max(0, data.totalBill - totalSavings);
    const unitPriceSell = store.unitPriceSell || 192.79;
    const surplusRevenue = surplusPower * unitPriceSell;

    return {
      ...data,
      solarGeneration,
      surplusPower,
      maxLoadSavings,
      baseBillSavings,
      totalSavings,
      afterBill,
      surplusRevenue,
      name: `${data.month}월`,
      설치전: data.totalBill / 10000,
      설치후: afterBill / 10000,
    };
  });

  const totals = computedData.reduce(
    (acc, cur) => ({
      usageKwh: acc.usageKwh + cur.usageKwh,
      selfConsumption: acc.selfConsumption + cur.selfConsumption,
      solarGeneration: acc.solarGeneration + cur.solarGeneration,
      surplusPower: acc.surplusPower + cur.surplusPower,
      totalBill: acc.totalBill + cur.totalBill,
      baseBill: acc.baseBill + cur.baseBill,
      maxLoadSavings: acc.maxLoadSavings + cur.maxLoadSavings,
      baseBillSavings: acc.baseBillSavings + cur.baseBillSavings,
      totalSavings: acc.totalSavings + cur.totalSavings,
      afterBill: acc.afterBill + cur.afterBill,
      surplusRevenue: acc.surplusRevenue + cur.surplusRevenue,
    }),
    {
      usageKwh: 0,
      selfConsumption: 0,
      solarGeneration: 0,
      surplusPower: 0,
      totalBill: 0,
      baseBill: 0,
      maxLoadSavings: 0,
      baseBillSavings: 0,
      totalSavings: 0,
      afterBill: 0,
      surplusRevenue: 0,
    }
  );

  const savingRate =
    totals.totalBill > 0 ? (totals.totalSavings / totals.totalBill) * 100 : 0;

  const maxLoadRatio =
    totals.usageKwh > 0 ? (totals.selfConsumption / totals.usageKwh) * 100 : 0;
  const totalBenefit = totals.totalSavings + totals.surplusRevenue;

  // ----------------------------------------------------------------
  // [2] 투자비 및 수익 계산
  // ----------------------------------------------------------------
  const initialAnnualGen = totals.solarGeneration;
  const annualSelfConsumption = totals.selfConsumption;
  const annualSurplus = Math.max(0, initialAnnualGen - annualSelfConsumption);

  const appliedSavingsPrice =
    store.unitPriceSavings || config.unit_price_savings;
  let appliedSellPrice = config.unit_price_kepco;
  if (store.selectedModel === 'RE100')
    appliedSellPrice = config.unit_price_ec_1_5;
  if (store.selectedModel === 'REC5')
    appliedSellPrice = config.unit_price_ec_5_0;

  let revenue_saving = 0,
    revenue_ec = 0,
    revenue_surplus = 0;
  const volume_self = annualSelfConsumption;
  let volume_ec = 0;
  let volume_surplus_final = 0;

  const rawEcCount = Math.floor(store.capacityKw / 100);
  const ecCount = Math.min(3, rawEcCount);
  const ec_capacity_annual = ecCount * 4 * 100 * 365;

  if (store.selectedModel === 'KEPCO') {
    revenue_surplus = initialAnnualGen * config.unit_price_kepco;
    volume_surplus_final = initialAnnualGen;
  } else {
    revenue_saving =
      Math.min(initialAnnualGen, annualSelfConsumption) * appliedSavingsPrice;
    const sellPrice = store.useEc ? appliedSellPrice : config.unit_price_kepco;

    if (store.useEc) {
      volume_ec = Math.min(annualSurplus, ec_capacity_annual);
      const volume_real_surplus = annualSurplus - volume_ec;
      revenue_ec = volume_ec * appliedSellPrice;
      revenue_surplus = volume_real_surplus * config.unit_price_kepco;
      volume_surplus_final = volume_real_surplus;
    } else {
      revenue_surplus = annualSurplus * sellPrice;
      volume_surplus_final = annualSurplus;
    }
  }
  const totalRevenue = revenue_saving + revenue_ec + revenue_surplus;
  const maintenanceCost = totalRevenue * (store.maintenanceRate / 100);
  let fixedLaborCost = 0;
  if (store.useEc && store.selectedModel !== 'KEPCO') {
    fixedLaborCost = config.price_labor_ec * 100000000;
  }
  const totalAnnualCost = maintenanceCost + fixedLaborCost;
  const netProfit = totalRevenue - totalAnnualCost;

  // 투자비
  let solarPrice = config.price_solar_standard;
  if (store.moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
  if (store.moduleTier === 'ECONOMY') solarPrice = config.price_solar_economy;

  const solarCount = store.capacityKw / 100;
  const solarCost = solarCount * solarPrice;
  const useEcReal = store.useEc && store.selectedModel !== 'KEPCO';
  const ecCost = useEcReal ? ecCount * config.price_ec_unit : 0;
  const tractorCost = useEcReal && ecCount > 0 ? 1 * config.price_tractor : 0;
  const platformCost = useEcReal && ecCount > 0 ? 1 * config.price_platform : 0;
  const maintenanceTableValue = totalAnnualCost / 100000000;

  const totalInitialInvestment =
    solarCost + ecCost + tractorCost + platformCost;
  const totalInvestment20Years =
    totalInitialInvestment + maintenanceTableValue * 20;

  // 20년 누적
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
  const roiPercent =
    totalInvestment20Years > 0
      ? (totalNetProfit20Years / 100000000 / totalInvestment20Years) * 100
      : 0;
  const roiYears = totalInitialInvestment / (firstYearNetProfit / 100000000);

  // 자식에게 넘겨줄 데이터 패키징
  const revenueDetails = {
    volume_self,
    volume_ec,
    volume_surplus_final,
    appliedSavingsPrice,
    appliedSellPrice,
    revenue_saving,
    revenue_ec,
    revenue_surplus,
  };

  const investmentDetails = {
    solarCount,
    solarPrice,
    solarCost,
    ecCount,
    ecCost,
    tractorCost,
    platformCost,
    useEcReal,
    maintenanceTableValue,
    totalInitialInvestment,
    totalInvestment20Years,
    solarSplit: round2(solarCost / 20),
    ecSplit: round2(ecCost / 20),
    tractorSplit: round2(tractorCost / 20),
    platformSplit: round2(platformCost / 20),
    maintenanceSplit: round2(maintenanceTableValue),
  };

  // ----------------------------------------------------------------
  // UI 렌더링
  // ----------------------------------------------------------------
  return (
    // [중요] 프린트 영역 ID 지정
    <div className={styles.a4Page} id="print-area">
      <div className={styles.header}>
        <div className={styles.logoBox}>FIRST</div>
        <div className={styles.companyInfo}>
          <h2 className={styles.companyName}>(주)퍼스트씨앤디</h2>
          <p className={styles.companySub}>FIRST C&D Inc.</p>
        </div>

        {/* [수정됨] CSS 모듈 클래스(.printButton)와 글로벌 클래스(.no-print) 함께 적용 */}
        <button
          onClick={handlePrint}
          className={`${styles.printButton} no-print`}
        >
          <LucidePrinter size={18} />
          PDF 저장 / 인쇄
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.titleSection}>
          <div>
            <h1 className={styles.mainTitle}>
              <span className={styles.highlight}>RE100</span> 에너지 발전시스템
              분석자료
            </h1>
            <h2 className={styles.subTitle}>
              - {store.clientName} (태양광발전{' '}
              {store.capacityKw.toLocaleString()}kW) -
            </h2>
          </div>
          <div className={styles.contractCard}>
            <div className={styles.contractLabel}>적용 계약 종별</div>
            <div className={styles.contractValue}>{store.contractType}</div>
          </div>
        </div>

        {/* 요약(확장플랜 포함) 컴포넌트 */}
        <div className="print-avoid-break">
          <PreviewSummary />
        </div>
        {/* 1. 차트 컴포넌트 */}
        <div className="print-avoid-break" style={{ marginTop: '20px' }}>
          <PreviewChart
            data={computedData}
            savingRate={savingRate}
            contractType={store.contractType}
            baseRate={store.baseRate}
          />
        </div>

        {/* 2. 월별 상세 테이블 컴포넌트 */}
        <div className="print-avoid-break" style={{ marginTop: '20px' }}>
          <PreviewDetailTable
            data={computedData}
            totals={totals}
            savingRate={savingRate}
            maxLoadRatio={maxLoadRatio}
            totalBenefit={totalBenefit}
          />
        </div>

        {/* 3. 투자비 및 수익 분석 테이블 컴포넌트 */}
        <div className="print-avoid-break" style={{ marginTop: '20px' }}>
          <PreviewFinancialTable
            totals={totals}
            netProfit={netProfit}
            totalRevenue={totalRevenue}
            revenueDetails={revenueDetails}
            totalAnnualCost={totalAnnualCost}
            maintenanceCost={maintenanceCost}
            fixedLaborCost={fixedLaborCost}
            roiPercent={roiPercent}
            roiYears={roiYears}
            totalNetProfit20Years={totalNetProfit20Years}
            investmentDetails={investmentDetails}
          />
        </div>
        <div className="print-avoid-break">
          <PreviewModelVisual />
        </div>
        <div className="print-avoid-break">
          <PreviewComparisonTable />
          <div className={styles.footer}>
            <div className={styles.contactInfo}>
              <div>김 종 우 &nbsp;|&nbsp; 010.5617.9500</div>
              <div>jongwoo@firstcorea.com</div>
              <div>www.firstcorea.com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
