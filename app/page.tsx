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
  LucideCopy, // [NEW] 아이콘 추가
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
        '작성 중인 내용이 모두 사라집니다.\n새로운 분석자료를 작성하시겠습니까?'
      )
    ) {
      store.resetProposal();
      window.scrollTo(0, 0);
    }
  };

  // [기존] 저장 (덮어쓰기 or 신규)
  const handleSave = async () => {
    const defaultName = store.proposalName || store.getProposalFileName();
    const name = window.prompt('분석자료 저장 이름을 입력해주세요:', defaultName);

    if (name !== null) {
      const finalName = name.trim() === '' ? defaultName : name;
      await store.saveProposal(finalName);
    }
  };

  // [NEW] 다른 이름으로 저장 (복제)
  const handleSaveAs = async () => {
    // 현재 이름 뒤에 _v2 등을 붙여서 제안
    const baseName = store.proposalName || store.getProposalFileName();
    const defaultNewName = `${baseName}_copy`;

    const name = window.prompt(
      '새로운 파일 이름을 입력해주세요 (다른 이름으로 저장):',
      defaultNewName
    );

    if (name !== null) {
      const finalName = name.trim() === '' ? defaultNewName : name;
      await store.saveAsProposal(finalName);
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

              {/* [NEW] 다른 이름으로 저장 버튼 */}
              <button
                onClick={handleSaveAs}
                className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 transition shadow-sm"
                title="다른 이름으로 저장 (복제)"
              >
                <LucideCopy size={16} /> 복제
              </button>

              {/* 기존 저장 버튼 */}
              <button
                onClick={handleSave}
                className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-blue-700 transition shadow-sm"
                title="현재 내용 저장 (덮어쓰기)"
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
