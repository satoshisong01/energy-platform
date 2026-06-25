'use client';

import React, { useState } from 'react';
import { useProposalStore, SystemConfig } from '../lib/store';
import {
  LucideX,
  LucideSave,
  LucideFolderOpen,
  LucideFilePlus,
  LucideSettings,
  LucideBattery,
} from 'lucide-react';

import ProposalListModal from './ProposalListModal';
import Step1_BasicInfo from './Step1_BasicInfo';
import Step2_SiteInfo from './Step2_SiteInfo';
import Step3_EnergyData from './Step3_EnergyData';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConfigModal({ isOpen, onClose }: Props) {
  const store = useProposalStore();
  const [activeTab, setActiveTab] = useState(0);
  const [isLoadModalOpen, setIsLoadModalOpen] = useState(false);
  const [activeConfigSubTab, setActiveConfigSubTab] = useState<
    'basic' | 'financial'
  >('basic');

  if (!isOpen) return null;

  const handleSave = async () => {
    const defaultName = store.proposalName || `${store.clientName} 분석자료`;
    const name = window.prompt(
      '분석자료 저장 이름을 입력해주세요:',
      defaultName,
    );

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

  const handleFinancialChange = (
    type: 'rps' | 'factoring',
    field: string,
    value: string,
  ) => {
    const numValue = parseFloat(value) || 0;
    const currentSettings = store.financialSettings || {
      rps: {
        loanRatio: 80,
        equityRatio: 20,
        interestRate: 1.75,
        gracePeriod: 5,
        repaymentPeriod: 10,
      },
      factoring: {
        loanRatio: 100,
        interestRate: 5.1,
        gracePeriod: 1,
        repaymentPeriod: 9,
      },
    };

    store.setFinancialSettings({
      ...currentSettings,
      [type]: {
        ...currentSettings[type],
        [field]: numValue,
      },
    });
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
              '4. 상세 옵션 (단가 & 금융)',
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
          <div className="flex-1 overflow-y-auto p-8 bg-white custom-scrollbar">
            {activeTab === 0 && <Step1_BasicInfo />}
            {activeTab === 1 && <Step2_SiteInfo />}
            {activeTab === 2 && <Step3_EnergyData />}

            {/* ✅ 4번 탭: 상세 옵션 설정 (단가 + 금융) */}
            {activeTab === 3 && (
              <div className="max-w-4xl mx-auto">
                <div className="flex space-x-4 mb-6 border-b border-gray-100 pb-2">
                  <button
                    onClick={() => setActiveConfigSubTab('basic')}
                    className={`pb-2 px-4 text-sm font-semibold transition-colors ${
                      activeConfigSubTab === 'basic'
                        ? 'text-blue-600 border-b-2 border-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    기본 단가 설정
                  </button>
                  <button
                    onClick={() => setActiveConfigSubTab('financial')}
                    className={`pb-2 px-4 text-sm font-semibold transition-colors ${
                      activeConfigSubTab === 'financial'
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    금융 정책 설정
                  </button>
                </div>

                {/* 전역 공통 설정 — 단가·금융·요금제는 모든 자료에 공통 적용 */}
                <div className="mb-6 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <b>전역 공통 설정</b> — 여기 단가·금융·요금제는 <b>모든 분석자료</b>에
                    공통 적용됩니다. 수정 후 <b>[전역 저장]</b>을 누르면 새 자료는 물론
                    기존 자료도 다시 열 때 최신 단가로 계산됩니다.
                  </div>
                  <button
                    onClick={async () => {
                      if (
                        !confirm(
                          '현재 단가·금융·요금제를 전역 공통값으로 저장합니다.\n모든 분석자료(기존 포함)에 적용됩니다. 계속할까요?',
                        )
                      )
                        return;
                      const ok = await store.saveGlobalConfig();
                      if (ok)
                        alert(
                          '✅ 전역 설정이 저장되었습니다. 모든 자료에 적용됩니다.',
                        );
                    }}
                    className="shrink-0 flex items-center gap-1 bg-amber-600 text-white px-3 py-2 rounded text-xs font-bold hover:bg-amber-700 transition shadow-sm"
                  >
                    <LucideSave size={14} /> 전역 저장 (전체 적용)
                  </button>
                </div>

                {activeConfigSubTab === 'basic' ? (
                  <div className="space-y-8">
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

                        {/* [수정] 운영 플랫폼: 입력 필드 제거 -> 자동 계산 안내 표시 */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">
                            운영 플랫폼
                          </label>
                          <div className="w-full p-2 border border-gray-200 rounded bg-gray-100 text-right text-sm text-gray-500 font-medium">
                            용량 비례 자동 산출 (Max 0.3억)
                          </div>
                        </div>

                        <ConfigInput
                          label="EC 운영 인건비"
                          field="price_labor_ec"
                          store={store}
                        />

                        {/* [수소발전 단가 설정] 1MW당 투자비 + 일반/청정수소 판매단가 */}
                        <div className="col-span-2 p-3 border border-cyan-200 rounded-lg bg-cyan-50">
                          <label className="block text-xs font-bold text-cyan-700 mb-2">
                            수소발전 단가 (1MW당 / 24·365 베이스로드 가정)
                          </label>
                          <div className="grid grid-cols-3 gap-3">
                            {/* 1MW당 투자비 */}
                            <div>
                              <label className="block text-[10px] text-cyan-700 mb-1 font-semibold">
                                1MW당 투자비
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="1"
                                  className="w-full p-2 border border-cyan-300 rounded text-right pr-16 focus:ring-2 focus:ring-cyan-500 outline-none font-mono text-cyan-800 font-bold bg-white"
                                  value={store.config.price_hydrogen_per_mw}
                                  onChange={(e) =>
                                    store.updateConfig(
                                      'price_hydrogen_per_mw',
                                      Number(e.target.value),
                                    )
                                  }
                                />
                                <span className="absolute right-3 top-2 text-cyan-600 text-[10px] font-bold">
                                  억원/MW
                                </span>
                              </div>
                            </div>
                            {/* 일반수소 발전단가 */}
                            <div>
                              <label className="block text-[10px] text-cyan-700 mb-1 font-semibold">
                                일반수소 발전단가
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="1"
                                  className="w-full p-2 border border-cyan-300 rounded text-right pr-12 focus:ring-2 focus:ring-cyan-500 outline-none font-mono text-cyan-800 font-bold bg-white"
                                  value={store.config.hydrogen_price_normal}
                                  onChange={(e) =>
                                    store.updateConfig(
                                      'hydrogen_price_normal',
                                      Number(e.target.value),
                                    )
                                  }
                                />
                                <span className="absolute right-3 top-2 text-cyan-600 text-[10px] font-bold">
                                  원/kWh
                                </span>
                              </div>
                            </div>
                            {/* 청정수소 발전단가 */}
                            <div>
                              <label className="block text-[10px] text-emerald-700 mb-1 font-semibold">
                                청정수소 발전단가
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="1"
                                  className="w-full p-2 border border-emerald-300 rounded text-right pr-12 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-emerald-800 font-bold bg-white"
                                  value={store.config.hydrogen_price_clean}
                                  onChange={(e) =>
                                    store.updateConfig(
                                      'hydrogen_price_clean',
                                      Number(e.target.value),
                                    )
                                  }
                                />
                                <span className="absolute right-3 top-2 text-emerald-600 text-[10px] font-bold">
                                  원/kWh
                                </span>
                              </div>
                            </div>
                          </div>
                          {/* [NEW] 재료비 + 유지보수율 — 둘째 줄 */}
                          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-cyan-200">
                            <div>
                              <label className="block text-[10px] text-amber-700 mb-1 font-semibold">
                                재료비 단가
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="1"
                                  className="w-full p-2 border border-amber-300 rounded text-right pr-12 focus:ring-2 focus:ring-amber-500 outline-none font-mono text-amber-800 font-bold bg-white"
                                  value={store.config.hydrogen_material_cost}
                                  onChange={(e) =>
                                    store.updateConfig(
                                      'hydrogen_material_cost',
                                      Number(e.target.value),
                                    )
                                  }
                                />
                                <span className="absolute right-3 top-2 text-amber-600 text-[10px] font-bold">
                                  원/kWh
                                </span>
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-amber-700 mb-1 font-semibold">
                                유지보수율
                              </label>
                              <div className="relative">
                                <input
                                  type="number"
                                  step="0.1"
                                  className="w-full p-2 border border-amber-300 rounded text-right pr-8 focus:ring-2 focus:ring-amber-500 outline-none font-mono text-amber-800 font-bold bg-white"
                                  value={store.config.hydrogen_om_rate}
                                  onChange={(e) =>
                                    store.updateConfig(
                                      'hydrogen_om_rate',
                                      Number(e.target.value),
                                    )
                                  }
                                />
                                <span className="absolute right-3 top-2 text-amber-600 text-[10px] font-bold">
                                  %
                                </span>
                              </div>
                            </div>
                            <div className="text-[9px] text-slate-500 self-end leading-tight">
                              매출 대비 비율
                              <br />
                              (수소생산 O&amp;M 일반치)
                            </div>
                          </div>
                          <p className="text-[10px] text-cyan-600 mt-2 leading-tight">
                            * 연간 매출 = 필요발전량 × 발전단가 ·
                            재료비 = 필요발전량 × 재료비단가 ·
                            O&amp;M = 매출 × 유지보수율
                            <br />
                            <strong>
                              순수익 = 매출 − 재료비 − O&amp;M,
                              ROI = 투자비 ÷ 순수익
                            </strong>{' '}
                            (음수면 적자, 회수 불가)
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* 2. 수익 분석 단가 */}
                    <div>
                      <h3 className="text-sm font-bold text-green-600 mb-4 uppercase tracking-wider border-b pb-2 border-green-100">
                        2. 수익 분석 단가 (단위: 원)
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
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
                          label="지붕임대 단가 (연간/kW)"
                          field="subscription_price_per_kw"
                          store={store}
                        />
                        <ConfigInput
                          label="자가소비 절감 단가"
                          field="unit_price_savings"
                          store={store}
                        />

                        {/* EC 판매 (REC 1.5) + 자가소비 체크박스 및 대수 입력 */}
                        <div className="col-span-1 p-3 border border-slate-200 rounded bg-slate-50">
                          <div
                            className={`mb-3 ${store.isEcSelfConsumption ? 'opacity-50' : ''}`}
                          >
                            <label className="block text-xs font-semibold text-gray-500 mb-1">
                              EC 판매 (REC 1.5 / 이동형)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              disabled={store.isEcSelfConsumption}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-right bg-white"
                              value={store.config.unit_price_ec_1_5}
                              onChange={(e) =>
                                store.updateConfig(
                                  'unit_price_ec_1_5',
                                  Number(e.target.value),
                                )
                              }
                            />
                          </div>

                          <div className="pt-2 border-t border-slate-200">
                            <div className="flex justify-between items-center mb-2">
                              <label className="flex items-center gap-2 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-green-600"
                                  checked={store.isEcSelfConsumption}
                                  onChange={(e) =>
                                    store.setSimulationOption(
                                      'isEcSelfConsumption',
                                      e.target.checked,
                                    )
                                  }
                                />
                                <span
                                  className={`text-xs font-bold flex items-center gap-1 ${store.isEcSelfConsumption ? 'text-green-700' : 'text-gray-500'}`}
                                >
                                  <LucideBattery size={14} />
                                  EC 자가소비 (배터리형) 적용
                                </span>
                              </label>

                              {store.isEcSelfConsumption && (
                                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-1">
                                  <input
                                    type="number"
                                    min="1"
                                    className="w-12 p-1 text-center border border-green-300 rounded text-xs font-bold text-green-700 focus:ring-1 focus:ring-green-500 outline-none bg-white"
                                    value={store.ecSelfConsumptionCount}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      if (val > 0)
                                        store.setSimulationOption(
                                          'ecSelfConsumptionCount',
                                          val,
                                        );
                                    }}
                                  />
                                  <span className="text-[10px] text-green-600 font-bold">
                                    대
                                  </span>
                                </div>
                              )}
                            </div>

                            {store.isEcSelfConsumption && (
                              <div className="pl-6 animate-in fade-in slide-in-from-top-1 duration-200">
                                <label className="block text-[10px] text-green-600 mb-1 font-bold">
                                  자가소비용 적용 단가
                                </label>
                                <input
                                  type="number"
                                  step="0.01"
                                  className="w-full p-2 border border-green-300 rounded focus:ring-2 focus:ring-green-500 outline-none font-mono text-right text-green-700 font-bold bg-green-50"
                                  value={store.config.unit_price_ec_self}
                                  onChange={(e) =>
                                    store.updateConfig(
                                      'unit_price_ec_self',
                                      Number(e.target.value),
                                    )
                                  }
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <ConfigInput
                          label="EC 판매 (REC 5.0)"
                          field="unit_price_ec_5_0"
                          store={store}
                        />
                      </div>

                      {/* [NEW] RE100연계형 단가 설정 */}
                      <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <h4 className="text-xs font-bold text-blue-700 mb-3 flex items-center gap-1">
                          🔗 RE100연계형 (임대 모델) 비율 설정
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                              한전 판매 적용 비율
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                className="w-full p-2 border border-blue-300 rounded text-right pr-8 focus:ring-2 focus:ring-blue-500 outline-none font-mono bg-white"
                                value={Math.round(
                                  (store.config.re100_kepco_ratio ?? 0.2) * 100,
                                )}
                                onChange={(e) =>
                                  store.updateConfig(
                                    're100_kepco_ratio',
                                    Number(e.target.value) / 100,
                                  )
                                }
                              />
                              <span className="absolute right-3 top-2 text-blue-600 text-xs font-bold">
                                %
                              </span>
                            </div>
                            <p className="text-[10px] text-blue-600 mt-1">
                              용량 × 비율 × 한전단가 × 일조량 × 365
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                              임대료 적용 비율
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                className="w-full p-2 border border-blue-300 rounded text-right pr-8 focus:ring-2 focus:ring-blue-500 outline-none font-mono bg-white"
                                value={Math.round(
                                  (store.config.re100_rental_ratio ?? 0.8) *
                                    100,
                                )}
                                onChange={(e) =>
                                  store.updateConfig(
                                    're100_rental_ratio',
                                    Number(e.target.value) / 100,
                                  )
                                }
                              />
                              <span className="absolute right-3 top-2 text-blue-600 text-xs font-bold">
                                %
                              </span>
                            </div>
                            <p className="text-[10px] text-blue-600 mt-1">
                              용량 × 비율 × 임대형 단가(연간/kW)
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-blue-500 mt-2 leading-tight">
                          * 두 비율의 합이 100%가 되도록 일반적으로 설정합니다
                          (예: 20% + 80%). 임대형 단가(연간/kW)는 위 입력란
                          참조.
                        </p>
                      </div>

                      {/* [NEW] 구독형 단가 설정 */}
                      <div className="mt-3 p-4 border border-purple-200 rounded-lg bg-purple-50">
                        <h4 className="text-xs font-bold text-purple-700 mb-3 flex items-center gap-1">
                          📦 구독형 (Subscription) 단가 설정
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                              절감 기준 단가
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full p-2 border border-purple-300 rounded text-right pr-8 focus:ring-2 focus:ring-purple-500 outline-none font-mono bg-white"
                                value={store.config.sub_price_standard ?? 210.5}
                                onChange={(e) =>
                                  store.updateConfig(
                                    'sub_price_standard',
                                    Number(e.target.value),
                                  )
                                }
                              />
                              <span className="absolute right-3 top-2 text-purple-600 text-xs">
                                원
                              </span>
                            </div>
                            <p className="text-[10px] text-purple-600 mt-1">
                              일반 산업용 절감 베이스
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                              가입자 자가소비 단가
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full p-2 border border-purple-300 rounded text-right pr-8 focus:ring-2 focus:ring-purple-500 outline-none font-mono bg-white"
                                value={store.config.sub_price_self}
                                onChange={(e) =>
                                  store.updateConfig(
                                    'sub_price_self',
                                    Number(e.target.value),
                                  )
                                }
                              />
                              <span className="absolute right-3 top-2 text-purple-600 text-xs">
                                원
                              </span>
                            </div>
                            <p className="text-[10px] text-purple-600 mt-1">
                              절감액 = (기준−가입자) × 자가소비
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                              잉여 판매 단가
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="0.01"
                                className="w-full p-2 border border-purple-300 rounded text-right pr-8 focus:ring-2 focus:ring-purple-500 outline-none font-mono bg-white"
                                value={store.config.sub_price_surplus}
                                onChange={(e) =>
                                  store.updateConfig(
                                    'sub_price_surplus',
                                    Number(e.target.value),
                                  )
                                }
                              />
                              <span className="absolute right-3 top-2 text-purple-600 text-xs">
                                원
                              </span>
                            </div>
                            <p className="text-[10px] text-purple-600 mt-1">
                              잉여 발전량에 적용
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-purple-500 mt-2 leading-tight">
                          * 연간 수익 = (기준 − 가입자) × 자가소비량 + 잉여량
                          × 잉여 단가
                        </p>
                      </div>

                      {/* [NEW] 수익배분형 설정 */}
                      <div className="mt-3 p-4 border border-emerald-200 rounded-lg bg-emerald-50">
                        <h4 className="text-xs font-bold text-emerald-700 mb-3 flex items-center gap-1">
                          🤝 수익배분형 (초기 투자 0 / 소유권 이전) 설정
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                              회사 측 배분 비율
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                className="w-full p-2 border border-emerald-300 rounded text-right pr-8 focus:ring-2 focus:ring-emerald-500 outline-none font-mono bg-white"
                                value={Math.round(
                                  (store.config.share_company_ratio ?? 0.5) *
                                    100,
                                )}
                                onChange={(e) =>
                                  store.updateConfig(
                                    'share_company_ratio',
                                    Number(e.target.value) / 100,
                                  )
                                }
                              />
                              <span className="absolute right-3 top-2 text-emerald-600 text-xs font-bold">
                                %
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-600 mt-1">
                              (주)퍼스트씨앤디 몫
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                              파트너 측 배분 비율
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                className="w-full p-2 border border-emerald-300 rounded text-right pr-8 focus:ring-2 focus:ring-emerald-500 outline-none font-mono bg-white"
                                value={Math.round(
                                  (store.config.share_partner_ratio ?? 0.5) *
                                    100,
                                )}
                                onChange={(e) =>
                                  store.updateConfig(
                                    'share_partner_ratio',
                                    Number(e.target.value) / 100,
                                  )
                                }
                              />
                              <span className="absolute right-3 top-2 text-emerald-600 text-xs font-bold">
                                %
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-600 mt-1">
                              지붕임대인 몫
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-semibold text-gray-600 mb-1">
                              소유권 이전 시점
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                step="1"
                                min="1"
                                max="30"
                                className="w-full p-2 border border-emerald-300 rounded text-right pr-8 focus:ring-2 focus:ring-emerald-500 outline-none font-mono bg-white"
                                value={
                                  store.config.share_ownership_transfer_years ??
                                  15
                                }
                                onChange={(e) =>
                                  store.updateConfig(
                                    'share_ownership_transfer_years',
                                    Number(e.target.value),
                                  )
                                }
                              />
                              <span className="absolute right-3 top-2 text-emerald-600 text-xs font-bold">
                                년
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-600 mt-1">
                              N년 뒤 파트너에게 이전
                            </p>
                          </div>
                        </div>
                        <p className="text-[10px] text-emerald-500 mt-2 leading-tight">
                          * 초기 투자비 0원, 전기 발생 수익(자가소비+잉여+EC+기본료절감)을
                          회사:파트너로 배분. N년 후 발전 설비 소유권은
                          파트너(지붕임대인)에게 이전.
                        </p>
                      </div>
                    </div>

                    {/* 3. 시뮬레이션 비율 - 기존 디자인 유지 */}
                    <div>
                      <h3 className="text-sm font-bold text-orange-600 mb-4 uppercase tracking-wider border-b pb-2 border-orange-100">
                        3. 시뮬레이션 기준 비율 / 설정
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {/* 적정 용량 산출 비율 */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">
                            적정 용량 산출 비율 (평당)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              className="w-full p-2 border border-gray-300 rounded text-right pr-8 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={store.config.solar_capacity_factor}
                              onChange={(e) =>
                                store.updateConfig(
                                  'solar_capacity_factor',
                                  Number(e.target.value),
                                )
                              }
                            />
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">
                              / N
                            </span>
                          </div>
                        </div>

                        {/* 모듈 개당 출력 */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">
                            모듈 개당 출력 (W)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="10"
                              className="w-full p-2 border border-gray-300 rounded text-right pr-8 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={store.config.solar_panel_wattage}
                              onChange={(e) =>
                                store.updateConfig(
                                  'solar_panel_wattage',
                                  Number(e.target.value),
                                )
                              }
                            />
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">
                              W
                            </span>
                          </div>
                        </div>

                        {/* [NEW - 추가됨] 일조량 (시간/일) */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">
                            일조량 (시간/일)
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.01"
                              className="w-full p-2 border border-gray-300 rounded text-right pr-8 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={store.config.solar_radiation}
                              onChange={(e) =>
                                store.updateConfig(
                                  'solar_radiation',
                                  Number(e.target.value),
                                )
                              }
                            />
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">
                              시간
                            </span>
                          </div>
                        </div>

                        {/* 매년 발전 감소율 */}
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
                                  Number(e.target.value),
                                )
                              }
                            />
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">
                              %
                            </span>
                          </div>
                        </div>

                        {/* 유지보수 비율 + 한도 설정 */}
                        <div>
                          <div className="flex justify-between items-end mb-1">
                            <label className="block text-xs font-semibold text-gray-500">
                              유지보수 비율
                            </label>

                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-1 cursor-pointer select-none">
                                <input
                                  type="checkbox"
                                  className="w-3 h-3 accent-blue-600 rounded"
                                  checked={store.isMaintenanceAuto}
                                  onChange={(e) =>
                                    store.setSimulationOption(
                                      'isMaintenanceAuto',
                                      e.target.checked,
                                    )
                                  }
                                />
                                <span
                                  className={`text-[10px] font-bold transition-colors ${
                                    store.isMaintenanceAuto
                                      ? 'text-blue-600'
                                      : 'text-gray-400'
                                  }`}
                                >
                                  자동 조정
                                </span>
                              </label>

                              {store.isMaintenanceAuto && (
                                <div className="flex items-center gap-1 animate-in fade-in slide-in-from-left-1 bg-blue-50 px-1 py-0.5 rounded border border-blue-100">
                                  <span className="text-[9px] text-blue-600 font-bold whitespace-nowrap">
                                    한도:
                                  </span>
                                  <input
                                    type="number"
                                    className="w-16 p-0.5 text-[10px] text-right border border-blue-200 rounded focus:ring-1 focus:ring-blue-500 outline-none text-blue-700 font-bold bg-white"
                                    value={store.maintenanceCostLimit}
                                    onChange={(e) =>
                                      store.setSimulationOption(
                                        'maintenanceCostLimit',
                                        Number(e.target.value),
                                      )
                                    }
                                  />
                                  <span className="text-[9px] text-blue-600">
                                    원
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="relative">
                            <input
                              type="number"
                              step="0.1"
                              className={`w-full p-2 border rounded text-right pr-8 outline-none font-mono transition-colors ${
                                store.isMaintenanceAuto
                                  ? 'bg-gray-50 text-gray-600 border-gray-200 focus:bg-white focus:border-blue-400'
                                  : 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500'
                              }`}
                              value={store.maintenanceRate}
                              onChange={(e) =>
                                store.setSimulationOption(
                                  'maintenanceRate',
                                  Number(e.target.value),
                                )
                              }
                            />
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">
                              %
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] text-gray-400">
                            {store.isMaintenanceAuto
                              ? `* 한도(${Math.round((store.maintenanceCostLimit / 100000000) * 10) / 10}억원) 내에서 최대 25%까지 자동 최적화됩니다.`
                              : `* 사용자가 입력한 비율로 고정됩니다. (단, ${Math.round((store.maintenanceCostLimit / 100000000) * 10) / 10}억원 초과 시 조정됨)`}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 4. 요금제 프리셋 */}
                    <div>
                      <h3 className="text-sm font-bold text-purple-600 mb-4 uppercase tracking-wider border-b pb-2 border-purple-100">
                        4. 주요 요금제 프리셋 (Top 6)
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
                                    e.target.value,
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
                                    Number(e.target.value),
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
                                    Number(e.target.value),
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
                ) : (
                  <div className="space-y-8">
                    {/* 금융 정책 설정 */}
                    <section>
                      <h3 className="text-sm font-bold text-blue-600 mb-4 uppercase tracking-wider border-b pb-2 border-blue-100 flex items-center gap-2">
                        RPS 정책자금 설정
                      </h3>
                      <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                        <div className="grid grid-cols-2 gap-6">
                          <FinancialInput
                            label="대출 비율 (%)"
                            value={store.financialSettings.rps.loanRatio}
                            onChange={(v) =>
                              handleFinancialChange('rps', 'loanRatio', v)
                            }
                          />
                          <FinancialInput
                            label="자기자본 비율 (%)"
                            value={store.financialSettings.rps.equityRatio}
                            onChange={(v) =>
                              handleFinancialChange('rps', 'equityRatio', v)
                            }
                          />
                          <FinancialInput
                            label="연 이자율 (%)"
                            value={store.financialSettings.rps.interestRate}
                            onChange={(v) =>
                              handleFinancialChange('rps', 'interestRate', v)
                            }
                            step={0.01}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <FinancialInput
                              label="거치 기간 (년)"
                              value={store.financialSettings.rps.gracePeriod}
                              onChange={(v) =>
                                handleFinancialChange('rps', 'gracePeriod', v)
                              }
                            />
                            <FinancialInput
                              label="상환 기간 (년)"
                              value={
                                store.financialSettings.rps.repaymentPeriod
                              }
                              onChange={(v) =>
                                handleFinancialChange(
                                  'rps',
                                  'repaymentPeriod',
                                  v,
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-white rounded border border-blue-100 text-xs text-blue-600 leading-relaxed">
                          ℹ️ <strong>RPS 계산:</strong> 총 투자비의{' '}
                          {store.financialSettings.rps.loanRatio}% 대출 /{' '}
                          {store.financialSettings.rps.gracePeriod}년
                          거치(이자만) +{' '}
                          {store.financialSettings.rps.repaymentPeriod}년 원리금
                          상환
                        </div>
                      </div>
                    </section>
                    <section>
                      <h3 className="text-sm font-bold text-green-600 mb-4 uppercase tracking-wider border-b pb-2 border-green-100 flex items-center gap-2">
                        팩토링 설정
                      </h3>
                      <div className="bg-green-50 p-6 rounded-lg border border-green-100">
                        <div className="grid grid-cols-2 gap-6">
                          <FinancialInput
                            label="대출 비율 (%)"
                            value={store.financialSettings.factoring.loanRatio}
                            onChange={(v) =>
                              handleFinancialChange('factoring', 'loanRatio', v)
                            }
                          />
                          <div className="flex items-end pb-2 text-gray-500 text-xs font-medium">
                            * 자기자본 0% (전액 대출 상품)
                          </div>
                          <FinancialInput
                            label="연 이자율 (%)"
                            value={
                              store.financialSettings.factoring.interestRate
                            }
                            onChange={(v) =>
                              handleFinancialChange(
                                'factoring',
                                'interestRate',
                                v,
                              )
                            }
                            step={0.01}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <FinancialInput
                              label="거치 기간 (년)"
                              value={
                                store.financialSettings.factoring.gracePeriod
                              }
                              onChange={(v) =>
                                handleFinancialChange(
                                  'factoring',
                                  'gracePeriod',
                                  v,
                                )
                              }
                            />
                            <FinancialInput
                              label="상환 기간 (년)"
                              value={
                                store.financialSettings.factoring
                                  .repaymentPeriod
                              }
                              onChange={(v) =>
                                handleFinancialChange(
                                  'factoring',
                                  'repaymentPeriod',
                                  v,
                                )
                              }
                            />
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-white rounded border border-green-100 text-xs text-green-600 leading-relaxed">
                          ℹ️ <strong>팩토링 계산:</strong> 총 투자비의{' '}
                          {store.financialSettings.factoring.loanRatio}% 대출 /{' '}
                          {store.financialSettings.factoring.gracePeriod}년 거치
                          + {store.financialSettings.factoring.repaymentPeriod}
                          년 원리금 상환
                        </div>
                      </div>
                    </section>
                  </div>
                )}
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
  step = 0.01,
}: {
  label: string;
  field: keyof SystemConfig;
  store: any;
  step?: number;
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">
      {label}
    </label>
    <input
      type="number"
      step={step}
      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-right"
      value={store.config[field]}
      onChange={(e) => store.updateConfig(field, Number(e.target.value))}
    />
  </div>
);

// FinancialInput 컴포넌트
const FinancialInput = ({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: string) => void;
  step?: number;
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-500 mb-1">
      {label}
    </label>
    <input
      type="number"
      step={step}
      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none font-mono text-right"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
