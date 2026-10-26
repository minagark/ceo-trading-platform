import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiClient } from '../../../core/api-client.service';

export interface AnalyticsQuery extends Record<string, string | number | boolean | null | undefined> {
  from: string;
  to: string;
  symbol?: string;
  clientSegment?: string;
}

export interface VolumeAnalytics {
  from?: string;
  to?: string;
  symbol?: string;
  clientSegment?: string;
  totalNotional: number;
  totalQuantity: number;
  executedTrades: number;
}

export interface TopInstrumentAnalytics {
  symbol: string;
  totalNotional: number;
  totalQuantity: number;
  executedTrades: number;
}

export interface TopMarketMover {
  symbol: string;
  percentageChange: number;
  currentPrice?: number;
  previousClose?: number;
}

export interface ClientActivityTrend {
  periodStart: string;
  clientSegment: string;
  totalNotional: number;
  totalQuantity: number;
  executedTrades: number;
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjclose?: number;
  volume: number;
  synthetic?: boolean;
}

type CandleResponse = Candle | Candle[] | null;

@Injectable({ providedIn: 'root' })
export class AnalyticsApiService {
  private readonly api = inject(ApiClient);

  getVolume(query: AnalyticsQuery): Observable<VolumeAnalytics> {
    return this.api.get<VolumeAnalytics>('analytics/volume', query);
  }

  getTopInstruments(limit: number, query: AnalyticsQuery): Observable<TopInstrumentAnalytics[]> {
    return this.api.get<TopInstrumentAnalytics[]>('analytics/top-instruments', { ...query, limit });
  }

  getTopMovers(limit: number): Observable<TopMarketMover[]> {
    return this.api.get<TopMarketMover[]>('analytics/top-movers', { limit });
  }

  getClientActivityTrends(query: AnalyticsQuery): Observable<ClientActivityTrend[]> {
    return this.api.get<ClientActivityTrend[]>('analytics/client-activity-trends', query);
  }

  getCandles(symbol: string): Observable<Candle[]> {
    return this.api
      .get<CandleResponse>(`analytics/candles/${encodeURIComponent(symbol)}`)
      .pipe(map((response) => {
        const candles = response === null ? [] : Array.isArray(response) ? response : [response];
        return candles.filter((candle) => Number.isFinite(candle?.open) && Number.isFinite(candle?.high) && Number.isFinite(candle?.low) && Number.isFinite(candle?.close));
      }));
  }
}
