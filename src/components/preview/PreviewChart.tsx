'use client';

import React from 'react';
import { LucideLineChart } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import styles from '../PreviewPanel.module.css'; // 상위 폴더의 CSS 사용

type Props = {
  data: any[];
  savingRate: number;
  contractType: string;
  baseRate: number;
  customSavingRate: number;
};

export default function PreviewChart({
  data,
  savingRate,
  customSavingRate,
  contractType,
  baseRate,
}: Props) {
  return (
    <div className={styles.chartSection}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>
          <LucideLineChart className="text-orange-500" size={20} />
          전력 요금 절감 효과 분석
        </div>
        <div className={styles.contractLabel}>
          <span style={{ color: '#94a3b8', marginRight: '0.5rem' }}>
            예상 절감율
          </span>
          <span style={{ color: '#22c55e', fontSize: '1rem' }}>
            {savingRate.toFixed(1)}% ▼
          </span>
        </div>
        <div className={styles.contractLabel}>
          <span style={{ color: '#94a3b8', marginRight: '0.5rem' }}>
            전기 절감율
          </span>
          <span style={{ color: '#22c55e', fontSize: '1rem' }}>
            {customSavingRate.toFixed(1)}% ▼
          </span>
        </div>
      </div>
      <div className={styles.chartWrapper}>
        <ResponsiveContainer width="100%" height={220} minHeight={220}>
          <LineChart
            data={data}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f1f5f9"
            />
            <XAxis
              dataKey="name"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              stroke="#94a3b8"
            />
            <YAxis
              tickFormatter={(v) => `${v}만`}
              fontSize={11}
              axisLine={false}
              tickLine={false}
              stroke="#94a3b8"
            />
            <Tooltip
              formatter={(value: any) => [
                `${Math.round(Number(value || 0)).toLocaleString()} 만원`,
                '',
              ]}
            />
            <Legend iconSize={10} fontSize={11} />
            <Line
              type="monotone"
              dataKey="설치전"
              name="설치 전"
              stroke="#1e40af"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
            <Line
              type="monotone"
              dataKey="설치후"
              name="설치 후 (예상)"
              stroke="#f97316"
              strokeWidth={2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className={styles.chartFooter}>
        * 적용 단가: {contractType} ({baseRate.toLocaleString()}원) 기준
        시뮬레이션
      </div>
    </div>
  );
}
