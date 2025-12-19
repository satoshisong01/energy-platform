'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useProposalStore, MonthlyData } from '../lib/store';
import styles from './Step3_EnergyData.module.css';
import { LucideCopy, LucideTable, LucideUpload } from 'lucide-react';
import * as XLSX from 'xlsx'; // 엑셀 파싱 라이브러리

// [Helper Component] NumberInput (기존과 동일)
interface NumberInputProps {
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
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
    const raw = e.target.value.replace(/,/g, '');
    if (/^\d*\.?\d*$/.test(raw)) {
      setTempValue(raw);
      const num = parseFloat(raw);
      if (!isNaN(num)) onChange(num);
      else if (raw === '') onChange(0);
    }
  };

  return (
    <input
      type="text"
      className={`${styles.cellInput} ${className || ''}`}
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
// [Main Component]
// -------------------------------------------------------------------------

const TARIFF_OPTIONS = [
  { name: '산업용(을) 고압A - 선택2', rate: 8320, savings: 210.5 },
  { name: '산업용(갑)2 고압A - 선택2', rate: 7470, savings: 136.47 },
  { name: '일반용(갑) 1 저압', rate: 6160, savings: 114.4 },
  { name: '산업용(갑)1 저압', rate: 5550, savings: 108.4 },
];

export default function Step3_EnergyData() {
  const store = useProposalStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTariffChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const opt = TARIFF_OPTIONS.find((t) => t.name === e.target.value);
    if (opt) {
      store.setContractType(opt.name, opt.rate, opt.savings);
    }
  };

  const getDaysInMonth = (month: number) => new Date(2025, month, 0).getDate();

  const updateStore = (month: number, field: any, value: number) => {
    store.updateMonthlyData(month, field, value);
  };

  // [NEW] 엑셀 파일 처리 핸들러
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];

      // JSON으로 변환 (첫 줄은 헤더로 인식)
      // 예상 엑셀 포맷: [연월, 사용전력량, 자가소비, 피크치, 전기요금, 기본요금]
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

      // 데이터 파싱 및 매핑
      // 헤더 제외하고 데이터 행부터 시작 (보통 2번째 줄부터)
      const newData: MonthlyData[] = [];

      // 데이터 행 순회 (최대 12개)
      let count = 0;
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0 || count >= 12) continue;

        // 엑셀의 '연월' 컬럼 (예: "2025년 08월" or "2025-08") 파싱
        const yearMonthStr = String(row[0]);
        let year = 2025;
        let month = count + 1; // 기본값

        // "2025년 08월" 형식 파싱 시도
        const yearMatch = yearMonthStr.match(/(\d{4})/);
        const monthMatch = yearMonthStr.match(/(\d{1,2})월/);

        if (yearMatch) year = parseInt(yearMatch[1]);
        if (monthMatch) month = parseInt(monthMatch[1]);
        // "2025-08" 등 다른 형식일 경우 추가 로직 필요하나 일단 단순화

        newData.push({
          month: month,
          year: year, // [NEW] 년도 저장 (store 타입에 year 추가 필요)
          usageKwh: Number(row[1]) || 0,
          selfConsumption: Number(row[2]) || 0,
          peakKw: Number(row[3]) || 0,
          totalBill: Number(row[4]) || 0,
          baseBill: Number(row[5]) || 0,
          solarGeneration: 0, // 엑셀에 없으면 0 (자동계산됨)
        });
        count++;
      }

      // 12개월치가 안 되면 나머지는 빈 값으로 채움
      while (newData.length < 12) {
        newData.push({
          month: newData.length + 1,
          year: 2025,
          usageKwh: 0,
          selfConsumption: 0,
          totalBill: 0,
          baseBill: 0,
          peakKw: 0,
          solarGeneration: 0,
        });
      }

      // Store 업데이트 (setMonthlyData 액션 필요)
      // 만약 setMonthlyData가 없다면 monthlyData를 map으로 하나씩 업데이트해야 함
      // 여기서는 store.ts에 setMonthlyData가 있다고 가정하거나, 임시로 하나씩 업데이트
      if (store.setMonthlyData) {
        store.setMonthlyData(newData);
      } else {
        // fallback: 기존 데이터 덮어쓰기 (약간 비효율적)
        alert('Store에 setMonthlyData 액션을 추가해주세요!');
      }
    };
    reader.readAsBinaryString(file);
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
      <div className="flex items-center justify-between mb-4">
        <h3 className={styles.sectionTitle}>
          <span className={styles.stepBadge}>3</span> 전력 데이터 (Sheet 4, 5)
        </h3>

        {/* [NEW] 엑셀 업로드 버튼 */}
        <div className="flex gap-2">
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-3 py-1.5 text-xs bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 rounded transition font-bold"
          >
            <LucideUpload size={14} /> 엑셀 데이터 업로드
          </button>
        </div>
      </div>

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
          <table className={styles.complexTable} style={{ minWidth: '1600px' }}>
            <thead>
              <tr>
                <th
                  rowSpan={2}
                  className={`${styles.headerGray} ${styles.stickyCol}`}
                >
                  월 (기간)
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
                <th className={`${styles.headerBlue} min-w-[120px]`}>
                  사용량
                  <br />
                  (kWh)
                </th>
                <th
                  className={`${styles.headerBlue} ${styles.textBlue} min-w-[120px]`}
                >
                  자가소비
                  <br />
                  (kWh)
                </th>
                <th
                  className={`${styles.headerBlue} ${styles.textOrange} min-w-[120px]`}
                >
                  피크치
                  <br />
                  (kW)
                </th>
                <th
                  className={`${styles.headerBlue} ${styles.textBlue} min-w-[120px]`}
                >
                  발전량
                  <br />
                  (E열)
                </th>
                <th className={`${styles.headerBlue} min-w-[120px]`}>
                  잉여전력
                  <br />
                  (F열)
                </th>
                <th className={`${styles.headerOrange} min-w-[140px]`}>
                  전기요금
                  <br />
                  (A)
                </th>
                <th
                  className={`${styles.headerOrange} ${styles.textOrange} min-w-[140px]`}
                >
                  기본요금
                  <br />
                  (설치전)
                </th>
                <th
                  className={`${styles.headerOrange} ${styles.textOrange} min-w-[130px]`}
                >
                  최대부하
                  <br />
                  절감(D12)
                </th>
                <th
                  className={`${styles.headerOrange} ${styles.textOrange} min-w-[130px]`}
                >
                  절감후
                  <br />
                  피크산정
                </th>
                <th
                  className={`${styles.headerOrange} ${styles.textOrange} min-w-[130px]`}
                >
                  계:총절감
                  <br />
                  (F12)
                </th>
                <th
                  className={`${styles.headerOrange} ${styles.textBlue} min-w-[130px]`}
                >
                  설치후요금
                  <br />
                  (G12)
                </th>
                <th
                  className={`${styles.headerOrange} ${styles.textGreen} min-w-[130px]`}
                >
                  잉여수익
                  <br />
                  (H12)
                </th>
              </tr>
            </thead>
            <tbody>
              {computedData.map((row) => (
                <tr
                  key={`${row.year}-${row.month}`}
                  className={styles.tableRow}
                >
                  {/* [수정] 동적 년월 표시 */}
                  <td className={styles.stickyCol}>
                    {row.year ? `${String(row.year).slice(2)}년 ` : ''}
                    {row.month}월
                  </td>

                  <td>
                    <NumberInput
                      value={row.usageKwh}
                      onChange={(val) =>
                        updateStore(row.month, 'usageKwh', val)
                      }
                      placeholder="0"
                    />
                  </td>
                  {/* ... (나머지 셀들은 기존과 동일) ... */}
                  <td className={styles.bgBlueLight}>
                    <NumberInput
                      value={row.selfConsumption}
                      onChange={(val) =>
                        updateStore(row.month, 'selfConsumption', val)
                      }
                      placeholder="0"
                    />
                  </td>
                  <td style={{ background: '#fffbeb' }}>
                    <NumberInput
                      value={row.peakKw}
                      onChange={(val) => updateStore(row.month, 'peakKw', val)}
                      placeholder="0"
                    />
                  </td>
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
                      className={styles.textBlue}
                    />
                  </td>
                  <td className={styles.resultCell}>
                    {Math.round(row.surplusPower).toLocaleString()}
                  </td>
                  <td>
                    <NumberInput
                      value={row.totalBill}
                      onChange={(val) =>
                        updateStore(row.month, 'totalBill', val)
                      }
                      placeholder="0"
                    />
                  </td>
                  <td className={styles.bgOrangeLight}>
                    <NumberInput
                      value={row.baseBill}
                      onChange={(val) =>
                        updateStore(row.month, 'baseBill', val)
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
              {/* 소계 행 (기존과 동일) */}
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

        {/* 배지 및 비고 (기존과 동일) */}
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
