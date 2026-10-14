import { Injectable, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';

export type ChangePeriod = '1D' | '5D' | '1M' | '6M' | '1Y';

export interface Holding {
  accountId: string;
  symbol: string;
  companyName: string;
  // Domain used to build a company logo URL (via logo.clearbit.com), e.g. 'apple.com'.
  logoDomain: string;
  shares: number;
  avgCost: number;
  currentPrice: number;
  // Today's $ change per share — always "today", independent of the
  // user-selectable period used for percentChange.
  dayChangeValue: number;
  percentChange: Record<ChangePeriod, number>;
  weekLow52: number;
  weekHigh52: number;
}

@Injectable({ providedIn: 'root' })
export class HoldingsService {
  // Real implementation
  // holdings = httpResource<Holding[]>(() => '/api/holdings');

  // Mock data — swap for httpResource<Holding[]>(() => '/api/holdings')
  // once the holdings API exists (same pattern as AccountsService / AssetsService).
  // accountId values line up with AccountsService's mock accounts ('1', '2', '3').
  holdings = signal<Holding[]>([
    // Brokerage (account 1)
    {
      accountId: '1', symbol: 'AAPL', companyName: 'Apple Inc.', logoDomain: 'apple.com',
      shares: 25, avgCost: 168.32, currentPrice: 227.52, dayChangeValue: 1.32,
      percentChange: { '1D': 0.0058, '5D': 0.021, '1M': 0.045, '6M': 0.128, '1Y': 0.312 },
      weekLow52: 164.08, weekHigh52: 237.23,
    },
    {
      accountId: '1', symbol: 'MSFT', companyName: 'Microsoft Corp.', logoDomain: 'microsoft.com',
      shares: 12, avgCost: 310.1, currentPrice: 421.87, dayChangeValue: -2.14,
      percentChange: { '1D': -0.0051, '5D': -0.012, '1M': 0.018, '6M': 0.095, '1Y': 0.221 },
      weekLow52: 362.9, weekHigh52: 468.35,
    },
    {
      accountId: '1', symbol: 'NVDA', companyName: 'NVIDIA Corp.', logoDomain: 'nvidia.com',
      shares: 40, avgCost: 45.02, currentPrice: 118.11, dayChangeValue: 3.47,
      percentChange: { '1D': 0.0303, '5D': 0.082, '1M': 0.145, '6M': 0.512, '1Y': 1.847 },
      weekLow52: 39.23, weekHigh52: 140.76,
    },
    {
      accountId: '1', symbol: 'AMZN', companyName: 'Amazon.com Inc.', logoDomain: 'amazon.com',
      shares: 8, avgCost: 145.6, currentPrice: 186.21, dayChangeValue: 0.89,
      percentChange: { '1D': 0.0048, '5D': 0.015, '1M': 0.038, '6M': 0.089, '1Y': 0.276 },
      weekLow52: 151.61, weekHigh52: 201.2,
    },

    // Retirement (account 2)
    {
      accountId: '2', symbol: 'GOOGL', companyName: 'Alphabet Inc.', logoDomain: 'abc.xyz',
      shares: 60, avgCost: 98.75, currentPrice: 165.94, dayChangeValue: -0.62,
      percentChange: { '1D': -0.0037, '5D': -0.009, '1M': 0.022, '6M': 0.081, '1Y': 0.298 },
      weekLow52: 127.9, weekHigh52: 207.05,
    },
    {
      accountId: '2', symbol: 'VOO', companyName: 'Vanguard S&P 500 ETF', logoDomain: 'vanguard.com',
      shares: 150, avgCost: 380.0, currentPrice: 512.44, dayChangeValue: 2.1,
      percentChange: { '1D': 0.0041, '5D': 0.011, '1M': 0.026, '6M': 0.071, '1Y': 0.198 },
      weekLow52: 453.03, weekHigh52: 565.1,
    },
    {
      accountId: '2', symbol: 'META', companyName: 'Meta Platforms Inc.', logoDomain: 'meta.com',
      shares: 30, avgCost: 210.45, currentPrice: 512.02, dayChangeValue: -6.33,
      percentChange: { '1D': -0.0122, '5D': -0.028, '1M': 0.015, '6M': 0.062, '1Y': 0.187 },
      weekLow52: 414.5, weekHigh52: 638.4,
    },

    // Active Trading (account 3)
    {
      accountId: '3', symbol: 'TSLA', companyName: 'Tesla Inc.', logoDomain: 'tesla.com',
      shares: 15, avgCost: 220.0, currentPrice: 248.5, dayChangeValue: 5.72,
      percentChange: { '1D': 0.0235, '5D': 0.061, '1M': 0.112, '6M': -0.045, '1Y': 0.089 },
      weekLow52: 138.8, weekHigh52: 488.54,
    },
    {
      accountId: '3', symbol: 'AMD', companyName: 'Advanced Micro Devices', logoDomain: 'amd.com',
      shares: 45, avgCost: 98.2, currentPrice: 142.33, dayChangeValue: -1.05,
      percentChange: { '1D': -0.0073, '5D': -0.018, '1M': 0.032, '6M': 0.184, '1Y': 0.421 },
      weekLow52: 76.48, weekHigh52: 187.28,
    },
  ]);
}
