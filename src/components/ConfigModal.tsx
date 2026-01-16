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
      defaultName
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
    value: string
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
                {/* 4번 탭 내부 서브 탭 */}
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
                          {/* 1. 이동형 (기본) */}
                          <div
                            className={`mb-3 ${
                              store.isEcSelfConsumption ? 'opacity-50' : ''
                            }`}
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
                                  Number(e.target.value)
                                )
                              }
                            />
                          </div>

                          {/* 2. 자가소비형 (체크박스 + 대수 입력) */}
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
                                      e.target.checked
                                    )
                                  }
                                />
                                <span
                                  className={`text-xs font-bold flex items-center gap-1 ${
                                    store.isEcSelfConsumption
                                      ? 'text-green-700'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  <LucideBattery size={14} />
                                  EC 자가소비 (배터리형) 적용
                                </span>
                              </label>

                              {/* [NEW] 자가소비 모드 활성화 시 대수 입력창 */}
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
                                          val
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
                                      Number(e.target.value)
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
                    </div>

                    {/* 3. 시뮬레이션 비율 */}
                    <div>
                      <h3 className="text-sm font-bold text-orange-600 mb-4 uppercase tracking-wider border-b pb-2 border-orange-100">
                        3. 시뮬레이션 기준 비율 (단위: %)
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="flex justify-between items-end mb-1">
                            <label className="block text-xs font-semibold text-gray-500">
                              유지보수 비율
                            </label>
                            <label className="flex items-center gap-1 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="w-3 h-3 accent-blue-600 rounded"
                                checked={store.isMaintenanceAuto}
                                onChange={(e) =>
                                  store.setSimulationOption(
                                    'isMaintenanceAuto',
                                    e.target.checked
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
                                  Number(e.target.value)
                                )
                              }
                            />
                            <span className="absolute right-3 top-2 text-gray-400 text-sm">
                              %
                            </span>
                          </div>
                          <div className="mt-1 text-[10px] text-gray-400">
                            {store.isMaintenanceAuto
                              ? '* 한도(8천만원) 내에서 최대 25%까지 자동 최적화됩니다.'
                              : '* 사용자가 입력한 비율로 고정됩니다. (단, 8천만원 초과 시 조정됨)'}
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
                        4. 주요 요금제 프리셋 (Top 5)
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
                ) : (
                  <div className="space-y-8">
                    {/* 금융 정책 설정 (기존 동일) */}
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
                                  v
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
                                v
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
                                  v
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
                                  v
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
