'use client';

import React, { useState } from 'react';
import { useProposalStore } from '../src/lib/store';
import styles from './page.module.css';
import {
  LucideSun,
  LucideSettings,
  LucideSave,
  LucideFolderOpen,
  LucideFilePlus,
} from 'lucide-react';

import Step1_BasicInfo from '../src/components/Step1_BasicInfo';
import Step2_SiteInfo from '../src/components/Step2_SiteInfo';
import Step3_EnergyData from '../src/components/Step3_EnergyData';
import Step4_Simulation from '../src/components/Step4_Simulation';
import PreviewPanel from '../src/components/PreviewPanel';
import ConfigModal from '../src/components/ConfigModal';
import Step5_Comparison from '../src/components/Step5_Comparison';
import ProposalListModal from '../src/components/ProposalListModal';

export default function Home() {
  const store = useProposalStore();

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  const handleReset = () => {
    if (
      confirm(
        '작성 중인 내용이 모두 사라집니다.\n새로운 견적서를 작성하시겠습니까?'
      )
    ) {
      store.resetProposal();
      window.scrollTo(0, 0);
    }
  };

  // [수정된 부분] 저장 핸들러
  const handleSave = async () => {
    // 1. 이미 저장된 이름이 있으면 그걸 쓰고, 없으면 규칙에 따라 자동 생성
    const defaultName = store.proposalName || store.getProposalFileName();

    // 2. 사용자에게 확인 (자동 생성된 이름을 기본값으로 보여줌)
    const name = window.prompt('견적서 저장 이름을 입력해주세요:', defaultName);

    if (name !== null) {
      const finalName = name.trim() === '' ? defaultName : name;
      await store.saveProposal(finalName);
    }
  };

  return (
    <main className={styles.container}>
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
      <ProposalListModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
      />

      <section className={styles.inputPanel}>
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleReset}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                title="새 문서 작성 (초기화)"
              >
                <LucideFilePlus size={20} />
              </button>
              <button
                onClick={() => setIsConfigOpen(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                title="기준 단가 및 설정 변경"
              >
                <LucideSettings size={20} />
              </button>
              <button
                onClick={() => setIsLoadModalOpen(true)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition"
                title="제안서 불러오기 (DB)"
              >
                <LucideFolderOpen size={20} />
              </button>
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

        <div className={styles.formContent}>
          <Step1_BasicInfo />
          <Step2_SiteInfo />
          <Step3_EnergyData />
          <Step4_Simulation />
          <Step5_Comparison />
        </div>
      </section>

      <section className={styles.previewPanel}>
        <PreviewPanel />
      </section>
    </main>
  );
}
