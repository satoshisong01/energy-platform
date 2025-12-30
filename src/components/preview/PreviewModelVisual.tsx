'use client';

import React from 'react';
import { useProposalStore } from '../../lib/store';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import styles from './PreviewModelVisual.module.css';

// [공통] 차트 데이터 생성 로직 (Hook으로 분리하거나 내부에서 사용)
const useChartData = () => {
  const store = useProposalStore();
  const totalUsage = store.monthlyData.reduce(
    (acc, cur) => acc + cur.usageKwh,
    0
  );
  const avgDailyUsage = totalUsage / 365;
  const capacity = store.capacityKw;

  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    let usageRatio = 0.02;
    if (hour >= 8 && hour <= 18) usageRatio = 0.065;
    const deterministicNoise = Math.sin(hour * 999) * 0.1;
    const usage = avgDailyUsage * usageRatio * (1.0 + deterministicNoise);

    let solarRatio = 0;
    if (hour >= 6 && hour <= 19) {
      const dist = Math.abs(hour - 12.5);
      solarRatio = Math.max(0, 1 - Math.pow(dist / 7.5, 2.5));
    }
    const generation = capacity * solarRatio * 0.8;
    const surplusVal = Math.max(0, generation - usage);
    const surplusRange = generation > usage ? [usage, generation] : null;

    return {
      hour: `${hour}시`,
      usage,
      generation,
      surplusVal,
      surplusRange,
    };
  });

  return { hourlyData };
};

// -----------------------------------------------------------
// [컴포넌트 1] 그래프 부분 (6페이지용)
// -----------------------------------------------------------
export function PreviewModelGraph() {
  const { hourlyData } = useChartData();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>RE100 에너지 발전 수익 분석 그래프</h3>
      <div className={styles.chartBox}>
        <h4 className={styles.chartTitle}>시간대별 전력 수급</h4>
        <div style={{ height: 400 }}>
          {' '}
          {/* 높이 약간 확보 */}
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={hourlyData}
              margin={{ top: 20, right: 20, bottom: 0, left: 0 }}
            >
              <defs>
                <pattern
                  id="stripePattern"
                  patternUnits="userSpaceOnUse"
                  width="6"
                  height="6"
                  patternTransform="rotate(45)"
                >
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="6"
                    stroke="#ef4444"
                    strokeWidth="3"
                    opacity="0.3"
                  />
                </pattern>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#f1f5f9"
              />
              <XAxis
                dataKey="hour"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                stroke="#94a3b8"
              />
              <YAxis
                fontSize={11}
                axisLine={false}
                tickLine={false}
                stroke="#94a3b8"
                unit="kW"
              />
              <Tooltip
                labelStyle={{ color: '#334155', fontWeight: 'bold' }}
                itemStyle={{ fontSize: '0.85rem' }}
                formatter={(val: any, name: any) => {
                  if (name === 'range' || name === 'surplusRange')
                    return [null, null];
                  // name이 undefined일 경우를 대비해 안전하게 처리하거나 그대로 둡니다.
                  return [`${Number(val).toFixed(1)} kW`, name];
                }}
                filterNull={true}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />
              <Legend verticalAlign="top" height={36} iconSize={10} />
              <Area
                type="monotone"
                dataKey="usage"
                name="전력 사용량"
                fill="#dbeafe"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={0.6}
              />
              <Area
                type="monotone"
                dataKey="surplusRange"
                name="range"
                stroke="none"
                fill="url(#stripePattern)"
                legendType="none"
              />
              <Line
                type="monotone"
                dataKey="generation"
                name="태양광 발전"
                stroke="#f97316"
                strokeWidth={3}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="surplusVal"
                name="잉여 전력"
                stroke="none"
                dot={false}
                activeDot={false}
                legendType="rect"
                strokeDasharray="3 3"
                strokeWidth={0}
                color="#ef4444"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        <p className={styles.desc}>
          *{' '}
          <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
            빨간색 빗금 영역
          </span>
          은 자가소비 후 남는 <b>잉여 전력</b>으로, 판매하여 수익을 창출합니다.
        </p>
      </div>
    </div>
  );
}

// -----------------------------------------------------------
// [컴포넌트 2] 이미지/영상 부분 (7페이지용)
// -----------------------------------------------------------
export function PreviewModelImage() {
  const store = useProposalStore();
  const isKepco = store.selectedModel === 'KEPCO';

  // 경로 설정 (파일명 확인 필요)
  const videoSrc = isKepco ? '/videos/direct.mp4' : '/videos/egc.mp4';
  const imageSrc = isKepco
    ? '/images/direct_capture.png'
    : '/images/egc_capture.png';
  const videoTitle = isKepco
    ? '한전 판매형 프로세스'
    : '에너지 캐리어(EC) 운송 프로세스';

  return (
    <div className={styles.container}>
      {/* 인쇄 스타일 */}
      <style jsx global>{`
        @media print {
          .print-hide {
            display: none !important;
          }
          .print-show {
            display: block !important;
          }
        }
        .print-show {
          display: none;
        }
      `}</style>

      <div className={styles.videoBox} style={{ marginTop: 0 }}>
        <h4 className={styles.videoTitle} style={{ marginBottom: '20px' }}>
          {videoTitle}
        </h4>
        <div className={styles.videoWrapper} style={{ height: '500px' }}>
          {' '}
          {/* 이미지 잘 보이라고 높이 키움 */}
          {/* 화면용: 비디오 */}
          <video
            src={videoSrc}
            className="w-full h-full object-contain rounded-lg print-hide"
            autoPlay
            loop
            muted
            playsInline
          />
          {/* 인쇄용: 이미지 */}
          <img
            src={imageSrc}
            className="w-full h-full object-contain rounded-lg print-show"
            alt="Process Diagram"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
      </div>
    </div>
  );
}

// 기존 default export는 제거하거나 두 컴포넌트를 묶어서 내보낼 수 있지만,
// PreviewPanel에서 분리해서 쓰기 위해 각각 Named Export 했습니다.
export default PreviewModelGraph;
