'use client';

import React from 'react';
import { useProposalStore } from '../lib/store';
import styles from './PreviewPanel.module.css';
import { LucidePrinter } from 'lucide-react';

// 분리된 컴포넌트 임포트
import PreviewChart from './preview/PreviewChart';
import PreviewDetailTable from './preview/PreviewDetailTable';
import PreviewFinancialTable from './preview/PreviewFinancialTable';
import {
  PreviewModelGraph,
  PreviewModelImage,
} from './preview/PreviewModelVisual';
import PreviewComparisonTable from './preview/PreviewComparisonTable';
import PreviewSummary from './preview/PreviewSummary';
import PreviewRequirementsTable from './preview/PreviewRequirementsTable';
import PreviewSiteAnalysis from './preview/PreviewSiteAnalysis';
import { computeMonthlyEnergyMetrics } from '../lib/energyCalculations';

// [Helper] 반올림
const round2 = (num: number) => Math.round(num * 100) / 100;

// ----------------------------------------------------------------
// [수정] 페이지 하단 Footer 컴포넌트
// ----------------------------------------------------------------
const PageFooter = ({ page }: { page: number }) => {
  const store = useProposalStore();

  const rawName = store.getProposalFileName();

  const displayName = rawName.includes('/')
    ? rawName.split('/').pop()
    : rawName;

  return (
    <div className={styles.pageFooter}>
      <span className={styles.pageNumber}>- {page} -</span>
      <span className={styles.projectName}>{displayName}</span>
    </div>
  );
};

export default function PreviewPanel() {
  const store = useProposalStore();
  const {
    config,
    rationalization,
    truckCount,
    isSurplusDiscarded,
    isEcSelfConsumption,
    ecSelfConsumptionCount,
  } = store;
  const isGap = store.contractType.includes('(갑)');

  const handlePrint = () => {
    window.print();
  };

  const {
    computedData: baseComputedData,
    totals,
    savingRate,
    customSavingRate,
    maxLoadRatio,
    totalBenefit,
  } = computeMonthlyEnergyMetrics({
    monthlyData: store.monthlyData,
    capacityKw: store.capacityKw,
    baseRate: store.baseRate,
    unitPriceSavings: store.unitPriceSavings || config.unit_price_savings || 0,
    config,
    isGap,
  });

  const computedData = baseComputedData.map((row) => ({
    ...row,
    name: `${row.month}월`,
    설치전: row.totalBill / 10000,
    설치후: row.afterBill / 10000,
  }));

  // [수정 3] 누락되었던 연간 발전량 계산 함수 추가 (헤더 표시용)
  const calculateAnnualGen = () => {
    const solarRadiation = config.solar_radiation || 3.8;
    return store.monthlyData.reduce((acc, cur) => {
      const days = new Date(2025, cur.month, 0).getDate();
      return acc + store.capacityKw * solarRadiation * days;
    }, 0);
  };

  // ----------------------------------------------------------------
  // UI 렌더링
  // ----------------------------------------------------------------
  return (
    <div className={styles.a4Page} id="print-area">
      {/* [페이지 1] 표지 + 요약 */}
      <div
        className="print-page-center"
        style={{ position: 'relative', marginTop: '10px' }}
      >
        <div className={styles.header} style={{ width: '100%' }}>
          <div className={styles.logoBox}>FIRST C&D</div>
          <div className={styles.companyInfo}>
            <h2 className={styles.companyName}>(주)퍼스트씨앤디</h2>
            <p className={styles.companySub}>FIRST C&D Inc.</p>
          </div>
          {/* 상단 컨트롤바가 따로 없으므로 여기 버튼 유지 */}
          <button
            onClick={handlePrint}
            className={`${styles.printButton} no-print`}
          >
            <LucidePrinter size={18} /> PDF 저장 / 인쇄
          </button>
        </div>

        <div className={styles.titleSection} style={{ width: '100%' }}>
          <div>
            <h1
              className={styles.mainTitle}
              style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
            >
              <span>
                <span className={styles.highlight}>RE100</span> 에너지
                발전시스템 분석자료
              </span>

              {/* 한전 판매 가능/불가능 상태 표시 배지 */}
              <span
                style={{
                  fontSize: '0.5em',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  border: isSurplusDiscarded
                    ? '1px solid #ef4444'
                    : '1px solid #3b82f6',
                  backgroundColor: isSurplusDiscarded ? '#fef2f2' : '#eff6ff',
                  color: isSurplusDiscarded ? '#dc2626' : '#2563eb',
                  verticalAlign: 'middle',
                  fontWeight: 'bold',
                }}
              >
                {isSurplusDiscarded ? '한전 판매 불가능' : '한전 판매 가능'}
              </span>
            </h1>
            <h2 className={styles.subTitle}>
              - {store.clientName} (태양광발전{' '}
              {store.capacityKw.toLocaleString()}kW
              {/* EC 상태 표시 로직 */}
              {isEcSelfConsumption
                ? `, 자가소비 EC ${ecSelfConsumptionCount}대`
                : store.useEc && truckCount > 0
                ? `, 이동형 EC ${truckCount}대`
                : ''}
              ) -
            </h2>
            {/* [추가] 일조량 표시 */}
            <div className="text-xs text-slate-500 mt-1">
              * 적용 일조량: {config.solar_radiation || 3.8} 시간/일
            </div>
          </div>
          <div className={styles.contractCard}>
            <div className={styles.contractLabel}>적용 계약 종별</div>
            <div className={styles.contractValue}>{store.contractType}</div>
          </div>
        </div>

        <div style={{ width: '100%', marginTop: '10px' }}>
          <PreviewSummary />
        </div>
        <PageFooter page={1} />
      </div>

      {/* [페이지 2] 설치 공간 분석 */}
      <div
        className="print-page-center"
        style={{ position: 'relative', marginTop: '20px' }}
      >
        <div style={{ width: '100%' }}>
          <PreviewSiteAnalysis />
        </div>
        <PageFooter page={2} />
      </div>

      {/* [페이지 3] 차트 */}
      <div className="print-page-center" style={{ position: 'relative' }}>
        <div style={{ width: '100%' }}>
          <PreviewChart
            data={computedData}
            savingRate={savingRate}
            customSavingRate={customSavingRate}
            contractType={store.contractType}
            baseRate={store.baseRate}
          />
        </div>
        <p>　</p>
        <div style={{ height: '100%' }}></div>
        <PageFooter page={3} />
      </div>

      {/* [페이지 4] 상세 데이터 테이블 */}
      <div
        className="print-page-center"
        style={{ position: 'relative', marginTop: '20px' }}
      >
        <div style={{ width: '100%' }}>
          <PreviewDetailTable
            data={computedData}
            totals={totals}
            savingRate={savingRate}
            customSavingRate={customSavingRate}
            maxLoadRatio={maxLoadRatio}
            totalBenefit={totalBenefit}
          />
        </div>
        <p>　</p>
        <p>　</p>
        <div style={{ height: '100%' }}></div>
        <PageFooter page={4} />
      </div>

      {/* [페이지 5] 투자 및 수익 분석 */}
      <div className="print-page-center" style={{ position: 'relative' }}>
        <div style={{ width: '100%' }}>
          <PreviewFinancialTable />
        </div>
        <PageFooter page={5} />
      </div>

      {/* [페이지 6] 모델 비주얼 - 그래프 */}
      <div className="print-page-center" style={{ position: 'relative' }}>
        <div style={{ width: '100%' }}>
          <PreviewModelGraph /> {/* 그래프 컴포넌트 */}
        </div>
        <p>　</p>
        <PageFooter page={6} />
      </div>

      {/* [페이지 7] 모델 비주얼 - 이미지/영상 */}
      <div className="print-page-center" style={{ position: 'relative' }}>
        <div style={{ width: '100%' }}>
          <PreviewModelImage /> {/* 이미지 컴포넌트 */}
        </div>
        <p>　</p>
        <PageFooter page={7} />
      </div>

      {/* [페이지 8] 비교 테이블 */}
      <div
        className="print-page-center"
        style={{ position: 'relative', marginTop: '20px' }}
      >
        <div style={{ width: '100%' }}>
          <PreviewComparisonTable />
        </div>
        <PageFooter page={8} />
      </div>

      {/* [페이지 9] 사업 조건 및 구비 서류 */}
      <div className="print-page-center" style={{ position: 'relative' }}>
        <div style={{ width: '100%' }}>
          <PreviewRequirementsTable />
          <div className={styles.footer} style={{ marginTop: '60px' }}>
            <div className={styles.contactInfo}>
              <div>김 종 우 &nbsp;|&nbsp; 010.5617.9500</div>
              <div>jongwoo@firstcorea.com</div>
              <div>www.firstcorea.com</div>
            </div>
          </div>
        </div>
        <PageFooter page={9} />
      </div>
    </div>
  );
}
