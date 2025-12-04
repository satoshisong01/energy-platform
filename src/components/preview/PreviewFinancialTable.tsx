'use client';

import React from 'react';
import { useProposalStore } from '../../lib/store';
import styles from '../PreviewPanel.module.css';
import { LucideBriefcase, LucideTrendingUp } from 'lucide-react';

type Props = {
  totals: any;
  netProfit: number;
  totalRevenue: number;
  revenueDetails: any;
  totalAnnualCost: number;
  maintenanceCost: number;
  fixedLaborCost: number;
  roiPercent: number;
  roiYears: number;
  totalNetProfit20Years: number;
  investmentDetails: any;
};

// [Helper] 반올림
const round2 = (num: number) => Math.round(num * 100) / 100;

export default function PreviewFinancialTable({
  totals,
  netProfit,
  totalRevenue,
  revenueDetails,
  totalAnnualCost,
  maintenanceCost,
  fixedLaborCost,
  roiPercent,
  roiYears,
  totalNetProfit20Years,
  investmentDetails,
}: Props) {
  const store = useProposalStore();
  const { config } = store;

  // 투자비 계산 데이터 해체
  const {
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
    solarSplit,
    ecSplit,
    tractorSplit,
    platformSplit,
    maintenanceSplit,
  } = investmentDetails;

  return (
    <div className={styles.financialSection}>
      <div className={styles.sectionTitle}>
        <LucideBriefcase size={20} className="text-purple-600" />
        투자 및 수익성 분석 상세
      </div>

      <div className={styles.summaryBox}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>사업 모델</span>
          <span className={styles.summaryValue}>{store.selectedModel}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>모듈 등급</span>
          <span className={styles.summaryValue}>{store.moduleTier}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>EC 운용</span>
          <span className={styles.summaryValue}>
            {useEcReal ? `${ecCount}대` : '미운용'}
          </span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>유지보수율</span>
          <span className={styles.summaryValue}>{store.maintenanceRate}%</span>
        </div>
      </div>

      {/* A. 초기 투자비 테이블 */}
      <table className={styles.finTable}>
        <thead className={styles.bgPurpleHeader}>
          <tr>
            <th>구분</th>
            <th>규격</th>
            <th>수량</th>
            <th>단가(억)</th>
            <th>합계(억)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>태양광</td>
            <td>100 kW</td>
            <td>{solarCount.toFixed(2)}</td>
            <td>{solarPrice}</td>
            <td className={styles.textBold}>{solarCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>에너지캐리어</td>
            <td>100 kW</td>
            <td>{ecCount}</td>
            <td>{config.price_ec_unit}</td>
            <td className={styles.textBold}>{ecCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>이동트랙터</td>
            <td>1 ton</td>
            <td>{tractorCost > 0 ? 1 : 0}</td>
            <td>{config.price_tractor}</td>
            <td className={styles.textBold}>{tractorCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>운영플랫폼</td>
            <td>1 set</td>
            <td>{platformCost > 0 ? 1 : 0}</td>
            <td>{config.price_platform}</td>
            <td className={styles.textBold}>{platformCost.toFixed(2)}</td>
          </tr>
          <tr className={styles.bgTotal}>
            <td colSpan={4} className={styles.textRight}>
              초기 투자비 합계
            </td>
            <td>{totalInitialInvestment.toFixed(2)}</td>
          </tr>
          <tr className={styles.bgTotal} style={{ backgroundColor: '#334155' }}>
            <td colSpan={4} className={styles.textRight}>
              20년 투자총액 (유지보수 포함)
            </td>
            <td>{totalInvestment20Years.toFixed(2)}</td>
          </tr>
        </tbody>
      </table>

      {/* B. 연간 수익 분석 테이블 */}
      <table className={styles.finTable}>
        <thead className={styles.bgBlueHeader}>
          <tr>
            <th>구분</th>
            <th>상세 내역</th>
            <th style={{ width: '100px' }}>물량 (kWh)</th>
            <th>단가 (원)</th>
            <th>금액 (억원)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td rowSpan={3} className={styles.textBold}>
              수익
            </td>
            <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>
              ① 자가소비(최대부하) 절감
            </td>
            <td className={styles.bgPinkRow}>
              {Math.round(revenueDetails.volume_self).toLocaleString()}
            </td>
            <td className={styles.bgYellowRow}>
              {revenueDetails.appliedSavingsPrice.toLocaleString()}
            </td>
            <td className={styles.textRight}>
              {(revenueDetails.revenue_saving / 100000000).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>
              ② 잉여 한전 판매 수익
            </td>
            <td className={styles.bgPinkRow}>
              {Math.round(revenueDetails.volume_surplus_final).toLocaleString()}
            </td>
            <td className={styles.bgYellowRow}>
              {config.unit_price_kepco.toLocaleString()}
            </td>
            <td className={styles.textRight}>
              {(revenueDetails.revenue_surplus / 100000000).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>
              ③ EC-전력 판매 수익
            </td>
            <td className={styles.bgPinkRow}>
              {Math.round(revenueDetails.volume_ec).toLocaleString()}
            </td>
            <td className={styles.bgYellowRow}>
              {revenueDetails.appliedSellPrice.toLocaleString()}
            </td>
            <td className={styles.textRight}>
              {(revenueDetails.revenue_ec / 100000000).toFixed(2)}
            </td>
          </tr>
          <tr className={styles.bgGreenRow} style={{ fontWeight: 'bold' }}>
            <td colSpan={4} className={styles.textRight}>
              연간 수익 총액
            </td>
            <td className={styles.textBlue}>
              {(totalRevenue / 100000000).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td className={styles.textBold}>비용</td>
            <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>
              (-) 유지보수비 및 인건비
            </td>
            <td>-</td>
            <td>-</td>
            <td className={`${styles.textRight} ${styles.textRed}`}>
              -{(totalAnnualCost / 100000000).toFixed(2)}
            </td>
          </tr>
          <tr className={styles.bgTotal}>
            <td colSpan={4} className={styles.textRight}>
              연간 실제 순수익 (Net Profit)
            </td>
            <td style={{ fontSize: '1.1rem', color: '#fbbf24' }}>
              {(netProfit / 100000000).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 최종 결론 */}
      <div className={styles.badgeWrapper}>
        <div className={styles.finalMetricBox} style={{ marginRight: '2rem' }}>
          <span className={styles.finalLabel}>20년 누적 수익</span>
          <span className={styles.finalValue} style={{ color: '#16a34a' }}>
            {(totalNetProfit20Years / 100000000).toFixed(2)}
          </span>
          <span className={styles.finalUnit}>억</span>
        </div>
        <div className={styles.finalMetricBox}>
          <span className={styles.finalLabel}>총 수익률(ROI)</span>
          <span className={styles.finalValue}>{roiPercent.toFixed(1)}</span>
          <span className={styles.finalUnit}>%</span>
        </div>
      </div>
    </div>
  );
}
