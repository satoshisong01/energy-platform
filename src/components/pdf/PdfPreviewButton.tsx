'use client';

/**
 * PDF 미리보기 버튼
 *
 * 클릭 → 웹 미리보기 화면 캡처(3~7페이지) → 모달에 @react-pdf 의 PDFViewer 로
 * 전체 PDF 를 실시간 렌더해서 보여준다. 모달 안에서 그대로 다운로드 가능.
 *
 * - PDFViewer / PDFDownloadLink 는 SSR 비호환 → dynamic import
 * - data 객체 useMemo + React.memo 로 1초 리렌더링 차단
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import type { DocumentProps } from '@react-pdf/renderer';
import { LucideEye, LucideDownload, LucideLoader2, LucideX } from 'lucide-react';
import { useProposalStore, type ProposalState } from '../../lib/store';
import { computeHydrogenComparison } from '../../lib/hydrogenCalculations';
import { computeMonthlyEnergyMetrics } from '../../lib/energyCalculations';
import { computeScenarioSummary } from '../../lib/scenarioCalculations';
import { MyEnergyPdfDocument, MyEnergyPdfData } from './MyEnergyPdfDocument';
import type { Page1Data } from './PdfPage1Summary';
import type { Page2Data } from './PdfPage2SiteAnalysis';
import type { Page3Data } from './PdfPage3Chart';
import type { Page4Data } from './PdfPage4DetailTable';
import type { Page5Data } from './PdfPage5Financial';
import type { Page6Data } from './PdfPage6ModelGraph';
import type { Page7Data } from './PdfPage7ModelImage';
import type { Page8Data } from './PdfPage8Comparison';
import type { Page9Data } from './PdfPage9Requirements';
import { buildHourlyData } from './buildHourlyData';

const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <ViewerSpinner /> }
);

const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span className="text-xs">준비 중...</span> }
);

const ViewerSpinner: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center text-slate-500 text-sm gap-2">
    <LucideLoader2 size={18} className="animate-spin" />
    PDF 렌더링 중...
  </div>
);

// ---- 페이지별 데이터 빌더 ----

function buildPage1Data(store: ProposalState): Page1Data {
  const { config, monthlyData } = store;
  const solarRadiation = config.solar_radiation || 3.8;
  const totalUsage = monthlyData.reduce((acc, cur) => acc + cur.usageKwh, 0);
  const totalBillBefore = monthlyData.reduce((acc, cur) => acc + cur.totalBill, 0);

  const initialAnnualGen = monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + store.capacityKw * solarRadiation * days;
  }, 0);
  const re100Rate = totalUsage > 0 ? (initialAnnualGen / totalUsage) * 100 : 0;

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

  const results = store.getSimulationResults();

  // 한전 박스
  const MAX_LIMIT = store.maintenanceCostLimit;
  const moduleSolarPrice =
    store.moduleTier === 'PREMIUM'
      ? config.price_solar_premium
      : store.moduleTier === 'ECONOMY'
      ? config.price_solar_economy
      : config.price_solar_standard;
  const kepcoSolarCost = (store.capacityKw / 100) * moduleSolarPrice;
  const kepcoInvestWon = kepcoSolarCost * 100000000;
  const kepcoAnnualRevenue = initialAnnualGen * config.unit_price_kepco;
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
  const totalCost20 = results.totalInvestment + results.totalMaintenance20;
  const stdProfitRate =
    totalCost20 > 0 ? (results.self_final_profit / totalCost20) * 100 : 0;

  const simpleRentalUk = (store.capacityKw * 0.4) / 1000;
  const simpleRentalSaveRate =
    totalBillBefore > 0 ? ((simpleRentalUk * 100000000) / totalBillBefore) * 100 : 0;

  // "REC 5.0 비교" 확장 — 웹 미리보기(PreviewSummary)와 동일 시나리오 계산
  const scenarioStd = computeScenarioSummary(store, false);
  const scenarioExp = computeScenarioSummary(store, true);

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
    kepcoAnnualGen: initialAnnualGen,
    kepcoAnnualProfitUk: kepcoAnnualNet / 100000000,
    kepcoAnnualRatio: kepcoInvestWon > 0 ? (kepcoAnnualNet / kepcoInvestWon) * 100 : 0,
    kepcoTotal20Uk: kepcoTotalNet20 / 100000000,
    kepcoTotalRatio,
    kepcoRoiYears: kepcoAnnualNet > 0 ? kepcoInvestWon / kepcoAnnualNet : 0,
    stdInvest,
    stdAnnualProfit,
    stdTotalProfit20,
    stdRoiYears: results.self_roi_years,
    stdProfitRate,
    stdEcCount: activeEcCount,
    re100Rate,
    customSavingRate,
    simpleRentalUk,
    simpleRentalSaveRate,
    re100RentalUk: results.rental_revenue_yr / 100000000,
    re100RentalSaveRate:
      totalBillBefore > 0 ? (results.rental_revenue_yr / totalBillBefore) * 100 : 0,
    subRevenueUk: results.sub_revenue_yr / 100000000,
    subSaveRate: totalBillBefore > 0 ? (results.sub_revenue_yr / totalBillBefore) * 100 : 0,
    shareRevenueAvgUk: results.share_revenue_avg_yr / 100000000,
    shareSaveRate:
      totalBillBefore > 0
        ? (results.share_revenue_avg_yr / totalBillBefore) * 100
        : 0,
    showRentSub: !store.isEcSelfConsumption,
    showExpansion: store.showExpansion,
    expansion: {
      title: scenarioExp.title,
      invest: scenarioExp.invest,
      ecCount: scenarioExp.ecCount,
      annualProfit: scenarioExp.annualProfit,
      modelName: scenarioExp.modelName,
      totalProfit20: scenarioExp.totalProfit20,
      profitRate: scenarioExp.profitRate,
      roiYears: scenarioExp.roiYears,
      deltaTotalProfit20: scenarioExp.totalProfit20 - scenarioStd.totalProfit20,
    },
    hydrogen,
    fileName: store.getProposalFileName(),
    pageNumber: 1,
  };
}

function buildPage2Data(store: ProposalState): Page2Data {
  const { roofAreas, capacityKw, address, siteImage, config } = store;
  const totalAreaM2 = roofAreas.reduce((acc, cur) => acc + (cur.valueM2 || 0), 0);
  const totalAreaPyeong = totalAreaM2 / 3.3058;
  const capacityFactor = config.solar_capacity_factor || 2.0;
  const maxPotentialKw =
    totalAreaPyeong > 0 ? Math.floor(totalAreaPyeong / capacityFactor) : 0;
  const panelWatt = config.solar_panel_wattage || 645;
  const moduleCount = capacityKw > 0 ? Math.round((capacityKw * 1000) / panelWatt) : 0;
  return {
    totalAreaPyeong,
    totalAreaM2,
    address,
    siteImage,
    maxPotentialKw,
    capacityKw,
    panelWatt,
    moduleCount,
    fileName: store.getProposalFileName(),
    pageNumber: 2,
  };
}

function buildPage3Data(store: ProposalState): Page3Data {
  const metrics = computeMonthlyEnergyMetrics({
    monthlyData: store.monthlyData,
    capacityKw: store.capacityKw,
    baseRate: store.baseRate,
    unitPriceSavings:
      store.unitPriceSavings || store.config.unit_price_savings,
    config: store.config,
  });
  const monthly = metrics.computedData.map((row) => ({
    name: `${row.month}월`,
    설치전: row.totalBill / 10000,
    설치후: row.afterBill / 10000,
  }));
  const totalBillBefore = metrics.totals.totalBill;
  return {
    monthly,
    savingRate: metrics.savingRate,
    customSavingRate:
      totalBillBefore > 0
        ? ((totalBillBefore - metrics.totals.totalSavings) / totalBillBefore) * 100
        : 0,
    contractType: store.contractType,
    baseRate: store.baseRate,
    fileName: store.getProposalFileName(),
    pageNumber: 3,
  };
}

function buildPage4Data(store: ProposalState): Page4Data {
  const metrics = computeMonthlyEnergyMetrics({
    monthlyData: store.monthlyData,
    capacityKw: store.capacityKw,
    baseRate: store.baseRate,
    unitPriceSavings:
      store.unitPriceSavings || store.config.unit_price_savings,
    config: store.config,
  });
  return {
    rows: metrics.computedData.map((r) => ({
      month: r.month,
      usageKwh: r.usageKwh,
      selfConsumption: r.selfConsumption,
      solarGeneration: r.solarGeneration,
      surplusPower: r.surplusPower,
      totalBill: r.totalBill,
      baseBill: r.baseBill,
      maxLoadSavings: r.maxLoadSavings,
      baseBillSavings: r.baseBillSavings,
      afterBill: r.afterBill,
      surplusRevenue: r.surplusRevenue,
    })),
    totals: metrics.totals,
    savingRate: metrics.savingRate,
    customSavingRate:
      metrics.totals.totalBill > 0
        ? ((metrics.totals.totalBill - metrics.totals.totalSavings) /
            metrics.totals.totalBill) *
          100
        : 0,
    maxLoadRatio: metrics.maxLoadRatio,
    totalBenefit: metrics.totalBenefit,
    energyNote: store.energyNote,
    fileName: store.getProposalFileName(),
    pageNumber: 4,
  };
}

function buildPage5Data(store: ProposalState): Page5Data {
  const { config, capacityKw, truckCount, selectedModel, moduleTier, useEc, isEcSelfConsumption, ecSelfConsumptionCount } = store;
  const results = store.getSimulationResults();
  let solarPrice = config.price_solar_standard;
  if (moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
  if (moduleTier === 'ECONOMY') solarPrice = config.price_solar_economy;
  const solarCount = capacityKw / 100;
  const solarCost = solarCount * solarPrice;
  let activeEcCount = 0;
  if (selectedModel !== 'KEPCO') {
    if (isEcSelfConsumption) activeEcCount = ecSelfConsumptionCount || 1;
    else if (useEc) activeEcCount = truckCount;
  }
  const ecCost = activeEcCount * config.price_ec_unit;
  const tractorCost =
    selectedModel !== 'KEPCO' && useEc && !isEcSelfConsumption && truckCount > 0
      ? config.price_tractor
      : 0;
  const calculatedPlatformCost = Math.min((capacityKw / 100) * 0.1, 0.3);
  const platformCost =
    selectedModel !== 'KEPCO' && ((useEc && truckCount > 0) || isEcSelfConsumption)
      ? calculatedPlatformCost
      : 0;
  const appliedSavingsPrice = store.unitPriceSavings || config.unit_price_savings;
  let appliedSellPrice = config.unit_price_kepco;
  if (isEcSelfConsumption) appliedSellPrice = config.unit_price_ec_self;
  else {
    if (selectedModel === 'RE100') appliedSellPrice = config.unit_price_ec_1_5;
    if (selectedModel === 'REC5') appliedSellPrice = config.unit_price_ec_5_0;
  }
  let ecStatusText = '미운용';
  if (selectedModel !== 'KEPCO') {
    if (isEcSelfConsumption) ecStatusText = `자가소비형 (${activeEcCount}대)`;
    else if (useEc) ecStatusText = `이동형 (${activeEcCount}대)`;
  }
  const displayedAnnualGross =
    results.revenue_saving +
    results.revenue_ec +
    results.revenue_surplus +
    results.revenue_base_bill_savings;
  const displayedAnnualNet = displayedAnnualGross - results.annualMaintenanceCost;
  const totalCost20Won = results.totalInvestment + results.totalMaintenance20;
  const profitRate =
    totalCost20Won > 0 ? (results.self_final_profit / totalCost20Won) * 100 : 0;
  const totalInvest20Uk = totalCost20Won / 100000000;

  const surplusVolume =
    selectedModel === 'KEPCO' ? results.annualSurplus : results.volume_surplus_final;

  return {
    selectedModel,
    moduleTier,
    ecStatus: ecStatusText,
    maintenanceRate: store.maintenanceRate,
    solarCount,
    solarPrice,
    solarCost,
    activeEcCount,
    ecUnitPrice: config.price_ec_unit,
    ecCost,
    tractorCount: tractorCost > 0 ? 1 : 0,
    tractorPrice: config.price_tractor,
    tractorCost,
    platformCount: platformCost > 0 ? 1 : 0,
    platformPrice: calculatedPlatformCost,
    platformCost,
    totalInvestmentUk: results.totalInvestmentUk,
    totalInvest20Uk,
    volumeSelf: results.volume_self,
    appliedSavingsPrice,
    revenueSaving: results.revenue_saving,
    surplusVolume,
    kepcoUnitPrice: config.unit_price_kepco,
    revenueSurplus: results.revenue_surplus,
    volumeEc: results.volume_ec,
    appliedSellPrice,
    revenueEc: results.revenue_ec,
    revenueBaseBillSavings: results.revenue_base_bill_savings,
    displayedAnnualGross,
    annualMaintenanceCost: results.annualMaintenanceCost,
    laborCostWon: results.laborCostWon,
    displayedAnnualNet,
    totalSolarRevenue20: results.totalSolarRevenue20,
    totalRationalization20: results.totalRationalization20,
    totalMaintenance20: results.totalMaintenance20,
    selfFinalProfit: results.self_final_profit,
    profitRate,
    fileName: store.getProposalFileName(),
    pageNumber: 5,
  };
}

function buildPage6Data(store: ProposalState): Page6Data {
  const { hourly, isEcActive } = buildHourlyData(store);
  return {
    hourly,
    isEcActive,
    fileName: store.getProposalFileName(),
    pageNumber: 6,
  };
}

function buildPage7Data(store: ProposalState): Page7Data {
  const modelLabelMap: Record<string, string> = {
    KEPCO: '한전 장기 계약형',
    RE100: 'RE100 / REC 1.5',
    REC5: 'REC 5.0 (ESS 연계)',
  };
  return {
    modelLabel: modelLabelMap[store.selectedModel] || store.selectedModel,
    modelType: 'video',
    modelSrc: '',
    fileName: store.getProposalFileName(),
    pageNumber: 7,
  };
}

function buildPage8Data(store: ProposalState): Page8Data {
  const { config, financialSettings, isEcSelfConsumption } = store;
  const results = store.getSimulationResults();
  const displayedAnnualGross =
    results.revenue_saving +
    results.revenue_ec +
    results.revenue_surplus +
    results.revenue_base_bill_savings;
  const displayedAnnualNet = displayedAnnualGross - results.annualMaintenanceCost;
  const rps = financialSettings.rps;
  const fac = financialSettings.factoring;
  const showRentSub = !isEcSelfConsumption;
  const shareCompanyPct = Math.round((config.share_company_ratio ?? 0.5) * 100);
  const sharePartnerPct = Math.round((config.share_partner_ratio ?? 0.5) * 100);

  return {
    totalInvestment: results.totalInvestment,
    rpsEquityRatio: rps.equityRatio,
    facLoanRatio: fac.loanRatio,
    rpsInterestRate: rps.interestRate,
    facInterestRate: fac.interestRate,
    rpsGracePeriod: rps.gracePeriod,
    rpsRepaymentPeriod: rps.repaymentPeriod,
    facGracePeriod: fac.gracePeriod,
    facRepaymentPeriod: fac.repaymentPeriod,
    recAveragePrice: store.recAveragePrice,
    displayedAnnualGross,
    displayedAnnualNet,
    annualMaintenanceCost: results.annualMaintenanceCost,
    rentalRevenueYr: results.rental_revenue_yr,
    subRevenueYr: results.sub_revenue_yr,
    shareRevenuePartnerYr: results.share_revenue_partner_yr,
    shareRevenuePartnerAfterYr: results.share_revenue_partner_after_yr,
    shareRevenueAvgYr: results.share_revenue_avg_yr,
    shareRecCount: results.share_rec_count,
    shareRecAnnual: results.share_rec_annual,
    shareTransferYears: results.share_transfer_years,
    rpsInterestOnly: results.rps_interest_only,
    rpsPmt: results.rps_pmt,
    facInterestOnly: results.fac_interest_only,
    facPmt: results.fac_pmt,
    rpsNet15: results.rps_net_1_5,
    rpsNet615: results.rps_net_6_15,
    facNet1: results.fac_net_1,
    facNet210: results.fac_net_2_10,
    rec1000Common: results.rec_1000_common,
    rec1000Rent: results.rec_1000_rent,
    rec1000Sub: results.rec_1000_sub,
    recAnnualCommon: results.rec_annual_common,
    recAnnualRent: results.rec_annual_rent,
    recAnnualSub: results.rec_annual_sub,
    selfFinalProfit: results.self_final_profit,
    rpsFinalProfit: results.rps_final_profit,
    facFinalProfit: results.fac_final_profit,
    rentalFinalProfit: results.rental_final_profit,
    subFinalProfit: results.sub_final_profit,
    shareFinalProfitPartner: results.share_final_profit_partner,
    selfAvg: results.self_final_profit / 20,
    rpsAvg: results.rps_final_profit / 20,
    facAvg: results.fac_final_profit / 20,
    rentalFinalProfitOver20: results.rental_final_profit / 20,
    subFinalProfitOver20: results.sub_final_profit / 20,
    selfRoiYears: results.self_roi_years,
    rpsRoiYears: results.rps_roi_years,
    facRoiYears: results.fac_roi_years,
    shareCompanyPct,
    sharePartnerPct,
    showRentSub,
    fileName: store.getProposalFileName(),
    pageNumber: 8,
  };
}

function buildPage9Data(store: ProposalState): Page9Data {
  return {
    loanRateRps: store.config.loan_rate_rps,
    loanRateFactoring: store.config.loan_rate_factoring,
    showRentSub: !store.isEcSelfConsumption,
    fileName: store.getProposalFileName(),
    pageNumber: 9,
  };
}

/** 전체 PDF 데이터 빌드 (캡처 없이 native 컴포넌트 기반) */
function buildAllPdfData(store: ProposalState): MyEnergyPdfData {
  return {
    page1: buildPage1Data(store),
    page2: buildPage2Data(store),
    page3: buildPage3Data(store),
    page4: buildPage4Data(store),
    page5: buildPage5Data(store),
    page6: buildPage6Data(store),
    page7: buildPage7Data(store),
    page8: buildPage8Data(store),
    page9: buildPage9Data(store),
    hydrogenMode: store.showHydrogen,
  };
}

/**
 * 페이지 3~7 의 웹 미리보기 화면을 html2canvas-pro 로 캡처해
 * { dataUrl, width, height } 맵으로 반환. 캡처 실패한 페이지는 undefined → native 폴백.
 */
async function captureSections(): Promise<MyEnergyPdfData['captures']> {
  if (typeof window === 'undefined') return {};
  const html2canvas = (await import('html2canvas-pro')).default;
  const pages: Array<keyof NonNullable<MyEnergyPdfData['captures']>> = [
    'page3',
    'page4',
    'page5',
    'page6',
    'page7',
  ];
  const result: NonNullable<MyEnergyPdfData['captures']> = {};

  for (const key of pages) {
    const n = key.replace('page', '');
    const el = document.querySelector<HTMLElement>(
      `[data-pdf-section="${n}"]`
    );
    if (!el) continue;
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        logging: false,
      });
      result[key] = {
        dataUrl: canvas.toDataURL('image/png'),
        width: canvas.width,
        height: canvas.height,
      };
    } catch (err) {
      console.warn(`[PDF] page ${n} 캡처 실패 — native 폴백`, err);
    }
  }
  return result;
}

// ----------------------------------------------------------------
// 미리보기 모달
// ----------------------------------------------------------------
interface PdfPreviewModalProps {
  data: MyEnergyPdfData;
  pdfDocument: React.ReactElement<DocumentProps>;
  onClose: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({
  data,
  pdfDocument,
  onClose,
}) => {
  // ESC 키로 닫기
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    // 모달 열려 있는 동안 body 스크롤 차단
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4 no-print"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-2xl w-full max-w-[1200px] h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 상단 바 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <LucideEye size={18} className="text-cyan-700" />
            <h3 className="font-bold text-slate-800 text-sm">
              PDF 미리보기 — {data.page1.fileName}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <PDFDownloadLink
              document={pdfDocument}
              fileName={`${data.page1.fileName}.pdf`}
              className="flex items-center gap-1 bg-cyan-700 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-cyan-800 transition shadow-sm"
            >
              {({ loading }) =>
                loading ? (
                  <>
                    <LucideLoader2 size={14} className="animate-spin" />
                    준비 중...
                  </>
                ) : (
                  <>
                    <LucideDownload size={14} />
                    PDF 다운로드
                  </>
                )
              }
            </PDFDownloadLink>
            <button
              onClick={onClose}
              className="flex items-center gap-1 bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-bold hover:bg-slate-300 transition"
              aria-label="미리보기 닫기"
            >
              <LucideX size={14} />
              닫기
            </button>
          </div>
        </div>

        {/* 미리보기 본문 */}
        <div className="flex-1 bg-slate-100 overflow-hidden">
          <PDFViewer width="100%" height="100%" showToolbar={false}>
            {pdfDocument}
          </PDFViewer>
        </div>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------
// 본체 버튼
// ----------------------------------------------------------------
const PdfPreviewButtonInner: React.FC = () => {
  const store = useProposalStore();
  const [data, setData] = useState<MyEnergyPdfData | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const prepareAndOpen = useCallback(async () => {
    setIsCapturing(true);
    try {
      const base = buildAllPdfData(store);
      const captures = store.showHydrogen ? {} : await captureSections();
      setData({ ...base, captures });
      setShowModal(true);
    } finally {
      setIsCapturing(false);
    }
  }, [store]);

  const pdfDocument = useMemo(
    () => (data ? <MyEnergyPdfDocument data={data} /> : null),
    [data]
  );

  return (
    <>
      <button
        onClick={prepareAndOpen}
        disabled={isCapturing}
        className="flex items-center gap-1 bg-cyan-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-cyan-700 transition shadow-sm no-print disabled:opacity-60"
        title="9 페이지 전체 PDF를 팝업 미리보기로 확인 후 다운로드"
      >
        {isCapturing ? (
          <>
            <LucideLoader2 size={16} className="animate-spin" /> 캡처 중...
          </>
        ) : (
          <>
            <LucideEye size={16} /> PDF 미리보기
          </>
        )}
      </button>

      {showModal && data && pdfDocument && (
        <PdfPreviewModal
          data={data}
          pdfDocument={pdfDocument}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export const PdfPreviewButton = React.memo(PdfPreviewButtonInner);
