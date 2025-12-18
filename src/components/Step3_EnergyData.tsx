'use client';

import React, { useState, useEffect } from 'react';
import { useProposalStore } from '../lib/store';
import styles from './Step3_EnergyData.module.css';
import { LucideCopy, LucideTable } from 'lucide-react';

// -------------------------------------------------------------------------
// [Helper Component] 소수점 입력 및 포맷팅을 위한 커스텀 인풋
// -------------------------------------------------------------------------
interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string; // 추가 스타일용
}

const NumberInput = ({
  value,
  onChange,
  disabled,
  placeholder,
  className,
}: NumberInputProps) => {
  const [tempValue, setTempValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      // 0보다 클 때만 포맷팅, 0이면 빈값 처리 (placeholder 보이게) or '0'
      // 기존 로직상 0이어도 보여야 하는 필드가 있고 아닌 게 있어서, 여기서는 값 그대로 표시
      setTempValue(
        value !== undefined && value !== null
          ? value.toLocaleString(undefined, { maximumFractionDigits: 2 })
          : ''
      );
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setTempValue(value !== undefined && value !== null ? value.toString() : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, ''); // 콤마 제거

    // 숫자와 점(.)만 허용
    if (/^\d*\.?\d*$/.test(raw)) {
      setTempValue(raw);
      const num = parseFloat(raw);
      if (!isNaN(num)) {
        onChange(num);
      } else if (raw === '') {
        onChange(0);
      }
    }
  };

  return (
    <input
      type="text"
      className={`${styles.cellInput} ${className || ''}`} // 기존 스타일 클래스 유지
      value={tempValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
};

// -------------------------------------------------------------------------
// [Main Component] Step3_EnergyData
// -------------------------------------------------------------------------

const TARIFF_OPTIONS = [
  { name: '산업용(을) 고압A - 선택2', rate: 8320, savings: 210.5 },
  { name: '산업용(갑)2 고압A - 선택2', rate: 7470, savings: 136.47 },
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

  // store update helper
  const updateStore = (month: number, field: any, value: number) => {
    store.updateMonthlyData(month, field, value);
  };

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
    const autoSolarGen = store.capacityKw * dailyGenHours * days;
    const solarGeneration =
      data.solarGeneration > 0 ? data.solarGeneration : autoSolarGen;
    const surplusPower = Math.max(0, solarGeneration - data.selfConsumption);

    const unitPriceSavings = store.unitPriceSavings || 136.47;
    const maxLoadSavings =
      Math.min(solarGeneration, data.selfConsumption) * unitPriceSavings;

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
      autoSolarGen,
      surplusPower,
      maxLoadSavings,
      baseBillSavings,
      totalSavings,
      afterBill,
      surplusRevenue,
    };
  });

  // 3. 합계 계산
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

  const savingRate =
    totals.totalBill > 0 ? (totals.totalSavings / totals.totalBill) * 100 : 0;
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

        {/* 테이블 (minWidth 조정으로 잘림 방지) */}
        <div className={styles.tableWrapper}>
          <table className={styles.complexTable} style={{ minWidth: '1500px' }}>
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
                  전기요금
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

                  {/* 사용량 (NumberInput 적용) */}
                  <td>
                    <NumberInput
                      value={row.usageKwh}
                      onChange={(val) =>
                        updateStore(row.month, 'usageKwh', val)
                      }
                      placeholder="0"
                    />
                  </td>

                  {/* 자가소비 (NumberInput 적용) */}
                  <td className={styles.bgBlueLight}>
                    <NumberInput
                      value={row.selfConsumption}
                      onChange={(val) =>
                        updateStore(row.month, 'selfConsumption', val)
                      }
                      placeholder="0"
                    />
                  </td>

                  {/* 피크치 (NumberInput 적용) */}
                  <td style={{ background: '#fffbeb' }}>
                    <NumberInput
                      value={row.peakKw}
                      onChange={(val) => updateStore(row.month, 'peakKw', val)}
                      placeholder="0"
                    />
                  </td>

                  {/* 발전량 (NumberInput 적용 - 자동값 placeholder) */}
                  <td
                    className={`${styles.resultCell} ${styles.textBlue} ${styles.bold}`}
                  >
                    <NumberInput
                      value={row.solarGeneration}
                      onChange={(val) =>
                        updateStore(row.month, 'solarGeneration', val)
                      }
                      placeholder={Math.round(
                        row.autoSolarGen
                      ).toLocaleString()}
                      className={styles.textBlue} // 파란색 텍스트 유지
                    />
                  </td>

                  {/* 결과: 잉여전력 (ReadOnly) */}
                  <td className={styles.resultCell}>
                    {Math.round(row.surplusPower).toLocaleString()}
                  </td>

                  {/* 전체요금 (NumberInput 적용) */}
                  <td>
                    <NumberInput
                      value={row.totalBill}
                      onChange={(val) =>
                        updateStore(row.month, 'totalBill', val)
                      }
                      placeholder="0"
                    />
                  </td>

                  {/* 기본요금 (NumberInput 적용) */}
                  <td className={styles.bgOrangeLight}>
                    <NumberInput
                      value={row.baseBill}
                      onChange={(val) =>
                        updateStore(row.month, 'baseBill', val)
                      }
                      placeholder="0"
                    />
                  </td>

                  {/* --- 계산 결과 필드들 (ReadOnly) --- */}
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

        {/* 배지 영역 */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '1rem',
            marginTop: '1rem',
          }}
        >
          <div
            className={styles.savingRateBadge}
            style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}
          >
            최대부하비율{' '}
            <span style={{ marginLeft: '0.5rem' }}>
              {maxLoadRatio.toFixed(1)}%
            </span>
          </div>
          <div className={styles.savingRateBadge}>
            기존 전기요금 절감율{' '}
            <span style={{ marginLeft: '0.5rem' }}>
              {savingRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* 비고란 */}
        <div style={{ marginTop: '1.5rem', marginBottom: '1rem' }}>
          <label
            className={styles.label}
            style={{
              marginBottom: '0.5rem',
              display: 'block',
              fontWeight: 'bold',
              color: '#475569',
            }}
          >
            비고 (특이사항)
          </label>
          <textarea
            className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            style={{ minHeight: '80px', resize: 'vertical' }}
            value={store.energyNote || ''}
            onChange={(e) => store.setEnergyNote(e.target.value)}
            placeholder="전력 데이터 관련 특이사항이나 메모를 입력하세요."
          />
        </div>

        <div className={styles.footerNote}>
          * 피크치(kW) 입력 시: [기본요금 - (단가 × 피크치)] 공식 적용
          <br />* 피크치 미입력 시: [기본요금 × 최대부하율] 공식 적용
        </div>
      </div>
    </div>
  );
}
