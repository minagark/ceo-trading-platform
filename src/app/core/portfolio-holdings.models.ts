export type ChangePeriod = '1D' | '5D' | '1M' | '6M' | '1Y';

export interface HoldingSummaryResponse {
  holdingId: string;
  portfolioId: string;
  instrumentSymbol: string;
  instrumentId: string;
  instrumentName: string;
  instrumentType: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  dayChangeValue: number;
  percentChange: Record<ChangePeriod, number>;
  weekLow52: number;
  weekHigh52: number;
}
