'use client';

import React from 'react';
import { useProposalStore } from '../lib/store';
import styles from './Step5_Comparison.module.css';
import { LucideCheckCircle2, LucideBriefcase } from 'lucide-react';

// [Helper] PMT 함수
const PMT = (rate: number, nper: number, pv: number) => {
  if (rate === 0) return -pv / nper;
  const pvif = Math.pow(1 + rate, nper);
  return (rate * pv * pvif) / (pvif - 1);
};

// [Helper] 천원 단위 변환 + 콤마
const toCheon = (val: number) => Math.round(val / 1000).toLocaleString();

export default function Step5_Comparison() {
  const store = useProposalStore();
  const { config, rationalization } = store;

  // ----------------------------------------------------------------
  // 1. 기초 데이터 및 모델별 계산
  // ----------------------------------------------------------------
  const totalInvestment = store.totalInvestment * 100000000;

  // [발전량/소비량] (365일 기준)
  // Step3에서 이미 2025년(평년) 기준으로 계산된 데이터를 사용합니다.
  const initialAnnualGen = store.monthlyData.reduce((acc, cur) => {
    // 혹시 모를 오차 방지를 위해 여기서도 2025년(평년) 기준 일수 사용
    const days = new Date(2025, cur.month, 0).getDate();
    const autoGen = store.capacityKw * 3.64 * days;
    const gen = cur.solarGeneration > 0 ? cur.solarGeneration : autoGen;
    return acc + gen;
  }, 0);

  const annualSelf = store.monthlyData.reduce(
    (acc, cur) => acc + cur.selfConsumption,
    0
  );
  // 잉여전력
  const annualSurplus = Math.max(0, initialAnnualGen - annualSelf);

  // [합리화 절감액]
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

  // [발전 기반 수익]
  const unitPriceSavings = store.unitPriceSavings || config.unit_price_savings;
  const sellPrice = config.unit_price_ec_1_5;
  const revenue_saving =
    Math.min(initialAnnualGen, annualSelf) * unitPriceSavings;
  let revenue_sales = 0;

  const useEcReal = store.useEc && store.selectedModel !== 'KEPCO';
  if (useEcReal) {
    revenue_sales = annualSurplus * sellPrice;
  } else {
    revenue_sales = annualSurplus * config.unit_price_kepco;
  }

  // 기본 연간 매출 (365일 기준 고정)
  const baseGenRevenue = revenue_saving + revenue_sales;

  // 1차년도 총 영업이익
  const annualGrossRevenue = baseGenRevenue + totalRationalizationSavings;
  const annualMaintenanceCost =
    (annualGrossRevenue * store.maintenanceRate) / 100 +
    (useEcReal ? config.price_labor_ec * 100000000 : 0);
  const annualOperatingProfit = annualGrossRevenue - annualMaintenanceCost;

  // ==========================================================================
  // [A] 자가자본 (20년 시뮬레이션 - 윤년 로직 제거, 365일 고정)
  // ==========================================================================
  const self_equity = totalInvestment;
  let self_total_20y = 0;

  let currentGenRatio = 1; // 발전효율

  for (let i = 0; i < 20; i++) {
    // [수정] 윤년 보정(leapFactor) 제거 -> 매년 365일 기준 동일 적용
    const yearGenRevenue = baseGenRevenue * currentGenRatio;

    // 전체 매출
    const yrRev = yearGenRevenue + totalRationalizationSavings;

    // 비용 차감
    const yrCost =
      (yrRev * store.maintenanceRate) / 100 +
      (useEcReal ? config.price_labor_ec * 100000000 : 0);

    self_total_20y += yrRev - yrCost;

    // 다음 해 효율 감소
    currentGenRatio *= 1 - store.degradationRate / 100;
  }
  const self_final_profit = self_total_20y;

  // ==========================================================================
  // [B] RPS
  // ==========================================================================
  const rps_rate = config.loan_rate_rps / 100;
  const rps_loan = totalInvestment * 0.8;
  const rps_equity = totalInvestment * 0.2;

  const rps_interest_only = rps_loan * rps_rate;
  const rps_pmt = PMT(rps_rate, 10, -rps_loan);

  const rps_net_1_5 = annualOperatingProfit - rps_interest_only;
  const rps_net_6_15 = annualOperatingProfit + rps_pmt;

  const rps_final_profit =
    self_final_profit - rps_interest_only * 5 - Math.abs(rps_pmt) * 10;

  // ==========================================================================
  // [C] 팩토링
  // ==========================================================================
  const fac_rate = config.loan_rate_factoring / 100;
  const fac_loan = totalInvestment;
  const fac_equity = 0;

  const fac_interest_only = fac_loan * fac_rate;
  const fac_pmt = PMT(fac_rate, 9, -fac_loan);

  const fac_net_1 = annualOperatingProfit - fac_interest_only;
  const fac_net_2_10 = annualOperatingProfit + fac_pmt;

  const fac_final_profit =
    self_final_profit - fac_interest_only * 1 - Math.abs(fac_pmt) * 9;

  // ==========================================================================
  // [D] 임대형
  // ==========================================================================
  // [수정] 365일 고정 공식 적용
  const rental_revenue_part1 =
    store.capacityKw * 0.2 * config.unit_price_kepco * 3.64 * 365;

  const rental_revenue_part2 =
    store.capacityKw * 0.8 * config.rental_price_per_kw;

  const rental_revenue_yr = rental_revenue_part1 + rental_revenue_part2;
  const rental_final_profit = rental_revenue_yr * 20;

  // ==========================================================================
  // [E] 구독형
  // ==========================================================================
  const price_standard = 210.5;
  const price_sub_self = config.sub_price_self;
  const price_sub_surplus = config.sub_price_surplus;

  const sub_benefit_savings = annualSelf * (price_standard - price_sub_self);
  const sub_revenue_surplus = annualSurplus * price_sub_surplus;
  const sub_revenue_yr = sub_benefit_savings + sub_revenue_surplus;

  const sub_final_profit = sub_revenue_yr * 20;

  // ==========================================================================
  // [F] 1 REC (1000kW 기준)
  // ==========================================================================
  const CONST_H18 = 80;
  const rec_1000_common = annualOperatingProfit / CONST_H18 / 1000;
  // 임대형 1 REC: (용량 * 0.2 * 3.64 * 365) / 1000 (365일 고정)
  const rec_1000_rent = (store.capacityKw * 0.2 * 3.64 * 365) / 1000;
  const rec_1000_sub = sub_revenue_yr / CONST_H18 / 1000;

  // ----------------------------------------------------------------
  // AI 추천 멘트
  // ----------------------------------------------------------------
  const models = [
    {
      id: 'self',
      name: '자가자본',
      profit: self_final_profit,
      invest: self_equity,
    },
    {
      id: 'rps',
      name: 'RPS 정책자금',
      profit: rps_final_profit,
      invest: rps_equity,
    },
    { id: 'fac', name: '팩토링', profit: fac_final_profit, invest: fac_equity },
    { id: 'rent', name: '임대형', profit: rental_final_profit, invest: 0 },
    { id: 'sub', name: '구독형', profit: sub_final_profit, invest: 0 },
  ];

  const bestProfitModel = models.reduce((prev, current) =>
    prev.profit > current.profit ? prev : current
  );
  const bestNoInvestModel = models
    .filter((m) => m.invest === 0)
    .reduce((prev, current) => (prev.profit > current.profit ? prev : current));
  const profitDiff = bestProfitModel.profit - bestNoInvestModel.profit;

  let aiRecommendation = '';
  if (bestProfitModel.id === 'self') {
    aiRecommendation = `[자가자본 투자] 시 20년 기준 가장 높은 수익(${(
      bestProfitModel.profit / 100000000
    ).toFixed(1)}억원)이 예상됩니다.`;
  } else if (bestProfitModel.invest === 0) {
    aiRecommendation = `현재 조건에서는 투자비가 없는 [${bestProfitModel.name}]이 리스크 없이 가장 안정적인 수익을 보장합니다.`;
  } else {
    aiRecommendation = `금융 레버리지를 활용한 [${bestProfitModel.name}]이 ${(
      bestProfitModel.profit / 100000000
    ).toFixed(1)}억원으로 가장 높은 수익률을 보입니다.`;
  }
  const comparisonText = `(무투자 모델 대비 +${(profitDiff / 100000000).toFixed(
    1
  )}억 이득)`;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <div className={styles.stepBadge}>5</div>
        <h3 className="text-lg font-bold text-slate-800">
          유형별 수익 비교 분석 (Sheet 10)
        </h3>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.compTable}>
          <thead>
            <tr>
              <th className={styles.colLabel}>구분</th>
              <th className={styles.colSelf}>
                자가자본
                <br />
                <span className={styles.subText}>(전액투자)</span>
              </th>
              <th className={styles.colRps}>
                RPS 정책자금
                <br />
                <span className={styles.subText}>{config.loan_rate_rps}%</span>
              </th>
              <th className={styles.colFac}>
                팩토링
                <br />
                <span className={styles.subText}>
                  {config.loan_rate_factoring}%
                </span>
              </th>
              <th className={styles.colRental}>
                임대형
                <br />
                <span className={styles.subText}>부지임대</span>
              </th>
              <th className={styles.colSub}>
                구독형
                <br />
                <span className={styles.subText}>서비스</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {/* 1. 초기 투자비 */}
            <tr>
              <td className={styles.rowHeader}>초기 투자비</td>
              <td className={styles.valBold}>
                {toCheon(totalInvestment)} 천원
                <br />
                <span className="text-[10px] text-blue-300">(자부담 100%)</span>
              </td>
              <td className={styles.val}>
                {toCheon(totalInvestment)} 천원
                <br />
                <span className="text-[10px] text-blue-600">
                  (자부담 20% : {toCheon(rps_equity)})
                </span>
              </td>
              <td className={styles.val}>
                {toCheon(totalInvestment)} 천원
                <br />
                <span className="text-[10px] text-blue-600">(자부담 0%)</span>
              </td>
              <td className={styles.val}>-</td>
              <td className={styles.val}>-</td>
            </tr>

            {/* 2. 연간 수입 (Gross) */}
            <tr className={styles.rowGroupStart}>
              <td className={styles.rowHeader}>연간 수입 (Gross)</td>
              <td className={styles.val}>{toCheon(annualGrossRevenue)} 천원</td>
              <td className={styles.val}>{toCheon(annualGrossRevenue)} 천원</td>
              <td className={styles.val}>{toCheon(annualGrossRevenue)} 천원</td>
              <td className={styles.val}>{toCheon(rental_revenue_yr)} 천원</td>
              <td className={styles.val}>{toCheon(sub_revenue_yr)} 천원</td>
            </tr>

            {/* 2-1. O&M 비용 */}
            <tr className={styles.rowDetail}>
              <td className={styles.rowLabel}>O&M (유지보수비)</td>
              <td className={styles.valRed}>
                -{toCheon(annualMaintenanceCost)} 천원
              </td>
              <td className={styles.valRed}>
                -{toCheon(annualMaintenanceCost)} 천원
              </td>
              <td className={styles.valRed}>
                -{toCheon(annualMaintenanceCost)} 천원
              </td>
              <td className={styles.val}>-</td>
              <td className={styles.val}>-</td>
            </tr>

            {/* 2-2. 연간 영업 이익 (Net) */}
            <tr className="bg-blue-50 font-bold border-b border-blue-100">
              <td className={styles.rowLabel} style={{ color: '#1e40af' }}>
                연간 영업이익 (Net)
              </td>
              <td className={styles.valBlue}>
                {toCheon(annualOperatingProfit)} 천원
              </td>
              <td className={styles.valBlue}>
                {toCheon(annualOperatingProfit)} 천원
              </td>
              <td className={styles.valBlue}>
                {toCheon(annualOperatingProfit)} 천원
              </td>
              <td className={styles.val}>{toCheon(rental_revenue_yr)} 천원</td>
              <td className={styles.val}>{toCheon(sub_revenue_yr)} 천원</td>
            </tr>

            {/* 3. 금융 비용 */}
            <tr className={styles.rowDetail}>
              <td className={styles.rowLabel}>RPS / 연 이자 (1~5년)</td>
              <td>-</td>
              <td className={styles.valRed}>-{toCheon(rps_interest_only)}</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr className={styles.rowDetail}>
              <td className={styles.rowLabel}>RPS / 연 상환액 (6~15년)</td>
              <td>-</td>
              <td className={styles.valRed}>-{toCheon(Math.abs(rps_pmt))}</td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr className={styles.rowDetail}>
              <td className={styles.rowLabel}>팩토링 / 연 이자 (1년)</td>
              <td>-</td>
              <td>-</td>
              <td className={styles.valRed}>-{toCheon(fac_interest_only)}</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr className={styles.rowDetail}>
              <td className={styles.rowLabel}>팩토링 / 연 상환액 (2~10년)</td>
              <td>-</td>
              <td>-</td>
              <td className={styles.valRed}>-{toCheon(Math.abs(fac_pmt))}</td>
              <td>-</td>
              <td>-</td>
            </tr>

            {/* 4. 최종 현금 흐름 (Net Cash Flow) */}
            <tr className={styles.rowGroupStart}>
              <td className={styles.rowLabel}>RPS / 순수익 (1~5년)</td>
              <td className={styles.val}>-</td>
              <td className={styles.valBlue}>{toCheon(rps_net_1_5)}</td>
              <td className={styles.val}>-</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr className={styles.rowDetail}>
              <td className={styles.rowLabel}>RPS / 순수익 (6~15년)</td>
              <td className={styles.val}>-</td>
              <td className={styles.valBlue}>{toCheon(rps_net_6_15)}</td>
              <td className={styles.val}>-</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr className={styles.rowDetail}>
              <td className={styles.rowLabel}>팩토링 / 순수익 (1년)</td>
              <td className={styles.val}>-</td>
              <td className={styles.val}>-</td>
              <td className={styles.valBlue}>{toCheon(fac_net_1)}</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr className={styles.rowDetail}>
              <td className={styles.rowLabel}>팩토링 / 순수익 (2~10년)</td>
              <td className={styles.val}>-</td>
              <td className={styles.val}>-</td>
              <td className={styles.valBlue}>{toCheon(fac_net_2_10)}</td>
              <td>-</td>
              <td>-</td>
            </tr>

            {/* 1 REC */}
            <tr className="bg-yellow-50 font-bold">
              <td className={styles.rowHeader}>1 REC (1000kW)</td>
              <td className={styles.val}>{rec_1000_common.toFixed(2)}</td>
              <td className={styles.val}>{rec_1000_common.toFixed(2)}</td>
              <td className={styles.val}>{rec_1000_common.toFixed(2)}</td>
              <td className={styles.val}>{rec_1000_rent.toFixed(2)}</td>
              <td className={styles.val}>{rec_1000_sub.toFixed(2)}</td>
            </tr>

            {/* 5. 최종 결과 (20년 누적) */}
            <tr className={styles.rowTotal}>
              <td>실제 수익 (20년)</td>
              <td>{(self_final_profit / 100000000).toFixed(2)} 억원</td>
              <td>{(rps_final_profit / 100000000).toFixed(2)} 억원</td>
              <td>{(fac_final_profit / 100000000).toFixed(2)} 억원</td>
              <td>{(rental_final_profit / 100000000).toFixed(2)} 억원</td>
              <td>{(sub_final_profit / 100000000).toFixed(2)} 억원</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg flex items-start gap-3 shadow-sm">
        <LucideCheckCircle2 className="text-indigo-600 mt-1" size={24} />
        <div>
          <h4 className="font-bold text-indigo-900 text-sm mb-1 flex items-center gap-2">
            <LucideBriefcase size={16} /> AI 투자 분석 리포트
          </h4>
          <p className="text-sm text-indigo-800 leading-relaxed">
            {aiRecommendation}{' '}
            <span className="text-xs text-indigo-500 block mt-1">
              {comparisonText}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
