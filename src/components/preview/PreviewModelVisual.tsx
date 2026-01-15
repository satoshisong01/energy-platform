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

// [수정] 차트 데이터 생성 로직 (EC 방전 로직 추가)
const useChartData = () => {
  const store = useProposalStore();

  // 1. 연간 데이터 가져오기
  const totalUsageYear = store.monthlyData.reduce(
    (acc, cur) => acc + cur.usageKwh,
    0
  );
  const initialAnnualGen = store.monthlyData.reduce((acc, cur) => {
    const days = new Date(2025, cur.month, 0).getDate();
    return acc + store.capacityKw * 3.64 * days;
  }, 0);

  // 2. 실제 잉여 전력량 계산
  const totalSelfConsumption = store.monthlyData.reduce(
    (acc, cur) => acc + cur.selfConsumption,
    0
  );

  // 3. 하루 평균 데이터 계산
  const dailyGenAvg = initialAnnualGen / 365;
  const dailySelfAvg = totalSelfConsumption / 365;

  // 4. 시간대별 패턴
  const solarPattern = [
    0, 0, 0, 0, 0, 0, 0.02, 0.08, 0.15, 0.22, 0.26, 0.28, 0.26, 0.22, 0.15,
    0.08, 0.02, 0, 0, 0, 0, 0, 0, 0,
  ];
  const solarPatternSum = solarPattern.reduce((a, b) => a + b, 0);

  const usagePattern = [
    0.03, 0.03, 0.03, 0.03, 0.04, 0.05, 0.07, 0.09, 0.1, 0.1, 0.1, 0.1, 0.1,
    0.1, 0.1, 0.1, 0.09, 0.07, 0.06, 0.05, 0.04, 0.04, 0.03, 0.03,
  ];
  const usagePatternSum = usagePattern.reduce((a, b) => a + b, 0);

  // --- [Step 1] 기본 데이터 생성 및 총 잉여량 계산 ---
  let dailyTotalSurplus = 0; // 하루 동안 발생하는 총 잉여 전력 (충전 가능량)

  const tempData = Array.from({ length: 24 }, (_, hour) => {
    const generation = (solarPattern[hour] * dailyGenAvg) / solarPatternSum;
    let usage = (usagePattern[hour] * dailySelfAvg) / usagePatternSum;

    if (generation > 0 && usage > generation) {
      usage = generation * 0.95;
    }

    const surplusVal = Math.max(0, generation - usage);
    dailyTotalSurplus += surplusVal; // 잉여 누적

    return {
      hour,
      hourLabel: `${hour}시`,
      usage,
      generation,
      surplusVal,
      ecDischarge: 0, // 초기화
    };
  });

  // --- [Step 2] EC 방전 시뮬레이션 (밤 시간대 사용량 커버) ---
  // EC 사용 조건: EC 옵션이 켜져있고, 한전 모델이 아닐 때
  if (store.useEc && store.selectedModel !== 'KEPCO') {
    let remainingEnergy = dailyTotalSurplus; // 배터리 잔량 (하루 잉여량만큼 충전되었다고 가정)

    // 전략: 저녁(16시~)부터 사용하고, 남으면 새벽(0시~)에 사용

    // 1. 오후/저녁 시간대 (16시 ~ 23시)
    for (let i = 16; i < 24; i++) {
      const row = tempData[i];
      // 발전량보다 사용량이 많은 구간(Deficit) 찾기
      const deficit = Math.max(0, row.usage - row.generation);

      if (deficit > 0 && remainingEnergy > 0) {
        const dischargeAmount = Math.min(deficit, remainingEnergy);
        row.ecDischarge = dischargeAmount;
        remainingEnergy -= dischargeAmount;
      }
    }

    // 2. 새벽/아침 시간대 (00시 ~ 09시) - 저녁에 쓰고 남은게 있다면
    for (let i = 0; i < 10; i++) {
      const row = tempData[i];
      const deficit = Math.max(0, row.usage - row.generation);

      if (deficit > 0 && remainingEnergy > 0) {
        const dischargeAmount = Math.min(deficit, remainingEnergy);
        row.ecDischarge = dischargeAmount;
        remainingEnergy -= dischargeAmount;
      }
    }
  }

  // --- [Step 3] 최종 데이터 포맷팅 ---
  const hourlyData = tempData.map((row) => ({
    ...row,
    hour: row.hourLabel,
    // 그래프 표현용: 잉여 영역 (발전 > 사용)
    surplusRange:
      row.generation > row.usage ? [row.usage, row.generation] : null,
  }));

  return { hourlyData };
};

export function PreviewModelGraph() {
  const { hourlyData } = useChartData();

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        RE100 에너지 발전 수익 분석 그래프 (일일 평균)
      </h3>
      <div className={styles.chartBox}>
        <h4 className={styles.chartTitle}>시간대별 전력 수급 패턴</h4>
        <div style={{ height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={hourlyData}
              margin={{ top: 20, right: 20, bottom: 0, left: 0 }}
            >
              <defs>
                {/* 잉여 전력 패턴 (빨강 빗금) */}
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
                {/* EC 방전 패턴 (초록 빗금 - 선택사항, 여기선 solid color 사용예정) */}
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

              {/* 1. 기본 사용량 (파랑) */}
              <Area
                type="monotone"
                dataKey="usage"
                name="전력 사용량"
                fill="#dbeafe"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={0.6}
              />

              {/* 2. EC 방전량 (초록) - 사용량 위에 덮어씌움 */}
              <Area
                type="monotone"
                dataKey="ecDischarge"
                name="EC 공급 (저장전력)"
                fill="#4ade80" // 밝은 초록색
                stroke="#16a34a" // 진한 초록색
                strokeWidth={2}
                fillOpacity={0.8}
              />

              {/* 3. 잉여 전력 영역 (빨강 빗금) */}
              <Area
                type="monotone"
                dataKey="surplusRange"
                name="range"
                stroke="none"
                fill="url(#stripePattern)"
                legendType="none"
              />

              {/* 4. 태양광 발전량 (주황 선) */}
              <Line
                type="monotone"
                dataKey="generation"
                name="태양광 발전"
                stroke="#f97316"
                strokeWidth={3}
                dot={false}
              />

              {/* 5. 잉여 전력 선 (빨강 선) - 시각적 강조용 */}
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
            빨간색 빗금
          </span>
          : 잉여 전력 (충전) /{' '}
          <span style={{ color: '#16a34a', fontWeight: 'bold' }}>
            초록색 영역
          </span>
          : EC 공급 (방전)
          <br />
          <span className="text-gray-400 text-xs">
            (낮에 남은 전력을 저장했다가, 태양광이 없는 아침/저녁 시간대에
            사용합니다)
          </span>
        </p>
      </div>
    </div>
  );
}

// ... (PreviewModelImage 컴포넌트는 기존과 동일하므로 생략) ...
export function PreviewModelImage() {
  const store = useProposalStore();
  const isKepco = store.selectedModel === 'KEPCO';
  const truckCount = store.truckCount;

  const videoSrc = truckCount === 2 ? '/videos/direct.mp4' : '/videos/egc.mp4';
  const videoCaptureImage =
    truckCount === 2 ? '/images/direct_capture.png' : '/images/egc_capture.png';
  const kepcoImageSrc = '/images/direct_sale.jpg';
  const title = isKepco
    ? '한전 판매형 프로세스'
    : `에너지 캐리어(EC) 운송 프로세스 (${truckCount}대 운용)`;

  return (
    <div className={styles.container}>
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
          {title}
        </h4>
        <div className={styles.videoWrapper} style={{ height: '500px' }}>
          {isKepco ? (
            <img
              src={kepcoImageSrc}
              className="w-full h-full object-contain rounded-lg"
              alt="한전 판매 프로세스"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <>
              <video
                src={videoSrc}
                className="w-full h-full object-contain rounded-lg print-hide"
                autoPlay
                loop
                muted
                playsInline
              />
              <img
                src={videoCaptureImage}
                className="w-full h-full object-contain rounded-lg print-show"
                alt="EC 운송 프로세스 캡처"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PreviewModelGraph;
