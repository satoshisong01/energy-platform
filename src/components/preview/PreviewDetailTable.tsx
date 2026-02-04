'use client';

import React from 'react';
import { LucideTable, LucideZap, LucideFileText } from 'lucide-react';
import { useProposalStore } from '../../lib/store';
import styles from '../PreviewPanel.module.css';

type Props = {
  data: any[];
  totals: any;
  savingRate: number;
  customSavingRate: number;
  maxLoadRatio: number;
  totalBenefit: number;
};

export default function PreviewDetailTable({
  data,
  totals,
  savingRate,
  customSavingRate,
  maxLoadRatio,
  totalBenefit,
}: Props) {
  const { energyNote } = useProposalStore();

  return (
    <div>
      <div className={styles.tableHeader}>03. 월별 상세 분석 데이터</div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th rowSpan={2} className={`${styles.headerGray} text-[14px]`}>
              월
            </th>
            <th colSpan={2} className={`${styles.headerGray} text-[14px]`}>
              사용량 분석
            </th>
            <th colSpan={2} className={`${styles.headerBlue} text-[14px]`}>
              태양광 발전
            </th>
            <th colSpan={2} className={`${styles.headerOrange} text-[14px]`}>
              요금 분석 (원)
            </th>
            <th colSpan={4} className={`${styles.headerOrange} text-[14px]`}>
              경제성 분석 (원)
            </th>
          </tr>
          <tr>
            <th className={`${styles.headerGray} text-[14px]`}>사용량</th>
            <th className={`${styles.headerGray} text-[14px]`}>자가소비</th>
            <th
              className={`${styles.headerBlue} ${styles.textBlue} text-[14px]`}
            >
              발전량
            </th>
            <th className={`${styles.headerBlue} text-[14px]`}>잉여전력</th>
            <th className={`${styles.headerOrange} text-[14px]`}>기존요금</th>
            <th className={`${styles.headerOrange} text-[14px]`}>기본요금</th>
            <th
              className={`${styles.headerOrange} ${styles.textOrange} text-[14px]`}
            >
              최대부하절감
            </th>
            <th
              className={`${styles.headerOrange} ${styles.textOrange} text-[14px]`}
            >
              기본요금절감
            </th>
            <th
              className={`${styles.headerOrange} ${styles.textBlue} text-[14px]`}
            >
              설치후요금
            </th>
            <th
              className={`${styles.headerOrange} ${styles.textGreen} text-[14px]`}
            >
              잉여수익
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.month} className="text-[13px]">
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

          {/* 소계 (합계) 행 - 조금 더 크게 강조 (text-[14px]) */}
          <tr className={`${styles.totalRow} text-[14px]`}>
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

      {/* ✅ [NEW] 비고 출력 섹션 (글자 크기 확대) */}
      {energyNote && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            backgroundColor: '#f8fafc',
            borderRadius: '0.5rem',
            border: '1px solid #e2e8f0',
            fontSize: '15px', // [수정] 0.875rem -> 15px
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
            <LucideFileText size={18} /> <span>비고 (특이사항)</span>
          </div>
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
            {energyNote}
          </div>
        </div>
      )}

      {/* 하단 배지 영역 (전체적으로 확대) */}
      <div className={styles.badgeWrapper}>
        <div style={{ textAlign: 'right', marginRight: '2rem' }}>
          <div
            style={{
              fontSize: '15px', // [수정] 0.8rem -> 15px
              color: '#64748b',
              fontWeight: 'bold',
              marginBottom: '4px',
            }}
          >
            연간 총 경제적 효과 (절감+수익)
          </div>
          <div
            style={{
              fontSize: '2.25rem', // [수정] 2rem -> 2.25rem
              fontWeight: '900',
              color: '#1e40af',
              lineHeight: '1.1',
            }}
          >
            {Math.round(totalBenefit).toLocaleString()}{' '}
            <span style={{ fontSize: '1.25rem', color: '#94a3b8' }}>원</span>
          </div>
        </div>

        {/* 최대부하비율 배지 */}
        <div
          className={styles.badge}
          style={{
            background: 'linear-gradient(to right, #e0f2fe, #bae6fd)',
            color: '#0284c7',
            borderColor: '#7dd3fc',
            gap: '0.5rem',
            marginRight: '0.5rem',
            padding: '0.75rem 1.25rem', // [수정] 패딩 약간 증가
          }}
        >
          <span
            className={styles.finalLabel}
            style={{ color: '#0369a1', fontSize: '14px' }} // [수정] 라벨 크기 증가
          >
            최대부하비율
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span
              className={styles.finalValue}
              style={{ color: '#0284c7', fontSize: '1.5rem' }} // [수정] 값 크기 증가
            >
              {maxLoadRatio.toFixed(1)}
            </span>
            <span
              className={styles.finalUnit}
              style={{ color: '#38bdf8', fontSize: '1rem' }}
            >
              %
            </span>
          </div>
        </div>

        {/* 절감율 배지 */}
        <div
          className={styles.badge}
          style={{ padding: '0.75rem 1.25rem', marginRight: '0.5rem' }} // [수정] 패딩 약간 증가
        >
          <LucideZap className="text-pink-500 mr-2" size={24} />
          <span className={styles.finalLabel} style={{ fontSize: '14px' }}>
            기존 전기요금 대비 절감율
          </span>
          <span
            className={styles.finalValue}
            style={{
              color: '#db2777',
              marginLeft: '0.5rem',
              fontSize: '1.5rem',
            }} // [수정] 값 크기 증가
          >
            {savingRate.toFixed(1)}
          </span>
          <span className={styles.finalUnit} style={{ fontSize: '1rem' }}>
            %
          </span>
        </div>
        <div
          className={styles.badge}
          style={{ padding: '0.75rem 1.25rem' }} // [수정] 패딩 약간 증가
        >
          <LucideZap className="text-pink-500 mr-2" size={24} />
          <span className={styles.finalLabel} style={{ fontSize: '14px' }}>
            기존 전기요금 절감율
          </span>
          <span
            className={styles.finalValue}
            style={{
              color: '#db2777',
              marginLeft: '0.5rem',
              fontSize: '1.5rem',
              
            }} // [수정] 값 크기 증가
          >
            {customSavingRate.toFixed(1)}
          </span>
          <span className={styles.finalUnit} style={{ fontSize: '1rem' }}>
            %
          </span>
        </div>
      </div>
    </div>
  );
}
