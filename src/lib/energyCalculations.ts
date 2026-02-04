import { MonthlyData, SystemConfig } from './store';

export interface MonthlyComputedRow extends MonthlyData {
  solarGeneration: number;
  autoSolarGen: number;
  surplusPower: number;
  maxLoadSavings: number;
  baseBillSavings: number;
  totalSavings: number;
  afterBill: number;
  surplusRevenue: number;
}

export interface MonthlyTotals {
  usageKwh: number;
  selfConsumption: number;
  solarGeneration: number;
  surplusPower: number;
  totalBill: number;
  baseBill: number;
  maxLoadSavings: number;
  baseBillSavings: number;
  totalSavings: number;
  afterBill: number;
  surplusRevenue: number;
}

export interface MonthlyMetrics {
  computedData: MonthlyComputedRow[];
  totals: MonthlyTotals;
  savingRate: number;
  customSavingRate: number;
  maxLoadRatio: number;
  totalBenefit: number;
  dynamicPeakRatio: number;
}

type MonthlyMetricsParams = {
  monthlyData: MonthlyData[];
  capacityKw: number;
  baseRate: number;
  unitPriceSavings?: number;
  config: SystemConfig;
  roundAutoGeneration?: boolean;
};

const getDaysInMonth = (month: number, year?: number) =>
  new Date(year ?? 2025, month, 0).getDate();

export function computeMonthlyEnergyMetrics({
  monthlyData,
  capacityKw,
  baseRate,
  unitPriceSavings,
  config,
  roundAutoGeneration = false,
}: MonthlyMetricsParams): MonthlyMetrics {
  const solarRadiation = config.solar_radiation || 3.8;
  const totalUsageYear = monthlyData.reduce(
    (acc, cur) => acc + cur.usageKwh,
    0
  );
  const totalSelfYear = monthlyData.reduce(
    (acc, cur) => acc + cur.selfConsumption,
    0
  );
  const dynamicPeakRatio =
    totalUsageYear > 0 ? totalSelfYear / totalUsageYear : 0;

  const appliedUnitPriceSavings =
    unitPriceSavings ?? config.unit_price_savings ?? 0;
  const unitPriceSell = config.unit_price_kepco || 0;

  const computedData = monthlyData.map((data) => {
    const days = getDaysInMonth(data.month, data.year);
    const autoSolarGenRaw = capacityKw * solarRadiation * days;
    const autoSolarGen = roundAutoGeneration
      ? Math.round(autoSolarGenRaw)
      : autoSolarGenRaw;
    const solarGeneration =
      data.solarGeneration > 0 ? data.solarGeneration : autoSolarGen;
    const surplusPower = Math.max(0, solarGeneration - data.selfConsumption);
    const maxLoadSavings =
      Math.min(solarGeneration, data.selfConsumption) * appliedUnitPriceSavings;

    let baseBillSavings = 0;
    if (data.peakKw > 0) {
      baseBillSavings = Math.max(0, data.baseBill - baseRate * data.peakKw);
    } else {
      baseBillSavings = data.baseBill * dynamicPeakRatio;
    }

    const totalSavings = maxLoadSavings + baseBillSavings;
    const afterBill = Math.max(0, data.totalBill - totalSavings);
    const surplusRevenue = surplusPower * unitPriceSell;

    return {
      ...data,
      solarGeneration,
      autoSolarGen,
      surplusPower,
      maxLoadSavings,
      baseBillSavings,
      totalSavings,
      afterBill,
      surplusRevenue,
    };
  });

  const totals = computedData.reduce<MonthlyTotals>(
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

  const customSavingRate =
    totals.totalBill > 0
      ? ((totals.totalBill - totals.totalSavings) / totals.totalBill) * 100
      : 0;

  const maxLoadRatio =
    totalUsageYear > 0 ? (totalSelfYear / totalUsageYear) * 100 : 0;

  const totalBenefit = totals.totalSavings + totals.surplusRevenue;

  return {
    computedData,
    totals,
    savingRate,
    customSavingRate,
    maxLoadRatio,
    totalBenefit,
    dynamicPeakRatio,
  };
}
