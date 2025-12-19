'use client';

import React from 'react';
import { useProposalStore } from '../../lib/store';
import styles from '../PreviewPanel.module.css';
import { LucideBriefcase } from 'lucide-react';

export default function PreviewFinancialTable() {
  const store = useProposalStore();
  const { config, truckCount, selectedModel, moduleTier, useEc } = store;

  // [핵심] 스토어 계산 함수 호출
  const results = store.getSimulationResults();

  // 투자비 세부 항목 계산
  let solarPrice = config.price_solar_standard;
  if (moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
  if (moduleTier === 'ECONOMY') solarPrice = config.price_solar_economy;

  const solarCount = store.capacityKw / 100;
  const solarCost = solarCount * solarPrice;
  const ecCost =
    useEc && selectedModel !== 'KEPCO' ? truckCount * config.price_ec_unit : 0;
  const tractorCost =
    useEc && selectedModel !== 'KEPCO' && truckCount > 0
      ? config.price_tractor
      : 0;
  const platformCost =
    useEc && selectedModel !== 'KEPCO' && truckCount > 0
      ? config.price_platform
      : 0;

  // 화면 표시용 단가
  const appliedSavingsPrice =
    store.unitPriceSavings || config.unit_price_savings;
  let appliedSellPrice = config.unit_price_kepco;
  if (selectedModel === 'RE100') appliedSellPrice = config.unit_price_ec_1_5;
  if (selectedModel === 'REC5') appliedSellPrice = config.unit_price_ec_5_0;

  const isEul = store.contractType.includes('(을)');

  // [수정] ROI (총 수익률) 계산 로직 - Step 4와 동일하게 맞춤
  // 총비용 = 초기투자비 + (연간유지비 * 20년)
  // 총수익 = 20년 순수익 (이미 비용 차감된 값) -> 따라서 수익률 = (순수익 / 총비용) * 100
  const totalCost20 =
    results.totalInvestment + results.annualMaintenanceCost * 20;
  const profitRate =
    totalCost20 > 0 ? (results.self_final_profit / totalCost20) * 100 : 0;

  return (
    <div className={styles.financialSection}>
      <div className={styles.sectionTitle}>
        <LucideBriefcase size={20} className="text-purple-600" />
        투자 및 수익성 분석 상세
      </div>

      <div className={styles.summaryBox}>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>사업 모델</span>
          <span className={styles.summaryValue}>{selectedModel}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>모듈 등급</span>
          <span className={styles.summaryValue}>{moduleTier}</span>
        </div>
        <div className={styles.summaryItem}>
          <span className={styles.summaryLabel}>EC 운용</span>
          <span className={styles.summaryValue}>
            {useEc && selectedModel !== 'KEPCO' ? `${truckCount}대` : '미운용'}
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
            <td>{solarCount.toFixed(2)} ea</td>
            <td>{solarPrice}</td>
            <td className={styles.textBold}>{solarCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>에너지캐리어</td>
            <td>100 kW</td>
            <td>{useEc && selectedModel !== 'KEPCO' ? truckCount : 0} ea</td>
            <td>{config.price_ec_unit}</td>
            <td className={styles.textBold}>{ecCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>이동트랙터</td>
            <td>1 ton</td>
            <td>{tractorCost > 0 ? 1 : 0} ea</td>
            <td>{config.price_tractor}</td>
            <td className={styles.textBold}>{tractorCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>운영플랫폼</td>
            <td>1 set</td>
            <td>{platformCost > 0 ? 1 : 0} set</td>
            <td>{config.price_platform}</td>
            <td className={styles.textBold}>{platformCost.toFixed(2)}</td>
          </tr>
          <tr className={styles.bgTotal}>
            <td colSpan={4} className={styles.textRight}>
              초기 투자비 합계
            </td>
            <td>{results.totalInvestmentUk.toFixed(2)}</td>
          </tr>
          <tr className={styles.bgTotal} style={{ backgroundColor: '#334155' }}>
            <td colSpan={4} className={styles.textRight}>
              20년 투자총액 (유지보수 포함)
            </td>
            <td>
              {(
                results.totalInvestmentUk +
                (results.annualMaintenanceCost * 20) / 100000000
              ).toFixed(2)}
            </td>
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
            <td rowSpan={4} className={styles.textBold}>
              수익
            </td>
            <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>
              ① 자가소비(최대부하) 절감
            </td>
            <td className={styles.bgPinkRow}>
              {Math.round(results.volume_self).toLocaleString()}
            </td>
            <td className={styles.bgYellowRow}>
              {appliedSavingsPrice.toLocaleString()}
            </td>
            <td className={styles.textRight}>
              {(results.revenue_saving / 100000000).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>
              ② 잉여 한전 판매 수익
            </td>
            <td className={styles.bgPinkRow}>
              {selectedModel === 'KEPCO'
                ? Math.round(results.annualSurplus).toLocaleString()
                : Math.round(results.volume_surplus_final).toLocaleString()}
            </td>
            <td className={styles.bgYellowRow}>
              {config.unit_price_kepco.toLocaleString()}
            </td>
            <td className={styles.textRight}>
              {(results.revenue_surplus / 100000000).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>
              ③ EC-전력 판매 수익
            </td>
            <td className={styles.bgPinkRow}>
              {Math.round(results.volume_ec).toLocaleString()}
            </td>
            <td className={styles.bgYellowRow}>
              {appliedSellPrice.toLocaleString()}
            </td>
            <td className={styles.textRight}>
              {(results.revenue_ec / 100000000).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>
              ④ 전기요금합리화절감액{isEul ? '(을)' : '(갑)'}
            </td>
            <td className={styles.bgPinkRow}>-</td>
            <td className={styles.bgYellowRow}>-</td>
            <td className={styles.textRight}>
              {(results.totalRationalizationSavings / 100000000).toFixed(2)}
            </td>
          </tr>

          {/* 총계 */}
          <tr className={styles.bgGreenRow} style={{ fontWeight: 'bold' }}>
            <td colSpan={4} className={styles.textRight}>
              연간 수익 총액
            </td>
            <td className={styles.textBlue}>
              {(results.annualGrossRevenue / 100000000).toFixed(2)}
            </td>
          </tr>
          <tr>
            <td className={styles.textBold}>비용</td>
            <td style={{ textAlign: 'left', paddingLeft: '1rem' }}>
              (-) 유지보수비 및 인건비
              {results.laborCostWon > 0 && (
                <span className="text-xs text-gray-400 ml-1 font-normal">
                  (EC운영인건비 포함)
                </span>
              )}
            </td>
            <td>-</td>
            <td>-</td>
            <td className={`${styles.textRight} ${styles.textRed}`}>
              -{(results.annualMaintenanceCost / 100000000).toFixed(2)}
            </td>
          </tr>
          <tr className={styles.bgTotal}>
            <td colSpan={4} className={styles.textRight}>
              연간 실제 순수익 (Net Profit)
            </td>
            <td style={{ fontSize: '1.1rem', color: '#fbbf24' }}>
              {(results.annualOperatingProfit / 100000000).toFixed(2)}
            </td>
          </tr>
        </tbody>
      </table>

      {/* 최종 결론 */}
      <div className={styles.badgeWrapper}>
        <div className={styles.finalMetricBox} style={{ marginRight: '2rem' }}>
          <span className={styles.finalLabel}>20년 누적 수익</span>
          <span className={styles.finalValue} style={{ color: '#16a34a' }}>
            {(results.self_final_profit / 100000000).toFixed(2)}
          </span>
          <span className={styles.finalUnit}>억</span>
        </div>
        <div className={styles.finalMetricBox}>
          <span className={styles.finalLabel}>총 수익률(ROI)</span>
          {/* [수정] 20년 총 수익률 표시 */}
          <span className={styles.finalValue}>{profitRate.toFixed(1)}</span>
          <span className={styles.finalUnit}>%</span>
        </div>
      </div>
    </div>
  );
}
