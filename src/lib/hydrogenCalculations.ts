/**
 * 수소발전 역산 비교 계산기
 *
 * 핵심 가정:
 *   - 수소(연료전지) 발전은 24시간 × 365일 베이스로드로 운전된다.
 *   - 비교 기준이 되는 "필요 발전량(kWh/년)"은 다음 우선순위로 산출한다.
 *       1순위. 실측 연간 사용량 (monthlyData.usageKwh 합계)  ← 정확
 *       2순위. 연간 전기료 ÷ 한전 단가 (단순 역산)              ← 폴백
 *   - 사용량 데이터가 없거나 0이면 자동으로 단순 역산 폴백을 사용한다.
 *
 * 용량 단위 규칙 (영업/제안 자료 정합성):
 *   - 기본 단위: 1 MW
 *   - 최소 단위: 100 kW (= 0.1 MW)
 *   - 소수점 둘째 자리(1.12 MW 등)는 표현 불가 → 0.1 MW 단위로 **올림(ceil)**
 *     이유: "필요량을 충당하려면 최소 X MW 필요"를 보수적으로 표기
 *
 * 계산 흐름:
 *   annualNeededKwh ─÷ (24 * 365) → rawCapacityKw
 *   rawCapacityKw ÷ 1000          → rawCapacityMw
 *   ceil(rawCapacityMw, 0.1)      → requiredCapacityMw (100kW 단위)
 *   requiredCapacityMw × pricePerMwUk → investmentUk
 *   investmentUk(원환산) ÷ annualBillWon → roiYears (전기료 회수)
 */

export interface HydrogenComparisonInput {
  annualBillWon: number; // 연간 전기료 (원)
  kepcoUnitPrice: number; // 한전 단가 (원/kWh) — 폴백 역산 및 헤더 표기용
  pricePerMwUk: number; // 1MW당 투자비 (억원)
  annualUsageKwh?: number; // 실측 연간 사용량 (kWh) — 있으면 우선 사용
}

export interface HydrogenComparisonResult {
  annualNeededKwh: number; // 연간 필요 발전량 (kWh)
  dailyNeededKwh: number; // 일일 필요 발전량 (kWh)
  rawCapacityKw: number; // 원시 평균 출력 (kW, 올림 전)
  requiredCapacityKw: number; // 필요 평균 출력 (kW, 100kW 단위 올림 후)
  requiredCapacityMw: number; // 필요 평균 출력 (MW)
  investmentWon: number; // 투자비 (원)
  investmentUk: number; // 투자비 (억원)
  roiYears: number; // 회수 기간 (년)
  basedOnActualUsage: boolean; // true: 실측 사용량 / false: 단순 역산
  simpleEstimateKwh: number; // 참고용: 단순 역산치 (annualBillWon / kepcoUnitPrice)
  isUnderscaled: boolean; // true: 원시 필요 출력이 상용 수소연료전지 최소 단위(100kW) 미만
  isValid: boolean;
}

const HOURS_PER_YEAR = 24 * 365;
const WON_PER_UK = 100_000_000;
const HYDROGEN_MIN_COMMERCIAL_KW = 100; // 상용 수소연료전지 최소 단위 (100 kW)

export function computeHydrogenComparison(
  input: HydrogenComparisonInput
): HydrogenComparisonResult {
  const {
    annualBillWon,
    kepcoUnitPrice,
    pricePerMwUk,
    annualUsageKwh = 0,
  } = input;

  // 단순 역산치는 항상 계산해두어 참고/폴백 양쪽 모두에 활용
  const simpleEstimateKwh =
    annualBillWon > 0 && kepcoUnitPrice > 0
      ? annualBillWon / kepcoUnitPrice
      : 0;

  // 1순위: 실측 사용량, 2순위: 단순 역산
  const hasActualUsage = annualUsageKwh > 0;
  const annualNeededKwh = hasActualUsage ? annualUsageKwh : simpleEstimateKwh;

  const isValid = annualNeededKwh > 0 && pricePerMwUk > 0;

  if (!isValid) {
    return {
      annualNeededKwh: 0,
      dailyNeededKwh: 0,
      rawCapacityKw: 0,
      requiredCapacityKw: 0,
      requiredCapacityMw: 0,
      investmentWon: 0,
      investmentUk: 0,
      roiYears: 0,
      basedOnActualUsage: false,
      simpleEstimateKwh,
      isUnderscaled: false,
      isValid: false,
    };
  }

  const dailyNeededKwh = annualNeededKwh / 365;

  // 원시 평균 출력
  const rawCapacityKw = annualNeededKwh / HOURS_PER_YEAR;
  const rawCapacityMw = rawCapacityKw / 1000;

  // 100kW(0.1 MW) 단위 올림 → 1.12 MW 같은 표현 방지, 영업적 보수성
  const requiredCapacityMw = Math.ceil(rawCapacityMw * 10) / 10;
  const requiredCapacityKw = requiredCapacityMw * 1000;

  // 투자비는 100kW 단위로 떨어진 용량 × 1MW 단가
  // (예: 1.1 MW × 60억 = 66억, 0.5 MW × 60억 = 30억 → 100kW당 6억으로 비례)
  const investmentUk = requiredCapacityMw * pricePerMwUk;
  const investmentWon = investmentUk * WON_PER_UK;

  // ROI는 "수소발전 투자비를 연간 전기료로 회수"하는 회수기간 개념
  // → 사용량이 아닌 전기료(원) 기준을 유지하여 사용자 예시(150억/40억=3.75년)와 정합
  const annualBillUk = annualBillWon / WON_PER_UK;
  const roiYears = annualBillUk > 0 ? investmentUk / annualBillUk : 0;

  // 소형 사업장 판정: 원시 평균 출력이 상용 최소 단위(100 kW) 미만
  // → 영업적으로 태양광 PV가 더 적합한 규모 (수소연료전지 단위 부정합)
  const isUnderscaled = rawCapacityKw < HYDROGEN_MIN_COMMERCIAL_KW;

  return {
    annualNeededKwh,
    dailyNeededKwh,
    rawCapacityKw,
    requiredCapacityKw,
    requiredCapacityMw,
    investmentWon,
    investmentUk,
    roiYears,
    basedOnActualUsage: hasActualUsage,
    simpleEstimateKwh,
    isUnderscaled,
    isValid: true,
  };
}
