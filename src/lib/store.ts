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
  year?: number; // [NEW] 엑셀 업로드 시 연도 저장을 위해 추가
  usageKwh: number;
  selfConsumption: number;
  totalBill: number;
  baseBill: number;
  peakKw: number;
  solarGeneration: number;
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
  subscription_price_per_kw: number;
  sub_price_self: number;
  sub_price_surplus: number;
};

export type TariffPreset = {
  id: number;
  name: string;
  baseRate: number;
  savings: number;
};

export type RationalizationData = {
  base_eul: number;
  base_gap: number;
  base_usage: number;
  base_savings_manual: number;
  light_eul: number;
  light_gap: number;
  light_usage: number;
  mid_eul: number;
  mid_gap: number;
  mid_usage: number;
  max_eul: number;
  max_gap: number;
  max_usage: number;
};

export type ProposalMeta = {
  id: number;
  proposal_name: string;
  client_name: string;
  created_at: string;
  updated_at: string;
};

// 계산 결과 반환 타입
type SimulationResult = {
  totalInvestment: number;
  totalInvestmentUk: number;

  initialAnnualGen: number;
  annualSelfConsumption: number;
  annualSurplus: number;
  volume_self: number;
  volume_ec: number;
  volume_surplus_final: number;

  revenue_saving: number;
  revenue_ec: number;
  revenue_surplus: number;
  totalRationalizationSavings: number;

  annualGrossRevenue: number;
  annualOperatingProfit: number;

  annualMaintenanceCost: number;
  laborCostWon: number;

  self_final_profit: number;
  rps_final_profit: number;
  fac_final_profit: number;
  rental_final_profit: number;
  sub_final_profit: number;

  rps_equity: number;
  rps_interest_only: number;
  rps_pmt: number;
  rps_net_1_5: number;
  rps_net_6_15: number;

  fac_interest_only: number;
  fac_pmt: number;
  fac_net_1: number;
  fac_net_2_10: number;

  rec_1000_common: number;
  rec_1000_rent: number;
  rec_1000_sub: number;

  // [NEW] 연간 REC 수익
  rec_annual_common: number;
  rec_annual_rent: number;
  rec_annual_sub: number;

  self_roi_years: number;
  rps_roi_years: number;
  fac_roi_years: number;

  rental_revenue_yr: number;
  sub_revenue_yr: number;
};

interface ProposalState {
  siteImage: string | null;
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
  energyNote: string;
  rationalization: RationalizationData;
  config: SystemConfig;
  tariffPresets: TariffPreset[];
  selectedModel: BusinessModel;
  moduleTier: ModuleTier;
  useEc: boolean;
  truckCount: number;
  maintenanceRate: number;
  degradationRate: number;
  totalInvestment: number;

  // [NEW] REC 평균 가격
  recAveragePrice: number;

  // --- Actions ---
  setSiteImage: (img: string | null) => void;
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

  // [NEW] 엑셀 업로드 및 일괄 적용용
  setMonthlyData: (data: MonthlyData[]) => void;
  copyJanToAll: () => void;
  copyFieldToAll: (field: keyof MonthlyData) => void;

  setEnergyNote: (note: string) => void;
  updateRationalization: (
    field: keyof RationalizationData,
    value: number
  ) => void;
  setSimulationOption: (field: any, value: any) => void;
  setTruckCount: (count: number) => void;
  updateConfig: (field: keyof SystemConfig, value: number) => void;
  updateTariffPreset: (
    index: number,
    field: keyof TariffPreset,
    value: string | number
  ) => void;
  recalculateInvestment: () => void;

  // [NEW] 용량 수동 설정 및 REC 가격 설정
  setCapacityKw: (val: number) => void;
  setRecAveragePrice: (price: number) => void;

  // [NEW] 파일명 자동 생성 Getter
  getProposalFileName: () => string;

  // DB Actions
  checkDuplicateName: (name: string, excludeId?: number) => Promise<boolean>;
  saveProposal: (customName?: string) => Promise<boolean>;
  // [NEW] 다른 이름으로 저장
  saveAsProposal: (customName: string) => Promise<boolean>;
  renameProposal: (id: number, newName: string) => Promise<boolean>;
  fetchProposalList: () => Promise<ProposalMeta[]>;
  loadProposal: (id: number) => Promise<void>;
  deleteProposal: (id: number) => Promise<void>;
  resetProposal: () => void;

  // Calculation Action
  getSimulationResults: () => SimulationResult;
}

// [Helper] PMT 함수
const PMT = (rate: number, nper: number, pv: number) => {
  if (rate === 0) return -pv / nper;
  const pvif = Math.pow(1 + rate, nper);
  return (rate * pv * pvif) / (pvif - 1);
};

export const useProposalStore = create<ProposalState>((set, get) => ({
  siteImage: null, // [NEW]
  proposalId: null,
  proposalName: '',
  clientName: '(주)회사명',
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
    solarGeneration: 0,
  })),
  unitPriceSavings: 210.5,
  unitPriceSell: 192.79,
  peakReductionRatio: 0.359,
  energyNote: '',
  rationalization: {
    base_eul: 8320,
    base_gap: 7470,
    base_usage: 0,
    base_savings_manual: 0,
    light_eul: 113.23,
    light_gap: 93.27,
    light_usage: 0,
    mid_eul: 153.73,
    mid_gap: 109.43,
    mid_usage: 0,
    max_eul: 210.5,
    max_gap: 136.5,
    max_usage: 0,
  },
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
    subscription_price_per_kw: 40000,
    sub_price_self: 150,
    sub_price_surplus: 50,
  },
  tariffPresets: [
    { id: 1, name: '산업용(을) 고압A - 선택2', baseRate: 8320, savings: 210.5 },
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
  truckCount: 3,
  maintenanceRate: 25.0,
  degradationRate: 0.5,
  totalInvestment: 0,
  recAveragePrice: 80, // [NEW] 초기값

  // --- Actions ---
  setSiteImage: (img) => set({ siteImage: img }), // [NEW]
  setClientName: (name) => set({ clientName: name }),
  setTargetDate: (date) => set({ targetDate: date }),
  setAddress: (addr) => set({ address: addr }),
  setProposalName: (name) => set({ proposalName: name }),
  addRoofArea: () => {
    const newAreas = [
      ...get().roofAreas,
      { id: Math.random().toString(36).substr(2, 9), name: '', valueM2: 0 },
    ];
    set({ roofAreas: newAreas });
    get().recalculateCapacity(newAreas);
  },
  removeRoofArea: (id) => {
    const newAreas = get().roofAreas.filter((r) => r.id !== id);
    set({ roofAreas: newAreas });
    get().recalculateCapacity(newAreas);
  },
  updateRoofArea: (id, field, value) => {
    const newAreas = get().roofAreas.map((area) =>
      area.id === id ? { ...area, [field]: value } : area
    );
    set({ roofAreas: newAreas });
    get().recalculateCapacity(newAreas);
  },
  recalculateCapacity: (areas) => {
    const totalM2 = areas.reduce((sum, area) => sum + area.valueM2, 0);
    const totalPyeong = totalM2 * 0.3025;
    const capacity = Math.floor(totalPyeong / 2);
    set({ totalAreaPyeong: Math.round(totalPyeong), capacityKw: capacity });
    get().recalculateInvestment();
  },
  setContractType: (name, baseRate, unitPriceSavings) =>
    set({ contractType: name, baseRate, unitPriceSavings }),
  setVoltageType: (type) => set({ voltageType: type }),
  updateMonthlyData: (month, field, value) =>
    set((state) => ({
      monthlyData: state.monthlyData.map((d) =>
        d.month === month ? { ...d, [field]: value } : d
      ),
    })),

  // [NEW] 전체 데이터 교체 (엑셀 업로드용)
  setMonthlyData: (data) => set({ monthlyData: data }),

  copyJanToAll: () =>
    set((state) => {
      const jan = state.monthlyData[0];
      const newData = state.monthlyData.map((d, i) =>
        i === 0
          ? d
          : {
              ...d,
              usageKwh: jan.usageKwh,
              selfConsumption: jan.selfConsumption,
              totalBill: jan.totalBill,
              baseBill: jan.baseBill,
              peakKw: jan.peakKw,
              solarGeneration: jan.solarGeneration,
            }
      );
      return { monthlyData: newData };
    }),

  // [NEW] 특정 필드 일괄 복사
  copyFieldToAll: (field) =>
    set((state) => {
      const firstVal = state.monthlyData[0][field];
      const newData = state.monthlyData.map((d, i) =>
        i === 0 ? d : { ...d, [field]: firstVal }
      );
      return { monthlyData: newData };
    }),

  setEnergyNote: (note) => set({ energyNote: note }),
  updateRationalization: (field, value) =>
    set((state) => ({
      rationalization: { ...state.rationalization, [field]: value },
    })),
  setSimulationOption: (field, value) => {
    set((state) => {
      if (field === 'useEc')
        return { ...state, useEc: value, truckCount: value ? 3 : 0 };
      return { ...state, [field]: value };
    });
    get().recalculateInvestment();
  },
  setTruckCount: (count) => {
    set({ truckCount: count });
    get().recalculateInvestment();
  },
  updateConfig: (field, value) => {
    set((state) => ({ config: { ...state.config, [field]: value } }));
    get().recalculateInvestment();
  },
  updateTariffPreset: (index, field, value) => {
    set((state) => {
      const newPresets = [...state.tariffPresets];
      newPresets[index] = { ...newPresets[index], [field]: value };
      return { tariffPresets: newPresets };
    });
    const state = get();
    const updated = state.tariffPresets[index];
    if (state.contractType === updated.name)
      get().setContractType(updated.name, updated.baseRate, updated.savings);
  },
  recalculateInvestment: () => {
    const state = get();
    const { config, capacityKw, moduleTier, useEc, selectedModel, truckCount } =
      state;
    let unitPrice = config.price_solar_standard;
    if (moduleTier === 'PREMIUM') unitPrice = config.price_solar_premium;
    if (moduleTier === 'ECONOMY') unitPrice = config.price_solar_economy;
    const solarCost = (capacityKw / 100) * unitPrice;
    let ecCost = 0,
      tractorCost = 0,
      platformCost = 0;
    if (useEc && selectedModel !== 'KEPCO') {
      ecCost = truckCount * config.price_ec_unit;
      tractorCost = truckCount > 0 ? config.price_tractor : 0;
      platformCost = truckCount > 0 ? config.price_platform : 0;
    }
    set({ totalInvestment: solarCost + ecCost + tractorCost + platformCost });
  },

  // [NEW] 용량 및 REC 가격 설정
  setCapacityKw: (val) => {
    set({ capacityKw: val });
    get().recalculateInvestment();
  },
  setRecAveragePrice: (price) => set({ recAveragePrice: price }),

  // [NEW] 자동 파일명 생성
  getProposalFileName: () => {
    const state = get();
    const date = new Date();
    const yy = String(date.getFullYear()).slice(2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;

    const isEcActive = state.useEc && state.selectedModel !== 'KEPCO';
    const ecPart = isEcActive ? `_EC${state.truckCount}대` : '';

    return `분석자료_${state.clientName}_${state.capacityKw}kW${ecPart}_${dateStr}`;
  },

  // ------------------------------------------------------------------
  // DB Actions
  // ------------------------------------------------------------------
  checkDuplicateName: async (name, excludeId) => {
    let query = supabase
      .from('proposals')
      .select('id')
      .eq('proposal_name', name);
    if (excludeId) query = query.neq('id', excludeId);
    const { data, error } = await query;
    if (error) {
      console.error('중복 체크 실패:', error);
      return false;
    }
    return data && data.length > 0;
  },

  saveProposal: async (customName) => {
    const state = get();
    const defaultName = get().getProposalFileName();
    const finalName = customName || state.proposalName || defaultName;

    const isDuplicate = await get().checkDuplicateName(
      finalName,
      state.proposalId || undefined
    );
    if (isDuplicate) {
      alert('❌ 이미 같은 이름의 견적서가 존재합니다.');
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
      energyNote: state.energyNote,
      rationalization: state.rationalization,
      selectedModel: state.selectedModel,
      moduleTier: state.moduleTier,
      useEc: state.useEc,
      truckCount: state.truckCount,
      maintenanceRate: state.maintenanceRate,
      degradationRate: state.degradationRate,
      config: state.config,
      tariffPresets: state.tariffPresets,
      recAveragePrice: state.recAveragePrice,
      siteImage: state.siteImage, // [NEW] 저장 시 포함
    };

    try {
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
        alert(`✅ '${finalName}' 수정 완료`);
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
          alert(`✅ '${finalName}' 저장 완료`);
        }
      }
      return true;
    } catch (error: any) {
      console.error('저장 실패:', error);
      alert(`저장 실패: ${error.message}`);
      return false;
    }
  },

  // [NEW] 다른 이름으로 저장 (복제)
  saveAsProposal: async (customName) => {
    const state = get();

    const isDuplicate = await get().checkDuplicateName(customName);
    if (isDuplicate) {
      alert(
        '❌ 이미 같은 이름의 견적서가 존재합니다. 다른 이름을 사용해주세요.'
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
      energyNote: state.energyNote,
      rationalization: state.rationalization,
      selectedModel: state.selectedModel,
      moduleTier: state.moduleTier,
      useEc: state.useEc,
      truckCount: state.truckCount,
      maintenanceRate: state.maintenanceRate,
      degradationRate: state.degradationRate,
      config: state.config,
      tariffPresets: state.tariffPresets,
      recAveragePrice: state.recAveragePrice,
    };

    try {
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          client_name: state.clientName,
          proposal_name: customName,
          address: state.address,
          input_data: saveData,
          status: 'completed',
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        set({ proposalId: data.id, proposalName: customName });
        alert(`✅ '${customName}'(으)로 복제 저장되었습니다.`);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('다른 이름으로 저장 실패:', error);
      alert(`저장 실패: ${error.message}`);
      return false;
    }
  },

  renameProposal: async (id, newName) => {
    const isDuplicate = await get().checkDuplicateName(newName, id);
    if (isDuplicate) {
      alert('❌ 중복된 이름입니다.');
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
      if (get().proposalId === id) set({ proposalName: newName });
      alert('✅ 변경 완료');
      return true;
    } catch (error: any) {
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
      console.error('목록 로드 실패:', error);
      return [];
    }
  },

  loadProposal: async (id) => {
    try {
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (!data) throw new Error('데이터 없음');

      set({
        proposalId: data.id,
        proposalName: data.proposal_name || data.client_name,
        ...data.input_data,
        recAveragePrice: data.input_data.recAveragePrice ?? 80,
        siteImage: data.input_data.siteImage || null, // [NEW]
      });
      get().recalculateCapacity(data.input_data.roofAreas);
      get().recalculateInvestment();
      alert(`✅ '${data.proposal_name}' 불러오기 완료`);
    } catch (error: any) {
      alert(`불러오기 실패: ${error.message}`);
    }
  },

  deleteProposal: async (id) => {
    try {
      const { error } = await supabase.from('proposals').delete().eq('id', id);
      if (error) throw error;
      if (get().proposalId === id) get().resetProposal();
      alert('🗑️ 삭제되었습니다.');
    } catch (error: any) {
      alert(`삭제 실패: ${error.message}`);
    }
  },

  resetProposal: () => {
    set({
      siteImage: null,
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
        solarGeneration: 0,
      })),
      roofAreas: [{ id: '1', name: 'A동 지붕', valueM2: 0 }],
      totalAreaPyeong: 0,
      capacityKw: 0,
      energyNote: '',
      rationalization: {
        base_eul: 8320,
        base_gap: 7470,
        base_usage: 0,
        base_savings_manual: 0,
        light_eul: 113.23,
        light_gap: 93.27,
        light_usage: 0,
        mid_eul: 153.73,
        mid_gap: 109.43,
        mid_usage: 0,
        max_eul: 210.5,
        max_gap: 136.5,
        max_usage: 0,
      },
      useEc: true,
      truckCount: 3,
      totalInvestment: 0,
      recAveragePrice: 80,
    });
  },

  // =================================================================
  // [핵심] 중앙 계산 로직
  // =================================================================
  getSimulationResults: () => {
    const state = get();
    const {
      config,
      rationalization,
      truckCount,
      monthlyData,
      capacityKw,
      selectedModel,
      useEc,
    } = state;

    // 1. 투자비
    const totalInvestment = state.totalInvestment * 100000000;
    const totalInvestmentUk = state.totalInvestment;

    // 2. 발전량 및 소비량
    const initialAnnualGen = monthlyData.reduce((acc, cur) => {
      const days = new Date(2025, cur.month, 0).getDate();
      const autoGen = capacityKw * 3.64 * days;
      return acc + (cur.solarGeneration > 0 ? cur.solarGeneration : autoGen);
    }, 0);

    let volume_self = 0;
    let rawSurplus = 0;
    let volume_ec = 0;
    let volume_surplus_final = 0;
    let revenue_saving = 0;
    let totalRationalizationSavings = 0;

    if (selectedModel === 'KEPCO') {
      volume_self = 0;
      rawSurplus = initialAnnualGen;
      volume_ec = 0;
      volume_surplus_final = initialAnnualGen;
      revenue_saving = 0;
      totalRationalizationSavings = 0;
    } else {
      const annualSelfConsumption = monthlyData.reduce(
        (acc, cur) => acc + cur.selfConsumption,
        0
      );
      volume_self = Math.min(initialAnnualGen, annualSelfConsumption);
      rawSurplus = Math.max(0, initialAnnualGen - annualSelfConsumption);

      const ecCapacityAnnual = truckCount * 100 * 4 * 365;
      if (useEc) {
        volume_ec = Math.min(rawSurplus, ecCapacityAnnual);
      }
      volume_surplus_final = Math.max(0, rawSurplus - volume_ec);

      const appliedSavingsPrice =
        state.unitPriceSavings || config.unit_price_savings;
      revenue_saving = volume_self * appliedSavingsPrice;

      const isEul = state.contractType.includes('(을)');
      totalRationalizationSavings = isEul
        ? rationalization.base_savings_manual +
          (rationalization.light_eul - rationalization.light_gap) *
            rationalization.light_usage +
          (rationalization.mid_eul - rationalization.mid_gap) *
            rationalization.mid_usage +
          (rationalization.max_eul - rationalization.max_gap) *
            rationalization.max_usage
        : 0;
    }

    let appliedSellPrice = config.unit_price_kepco;
    if (selectedModel === 'RE100') appliedSellPrice = config.unit_price_ec_1_5;
    if (selectedModel === 'REC5') appliedSellPrice = config.unit_price_ec_5_0;

    const revenue_ec = volume_ec * appliedSellPrice;
    const revenue_surplus = volume_surplus_final * config.unit_price_kepco;

    const annualGrossRevenue =
      revenue_saving +
      revenue_ec +
      revenue_surplus +
      totalRationalizationSavings;

    const laborCostWon =
      truckCount > 0 && useEc && selectedModel !== 'KEPCO'
        ? config.price_labor_ec * 100000000
        : 0;
    const annualMaintenanceCost =
      (annualGrossRevenue * state.maintenanceRate) / 100 + laborCostWon;

    const annualOperatingProfit = annualGrossRevenue - annualMaintenanceCost;

    const degradationRateDecimal = -(state.degradationRate / 100);
    const R = 1 + degradationRateDecimal;
    const n = 20;
    const self_final_profit =
      (annualOperatingProfit * (1 - Math.pow(R, n))) / (1 - R);

    const rps_rate = config.loan_rate_rps / 100;
    const rps_loan = totalInvestment * 0.8;
    const rps_equity = totalInvestment * 0.2;
    const rps_interest_only = rps_loan * rps_rate;
    const rps_pmt = PMT(rps_rate, 10, -rps_loan);
    const rps_final_profit =
      self_final_profit - rps_interest_only * 5 - Math.abs(rps_pmt) * 10;
    const rps_net_1_5 = annualOperatingProfit - rps_interest_only;
    const rps_net_6_15 = annualOperatingProfit + rps_pmt;

    const fac_rate = config.loan_rate_factoring / 100;
    const fac_loan = totalInvestment;
    const fac_interest_only = fac_loan * fac_rate;
    const fac_pmt = PMT(fac_rate, 9, -fac_loan);
    const fac_final_profit =
      self_final_profit - fac_interest_only * 1 - Math.abs(fac_pmt) * 9;
    const fac_net_1 = annualOperatingProfit - fac_interest_only;
    const fac_net_2_10 = annualOperatingProfit + fac_pmt;

    const rental_revenue_yr =
      capacityKw * 0.2 * config.unit_price_kepco * 3.64 * 365 +
      capacityKw * 0.8 * config.rental_price_per_kw;
    const rental_final_profit = rental_revenue_yr * 20;

    const price_standard = 210.5;
    const annualSelfConsumptionForSub = monthlyData.reduce(
      (acc, cur) => acc + cur.selfConsumption,
      0
    );
    const sub_benefit_savings =
      annualSelfConsumptionForSub * (price_standard - config.sub_price_self);
    const rawSurplusForSub = Math.max(
      0,
      initialAnnualGen - annualSelfConsumptionForSub
    );
    const sub_revenue_surplus = rawSurplusForSub * config.sub_price_surplus;
    const sub_revenue_yr = sub_benefit_savings + sub_revenue_surplus;
    const sub_final_profit = sub_revenue_yr * 20;

    // 10. 1 REC & REC Annual Revenue
    const recPrice = state.recAveragePrice || 80;

    const rec_1000_common = annualOperatingProfit / recPrice / 1000;
    const rec_1000_rent = (capacityKw * 0.2 * 3.64 * 365) / 1000;
    const rec_1000_sub = sub_revenue_yr / recPrice / 1000;

    const rec_annual_common = rec_1000_common * recPrice * 1000;
    const rec_annual_rent = rec_1000_rent * recPrice * 1000;
    const rec_annual_sub = rec_1000_sub * recPrice * 1000;

    const self_roi_years =
      annualOperatingProfit > 0 ? totalInvestment / annualOperatingProfit : 0;
    const rps_roi_years =
      rps_final_profit / 20 > 0 ? totalInvestment / (rps_final_profit / 20) : 0;
    const fac_roi_years =
      fac_final_profit / 20 > 0 ? totalInvestment / (fac_final_profit / 20) : 0;

    return {
      totalInvestment,
      totalInvestmentUk,
      initialAnnualGen,
      annualSelfConsumption:
        selectedModel === 'KEPCO'
          ? 0
          : monthlyData.reduce((acc, cur) => acc + cur.selfConsumption, 0),
      annualSurplus: rawSurplus,
      volume_self,
      volume_ec,
      volume_surplus_final,
      revenue_saving,
      revenue_ec,
      revenue_surplus,
      totalRationalizationSavings,
      annualGrossRevenue,
      annualOperatingProfit,
      annualMaintenanceCost,
      laborCostWon,
      self_final_profit,
      rps_final_profit,
      fac_final_profit,
      rental_final_profit,
      sub_final_profit,
      rps_equity,
      rps_interest_only,
      rps_pmt,
      rps_net_1_5,
      rps_net_6_15,
      fac_interest_only,
      fac_pmt,
      fac_net_1,
      fac_net_2_10,
      rec_1000_common,
      rec_1000_rent,
      rec_1000_sub,

      // 반환값에 추가
      rec_annual_common,
      rec_annual_rent,
      rec_annual_sub,

      self_roi_years,
      rps_roi_years,
      fac_roi_years,
      rental_revenue_yr,
      sub_revenue_yr,
    };
  },
}));
