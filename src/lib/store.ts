import { create } from 'zustand';
import { supabase } from './supabase';

// ------------------------------------------------------------------
// 1. 타입 정의 (Data Types)
// ------------------------------------------------------------------

export type RoofArea = {
  id: string;
  name: string;
  valueM2: number;
};

export type MonthlyData = {
  month: number;
  usageKwh: number;
  selfConsumption: number;
  totalBill: number;
  baseBill: number;
  peakKw: number;
};

export type ModuleTier = 'PREMIUM' | 'STANDARD' | 'ECONOMY';
export type BusinessModel = 'KEPCO' | 'RE100' | 'REC5';

export type SystemConfig = {
  price_solar_premium: number;
  price_solar_standard: number;
  price_solar_economy: number;
  price_ec_unit: number;
  price_tractor: number;
  price_platform: number;
  price_labor_ec: number;
  unit_price_kepco: number;
  unit_price_savings: number;
  unit_price_ec_1_5: number;
  unit_price_ec_5_0: number;
  loan_rate_rps: number;
  loan_rate_factoring: number;
  rental_price_per_kw: number;
  sub_price_self: number;
  sub_price_surplus: number;
};

export type TariffPreset = {
  id: number;
  name: string;
  baseRate: number;
  savings: number;
};

export type ProposalMeta = {
  id: number;
  proposal_name: string;
  client_name: string;
  created_at: string;
  updated_at: string;
};

interface ProposalState {
  proposalId: number | null;
  proposalName: string;

  clientName: string;
  targetDate: string;
  address: string;

  roofAreas: RoofArea[];
  totalAreaPyeong: number;
  capacityKw: number;

  contractType: string;
  baseRate: number;
  voltageType: string;
  monthlyData: MonthlyData[];

  unitPriceSavings: number;
  unitPriceSell: number;
  peakReductionRatio: number;

  config: SystemConfig;
  tariffPresets: TariffPreset[];

  selectedModel: BusinessModel;
  moduleTier: ModuleTier;
  useEc: boolean;
  maintenanceRate: number;
  degradationRate: number;

  totalInvestment: number;

  // --- Actions ---
  setClientName: (name: string) => void;
  setTargetDate: (date: string) => void;
  setAddress: (addr: string) => void;
  setProposalName: (name: string) => void;

  addRoofArea: () => void;
  removeRoofArea: (id: string) => void;
  updateRoofArea: (
    id: string,
    field: 'name' | 'valueM2',
    value: string | number
  ) => void;

  recalculateCapacity: (areas: RoofArea[]) => void;

  setContractType: (
    name: string,
    baseRate: number,
    unitPriceSavings: number
  ) => void;
  setVoltageType: (type: string) => void;
  updateMonthlyData: (
    month: number,
    field: keyof MonthlyData,
    value: number
  ) => void;
  copyJanToAll: () => void;

  setSimulationOption: (
    field:
      | 'selectedModel'
      | 'moduleTier'
      | 'useEc'
      | 'maintenanceRate'
      | 'degradationRate',
    value: any
  ) => void;

  updateConfig: (field: keyof SystemConfig, value: number) => void;

  updateTariffPreset: (
    index: number,
    field: keyof TariffPreset,
    value: string | number
  ) => void;

  recalculateInvestment: () => void;

  // --- DB Actions ---
  checkDuplicateName: (name: string, excludeId?: number) => Promise<boolean>;
  saveProposal: (customName?: string) => Promise<boolean>;
  renameProposal: (id: number, newName: string) => Promise<boolean>;
  fetchProposalList: () => Promise<ProposalMeta[]>;
  loadProposal: (id: number) => Promise<void>;
  deleteProposal: (id: number) => Promise<void>;
  resetProposal: () => void;
}

// ------------------------------------------------------------------
// 2. 스토어 구현 (Store Implementation)
// ------------------------------------------------------------------

export const useProposalStore = create<ProposalState>(
  (set, get) =>
    ({
      // [초기값 세팅]
      proposalId: null,
      proposalName: '',

      clientName: '(주)대림풍력',
      targetDate: new Date().toISOString().split('T')[0],
      address: '',

      roofAreas: [{ id: '1', name: 'A동 지붕', valueM2: 0 }],
      totalAreaPyeong: 0,
      capacityKw: 0,

      contractType: '산업용(을) 고압A - 선택2',
      baseRate: 8320,
      voltageType: '고압A',

      monthlyData: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        usageKwh: 0,
        selfConsumption: 0,
        totalBill: 0,
        baseBill: 0,
        peakKw: 0,
      })),

      unitPriceSavings: 210.5,
      unitPriceSell: 192.79,
      peakReductionRatio: 0.359,

      config: {
        price_solar_premium: 0.97,
        price_solar_standard: 0.9,
        price_solar_economy: 0.84,
        price_ec_unit: 0.7,
        price_tractor: 0.4,
        price_platform: 0.3,
        price_labor_ec: 0.4,
        unit_price_kepco: 192.79,
        unit_price_savings: 136.47,
        unit_price_ec_1_5: 261.45,
        unit_price_ec_5_0: 441.15,
        loan_rate_rps: 1.75,
        loan_rate_factoring: 5.1,
        rental_price_per_kw: 20000,
        sub_price_self: 150,
        sub_price_surplus: 50,
      },

      tariffPresets: [
        {
          id: 1,
          name: '산업용(을) 고압A - 선택2',
          baseRate: 8320,
          savings: 210.5,
        },
        {
          id: 2,
          name: '산업용(갑)2 고압A - 선택2',
          baseRate: 7470,
          savings: 136.47,
        },
        { id: 3, name: '산업용(갑)I 저압', baseRate: 5550, savings: 108.4 },
        { id: 4, name: '일반용(갑)I 저압', baseRate: 6160, savings: 114.4 },
      ],

      selectedModel: 'RE100',
      moduleTier: 'STANDARD',
      useEc: true,
      maintenanceRate: 25.0,
      degradationRate: 0.5,
      totalInvestment: 0,

      // --- Actions Implementation (타입 명시 추가) ---

      setClientName: (name: string) => set({ clientName: name }),
      setTargetDate: (date: string) => set({ targetDate: date }),
      setAddress: (address: string) => set({ address }),
      setProposalName: (name: string) => set({ proposalName: name }),

      addRoofArea: () => {
        const newAreas = [
          ...get().roofAreas,
          { id: Math.random().toString(36).substr(2, 9), name: '', valueM2: 0 },
        ];
        set({ roofAreas: newAreas });
        get().recalculateCapacity(newAreas);
      },

      removeRoofArea: (id: string) => {
        const newAreas = get().roofAreas.filter((r) => r.id !== id);
        set({ roofAreas: newAreas });
        get().recalculateCapacity(newAreas);
      },

      updateRoofArea: (
        id: string,
        field: 'name' | 'valueM2',
        value: string | number
      ) => {
        const newAreas = get().roofAreas.map((area) =>
          area.id === id ? { ...area, [field]: value } : area
        );
        set({ roofAreas: newAreas });
        get().recalculateCapacity(newAreas);
      },

      recalculateCapacity: (areas: RoofArea[]) => {
        const totalM2 = areas.reduce((sum, area) => sum + area.valueM2, 0);
        const totalPyeong = totalM2 * 0.3025;
        const capacity = Math.floor(totalPyeong / 2);

        set({ totalAreaPyeong: Math.round(totalPyeong), capacityKw: capacity });
        get().recalculateInvestment();
      },

      setContractType: (
        name: string,
        baseRate: number,
        unitPriceSavings: number
      ) =>
        set({
          contractType: name,
          baseRate: baseRate,
          unitPriceSavings: unitPriceSavings,
        }),

      setVoltageType: (type: string) => set({ voltageType: type }),

      updateMonthlyData: (
        month: number,
        field: keyof MonthlyData,
        value: number
      ) =>
        set((state) => ({
          monthlyData: state.monthlyData.map((data) =>
            data.month === month ? { ...data, [field]: value } : data
          ),
        })),

      copyJanToAll: () =>
        set((state) => {
          const janData = state.monthlyData[0];
          const newMonthlyData = state.monthlyData.map((data, index) => {
            if (index === 0) return data;
            return {
              ...data,
              usageKwh: janData.usageKwh,
              selfConsumption: janData.selfConsumption,
              totalBill: janData.totalBill,
              baseBill: janData.baseBill,
              peakKw: janData.peakKw,
            };
          });
          return { monthlyData: newMonthlyData };
        }),

      setSimulationOption: (
        field:
          | 'selectedModel'
          | 'moduleTier'
          | 'useEc'
          | 'maintenanceRate'
          | 'degradationRate',
        value: any
      ) => {
        set({ [field]: value });
        get().recalculateInvestment();
      },

      updateConfig: (field: keyof SystemConfig, value: number) => {
        set((state) => ({
          config: { ...state.config, [field]: value },
        }));
        get().recalculateInvestment();
      },

      updateTariffPreset: (
        index: number,
        field: keyof TariffPreset,
        value: string | number
      ) => {
        set((state) => {
          const newPresets = [...state.tariffPresets];
          newPresets[index] = { ...newPresets[index], [field]: value };
          return { tariffPresets: newPresets };
        });

        const state = get();
        const updated = state.tariffPresets[index];
        if (state.contractType === updated.name) {
          get().setContractType(
            updated.name,
            updated.baseRate,
            updated.savings
          );
        }
      },

      recalculateInvestment: () => {
        const state = get();
        const { config, capacityKw, moduleTier, useEc, selectedModel } = state;

        let unitPrice = config.price_solar_standard;
        if (moduleTier === 'PREMIUM') unitPrice = config.price_solar_premium;
        if (moduleTier === 'ECONOMY') unitPrice = config.price_solar_economy;

        const solarCount = capacityKw / 100;
        const solarCost = solarCount * unitPrice;

        let ecCost = 0;
        let tractorCost = 0;
        let platformCost = 0;

        if (useEc && selectedModel !== 'KEPCO') {
          const rawEcCount = Math.floor(capacityKw / 100);
          const ecCount = Math.min(3, rawEcCount);

          ecCost = ecCount * config.price_ec_unit;
          tractorCost = ecCount > 0 ? 1 * config.price_tractor : 0;
          platformCost = ecCount > 0 ? 1 * config.price_platform : 0;
        }

        const total = solarCost + ecCost + tractorCost + platformCost;
        set({ totalInvestment: total });
      },

      // --- DB Helper ---
      checkDuplicateName: async (name: string, excludeId?: number) => {
        let query = supabase
          .from('proposals')
          .select('id')
          .eq('proposal_name', name);

        if (excludeId) {
          query = query.neq('id', excludeId);
        }

        const { data, error } = await query;
        if (error) {
          console.error('중복 체크 실패:', error);
          return false;
        }
        return data && data.length > 0;
      },

      // --- DB Actions ---
      saveProposal: async (customName?: string) => {
        const state = get();
        const finalName =
          customName || state.proposalName || `${state.clientName} 견적서`;

        // 중복 체크
        const isDuplicate = await get().checkDuplicateName(
          finalName,
          state.proposalId || undefined
        );
        if (isDuplicate) {
          alert(
            '❌ 이미 같은 이름의 견적서가 존재합니다. 다른 이름을 입력해주세요.'
          );
          return false;
        }

        const saveData = {
          clientName: state.clientName,
          targetDate: state.targetDate,
          address: state.address,
          roofAreas: state.roofAreas,
          monthlyData: state.monthlyData,
          contractType: state.contractType,
          baseRate: state.baseRate,
          unitPriceSavings: state.unitPriceSavings,
          selectedModel: state.selectedModel,
          moduleTier: state.moduleTier,
          useEc: state.useEc,
          maintenanceRate: state.maintenanceRate,
          degradationRate: state.degradationRate,
          config: state.config,
          tariffPresets: state.tariffPresets,
        };

        try {
          console.log('DB 저장 시작...', {
            proposalId: state.proposalId,
            name: finalName,
          });

          if (state.proposalId) {
            const { error } = await supabase
              .from('proposals')
              .update({
                client_name: state.clientName,
                proposal_name: finalName,
                address: state.address,
                input_data: saveData,
                updated_at: new Date().toISOString(),
              })
              .eq('id', state.proposalId);

            if (error) throw error;
            set({ proposalName: finalName });
            alert(`✅ '${finalName}' (이)가 수정되었습니다.`);
          } else {
            const { data, error } = await supabase
              .from('proposals')
              .insert({
                client_name: state.clientName,
                proposal_name: finalName,
                address: state.address,
                input_data: saveData,
                status: 'completed',
              })
              .select()
              .single();

            if (error) throw error;

            if (data) {
              set({ proposalId: data.id, proposalName: finalName });
              alert(`✅ 새 견적서 '${finalName}' (이)가 저장되었습니다.`);
            }
          }
          return true;
        } catch (error: any) {
          console.error('저장 오류 상세:', error);
          alert(`❌ 저장 실패: ${error.message || JSON.stringify(error)}`);
          return false;
        }
      },

      renameProposal: async (id: number, newName: string) => {
        const isDuplicate = await get().checkDuplicateName(newName, id);
        if (isDuplicate) {
          alert('❌ 이미 같은 이름의 견적서가 존재합니다.');
          return false;
        }

        try {
          const { error } = await supabase
            .from('proposals')
            .update({
              proposal_name: newName,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id);

          if (error) throw error;

          if (get().proposalId === id) {
            set({ proposalName: newName });
          }
          alert('✅ 견적서명이 변경되었습니다.');
          return true;
        } catch (error: any) {
          console.error('이름 변경 오류:', error);
          alert(`변경 실패: ${error.message}`);
          return false;
        }
      },

      fetchProposalList: async () => {
        try {
          const { data, error } = await supabase
            .from('proposals')
            .select('id, proposal_name, client_name, created_at, updated_at')
            .order('created_at', { ascending: false });

          if (error) throw error;
          return data || [];
        } catch (error: any) {
          console.error('목록 불러오기 오류:', error);
          alert(`목록 로드 실패: ${error.message}`);
          return [];
        }
      },

      loadProposal: async (id: number) => {
        try {
          const { data, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          if (!data) throw new Error('데이터가 없습니다.');

          set({
            proposalId: data.id,
            proposalName: data.proposal_name || data.client_name,
            ...data.input_data,
          });

          get().recalculateCapacity(data.input_data.roofAreas);
          get().recalculateInvestment();

          alert(`✅ '${data.proposal_name}' 불러오기 완료!`);
        } catch (error: any) {
          console.error('불러오기 오류:', error);
          alert(`불러오기 실패: ${error.message}`);
        }
      },

      deleteProposal: async (id: number) => {
        try {
          const { error } = await supabase
            .from('proposals')
            .delete()
            .eq('id', id);

          if (error) throw error;

          if (get().proposalId === id) {
            get().resetProposal();
          }
          alert('🗑️ 견적서가 삭제되었습니다.');
        } catch (error: any) {
          console.error('삭제 오류:', error);
          alert(`삭제 실패: ${error.message}`);
        }
      },

      resetProposal: () => {
        set({
          proposalId: null,
          proposalName: '',
          clientName: '',
          address: '',
          monthlyData: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            usageKwh: 0,
            selfConsumption: 0,
            totalBill: 0,
            baseBill: 0,
            peakKw: 0,
          })),
          roofAreas: [{ id: '1', name: 'A동 지붕', valueM2: 0 }],
          totalAreaPyeong: 0,
          capacityKw: 0,
          totalInvestment: 0,
        });
      },
    } as any)
);
