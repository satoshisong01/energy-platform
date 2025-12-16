'use client';

import React from 'react';
import { LucideTable, LucideZap, LucideFileText } from 'lucide-react';
import { useProposalStore } from '../../lib/store'; // [NEW] 스토어 임포트
import styles from '../PreviewPanel.module.css';

type Props = {
  data: any[];
  totals: any;
  savingRate: number;
  maxLoadRatio: number;
  totalBenefit: number;
};

export default function PreviewDetailTable({
  data,
  totals,
  savingRate,
  maxLoadRatio,
  totalBenefit,
}: Props) {
  // [NEW] 스토어에서 비고(energyNote) 가져오기
  const { energyNote } = useProposalStore();

  return (
    <div>
      <div className={styles.tableHeader}>
        <LucideTable size={16} className="text-blue-600" /> 월별 상세 분석
        데이터
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th rowSpan={2} className={styles.headerGray}>
              월
            </th>
            <th colSpan={2} className={styles.headerGray}>
              사용량 분석
            </th>
            <th colSpan={2} className={styles.headerBlue}>
              태양광 발전
            </th>
            <th colSpan={2} className={styles.headerOrange}>
              요금 분석 (원)
            </th>
            <th colSpan={4} className={styles.headerOrange}>
              경제성 분석 (원)
            </th>
          </tr>
          <tr>
            <th className={styles.headerGray}>사용량</th>
            <th>자가소비</th>
            <th className={`${styles.headerBlue} ${styles.textBlue}`}>
              발전량
            </th>
            <th className={styles.headerBlue}>잉여전력</th>
            <th className={styles.headerOrange}>기존요금</th>
            <th className={styles.headerOrange}>기본요금</th>
            <th className={`${styles.headerOrange} ${styles.textOrange}`}>
              최대부하절감
            </th>
            <th className={`${styles.headerOrange} ${styles.textOrange}`}>
              기본요금절감
            </th>
            <th className={`${styles.headerOrange} ${styles.textBlue}`}>
              설치후요금
            </th>
            <th className={`${styles.headerOrange} ${styles.textGreen}`}>
              잉여수익
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month}>
              <td>{row.month}월</td>
              <td className={styles.alignRight}>
                {row.usageKwh.toLocaleString()}
              </td>
              <td className={styles.alignRight}>
                {row.selfConsumption.toLocaleString()}
              </td>
              <td
                className={`${styles.alignRight} ${styles.textBlue} ${styles.bold}`}
              >
                {Math.round(row.solarGeneration).toLocaleString()}
              </td>
              <td className={styles.alignRight}>
                {Math.round(row.surplusPower).toLocaleString()}
              </td>
              <td className={styles.alignRight}>
                {row.totalBill.toLocaleString()}
              </td>
              <td className={styles.alignRight}>
                {row.baseBill.toLocaleString()}
              </td>
              <td className={`${styles.alignRight} ${styles.textOrange}`}>
                {Math.round(row.maxLoadSavings).toLocaleString()}
              </td>
              <td className={`${styles.alignRight} ${styles.textOrange}`}>
                {Math.round(row.baseBillSavings).toLocaleString()}
              </td>
              <td className={`${styles.alignRight} ${styles.textBlue}`}>
                {Math.round(row.afterBill).toLocaleString()}
              </td>
              <td
                className={`${styles.alignRight} ${styles.textGreen} ${styles.bold}`}
              >
                {Math.round(row.surplusRevenue).toLocaleString()}
              </td>
            </tr>
          ))}
          <tr className={styles.totalRow}>
            <td>소계</td>
            <td className={styles.alignRight}>
              {totals.usageKwh.toLocaleString()}
            </td>
            <td className={styles.alignRight}>
              {totals.selfConsumption.toLocaleString()}
            </td>
            <td className={styles.alignRight}>
              {Math.round(totals.solarGeneration).toLocaleString()}
            </td>
            <td className={styles.alignRight}>
              {Math.round(totals.surplusPower).toLocaleString()}
            </td>
            <td className={styles.alignRight}>
              {totals.totalBill.toLocaleString()}
            </td>
            <td className={styles.alignRight}>
              {totals.baseBill.toLocaleString()}
            </td>
            <td className={styles.alignRight} style={{ color: '#fbbf24' }}>
              {Math.round(totals.maxLoadSavings).toLocaleString()}
            </td>
            <td className={styles.alignRight} style={{ color: '#fbbf24' }}>
              {Math.round(totals.baseBillSavings).toLocaleString()}
            </td>
            <td className={styles.alignRight} style={{ color: '#bae6fd' }}>
              {Math.round(totals.afterBill).toLocaleString()}
            </td>
            <td className={styles.alignRight} style={{ color: '#4ade80' }}>
              {Math.round(totals.surplusRevenue).toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ✅ [NEW] 비고 출력 섹션 */}
      {energyNote && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
            fontSize: '0.875rem',
            color: '#475569',
          }}
        >
          <div
            style={{
              fontWeight: 'bold',
              marginBottom: '0.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              color: '#334155',
            }}
          >
            <LucideFileText size={16} /> <span>비고 (특이사항)</span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>
            {energyNote}
          </div>
        </div>
      )}

      <div className={styles.badgeWrapper}>
        <div style={{ textAlign: 'right', marginRight: '2rem' }}>
          <div
            style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 'bold' }}
          >
            연간 총 경제적 효과 (절감+수익)
          </div>
          <div
            style={{
              fontSize: '2rem',
              fontWeight: '900',
              color: '#1e40af',
              lineHeight: '1.1',
            }}
          >
            {Math.round(totalBenefit).toLocaleString()}{' '}
            <span style={{ fontSize: '1rem', color: '#94a3b8' }}>원</span>
          </div>
        </div>
        <div
          className={styles.badge}
          style={{
            background: 'linear-gradient(to right, #e0f2fe, #bae6fd)',
            color: '#0284c7',
            borderColor: '#7dd3fc',
            gap: '0.5rem',
            marginRight: '0.5rem',
          }}
        >
          <span className={styles.finalLabel} style={{ color: '#0369a1' }}>
            최대부하비율
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span className={styles.finalValue} style={{ color: '#0284c7' }}>
              {maxLoadRatio.toFixed(1)}
            </span>
            <span className={styles.finalUnit} style={{ color: '#38bdf8' }}>
              %
            </span>
          </div>
        </div>
        <div className={styles.badge}>
          <LucideZap className="text-pink-500 mr-2" size={20} />
          <span className={styles.finalLabel}>기존 전기요금 대비 절감율</span>
          <span
            className={styles.finalValue}
            style={{ color: '#db2777', marginLeft: '0.5rem' }}
          >
            {savingRate.toFixed(1)}
          </span>
          <span className={styles.finalUnit}>%</span>
        </div>
      </div>
    </div>
  );
}
