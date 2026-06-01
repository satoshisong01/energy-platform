/**
 * 시나리오(수익 극대화 비교) 계산 — 웹 미리보기(PreviewSummary)와
 * PDF 페이지 1(PdfPage1Summary)이 동일한 산식을 공유하도록 추출한 순수 모듈.
 *
 * isPremium=false → TYPE A (REC 1.5 / 현행)
 * isPremium=true  → TYPE B (REC 5.0 / 수익 극대화, "REC 5.0 비교" 토글 시 노출)
 *
 * 기존 PreviewSummary 의 인라인 getScenarioData 와 산식 동일.
 */
import type { ProposalState } from './store';

export interface ScenarioSummary {
  title: string;
  invest: number; // 억원
  ecCount: number;
  annualProfit: number; // 억원 (1차년 순수익)
  totalProfit20: number; // 억원 (20년 누적 순수익)
  roiYears: number;
  profitRate: number; // %
  isPro: boolean;
  modelName: string;
}

/** 합리화 절감액(고정) — PreviewSummary.calculateRationalizationSavings 와 동일 */
function calcRationalizationSavings(store: ProposalState): number {
  const { isRationalizationEnabled, contractType, rationalization } = store;
  if (!isRationalizationEnabled) return 0;
  if (!contractType.includes('(을)')) return 0;
  const savingBase = rationalization.base_savings_manual || 0;
  const savingLight =
    (rationalization.light_eul - rationalization.light_gap) *
    rationalization.light_usage;
  const savingMid =
    (rationalization.mid_eul - rationalization.mid_gap) *
    rationalization.mid_usage;
  const savingMax =
    (rationalization.max_eul - rationalization.max_gap) *
    rationalization.max_usage;
  return savingBase + savingLight + savingMid + savingMax;
}

/** 단순 연간 발전량 (일조량 × 용량 × 일수, 365일 평년 기준 월별 합산) */
function calcSimpleAnnualGen(store: ProposalState): number {
  const solarRadiation = store.config.solar_radiation || 3.8;
  return store.monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + store.capacityKw * solarRadiation * days;
  }, 0);
}

/**
 * 수익 시나리오 계산. store 전체 상태를 받아 자기 완결적으로 산정한다.
 */
export function computeScenarioSummary(
  store: ProposalState,
  isPremium: boolean
): ScenarioSummary {
  const { config, isEcSelfConsumption, ecSelfConsumptionCount, isSurplusDiscarded } =
    store;
  const capacity = store.capacityKw;
  const MAX_LIMIT = store.maintenanceCostLimit;

  const simpleAnnualGen = calcSimpleAnnualGen(store);
  const fixedRationalizationSavings = calcRationalizationSavings(store);
  const results = store.getSimulationResults();

  let activeEcCount = 0;
  if (isEcSelfConsumption) {
    activeEcCount = ecSelfConsumptionCount || 1;
  } else if (store.useEc) {
    activeEcCount = store.truckCount > 0 ? store.truckCount : 3;
  }

  const cycles = isEcSelfConsumption ? 1 : 4;
  const ecCapacityAnnual = activeEcCount * 100 * cycles * 365;

  const annualGen = simpleAnnualGen;
  const annualSelf = store.monthlyData.reduce(
    (acc, cur) => acc + cur.selfConsumption,
    0
  );

  const rawSurplus = Math.max(0, annualGen - annualSelf);
  const volume_ec = Math.min(rawSurplus, ecCapacityAnnual);
  const volume_surplus_final = Math.max(0, rawSurplus - volume_ec);

  let targetEcPrice = 0;
  let modelName = '';
  let currentSolarPrice = config.price_solar_standard;
  if (store.moduleTier === 'PREMIUM')
    currentSolarPrice = config.price_solar_premium;
  else if (store.moduleTier === 'ECONOMY')
    currentSolarPrice = config.price_solar_economy;

  if (isEcSelfConsumption) {
    targetEcPrice = config.unit_price_ec_self;
    modelName = isPremium ? 'EC 자가소비 (수익 극대화)' : 'EC 자가소비 (배터리)';
  } else {
    if (isPremium) {
      targetEcPrice = config.unit_price_ec_5_0;
      modelName = 'REC 5.0 (예상)';
    } else {
      targetEcPrice = config.unit_price_ec_1_5;
      modelName = 'REC 1.5 (현행)';
    }
  }

  const revenue_saving =
    Math.min(annualGen, annualSelf) *
    (store.unitPriceSavings || config.unit_price_savings);
  const revenue_ec = volume_ec * targetEcPrice;
  const revenue_surplus = isSurplusDiscarded
    ? 0
    : volume_surplus_final * config.unit_price_kepco;

  // O&M 비율 계산용 매출 (합리화 + 기본료 절감 포함)
  const grossRevenueForOandM =
    revenue_saving +
    revenue_ec +
    revenue_surplus +
    results.revenue_base_bill_savings +
    fixedRationalizationSavings;

  // 태양광 기반 변동 매출 (합리화 제외, 매년 감소 반영용)
  const solarBasedRevenue = revenue_saving + revenue_ec + revenue_surplus;

  const isMovingEcMode = activeEcCount > 0 && !isEcSelfConsumption;
  const laborCostWon = isMovingEcMode ? config.price_labor_ec * 100000000 : 0;

  // 유지보수 비율 결정 (합리화 포함 매출 기준)
  let scenarioMaintenanceRate = 0;
  if (!store.isMaintenanceAuto) {
    scenarioMaintenanceRate = store.maintenanceRate;
  } else {
    const targetBaseRate = isMovingEcMode ? 25.0 : 5.0;
    const maxAvailableForOandM = Math.max(0, MAX_LIMIT - laborCostWon);
    const revenueBasedCapRate =
      grossRevenueForOandM > 0
        ? (maxAvailableForOandM / grossRevenueForOandM) * 100
        : 0;
    scenarioMaintenanceRate = Math.min(targetBaseRate, revenueBasedCapRate);
    scenarioMaintenanceRate = Math.floor(scenarioMaintenanceRate * 100) / 100;
  }

  const maintenanceCost =
    (grossRevenueForOandM * scenarioMaintenanceRate) / 100 + laborCostWon;

  // 1차년도 연간 순수익 (표시용) → 합리화 제외, 기본료 절감 포함
  const annualNetProfitWon =
    solarBasedRevenue + results.revenue_base_bill_savings - maintenanceCost;

  // --- 투자비 계산 ---
  const solarCost = (capacity / 100) * currentSolarPrice;
  const ecCost = activeEcCount * config.price_ec_unit;
  const calculatedPlatformCost = Math.min((capacity / 100) * 0.1, 0.3);

  let infraCost = 0;
  if (isEcSelfConsumption) {
    infraCost = calculatedPlatformCost;
  } else if (store.useEc && activeEcCount > 0) {
    infraCost = config.price_tractor + calculatedPlatformCost;
  }

  const investUk = solarCost + ecCost + infraCost;
  const investWon = investUk * 100000000;

  // --- 20년 수익 상세 계산 ---
  const degradationRateDecimal = -(store.degradationRate / 100);
  const R = 1 + degradationRateDecimal;
  const n = 20;

  const annualRevenueFor20Yr =
    solarBasedRevenue + results.revenue_base_bill_savings;
  const totalSolarRevenue20 =
    (annualRevenueFor20Yr * (1 - Math.pow(R, n))) / (1 - R);
  const totalRationalization20 = fixedRationalizationSavings * 20;
  const totalMaintenance20 = maintenanceCost * 17; // 3년 무상, 17년 유상
  const totalNet20Won =
    totalSolarRevenue20 + totalRationalization20 - totalMaintenance20;

  const totalCost20 = investWon + totalMaintenance20;
  const roiYears = annualNetProfitWon > 0 ? investWon / annualNetProfitWon : 0;
  const profitRate = totalCost20 > 0 ? (totalNet20Won / totalCost20) * 100 : 0;

  return {
    title: isPremium
      ? isEcSelfConsumption
        ? 'TYPE B. EC 자가소비 Plan'
        : 'TYPE B. REC 5.0 Plan'
      : isEcSelfConsumption
      ? 'TYPE A. EC 자가소비 Plan'
      : 'TYPE A. REC 1.5 Plan',
    invest: investUk,
    ecCount: activeEcCount,
    annualProfit: annualNetProfitWon / 100000000,
    totalProfit20: totalNet20Won / 100000000,
    roiYears,
    profitRate,
    isPro: isPremium,
    modelName,
  };
}
