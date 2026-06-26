/**
 * 페이지 6 (시간대별 차트) 용 hourly data 생성기.
 * PreviewModelVisual.tsx의 useChartData 로직을 함수로 추출.
 */
import type { ProposalState } from '../../lib/store';

export interface HourlyPoint {
  hour: number;
  usage: number;
  generation: number;
  surplusVal: number;
  ecDischarge: number;
}

export function buildHourlyData(
  store: ProposalState
): { hourly: HourlyPoint[]; isEcActive: boolean } {
  const config = store.activeConfig ?? store.config;
  const solarRadiation = config.solar_radiation || 3.8;

  const initialAnnualGen = store.monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + store.capacityKw * solarRadiation * days;
  }, 0);

  const totalSelf = store.monthlyData.reduce(
    (acc, cur) => acc + cur.selfConsumption,
    0
  );

  const dailyGenAvg = initialAnnualGen / 365;
  const dailySelfAvg = totalSelf / 365;

  const solarPattern = [
    0, 0, 0, 0, 0, 0, 0.02, 0.08, 0.15, 0.22, 0.26, 0.28, 0.26, 0.22, 0.15,
    0.08, 0.02, 0, 0, 0, 0, 0, 0, 0,
  ];
  const solarSum = solarPattern.reduce((a, b) => a + b, 0);
  const usagePattern = [
    0.03, 0.03, 0.03, 0.03, 0.04, 0.05, 0.07, 0.09, 0.1, 0.1, 0.1, 0.1, 0.1,
    0.1, 0.1, 0.1, 0.09, 0.07, 0.06, 0.05, 0.04, 0.04, 0.03, 0.03,
  ];
  const usageSum = usagePattern.reduce((a, b) => a + b, 0);

  let dailyTotalSurplus = 0;
  const tempData: HourlyPoint[] = Array.from({ length: 24 }, (_, hour) => {
    const generation = (solarPattern[hour] * dailyGenAvg) / solarSum;
    let usage = (usagePattern[hour] * dailySelfAvg) / usageSum;
    if (generation > 0 && usage > generation) usage = generation * 0.95;
    const surplusVal = Math.max(0, generation - usage);
    dailyTotalSurplus += surplusVal;
    return { hour, usage, generation, surplusVal, ecDischarge: 0 };
  });

  const isEcActive =
    (store.useEc || store.isEcSelfConsumption) &&
    store.selectedModel !== 'KEPCO';

  if (isEcActive) {
    let remaining = dailyTotalSurplus;
    for (let i = 16; i < 24; i++) {
      const deficit = Math.max(0, tempData[i].usage - tempData[i].generation);
      if (deficit > 0 && remaining > 0) {
        const d = Math.min(deficit, remaining);
        tempData[i].ecDischarge = d;
        remaining -= d;
      }
    }
    for (let i = 0; i < 10; i++) {
      const deficit = Math.max(0, tempData[i].usage - tempData[i].generation);
      if (deficit > 0 && remaining > 0) {
        const d = Math.min(deficit, remaining);
        tempData[i].ecDischarge = d;
        remaining -= d;
      }
    }
  }

  return { hourly: tempData, isEcActive };
}
