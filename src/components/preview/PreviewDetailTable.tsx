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

      {/* 하단 배지 영역 (크기 축소, 절감율 배지 구분) */}
      <div className={styles.badgeWrapper}>
        <div style={{ textAlign: 'right', marginRight: '1.5rem' }}>
          <div
            style={{
              fontSize: '12px',
              color: '#64748b',
              fontWeight: 'bold',
              marginBottom: '2px',
            }}
          >
            연간 총 경제적 효과 (절감+수익)
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: '900',
              color: '#1e40af',
              lineHeight: '1.1',
            }}
          >
            {Math.round(totalBenefit).toLocaleString()}{' '}
            <span style={{ fontSize: '1rem', color: '#94a3b8' }}>원</span>
          </div>
        </div>

        {/* 최대부하비율 배지 */}
        <div
          className={styles.badge}
          style={{
            background: 'linear-gradient(to right, #e0f2fe, #bae6fd)',
            color: '#0284c7',
            borderColor: '#7dd3fc',
            gap: '0.35rem',
            marginRight: '0.5rem',
            padding: '0.5rem 1rem',
          }}
        >
          <span
            className={styles.finalLabel}
            style={{ color: '#0369a1', fontSize: '11px' }}
          >
            최대부하비율
          </span>
          <div style={{ display: 'flex', alignItems: 'baseline' }}>
            <span
              className={styles.finalValue}
              style={{ color: '#0284c7', fontSize: '1.2rem' }}
            >
              {maxLoadRatio.toFixed(1)}
            </span>
            <span
              className={styles.finalUnit}
              style={{ color: '#38bdf8', fontSize: '0.85rem' }}
            >
              %
            </span>
          </div>
        </div>

        {/* 기존 전기요금 대비 절감율 - 분홍 테두리/배경으로 구분 */}
        <div
          className={styles.badge}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            background: 'linear-gradient(to right, #fdf2f8, #fce7f3)',
            border: '1px solid #f9a8d4',
          }}
        >
          <LucideZap
            size={18}
            style={{ color: '#db2777', marginRight: '0.35rem' }}
          />
          <span
            className={styles.finalLabel}
            style={{ fontSize: '11px', color: '#9d174d' }}
          >
            기존 대비 절감율
          </span>
          <span
            className={styles.finalValue}
            style={{
              color: '#db2777',
              marginLeft: '0.35rem',
              fontSize: '1.2rem',
            }}
          >
            {savingRate.toFixed(1)}
          </span>
          <span className={styles.finalUnit} style={{ fontSize: '0.85rem' }}>
            %
          </span>
        </div>

        {/* 전기요금 절감율 - 보라/인디고 톤으로 구분 */}
        <div
          className={styles.badge}
          style={{
            padding: '0.5rem 1rem',
            background: 'linear-gradient(to right, #eef2ff, #e0e7ff)',
            border: '1px solid #a5b4fc',
          }}
        >
          <LucideZap
            size={18}
            style={{ color: '#6366f1', marginRight: '0.35rem' }}
          />
          <span
            className={styles.finalLabel}
            style={{ fontSize: '11px', color: '#4338ca' }}
          >
            전기요금 절감율
          </span>
          <span
            className={styles.finalValue}
            style={{
              color: '#6366f1',
              marginLeft: '0.35rem',
              fontSize: '1.2rem',
            }}
          >
            {customSavingRate.toFixed(1)}
          </span>
          <span className={styles.finalUnit} style={{ fontSize: '0.85rem' }}>
            %
          </span>
        </div>
      </div>
    </div>
  );
}
