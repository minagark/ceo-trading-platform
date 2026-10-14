export interface ApiError {
  status: number;
  message: string;
  detail?: unknown;
}

export interface QuoteResponse {
  symbol: string;
  price: number;
  bid: number;
  ask: number;
  spreadBps: number;
  currency: string;
  change: number;
  changePercent: number;
  previousClose: number;
  asOf: string;
  marketState: string;
}
