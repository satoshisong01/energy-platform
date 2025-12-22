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

export default function PreviewModelVisual() {
  const store = useProposalStore();

  const totalUsage = store.monthlyData.reduce(
    (acc, cur) => acc + cur.usageKwh,
    0
  );
  const avgDailyUsage = totalUsage / 365;
  const capacity = store.capacityKw;

  const hourlyData = Array.from({ length: 24 }, (_, hour) => {
    // 1. 사용량 패턴
    let usageRatio = 0.02;
    if (hour >= 8 && hour <= 18) usageRatio = 0.065;
    const deterministicNoise = Math.sin(hour * 999) * 0.1;
    const usage = avgDailyUsage * usageRatio * (1.0 + deterministicNoise);

    // 2. 발전량 패턴 (사다리꼴)
    let solarRatio = 0;
    if (hour >= 6 && hour <= 19) {
      const dist = Math.abs(hour - 12.5);
      solarRatio = Math.max(0, 1 - Math.pow(dist / 7.5, 2.5));
    }
    const generation = capacity * solarRatio * 0.8;

    // 3. 잉여 전력 데이터
    // (1) 수치용: 실제 남는 양 (0 이상)
    const surplusVal = Math.max(0, generation - usage);

    // (2) 차트용: [사용량 ~ 발전량] 범위 (발전량이 더 클 때만)
    const surplusRange = generation > usage ? [usage, generation] : null;

    return {
      hour: `${hour}시`,
      usage,
      generation,
      surplusVal, // ✅ 툴팁에 보여줄 숫자
      surplusRange, // 차트에 그릴 범위
    };
  });

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>RE100 에너지 발전 수익 분석 그래프</h3>

      <div className={styles.chartBox}>
        <h4 className={styles.chartTitle}>시간대별 전력 수급</h4>
        <div style={{ height: 350 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={hourlyData}
              margin={{ top: 20, right: 20, bottom: 0, left: 0 }}
            >
              {/* 빗금 패턴 정의 */}
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

              {/* ✅ 툴팁 설정 수정 */}
              <Tooltip
                labelStyle={{ color: '#334155', fontWeight: 'bold' }}
                itemStyle={{ fontSize: '0.85rem' }}
                formatter={(val: any, name: string, props: any) => {
                  // surplusRange(배열)는 숨김
                  if (name === 'range' || name === 'surplusRange')
                    return [null, null];
                  // 나머지는 소수점 1자리 + kW 표시
                  return [`${Number(val).toFixed(1)} kW`, name];
                }}
                // null을 반환한 항목(숨김 항목)을 아예 툴팁 박스에서 제거
                filterNull={true}
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                }}
              />

              <Legend verticalAlign="top" height={36} iconSize={10} />

              {/* 1. 전력 사용량 */}
              <Area
                type="monotone"
                dataKey="usage"
                name="전력 사용량"
                fill="#dbeafe"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={0.6}
              />

              {/* 2. 잉여 전력 (시각적 빗금 영역) */}
              <Area
                type="monotone"
                dataKey="surplusRange"
                name="range" // 툴팁에서 필터링할 이름
                stroke="none"
                fill="url(#stripePattern)"
                legendType="none"
              />

              {/* 3. 태양광 발전량 */}
              <Line
                type="monotone"
                dataKey="generation"
                name="태양광 발전"
                stroke="#f97316"
                strokeWidth={3}
                dot={false}
              />

              {/* ✅ 4. 잉여 전력 (데이터 표시용 투명 라인) */}
              {/* 화면엔 안 보이지만(stroke="none"), 툴팁에는 데이터(surplusVal)를 제공함 */}
              <Line
                type="monotone"
                dataKey="surplusVal"
                name="잉여 전력"
                stroke="none"
                dot={false}
                activeDot={false}
                legendType="rect" // 범례 아이콘 모양 (선 말고 네모로)
                strokeDasharray="3 3" // 범례 아이콘 스타일링용 (빨간 점선 느낌)
                strokeWidth={0}
                color="#ef4444" // 범례 색상
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

      {/* 영상 영역 */}
      <div className={styles.videoBox}>
        <h4 className={styles.videoTitle}>
          {store.selectedModel === 'KEPCO'
            ? '한전 판매형 프로세스'
            : '에너지 캐리어(EC) 운송 프로세스'}
        </h4>
        <div className={styles.videoWrapper}>
          {store.selectedModel === 'KEPCO' ? (
            <div className="bg-blue-100 h-40 flex items-center justify-center text-blue-600 font-bold">
              ⚡ 한전 송전탑으로 전송되는 애니메이션 (GIF)
            </div>
          ) : (
            <div className="bg-green-100 h-40 flex items-center justify-center text-green-600 font-bold">
              🚛 트럭이 잉여 전력을 싣고 가는 애니메이션 (GIF)
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
