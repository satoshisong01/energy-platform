'use client';

import React from 'react';
import { useProposalStore } from '../lib/store';
import styles from './Step5_Comparison.module.css';
import { LucideCheckCircle2, LucideBriefcase } from 'lucide-react';

// [Helper] 원 단위 변환 (반올림 + 콤마)
const toWon = (val: number) => Math.round(val).toLocaleString();

export default function Step5_Comparison() {
  const store = useProposalStore();
  const { config } = store;

  // [핵심] 중앙 계산 로직 호출
  const results = store.getSimulationResults();

  // 20년 수익 평균치 계산
  const self_avg = results.self_final_profit / 20;
  const rps_avg = results.rps_final_profit / 20;
  const fac_avg = results.fac_final_profit / 20;

  // AI 분석 멘트 생성
  const models = [
    {
      id: 'self',
      name: '자가자본',
      profit: results.self_final_profit,
      invest: results.totalInvestment,
    },
    {
      id: 'rps',
      name: 'RPS 정책자금',
      profit: results.rps_final_profit,
      invest: results.rps_equity,
    },
    { id: 'fac', name: '팩토링', profit: results.fac_final_profit, invest: 0 },
    {
      id: 'rent',
      name: '임대형',
      profit: results.rental_final_profit,
      invest: 0,
    },
    { id: 'sub', name: '구독형', profit: results.sub_final_profit, invest: 0 },
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
    aiRecommendation = `현재 조건에서는 투자비가 없는 [${bestProfitModel.name}]이 리스크 없이 안정적입니다.`;
  } else {
    aiRecommendation = `[${bestProfitModel.name}] 모델이 ${(
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
                {toWon(results.totalInvestment)} 원
                <br />
                <span className="text-[10px] text-blue-300">(자부담 100%)</span>
              </td>
              <td className={styles.val}>
                {toWon(results.totalInvestment)} 원
                <br />
                <span className="text-[10px] text-blue-600">(자부담 20%)</span>
              </td>
              <td className={styles.val}>
                {toWon(results.totalInvestment)} 원
                <br />
                <span className="text-[10px] text-blue-600">(자부담 0%)</span>
              </td>
              <td className={styles.val}>-</td>
              <td className={styles.val}>-</td>
            </tr>

            {/* 2. 연간 수입 (Gross) */}
            <tr className={styles.rowGroupStart}>
              <td className={styles.rowHeader}>연간 수입 (Gross)</td>
              <td className={styles.val}>
                {toWon(results.annualGrossRevenue)} 원
              </td>
              <td className={styles.val}>
                {toWon(results.annualGrossRevenue)} 원
              </td>
              <td className={styles.val}>
                {toWon(results.annualGrossRevenue)} 원
              </td>
              <td className={styles.val}>
                {toWon(results.rental_revenue_yr)} 원
              </td>
              <td className={styles.val}>{toWon(results.sub_revenue_yr)} 원</td>
            </tr>

            {/* O&M */}
            <tr>
              <td className={styles.rowLabel}>O&M (유지보수비)</td>
              <td className={styles.valRed}>
                -{toWon(results.annualMaintenanceCost)} 원
              </td>
              <td className={styles.valRed}>
                -{toWon(results.annualMaintenanceCost)} 원
              </td>
              <td className={styles.valRed}>
                -{toWon(results.annualMaintenanceCost)} 원
              </td>
              <td className={styles.val}>-</td>
              <td className={styles.val}>-</td>
            </tr>

            {/* 3. 연간 영업 이익 (Net) */}
            <tr className="bg-blue-50">
              <td className={styles.rowHeader} style={{ color: '#1e40af' }}>
                연간 영업이익(Net)
              </td>
              <td className={styles.valBlue}>
                {toWon(results.annualOperatingProfit)} 원
              </td>
              <td className={styles.valBlue}>
                {toWon(results.annualOperatingProfit)} 원
              </td>
              <td className={styles.valBlue}>
                {toWon(results.annualOperatingProfit)} 원
              </td>
              <td className={styles.val}>
                {toWon(results.rental_revenue_yr)} 원
              </td>
              <td className={styles.val}>{toWon(results.sub_revenue_yr)} 원</td>
            </tr>

            {/* 4. 금융 비용 및 구간별 수익 */}
            <tr>
              <td className={styles.rowLabel}>RPS / 연 이자 (1~5년)</td>
              <td>-</td>
              <td className={styles.valRed}>
                -{toWon(results.rps_interest_only)} 원
              </td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr>
              <td className={styles.rowLabel}>RPS / 연 상환액 (6~15년)</td>
              <td>-</td>
              <td className={styles.valRed}>
                -{toWon(Math.abs(results.rps_pmt))} 원
              </td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr>
              <td className={styles.rowLabel}>팩토링 / 연 이자 (1년)</td>
              <td>-</td>
              <td>-</td>
              <td className={styles.valRed}>
                -{toWon(results.fac_interest_only)} 원
              </td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr>
              <td className={styles.rowLabel}>팩토링 / 연 상환액 (2~10년)</td>
              <td>-</td>
              <td>-</td>
              <td className={styles.valRed}>
                -{toWon(Math.abs(results.fac_pmt))} 원
              </td>
              <td>-</td>
              <td>-</td>
            </tr>

            {/* 순수익 구간 */}
            <tr className={styles.rowGroupStart}>
              <td className={styles.rowLabel}>RPS / 순수익 (1~5년)</td>
              <td>-</td>
              <td className={styles.valBlue}>
                {toWon(results.rps_net_1_5)} 원
              </td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr>
              <td className={styles.rowLabel}>RPS / 순수익 (6~15년)</td>
              <td>-</td>
              <td className={styles.valBlue}>
                {toWon(results.rps_net_6_15)} 원
              </td>
              <td>-</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr>
              <td className={styles.rowLabel}>팩토링 / 순수익 (1년)</td>
              <td>-</td>
              <td>-</td>
              <td className={styles.valBlue}>{toWon(results.fac_net_1)} 원</td>
              <td>-</td>
              <td>-</td>
            </tr>
            <tr>
              <td className={styles.rowLabel}>팩토링 / 순수익 (2~10년)</td>
              <td>-</td>
              <td>-</td>
              <td className={styles.valBlue}>
                {toWon(results.fac_net_2_10)} 원
              </td>
              <td>-</td>
              <td>-</td>
            </tr>

            {/* 1 REC */}
            <tr className="bg-yellow-50 font-bold">
              <td className={styles.rowHeader}>1 REC (1000kW)</td>
              <td className={styles.val}>
                {results.rec_1000_common.toFixed(2)}
              </td>
              <td className={styles.val}>
                {results.rec_1000_common.toFixed(2)}
              </td>
              <td className={styles.val}>
                {results.rec_1000_common.toFixed(2)}
              </td>
              <td className={styles.val}>{results.rec_1000_rent.toFixed(2)}</td>
              <td className={styles.val}>{results.rec_1000_sub.toFixed(2)}</td>
            </tr>

            {/* [NEW] REC 수익/연간 */}
            <tr className="bg-white border-b-2 border-slate-300 font-bold">
              <td className={styles.rowHeader} style={{ color: '#1d4ed8' }}>
                REC수익/연간
              </td>
              <td className={styles.val} style={{ fontSize: '0.8rem' }}>
                {toWon(results.rec_annual_common)} 원
              </td>
              <td className={styles.val} style={{ fontSize: '0.8rem' }}>
                {toWon(results.rec_annual_common)} 원
              </td>
              <td className={styles.val} style={{ fontSize: '0.8rem' }}>
                {toWon(results.rec_annual_common)} 원
              </td>
              <td className={styles.val} style={{ fontSize: '0.8rem' }}>
                {toWon(results.rec_annual_rent)} 원
              </td>
              <td className={styles.val} style={{ fontSize: '0.8rem' }}>
                {toWon(results.rec_annual_sub)} 원
              </td>
            </tr>

            {/* 5. 최종 결과 (20년 누적) */}
            <tr className={styles.rowTotal}>
              <td>실제 수익 (20년)</td>
              <td>{(results.self_final_profit / 100000000).toFixed(2)} 억원</td>
              <td>{(results.rps_final_profit / 100000000).toFixed(2)} 억원</td>
              <td>{(results.fac_final_profit / 100000000).toFixed(2)} 억원</td>
              <td>
                {(results.rental_final_profit / 100000000).toFixed(2)} 억원
              </td>
              <td>{(results.sub_final_profit / 100000000).toFixed(2)} 억원</td>
            </tr>

            {/* [NEW] 20년 수익 평균치 */}
            <tr className="bg-slate-100 text-sm">
              <td className={styles.rowLabel}>20년 수익 평균치</td>
              <td className={styles.val}>{toWon(self_avg)} 원</td>
              <td className={styles.val}>{toWon(rps_avg)} 원</td>
              <td className={styles.val}>{toWon(fac_avg)} 원</td>
              <td>-</td>
              <td>-</td>
            </tr>

            {/* ROI */}
            <tr className="bg-slate-200 font-bold text-slate-800 text-sm">
              <td className={styles.rowLabel}>ROI (회수기간)</td>
              <td className={styles.val}>
                {results.self_roi_years.toFixed(2)} 년
              </td>
              <td className={styles.val}>
                {results.rps_roi_years.toFixed(2)} 년
              </td>
              <td className={styles.val}>
                {results.fac_roi_years.toFixed(2)} 년
              </td>
              <td>-</td>
              <td>-</td>
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
