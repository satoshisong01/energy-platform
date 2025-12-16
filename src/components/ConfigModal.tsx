'use client';

import React, { useState } from 'react';
import { useProposalStore, SystemConfig } from '../lib/store';
import {
  LucideX,
  LucideSave,
  LucideFolderOpen,
  LucideFilePlus,
  LucideSettings,
} from 'lucide-react';

import ProposalListModal from './ProposalListModal';
import Step1_BasicInfo from './Step1_BasicInfo';
import Step2_SiteInfo from './Step2_SiteInfo';
import Step3_EnergyData from './Step3_EnergyData'; // Step3가 있다면 주석 해제

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfigModal({ isOpen, onClose }: Props) {
  const store = useProposalStore();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleSave = async () => {
    const defaultName = store.proposalName || `${store.clientName} 견적서`;
    const name = window.prompt('견적서 저장 이름을 입력해주세요:', defaultName);

    if (name !== null) {
      const finalName = name.trim() === '' ? defaultName : name;
      await store.saveProposal(finalName);
    }
  };

  const handleReset = () => {
    if (confirm('현재 작성 중인 내용이 초기화됩니다. 계속하시겠습니까?')) {
      store.resetProposal();
      setActiveTab(0);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
        <div className="bg-white rounded-xl shadow-2xl w-[90%] max-w-[1200px] h-[90vh] flex flex-col overflow-hidden">
          {/* --- Header --- */}
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-slate-50">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <LucideSettings className="text-blue-600" />
                시뮬레이션 설정
              </h2>
              {store.proposalName && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-bold">
                  Editing: {store.proposalName}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 text-slate-600 rounded hover:bg-slate-50 font-bold text-sm"
              >
                <LucideFilePlus size={16} /> 신규
              </button>
              <button
                onClick={() => setIsLoadModalOpen(true)}
                className="flex items-center gap-1 px-3 py-2 bg-white border border-slate-300 text-slate-600 rounded hover:bg-slate-50 font-bold text-sm"
              >
                <LucideFolderOpen size={16} /> 불러오기
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold text-sm shadow-sm"
              >
                <LucideSave size={16} /> 저장
              </button>
              <div className="w-[1px] h-8 bg-slate-200 mx-2"></div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-red-500"
              >
                <LucideX size={24} />
              </button>
            </div>
          </div>

          {/* --- Tab Menu --- */}
          <div className="flex border-b border-gray-200 px-6 bg-white">
            {[
              '1. 기본 정보',
              '2. 현장 정보',
              '3. 에너지 데이터',
              '4. 상세 옵션 (단가)',
            ].map((tab, idx) => (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === idx
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* --- Content Area --- */}
          <div className="flex-1 overflow-y-auto p-8 bg-white">
            {activeTab === 0 && <Step1_BasicInfo />}
            {activeTab === 1 && <Step2_SiteInfo />}
            {activeTab === 2 && <Step3_EnergyData />}{' '}
            {/* Step3 컴포넌트 연결 */}
            {/* ✅ 4번 탭: 상세 단가 설정 */}
            {activeTab === 3 && (
              <div className="space-y-8 max-w-4xl mx-auto">
                {/* 1. 장비 투자비 단가 */}
                <div>
                  <h3 className="text-sm font-bold text-blue-600 mb-4 uppercase tracking-wider border-b pb-2 border-blue-100">
                    1. 장비 투자비 단가 (단위: 억원)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <ConfigInput
                      label="태양광 (프리미엄)"
                      field="price_solar_premium"
                      store={store}
                    />
                    <ConfigInput
                      label="태양광 (스탠다드)"
                      field="price_solar_standard"
                      store={store}
                    />
                    <ConfigInput
                      label="태양광 (이코노미)"
                      field="price_solar_economy"
                      store={store}
                    />
                    <ConfigInput
                      label="에너지캐리어 (1대)"
                      field="price_ec_unit"
                      store={store}
                    />
                    <ConfigInput
                      label="이동 트랙터"
                      field="price_tractor"
                      store={store}
                    />
                    <ConfigInput
                      label="운영 플랫폼"
                      field="price_platform"
                      store={store}
                    />
                    <ConfigInput
                      label="EC 운영 인건비"
                      field="price_labor_ec"
                      store={store}
                    />
                  </div>
                </div>

                {/* 2. 수익 분석 단가 (수정됨) */}
                <div>
                  <h3 className="text-sm font-bold text-green-600 mb-4 uppercase tracking-wider border-b pb-2 border-green-100">
                    2. 수익 분석 단가 (단위: 원)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* [NEW] 전력 판매 및 임대/구독 단가 */}
                    <ConfigInput
                      label="한전 판매 단가 (SMP+REC)"
                      field="unit_price_kepco"
                      store={store}
                    />
                    <ConfigInput
                      label="임대형 단가 (연간/kW)"
                      field="rental_price_per_kw"
                      store={store}
                    />
                    <ConfigInput
                      label="구독형 단가 (연간/kW)"
                      field="subscription_price_per_kw"
                      store={store}
                    />

                    <ConfigInput
                      label="자가소비 절감 단가"
                      field="unit_price_savings"
                      store={store}
                    />
                    <ConfigInput
                      label="EC 판매 (REC 1.5)"
                      field="unit_price_ec_1_5"
                      store={store}
                    />
                    <ConfigInput
                      label="EC 판매 (REC 5.0)"
                      field="unit_price_ec_5_0"
                      store={store}
                    />
                  </div>
                </div>

                {/* 3. 시뮬레이션 비율 */}
                <div>
                  <h3 className="text-sm font-bold text-orange-600 mb-4 uppercase tracking-wider border-b pb-2 border-orange-100">
                    3. 시뮬레이션 기준 비율 (단위: %)
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        유지보수 비율
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          className="w-full p-2 border border-gray-300 rounded text-right pr-8 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={store.maintenanceRate}
                          onChange={(e) =>
                            store.setSimulationOption(
                              'maintenanceRate',
                              Number(e.target.value)
                            )
                          }
                        />
                        <span className="absolute right-3 top-2 text-gray-400 text-sm">
                          %
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">
                        매년 발전 감소율
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.1"
                          className="w-full p-2 border border-gray-300 rounded text-right pr-8 focus:ring-2 focus:ring-blue-500 outline-none"
                          value={store.degradationRate}
                          onChange={(e) =>
                            store.setSimulationOption(
                              'degradationRate',
                              Number(e.target.value)
                            )
                          }
                        />
                        <span className="absolute right-3 top-2 text-gray-400 text-sm">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. 요금제 프리셋 */}
                <div>
                  <h3 className="text-sm font-bold text-purple-600 mb-4 uppercase tracking-wider border-b pb-2 border-purple-100">
                    4. 주요 요금제 프리셋 (Top 4)
                  </h3>
                  <div className="space-y-3">
                    {store.tariffPresets.map((preset, index) => (
                      <div
                        key={preset.id}
                        className="flex gap-2 items-center bg-purple-50 p-3 rounded-lg border border-purple-100"
                      >
                        <div className="flex-1">
                          <label className="block text-[10px] text-gray-400 mb-0.5">
                            요금제 이름
                          </label>
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-200 rounded text-sm focus:border-purple-500 outline-none"
                            value={preset.name}
                            onChange={(e) =>
                              store.updateTariffPreset(
                                index,
                                'name',
                                e.target.value
                              )
                            }
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-[10px] text-gray-400 mb-0.5">
                            기본요금
                          </label>
                          <input
                            type="number"
                            className="w-full p-2 border border-gray-200 rounded text-sm text-right focus:border-purple-500 outline-none"
                            value={preset.baseRate}
                            onChange={(e) =>
                              store.updateTariffPreset(
                                index,
                                'baseRate',
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-[10px] text-gray-400 mb-0.5">
                            절감단가
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            className="w-full p-2 border border-gray-200 rounded text-sm text-right focus:border-purple-500 outline-none"
                            value={preset.savings}
                            onChange={(e) =>
                              store.updateTariffPreset(
                                index,
                                'savings',
                                Number(e.target.value)
                              )
                            }
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-right">
                    * 값을 수정하면 입력 패널의 선택지가 즉시 변경됩니다.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* --- Footer --- */}
          <div className="p-5 border-t border-gray-100 bg-slate-50 flex justify-end">
            <button
              onClick={onClose}
              className="bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 transition shadow-lg text-sm"
            >
              설정 완료 및 닫기
            </button>
          </div>
        </div>
      </div>

      <ProposalListModal
        isOpen={isLoadModalOpen}
        onClose={() => setIsLoadModalOpen(false)}
      />
    </>
  );
}

// ConfigInput 컴포넌트 (재사용)
const ConfigInput = ({
  label,
  field,
  store,
}: {
  label: string;
  field: keyof SystemConfig;
  store: any;
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">
      {label}
    </label>
    <input
      type="number"
      step="0.01"
      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-right"
      value={store.config[field]}
      onChange={(e) => store.updateConfig(field, Number(e.target.value))}
    />
  </div>
);
