'use client';

/**
 * PDF 다운로드 버튼 (Page 1 한정 — 점진 확장 예정)
 *
 * 동작:
 * - 클릭 시 클라이언트에서 PDF blob 생성 → 자동 다운로드
 * - 기존 'PDF 저장/인쇄' 버튼(window.print)과 별도로 동작
 * - 첫 클릭 시 Pretendard 폰트를 jsDelivr CDN에서 fetch (캐시 후 빠름)
 *
 * 사용:
 *   <PdfDownloadButton />
 */
import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { LucideDownload, LucideLoader2 } from 'lucide-react';
import { useProposalStore, type ProposalState } from '../../lib/store';
import { computeHydrogenComparison } from '../../lib/hydrogenCalculations';
import { computeMonthlyEnergyMetrics } from '../../lib/energyCalculations';
import { MyEnergyPdfDocument, MyEnergyPdfData } from './MyEnergyPdfDocument';
import type { Page1Data } from './PdfPage1Summary';

// PDFDownloadLink는 SSR 비호환 (브라우저 전용) → 동적 import
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <Spinner /> }
);

const Spinner: React.FC = () => (
  <span className="inline-flex items-center gap-1 text-xs text-cyan-700">
    <LucideLoader2 size={12} className="animate-spin" /> 준비 중...
  </span>
);

/**
 * 화면 store의 값을 Page1Data로 변환.
 * - PreviewSummary의 산식과 동일하게 재현
 */
function buildPage1Data(store: ProposalState): Page1Data {
  const { config, monthlyData } = store;
  const solarRadiation = config.solar_radiation || 3.8;

  const totalUsage = monthlyData.reduce((acc, cur) => acc + cur.usageKwh, 0);
  const totalBillBefore = monthlyData.reduce((acc, cur) => acc + cur.totalBill, 0);
  const totalSelf = monthlyData.reduce((acc, cur) => acc + cur.selfConsumption, 0);

  const initialAnnualGen = monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + store.capacityKw * solarRadiation * days;
  }, 0);

  const re100Rate = totalUsage > 0 ? (initialAnnualGen / totalUsage) * 100 : 0;

  // 월별 절감액 (customSavingRate 계산용)
  const metrics = computeMonthlyEnergyMetrics({
    monthlyData,
    capacityKw: store.capacityKw,
    baseRate: store.baseRate,
    unitPriceSavings: store.unitPriceSavings || config.unit_price_savings,
    config,
  });
  const customSavingRate =
    totalBillBefore > 0
      ? ((totalBillBefore - metrics.totals.totalSavings) / totalBillBefore) * 100
      : 0;

  // 수소 비교
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

  // store에서 시뮬레이션 결과
  const results = store.getSimulationResults();

  // 한전 박스 (PreviewSummary calculateKepcoData 재현)
  const MAX_LIMIT = store.maintenanceCostLimit;
  const moduleSolarPrice =
    store.moduleTier === 'PREMIUM'
      ? config.price_solar_premium
      : store.moduleTier === 'ECONOMY'
      ? config.price_solar_economy
      : config.price_solar_standard;
  const kepcoSolarCost = (store.capacityKw / 100) * moduleSolarPrice;
  const kepcoInvestWon = kepcoSolarCost * 100000000;
  const kepcoAnnualGen = initialAnnualGen;
  const kepcoAnnualRevenue = kepcoAnnualGen * config.unit_price_kepco;
  let kepcoRate = store.isMaintenanceAuto ? 5.0 : store.maintenanceRate;
  if (store.isMaintenanceAuto && kepcoAnnualRevenue * (kepcoRate / 100) > MAX_LIMIT) {
    kepcoRate =
      kepcoAnnualRevenue > 0
        ? Math.floor((MAX_LIMIT / kepcoAnnualRevenue) * 100 * 100) / 100
        : 0;
  }
  const kepcoOM = kepcoAnnualRevenue * (kepcoRate / 100);
  const kepcoAnnualNet = kepcoAnnualRevenue - kepcoOM;
  const degR = 1 - store.degradationRate / 100;
  const kepcoTotalRevenue20 = (kepcoAnnualRevenue * (1 - Math.pow(degR, 20))) / (1 - degR);
  const kepcoTotalCost20 = kepcoOM * 17;
  const kepcoTotalNet20 = kepcoTotalRevenue20 - kepcoTotalCost20;
  const kepcoTotalRatio = ((kepcoTotalNet20 / (kepcoInvestWon + kepcoTotalCost20)) * 100) || 0;

  // TYPE A (REC 1.5)
  let activeEcCount = 0;
  if (store.isEcSelfConsumption) {
    activeEcCount = store.ecSelfConsumptionCount || 1;
  } else if (store.useEc) {
    activeEcCount = store.truckCount > 0 ? store.truckCount : 3;
  }
  const stdInvest = results.totalInvestmentUk;
  const stdAnnualProfit =
    (results.revenue_saving +
      results.revenue_ec +
      results.revenue_surplus +
      results.revenue_base_bill_savings -
      results.annualMaintenanceCost) /
    100000000;
  const stdTotalProfit20 = results.self_final_profit / 100000000;
  const stdRoiYears = results.self_roi_years;
  const totalCost20 = results.totalInvestment + results.totalMaintenance20;
  const stdProfitRate =
    totalCost20 > 0 ? (results.self_final_profit / totalCost20) * 100 : 0;

  // 비교 섹션
  const simpleRentalUk = (store.capacityKw * 0.4) / 1000;
  const simpleRentalSaveRate =
    totalBillBefore > 0
      ? ((simpleRentalUk * 100000000) / totalBillBefore) * 100
      : 0;
  const re100RentalUk = results.rental_revenue_yr / 100000000;
  const re100RentalSaveRate =
    totalBillBefore > 0
      ? (results.rental_revenue_yr / totalBillBefore) * 100
      : 0;
  const subRevenueUk = results.sub_revenue_yr / 100000000;
  const subSaveRate =
    totalBillBefore > 0 ? (results.sub_revenue_yr / totalBillBefore) * 100 : 0;
  const shareRevenueAvgUk = results.share_revenue_avg_yr / 100000000;
  const shareSaveRate =
    totalBillBefore > 0
      ? (results.share_revenue_avg_yr / totalBillBefore) * 100
      : 0;

  return {
    clientName: store.clientName,
    contractType: store.contractType,
    capacityKw: store.capacityKw,
    isSurplusDiscarded: store.isSurplusDiscarded,
    isEcSelfConsumption: store.isEcSelfConsumption,
    ecSelfConsumptionCount: store.ecSelfConsumptionCount,
    useEc: store.useEc,
    truckCount: store.truckCount,
    solarRadiation,
    showHydrogen: store.showHydrogen,
    hydrogenPriceNormal: config.hydrogen_price_normal,
    hydrogenPriceClean: config.hydrogen_price_clean,
    pricePerMwUk: config.price_hydrogen_per_mw,
    hydrogenMaterialCost: config.hydrogen_material_cost,
    hydrogenOmRate: config.hydrogen_om_rate,
    kepcoInvestUk: kepcoSolarCost,
    kepcoAnnualGen,
    kepcoAnnualProfitUk: kepcoAnnualNet / 100000000,
    kepcoAnnualRatio: kepcoInvestWon > 0 ? (kepcoAnnualNet / kepcoInvestWon) * 100 : 0,
    kepcoTotal20Uk: kepcoTotalNet20 / 100000000,
    kepcoTotalRatio,
    kepcoRoiYears: kepcoAnnualNet > 0 ? kepcoInvestWon / kepcoAnnualNet : 0,
    stdInvest,
    stdAnnualProfit,
    stdTotalProfit20,
    stdRoiYears,
    stdProfitRate,
    stdEcCount: activeEcCount,
    re100Rate,
    customSavingRate,
    simpleRentalUk,
    simpleRentalSaveRate,
    re100RentalUk,
    re100RentalSaveRate,
    subRevenueUk,
    subSaveRate,
    shareRevenueAvgUk,
    shareSaveRate,
    showRentSub: !store.isEcSelfConsumption,
    hydrogen,
    fileName: store.getProposalFileName(),
    pageNumber: 1,
  };
}

export const PdfDownloadButton: React.FC = () => {
  const store = useProposalStore();
  const [data, setData] = useState<MyEnergyPdfData | null>(null);

  const prepare = () => {
    setData({ page1: buildPage1Data(store) });
  };

  // 데이터 준비 전 — 클릭하면 데이터 생성 후 PDFDownloadLink 표시
  if (!data) {
    return (
      <button
        onClick={prepare}
        className="flex items-center gap-1 bg-cyan-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-cyan-700 transition shadow-sm no-print"
        title="페이지 1을 정확한 A4 PDF로 다운로드 (베타)"
      >
        <LucideDownload size={16} /> PDF 다운로드 (1p, 베타)
      </button>
    );
  }

  return (
    <PDFDownloadLink
      document={<MyEnergyPdfDocument data={data} />}
      fileName={`${data.page1.fileName}.pdf`}
      className="flex items-center gap-1 bg-cyan-700 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-cyan-800 transition shadow-sm no-print"
    >
      {({ loading }) =>
        loading ? (
          <>
            <LucideLoader2 size={16} className="animate-spin" /> 생성 중...
          </>
        ) : (
          <>
            <LucideDownload size={16} /> 다시 다운로드
          </>
        )
      }
    </PDFDownloadLink>
  );
};
