'use client';

import React from 'react';
import { useProposalStore } from '../../lib/store';
import styles from '../PreviewPanel.module.css';

export default function PreviewFinancialTable() {
  const store = useProposalStore();
  const {
    config,
    truckCount,
    selectedModel,
    moduleTier,
    useEc,
    isEcSelfConsumption,
    ecSelfConsumptionCount,
  } = store;

  // 스토어 계산 함수 호출 (전체 합계 등은 여기서 가져옴)
  const results = store.getSimulationResults();

  // --- [수정] 투자비 세부 항목 독립 계산 (Store 로직과 일치화) ---

  // 1. 태양광
  let solarPrice = config.price_solar_standard;
  if (moduleTier === 'PREMIUM') solarPrice = config.price_solar_premium;
  if (moduleTier === 'ECONOMY') solarPrice = config.price_solar_economy;
  const solarCount = store.capacityKw / 100;
  const solarCost = solarCount * solarPrice;

  // 2. 에너지캐리어 (EC)
  // 고정형이면 설정된 대수, 이동형이면 트럭 대수
  let activeEcCount = 0;
  if (selectedModel !== 'KEPCO') {
    if (isEcSelfConsumption) {
      activeEcCount = ecSelfConsumptionCount || 1;
    } else if (useEc) {
      activeEcCount = truckCount;
    }
  }
  const ecCost = activeEcCount * config.price_ec_unit;

  // 3. 이동트랙터 (이동형일 때만 발생)
  const tractorCost =
    selectedModel !== 'KEPCO' && useEc && !isEcSelfConsumption && truckCount > 0
      ? config.price_tractor
      : 0;
  const tractorCount = tractorCost > 0 ? 1 : 0;

  // [수정] 4. 운영플랫폼 (용량 비례 자동 계산, Max 0.3억)
  // 엑셀 공식: Min( (용량/100)*0.1, 0.3 )
  const calculatedPlatformCost = Math.min((store.capacityKw / 100) * 0.1, 0.3);

  const platformCost =
    selectedModel !== 'KEPCO' &&
    ((useEc && truckCount > 0) || isEcSelfConsumption)
      ? calculatedPlatformCost // 1식이므로 그대로 사용
      : 0;
  const platformCount = platformCost > 0 ? 1 : 0;

  // 화면 표시용 단가
  const appliedSavingsPrice =
    store.unitPriceSavings || config.unit_price_savings;
  let appliedSellPrice = config.unit_price_kepco;

  if (isEcSelfConsumption) {
    appliedSellPrice = config.unit_price_ec_self;
  } else {
    if (selectedModel === 'RE100') appliedSellPrice = config.unit_price_ec_1_5;
    if (selectedModel === 'REC5') appliedSellPrice = config.unit_price_ec_5_0;
  }

  // ROI (총 수익률) 계산
  const totalCost20 =
    results.totalInvestment + results.annualMaintenanceCost * 20;
  const profitRate =
    totalCost20 > 0 ? (results.self_final_profit / totalCost20) * 100 : 0;

  // EC 운용 상태 텍스트
  let ecStatusText = '미운용';
  if (selectedModel !== 'KEPCO') {
    if (isEcSelfConsumption) ecStatusText = `자가소비형 (${activeEcCount}대)`;
    else if (useEc) ecStatusText = `이동형 (${activeEcCount}대)`;
  }

  return (
    <div className={styles.financialSection}>
      <div className={styles.tableHeader}>04. 투자 및 수익성 분석 상세</div>

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
          <span className={styles.summaryValue}>{ecStatusText}</span>
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
            <td>{solarPrice.toFixed(2)}</td>
            <td className={styles.textBold}>{solarCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>에너지캐리어</td>
            <td>100 kW</td>
            <td>{activeEcCount} ea</td>
            <td>{config.price_ec_unit.toFixed(2)}</td>
            <td className={styles.textBold}>{ecCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>이동트랙터</td>
            <td>1 ton</td>
            <td>{tractorCount} ea</td>
            <td>{config.price_tractor.toFixed(2)}</td>
            <td className={styles.textBold}>{tractorCost.toFixed(2)}</td>
          </tr>
          <tr>
            <td>운영플랫폼</td>
            <td>1 set</td>
            <td>{platformCount} set</td>
            {/* [수정] 단가에 계산된 값 표시 */}
            <td>{calculatedPlatformCost.toFixed(2)}</td>
            <td className={styles.textBold}>{platformCost.toFixed(2)}</td>
          </tr>

          {/* 합계 행 */}
          <tr className={styles.bgTotal}>
            <td colSpan={4} className={styles.textRight}>
              초기 투자비 합계
            </td>
            {/* store에서 계산된 정확한 합계 사용 (자동 검증됨) */}
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

      {/* B. 연간 수익 분석 테이블 (기존 유지) */}
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
              ④ 전기요금합리화절감액
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
              {(results.annualOperatingProfit / 100000000).toFixed(2)} 억
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
          <span className={styles.finalValue}>{profitRate.toFixed(1)}</span>
          <span className={styles.finalUnit}>%</span>
        </div>
      </div>
    </div>
  );
}
