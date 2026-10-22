export type ChangePeriod = '1D' | '5D' | '1M' | '6M' | '1Y';

export interface HoldingSummaryResponse {
  holdingId: string;
  portfolioId: string;
  symbol: string;
  instrumentName: string;
  instrumentType: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  dayChangeValue: number;
  // fractions (0.0123 = 1.23%); null when the backend has too little price history for the period
  percentChange: Record<ChangePeriod, number | null>;
  weekLow52: number;
  weekHigh52: number;
}
