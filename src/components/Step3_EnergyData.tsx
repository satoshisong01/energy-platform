'use client';

import React from 'react';
import { useProposalStore } from '../lib/store';
import styles from './Step3_EnergyData.module.css';
import { LucideCopy } from 'lucide-react';

const TARIFF_OPTIONS = [
  { name: '산업용(을) 고압A - 선택2', rate: 8320, savings: 210.5 },
  { name: '산업용(갑)2 고압A - 선택2', rate: 7470, savings: 136.5 },
  { name: '일반용(갑) 1 저압', rate: 6160, savings: 114.4 },
  { name: '산업용(갑)1 저압', rate: 5550, savings: 108.4 },
];

export default function Step3_EnergyData() {
  const store = useProposalStore();

  const handleTariffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const opt = TARIFF_OPTIONS.find((t) => t.name === e.target.value);
    if (opt) {
      store.setContractType(opt.name, opt.rate, opt.savings);
    }
  };

  const getDaysInMonth = (month: number) => new Date(2025, month, 0).getDate();

  // 1. 비율 계산
  const totalUsageInput = store.monthlyData.reduce(
    (acc, cur) => acc + cur.usageKwh,
    0
  );
  const totalSelfConsumptionInput = store.monthlyData.reduce(
    (acc, cur) => acc + cur.selfConsumption,
    0
  );
  const dynamicPeakRatio =
    totalUsageInput > 0 ? totalSelfConsumptionInput / totalUsageInput : 0;

  // 2. 데이터 계산
  const computedData = store.monthlyData.map((data) => {
    const days = getDaysInMonth(data.month);
    const dailyGenHours = 3.64;
    const solarGeneration = store.capacityKw * dailyGenHours * days;

    const surplusPower = Math.max(0, solarGeneration - data.selfConsumption);
    const unitPriceSavings = store.unitPriceSavings || 136.5;
    const maxLoadSavings =
      Math.min(solarGeneration, data.selfConsumption) * unitPriceSavings;

    // 피크치 입력 여부에 따른 기본요금 절감
    let baseBillSavings = 0;
    if (data.peakKw > 0) {
      baseBillSavings = Math.max(
        0,
        data.baseBill - store.baseRate * data.peakKw
      );
    } else {
      baseBillSavings = data.baseBill * dynamicPeakRatio;
    }

    const totalSavings = maxLoadSavings + baseBillSavings;
    const afterBill = Math.max(0, data.totalBill - totalSavings);
    const unitPriceSell = store.unitPriceSell || 192.79;
    const surplusRevenue = surplusPower * unitPriceSell;

    return {
      ...data,
      solarGeneration,
      surplusPower,
      maxLoadSavings,
      baseBillSavings,
      totalSavings,
      afterBill,
      surplusRevenue,
    };
  });

  // 3. 합계(소계) 계산
  const totals = computedData.reduce(
    (acc, cur) => ({
      usageKwh: acc.usageKwh + cur.usageKwh,
      selfConsumption: acc.selfConsumption + cur.selfConsumption,
      solarGeneration: acc.solarGeneration + cur.solarGeneration,
      surplusPower: acc.surplusPower + cur.surplusPower,
      totalBill: acc.totalBill + cur.totalBill,
      baseBill: acc.baseBill + cur.baseBill,
      maxLoadSavings: acc.maxLoadSavings + cur.maxLoadSavings,
      baseBillSavings: acc.baseBillSavings + cur.baseBillSavings,
      totalSavings: acc.totalSavings + cur.totalSavings,
      afterBill: acc.afterBill + cur.afterBill,
      surplusRevenue: acc.surplusRevenue + cur.surplusRevenue,
    }),
    {
      usageKwh: 0,
      selfConsumption: 0,
      solarGeneration: 0,
      surplusPower: 0,
      totalBill: 0,
      baseBill: 0,
      maxLoadSavings: 0,
      baseBillSavings: 0,
      totalSavings: 0,
      afterBill: 0,
      surplusRevenue: 0,
    }
  );

  // (1) 기존 전기요금 절감율 (금액 기준)
  const savingRate =
    totals.totalBill > 0 ? (totals.totalSavings / totals.totalBill) * 100 : 0;

  // ✅ (2) [New] 최대부하비율 (물량 기준: 자가소비 / 사용량)
  const maxLoadRatio =
    totals.usageKwh > 0 ? (totals.selfConsumption / totals.usageKwh) * 100 : 0;

  return (
    <div>
      <h3 className={styles.sectionTitle}>
        <span className={styles.stepBadge}>3</span> 전력 데이터 (Sheet 4, 5)
      </h3>

      <div className={styles.card}>
        {/* 상단 컨트롤 */}
        <div className={styles.grid2}>
          <div>
            <label className={styles.label}>계약 종별</label>
            <select
              className={styles.select}
              value={store.contractType}
              onChange={handleTariffChange}
            >
              {TARIFF_OPTIONS.map((opt) => (
                <option key={opt.name} value={opt.name}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <label className={styles.label}>기본요금 단가</label>
              <div className={styles.inputReadOnly}>
                {store.baseRate.toLocaleString()} 원
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label className={styles.label}>절감단가</label>
              <div
                className={styles.inputReadOnly}
                style={{
                  backgroundColor: '#f0fdf4',
                  color: '#16a34a',
                  borderColor: '#bbf7d0',
                }}
              >
                {store.unitPriceSavings.toLocaleString()} 원
              </div>
            </div>
          </div>
        </div>

        <div
          className={styles.controls}
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '0.5rem',
          }}
        >
          <button
            onClick={store.copyJanToAll}
            className={styles.copyButton}
            title="1월 값 복사"
          >
            <LucideCopy size={14} /> 1월 값 일괄 적용
          </button>
        </div>

        {/* 테이블 */}
        <div className={styles.tableWrapper}>
          <table className={styles.complexTable} style={{ minWidth: '1400px' }}>
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className={`${styles.headerGray} ${styles.stickyCol}`}
                >
                  월
                </th>
                <th colSpan={3} className={styles.headerBlue}>
                  Sheet 4 (입력)
                </th>
                <th colSpan={2} className={styles.headerBlue}>
                  Sheet 4 (결과)
                </th>
                <th colSpan={2} className={styles.headerOrange}>
                  Sheet 5 (입력)
                </th>
                <th colSpan={5} className={styles.headerOrange}>
                  Sheet 5 (수익분석)
                </th>
              </tr>
              <tr>
                <th className={styles.headerBlue}>
                  사용량
                  <br />
                  (kWh)
                </th>
                <th className={`${styles.headerBlue} ${styles.textBlue}`}>
                  자가소비
                  <br />
                  (kWh)
                </th>
                <th className={`${styles.headerBlue} ${styles.textOrange}`}>
                  피크치
                  <br />
                  (kW)
                </th>
                <th className={`${styles.headerBlue} ${styles.textBlue}`}>
                  발전량
                  <br />
                  (E열)
                </th>
                <th className={styles.headerBlue}>
                  잉여전력
                  <br />
                  (F열)
                </th>
                <th className={styles.headerOrange}>
                  전체요금
                  <br />
                  (A)
                </th>
                <th className={`${styles.headerOrange} ${styles.textOrange}`}>
                  기본요금
                  <br />
                  (설치전)
                </th>
                <th className={`${styles.headerOrange} ${styles.textOrange}`}>
                  최대부하
                  <br />
                  절감(D12)
                </th>
                <th className={`${styles.headerOrange} ${styles.textOrange}`}>
                  절감후
                  <br />
                  피크산정
                </th>
                <th className={`${styles.headerOrange} ${styles.textOrange}`}>
                  계:총절감
                  <br />
                  (F12)
                </th>
                <th className={`${styles.headerOrange} ${styles.textBlue}`}>
                  설치후요금
                  <br />
                  (G12)
                </th>
                <th className={`${styles.headerOrange} ${styles.textGreen}`}>
                  잉여수익
                  <br />
                  (H12)
                </th>
              </tr>
            </thead>
            <tbody>
              {computedData.map((row) => (
                <tr key={row.month} className={styles.tableRow}>
                  <td className={styles.stickyCol}>{row.month}</td>
                  {/* 입력 */}
                  <td>
                    <input
                      type="number"
                      className={styles.cellInput}
                      value={row.usageKwh || ''}
                      onChange={(e) =>
                        store.updateMonthlyData(
                          row.month,
                          'usageKwh',
                          Number(e.target.value)
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className={styles.bgBlueLight}>
                    <input
                      type="number"
                      className={styles.cellInput}
                      value={row.selfConsumption || ''}
                      onChange={(e) =>
                        store.updateMonthlyData(
                          row.month,
                          'selfConsumption',
                          Number(e.target.value)
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td style={{ background: '#fffbeb' }}>
                    <input
                      type="number"
                      className={styles.cellInput}
                      value={row.peakKw || ''}
                      onChange={(e) =>
                        store.updateMonthlyData(
                          row.month,
                          'peakKw',
                          Number(e.target.value)
                        )
                      }
                      placeholder="0"
                    />
                  </td>

                  {/* 결과 */}
                  <td
                    className={`${styles.resultCell} ${styles.textBlue} ${styles.bold}`}
                  >
                    {Math.round(row.solarGeneration).toLocaleString()}
                  </td>
                  <td className={styles.resultCell}>
                    {Math.round(row.surplusPower).toLocaleString()}
                  </td>
                  <td>
                    <input
                      type="number"
                      className={styles.cellInput}
                      value={row.totalBill || ''}
                      onChange={(e) =>
                        store.updateMonthlyData(
                          row.month,
                          'totalBill',
                          Number(e.target.value)
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className={styles.bgOrangeLight}>
                    <input
                      type="number"
                      className={styles.cellInput}
                      value={row.baseBill || ''}
                      onChange={(e) =>
                        store.updateMonthlyData(
                          row.month,
                          'baseBill',
                          Number(e.target.value)
                        )
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className={`${styles.resultCell} ${styles.textOrange}`}>
                    {Math.round(row.maxLoadSavings).toLocaleString()}
                  </td>
                  <td className={`${styles.resultCell} ${styles.textOrange}`}>
                    {Math.round(row.baseBillSavings).toLocaleString()}
                  </td>
                  <td
                    className={`${styles.resultCell} ${styles.textOrange} ${styles.bgTotalSavings}`}
                  >
                    {Math.round(row.totalSavings).toLocaleString()}
                  </td>
                  <td
                    className={`${styles.resultCell} ${styles.textBlue} ${styles.bgAfterBill}`}
                  >
                    {Math.round(row.afterBill).toLocaleString()}
                  </td>
                  <td
                    className={`${styles.resultCell} ${styles.textGreen} ${styles.bold}`}
                  >
                    {Math.round(row.surplusRevenue).toLocaleString()}
                  </td>
                </tr>
              ))}
              {/* 소계 행 */}
              <tr
                style={{
                  borderTop: '2px solid #cbd5e1',
                  fontWeight: 'bold',
                  backgroundColor: '#1e293b',
                  color: 'white',
                }}
              >
                <td
                  className={styles.stickyCol}
                  style={{
                    backgroundColor: '#0f172a',
                    color: 'white',
                    textAlign: 'center',
                  }}
                >
                  소계
                </td>
                <td className={styles.resultCell} style={{ color: 'white' }}>
                  {totals.usageKwh.toLocaleString()}
                </td>
                <td className={styles.resultCell} style={{ color: 'white' }}>
                  {totals.selfConsumption.toLocaleString()}
                </td>
                <td className={styles.resultCell} style={{ color: 'white' }}>
                  -
                </td>
                <td className={styles.resultCell} style={{ color: 'white' }}>
                  {Math.round(totals.solarGeneration).toLocaleString()}
                </td>
                <td className={styles.resultCell} style={{ color: 'white' }}>
                  {Math.round(totals.surplusPower).toLocaleString()}
                </td>
                <td className={styles.resultCell} style={{ color: 'white' }}>
                  {totals.totalBill.toLocaleString()}
                </td>
                <td className={styles.resultCell} style={{ color: 'white' }}>
                  {totals.baseBill.toLocaleString()}
                </td>
                <td className={styles.resultCell} style={{ color: '#fbbf24' }}>
                  {Math.round(totals.maxLoadSavings).toLocaleString()}
                </td>
                <td className={styles.resultCell} style={{ color: '#fbbf24' }}>
                  {Math.round(totals.baseBillSavings).toLocaleString()}
                </td>
                <td className={styles.resultCell} style={{ color: '#fbbf24' }}>
                  {Math.round(totals.totalSavings).toLocaleString()}
                </td>
                <td className={styles.resultCell} style={{ color: '#bae6fd' }}>
                  {Math.round(totals.afterBill).toLocaleString()}
                </td>
                <td className={styles.resultCell} style={{ color: '#4ade80' }}>
                  {Math.round(totals.surplusRevenue).toLocaleString()}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* ✅ [수정] 배지 영역 (2개 나란히 배치) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          {/* 1. 최대부하 비율 (Blue) */}
          <div
            className={styles.savingRateBadge}
            style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}
          >
            최대부하비율{' '}
            <span style={{ marginLeft: '0.5rem' }}>
              {maxLoadRatio.toFixed(1)}%
            </span>
          </div>

          {/* 2. 기존 전기요금 절감율 (Pink) */}
          <div className={styles.savingRateBadge}>
            기존 전기요금 절감율{' '}
            <span style={{ marginLeft: '0.5rem' }}>
              {savingRate.toFixed(1)}%
            </span>
          </div>
        </div>

        <div className={styles.footerNote}>
          * 피크치(kW) 입력 시: [기본요금 - (단가 × 피크치)] 공식 적용
          <br />* 피크치 미입력 시: [기본요금 × 최대부하율] 공식 적용
        </div>
      </div>
    </div>
  );
}
