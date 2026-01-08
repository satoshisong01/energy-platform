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

// [Helper] 반올림
const round2 = (num: number) => Math.round(num * 100) / 100;

// ----------------------------------------------------------------
// [수정] 페이지 하단 Footer 컴포넌트 (폴더명 제거 로직 추가)
// ----------------------------------------------------------------
const PageFooter = ({ page }: { page: number }) => {
  const { proposalName, clientName } = useProposalStore();

  // 1. 기본 이름 가져오기
  const rawName = proposalName || `${clientName} 태양광 발전 제안서`;

  // 2. [핵심] 만약 이름에 '/'가 있다면 뒤쪽(파일명)만 잘라내기
  // 예: "인스케이프/분석자료_..." -> "분석자료_..."
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
  const { config, rationalization, truckCount } = store;

  const handlePrint = () => {
    window.print();
  };

  const getDaysInMonth = (month: number) => new Date(2025, month, 0).getDate();

  // ----------------------------------------------------------------
  // [1] 월별 데이터 계산 (기존 코드 유지)
  // ----------------------------------------------------------------
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
    const totalUsage = store.monthlyData.reduce(
      (acc, cur) => acc + cur.usageKwh,
      0
    );
    const totalSelf = store.monthlyData.reduce(
      (acc, cur) => acc + cur.selfConsumption,
      0
    );
    const dynamicPeakRatio = totalUsage > 0 ? totalSelf / totalUsage : 0;

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
      name: `${data.month}월`,
      설치전: data.totalBill / 10000,
      설치후: afterBill / 10000,
    };
  });

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
  const totalBenefit = totals.totalSavings + totals.surplusRevenue;

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
          <button
            onClick={handlePrint}
            className={`${styles.printButton} no-print`}
          >
            <LucidePrinter size={18} /> PDF 저장 / 인쇄
          </button>
        </div>

        <div className={styles.titleSection} style={{ width: '100%' }}>
          <div>
            <h1 className={styles.mainTitle}>
              <span className={styles.highlight}>RE100</span> 에너지 발전시스템
              분석자료
            </h1>
            <h2 className={styles.subTitle}>
              - {store.clientName} (태양광발전{' '}
              {store.capacityKw.toLocaleString()}kW) -
            </h2>
          </div>
          <div className={styles.contractCard}>
            <div className={styles.contractLabel}>적용 계약 종별</div>
            <div className={styles.contractValue}>{store.contractType}</div>
          </div>
        </div>

        <div style={{ width: '100%', marginTop: '20px' }}>
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
      <div className="print-page-center" style={{ position: 'relative' }}>
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
