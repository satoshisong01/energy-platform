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
  LucideCopy,
  LucideChevronLeft,
  LucideChevronRight,
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

  // [State] 왼쪽 패널 열림/닫힘 상태
  const [isInputOpen, setIsInputOpen] = useState(true);

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

  const handleSave = async () => {
    const defaultName = store.proposalName || store.getProposalFileName();
    const name = window.prompt(
      '분석자료 저장 이름을 입력해주세요:',
      defaultName
    );

    if (name !== null) {
      const finalName = name.trim() === '' ? defaultName : name;
      await store.saveProposal(finalName);
    }
  };

  const handleSaveAs = async () => {
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

  // 입력창 너비 설정
  const PANEL_WIDTH = '800px';

  return (
    // [PDF 수정 1] print:h-auto 및 print:overflow-visible로 높이 제한 해제
    <main className="flex h-screen w-full overflow-hidden bg-slate-100 relative print:h-auto print:overflow-visible print:block">
      <ConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
      />
      <ProposalListModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
      />

      {/* 1. 왼쪽: 입력 패널 (인쇄 시 숨김) */}
      <section
        className={`
          h-full bg-white border-r border-slate-200 shadow-xl z-20
          transition-all duration-300 ease-in-out flex flex-col shrink-0
          print:hidden
          ${isInputOpen ? 'opacity-100' : 'w-0 opacity-0 overflow-hidden'}
        `}
        style={{ width: isInputOpen ? PANEL_WIDTH : '0px' }}
      >
        <div className="flex-1 overflow-y-auto h-full scrollbar-thin">
          <div
            className={styles.inputPanel}
            style={{ width: '100%', border: 'none', boxShadow: 'none' }}
          >
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
                    onClick={handleSaveAs}
                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold hover:bg-green-700 transition shadow-sm"
                    title="다른 이름으로 저장 (복제)"
                  >
                    <LucideCopy size={16} /> 복제
                  </button>

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
          </div>
        </div>
      </section>

      {/* 접기/펼치기 버튼 (인쇄 시 숨김) */}
      <button
        onClick={() => setIsInputOpen(!isInputOpen)}
        className={`
          absolute top-1/2 z-50 w-6 h-16 
          flex items-center justify-center cursor-pointer 
          bg-white border border-slate-200 border-l-0 rounded-r-lg shadow-md
          text-slate-400 hover:bg-blue-50 hover:text-blue-600
          transition-all duration-300 ease-in-out transform -translate-y-1/2
          print:hidden
        `}
        style={{ left: isInputOpen ? PANEL_WIDTH : '0px' }}
        title={isInputOpen ? '입력창 접기 (프리뷰 확대)' : '입력창 펼치기'}
      >
        {isInputOpen ? (
          <LucideChevronLeft size={18} />
        ) : (
          <LucideChevronRight size={18} />
        )}
      </button>

      {/* 2. 오른쪽: 프리뷰 패널 */}
      <section
        className={`
          flex-1 h-full overflow-hidden bg-slate-100 relative transition-all duration-300
          /* [PDF 수정 2] 인쇄 시 절대 위치 사용하되, 너비를 강제하지 않고 내부 div에 맡김 */
          print:absolute print:top-0 print:left-0 print:w-full print:h-auto print:overflow-visible print:z-0 print:block
        `}
      >
        <div
          className={`
            h-full w-full overflow-y-auto p-4 scrollbar-thin
            /* [PDF 수정 3] 인쇄 시 패딩 0, 스크롤 제거 */
            print:p-0 print:overflow-visible print:h-auto
          `}
        >
          {/* [핵심 해결책] 
             1. print:w-[210mm]: 인쇄 너비를 A4로 고정 
             2. print:min-w-[210mm]: 축소 방지 
             3. print:mx-auto: 용지 중앙 정렬
             4. print:transition-none: 인쇄 순간 너비 변경 애니메이션 끄기 (중요!)
          */}
          <div className="mx-auto h-full transition-all duration-300 print:transition-none print:w-[210mm] print:min-w-[210mm] print:max-w-[210mm] print:mx-auto print:h-auto">
            <PreviewPanel />
          </div>
        </div>
      </section>
    </main>
  );
}
