'use client';

import React, { useState } from 'react';
import { useProposalStore } from '../src/lib/store';
import styles from './page.module.css';
import {
  LucideSun,
  LucideSettings,
  LucideSave,
  LucideFolderOpen,
} from 'lucide-react';

// 분리한 컴포넌트들 임포트
import Step1_BasicInfo from '../src/components/Step1_BasicInfo';
import Step2_SiteInfo from '../src/components/Step2_SiteInfo';
import Step3_EnergyData from '../src/components/Step3_EnergyData';
import Step4_Simulation from '../src/components/Step4_Simulation';
import PreviewPanel from '../src/components/PreviewPanel';
import ConfigModal from '../src/components/ConfigModal';
import Step5_Comparison from '@/src/components/Step5_Comparison';

// [NEW] 새로 만든 불러오기 팝업 임포트
import ProposalListModal from '../src/components/ProposalListModal';

export default function Home() {
  const store = useProposalStore();

  // 팝업 상태 관리
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false); // [NEW] 불러오기 팝업 상태

  // [수정됨] 저장 핸들러 (이름 입력 + 타입 에러 해결)
  const handleSave = async () => {
    const defaultName = store.proposalName || `${store.clientName} 견적서`;
    const name = window.prompt('견적서 저장 이름을 입력해주세요:', defaultName);

    if (name !== null) {
      const finalName = name.trim() === '' ? defaultName : name;
      await store.saveProposal(finalName);
    }
  };

  return (
    <main className={styles.container}>
      {/* ------------------------------------------------------------
          ⚙️ 설정 팝업 (Modal)
      ------------------------------------------------------------ */}
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />

      {/* ------------------------------------------------------------
          📂 불러오기 팝업 (Modal) - [NEW] 여기에 추가
      ------------------------------------------------------------ */}
      <ProposalListModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
      />

      {/* ------------------------------------------------------------
          👈 좌측: 입력 패널 (Input Zone)
      ------------------------------------------------------------ */}
      <section className={styles.inputPanel}>
        {/* Sticky Header */}
        <div className={styles.stickyHeader}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <h1 className={styles.headerTitle}>
              <LucideSun className="text-orange-500 fill-orange-500" />
              정보 입력 패널
            </h1>

            {/* 상단 액션 버튼 그룹 */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {/* 기준 단가 설정 버튼 */}
              <button
                onClick={() => setIsConfigOpen(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                title="기준 단가 및 설정 변경"
              >
                <LucideSettings size={20} />
              </button>

              {/* [수정됨] 불러오기 버튼 -> 모달 열기 */}
              <button
                onClick={() => setIsLoadModalOpen(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                title="제안서 불러오기 (DB)"
              >
                <LucideFolderOpen size={20} />
              </button>

              {/* [수정됨] 저장 버튼 -> handleSave 함수 연결 */}
              <button
                onClick={handleSave}
                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                title="현재 내용 저장"
              >
                <LucideSave size={16} /> 저장
              </button>
            </div>
          </div>
          <p className={styles.headerDesc}>
            데이터를 입력하면 제안서가 실시간으로 자동 완성됩니다.
          </p>
        </div>

        {/* Form Content */}
        <div className={styles.formContent}>
          {/* 1. 기본 정보 */}
          <Step1_BasicInfo />

          {/* 2. 설치 공간 (Sheet 3) */}
          <Step2_SiteInfo />

          {/* 3. 전력 데이터 (Sheet 4, 5) */}
          <Step3_EnergyData />

          {/* 4. 투자비 및 수익 시뮬레이션 (Sheet 6, 7, 8) */}
          <Step4_Simulation />
          <Step5_Comparison />
        </div>
      </section>

      {/* ------------------------------------------------------------
          👉 우측: 미리보기 패널 (Preview Zone)
      ------------------------------------------------------------ */}
      <section className={styles.previewPanel}>
        {/* 우측 화면 컴포넌트 */}
        <PreviewPanel />
      </section>
    </main>
  );
}
