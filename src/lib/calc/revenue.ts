/**
 * Yatırımcı gelir senaryosu modeli — açıklayıcı bir hesap aracıdır, tahmin veya taahhüt değildir.
 * Gelir kalemleri: sürücü abonelikleri, filo SaaS lisansları, şarj işlem komisyonu, operatör API/entegrasyon ücretleri.
 */
export interface RevenueInput {
  years: number;
  usersY1: number;
  userGrowthPct: number;
  paidConversionPct: number;
  arpuMonthly: number; // ₺, ücretli sürücü başı
  fleetCustomersY1: number;
  fleetGrowthPct: number;
  vehiclesPerFleet: number;
  fleetFeePerVehicleMonthly: number;
  chargingSpendPerUserYearly: number; // ₺, platform üzerinden ödenen şarj tutarı
  takeRatePct: number;
  operatorPartnersY1: number;
  operatorFeeYearly: number;
  grossMarginPct: number;
  /** Kullanıcı edinme maliyeti (₺/yeni kullanıcı) */
  cacPerUser: number;
  /** Aylık kullanıcı kaybı (%) */
  monthlyChurnPct: number;
  /** 1. yıl sabit işletme giderleri (personel, altyapı, genel giderler) ₺ */
  opexYear1: number;
  opexGrowthPct: number;
  /** Kâr üzerinden vergi oranı (%) — yalnızca pozitif kârda uygulanır */
  taxRatePct: number;
  /** Başlangıç nakdi (₺) */
  startingCash: number;
}

export interface RevenueRow {
  year: number;
  users: number;
  paidUsers: number;
  fleetCustomers: number;
  fleetVehicles: number;
  subscription: number;
  fleetSaas: number;
  transactions: number;
  operatorApi: number;
  total: number;
  grossProfit: number;
  newUsers: number;
  acquisitionCost: number;
  opex: number;
  ebitda: number;
  tax: number;
  netIncome: number;
  cumulativeCash: number;
}

export const REVENUE_PRESETS: Record<'muhafazakar' | 'baz' | 'iddiali', RevenueInput> = {
  muhafazakar: {
    years: 5, usersY1: 8000, userGrowthPct: 70, paidConversionPct: 4, arpuMonthly: 99,
    fleetCustomersY1: 6, fleetGrowthPct: 60, vehiclesPerFleet: 25, fleetFeePerVehicleMonthly: 290,
    chargingSpendPerUserYearly: 3500, takeRatePct: 1.5, operatorPartnersY1: 1, operatorFeeYearly: 180000, grossMarginPct: 62, cacPerUser: 60, monthlyChurnPct: 4, opexYear1: 9000000, opexGrowthPct: 25, taxRatePct: 25, startingCash: 15000000,
  },
  baz: {
    years: 5, usersY1: 20000, userGrowthPct: 95, paidConversionPct: 6, arpuMonthly: 129,
    fleetCustomersY1: 12, fleetGrowthPct: 85, vehiclesPerFleet: 30, fleetFeePerVehicleMonthly: 340,
    chargingSpendPerUserYearly: 4500, takeRatePct: 2, operatorPartnersY1: 2, operatorFeeYearly: 240000, grossMarginPct: 68, cacPerUser: 45, monthlyChurnPct: 3, opexYear1: 12000000, opexGrowthPct: 35, taxRatePct: 25, startingCash: 25000000,
  },
  iddiali: {
    years: 5, usersY1: 45000, userGrowthPct: 120, paidConversionPct: 8, arpuMonthly: 149,
    fleetCustomersY1: 25, fleetGrowthPct: 110, vehiclesPerFleet: 40, fleetFeePerVehicleMonthly: 390,
    chargingSpendPerUserYearly: 5500, takeRatePct: 2.5, operatorPartnersY1: 3, operatorFeeYearly: 300000, grossMarginPct: 72, cacPerUser: 35, monthlyChurnPct: 2, opexYear1: 18000000, opexGrowthPct: 45, taxRatePct: 25, startingCash: 40000000,
  },
};

export function projectRevenue(i: RevenueInput): RevenueRow[] {
  const rows: RevenueRow[] = [];
  const years = Math.max(1, Math.min(10, Math.round(i.years)));
  const annualRetention = Math.pow(1 - Math.min(100, Math.max(0, i.monthlyChurnPct)) / 100, 12);
  let prevUsers = 0;
  let cash = i.startingCash;
  for (let y = 0; y < years; y++) {
    const users = i.usersY1 * Math.pow(1 + i.userGrowthPct / 100, y);
    // Hedef kullanıcı tabanına ulaşmak için, kaybedilenlerin yerine konanlar dahil edinilmesi gereken kullanıcı
    const newUsers = Math.max(0, users - prevUsers * annualRetention);
    prevUsers = users;
    const paidUsers = users * (i.paidConversionPct / 100);
    const fleetCustomers = i.fleetCustomersY1 * Math.pow(1 + i.fleetGrowthPct / 100, y);
    const fleetVehicles = fleetCustomers * i.vehiclesPerFleet;
    const operators = i.operatorPartnersY1 + y; // her yıl bir yeni operatör entegrasyonu varsayımı
    const subscription = paidUsers * i.arpuMonthly * 12;
    const fleetSaas = fleetVehicles * i.fleetFeePerVehicleMonthly * 12;
    const transactions = users * i.chargingSpendPerUserYearly * (i.takeRatePct / 100);
    const operatorApi = operators * i.operatorFeeYearly;
    const total = subscription + fleetSaas + transactions + operatorApi;
    const grossProfit = total * (i.grossMarginPct / 100);
    const acquisitionCost = newUsers * i.cacPerUser;
    const opex = i.opexYear1 * Math.pow(1 + i.opexGrowthPct / 100, y);
    const ebitda = grossProfit - acquisitionCost - opex;
    const tax = ebitda > 0 ? ebitda * (i.taxRatePct / 100) : 0;
    const netIncome = ebitda - tax;
    cash += netIncome;
    rows.push({
      year: y + 1,
      users: Math.round(users),
      paidUsers: Math.round(paidUsers),
      fleetCustomers: Math.round(fleetCustomers),
      fleetVehicles: Math.round(fleetVehicles),
      subscription,
      fleetSaas,
      transactions,
      operatorApi,
      total,
      grossProfit,
      newUsers: Math.round(newUsers),
      acquisitionCost,
      opex,
      ebitda,
      tax,
      netIncome,
      cumulativeCash: cash,
    });
  }
  return rows;
}

export function cagr(first: number, last: number, periods: number) {
  if (first <= 0 || periods <= 0) return 0;
  return (Math.pow(last / first, 1 / periods) - 1) * 100;
}
