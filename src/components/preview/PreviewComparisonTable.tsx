'use client';

import React from 'react';
import { useProposalStore } from '../../lib/store';
import styles from './PreviewComparisonTable.module.css';

// [Helper] 원 단위 변환 (반올림 + 콤마)
const toWon = (val: number) => Math.round(val).toLocaleString();

export default function PreviewComparisonTable() {
  const store = useProposalStore();
  const { config, recAveragePrice, setRecAveragePrice } = store;

  // 스토어에서 계산된 결과 가져오기
  const results = store.getSimulationResults();

  // 20년 수익 평균치 계산
  const self_avg = results.self_final_profit / 20;
  const rps_avg = results.rps_final_profit / 20;
  const fac_avg = results.fac_final_profit / 20;

  return (
    <div className={styles.container}>
      <div
        className={styles.titleWrapper}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <h3 className={styles.title}>5. 금융 모델별 수익성 비교 분석</h3>

        {/* [NEW] REC 평균가격 조정 입력 (인쇄 시 숨김) */}
        <div className="no-print flex items-center gap-2 text-xs bg-yellow-50 px-2 py-1 rounded border border-yellow-200">
          <span className="font-bold text-yellow-800">REC 평균가격:</span>
          <input
            type="number"
            className="w-16 p-1 border rounded text-right font-bold text-slate-700 focus:outline-blue-500"
            value={recAveragePrice}
            onChange={(e) => setRecAveragePrice(Number(e.target.value))}
          />
          <span className="text-slate-500">원</span>
        </div>
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
                <span className="text-[9px] text-blue-300">(자부담 100%)</span>
              </td>
              <td className={styles.val}>
                {toWon(results.totalInvestment)} 원
                <br />
                <span className="text-[9px] text-blue-600">(자부담 20%)</span>
              </td>
              <td className={styles.val}>
                {toWon(results.totalInvestment)} 원
                <br />
                <span className="text-[9px] text-blue-600">(자부담 0%)</span>
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

            {/* 4. 금융 비용 */}
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
            <tr className="bg-blue-50 font-bold">
              <td className={styles.rowHeader}>1 REC (1000kW)</td>
              <td className={styles.val} style={{ color: '#2563eb' }}>
                {results.rec_1000_common.toFixed(1)}
              </td>
              <td className={styles.val} style={{ color: '#2563eb' }}>
                {results.rec_1000_common.toFixed(1)}
              </td>
              <td className={styles.val} style={{ color: '#2563eb' }}>
                {results.rec_1000_common.toFixed(1)}
              </td>
              <td className={styles.val} style={{ color: '#2563eb' }}>
                {results.rec_1000_rent.toFixed(1)}
              </td>
              <td className={styles.val} style={{ color: '#2563eb' }}>
                {results.rec_1000_sub.toFixed(1)}
              </td>
            </tr>

            {/* [수정] REC 수익/연간 - 각각 분리 표시 */}
            <tr className="bg-white border-b-2 border-slate-300 font-bold">
              <td className={styles.rowHeader} style={{ color: '#1d4ed8' }}>
                REC수익/연간
              </td>
              {/* 자가자본 */}
              <td className={styles.val} style={{ fontSize: '0.8rem' }}>
                {toWon(results.rec_annual_common)} 원
              </td>
              {/* RPS 정책자금 */}
              <td className={styles.val} style={{ fontSize: '0.8rem' }}>
                {toWon(results.rec_annual_common)} 원
              </td>
              {/* 팩토링 */}
              <td className={styles.val} style={{ fontSize: '0.8rem' }}>
                {toWon(results.rec_annual_common)} 원
              </td>
              {/* 임대형 */}
              <td className={styles.val} style={{ fontSize: '0.8rem' }}>
                {toWon(results.rec_annual_rent)} 원
              </td>
              {/* 구독형 */}
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

            {/* 20년 수익 평균치 */}
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
    </div>
  );
}
