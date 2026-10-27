import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { ApiClient } from '../../../core/api-client.service';
import { QuoteResponse } from '../../../core/api.models';
import { InstrumentType } from '../../../core/trading.models';
import { PerformanceResponse } from '../../../core/portfolio-performance.models';
import { Candle } from './analytics-api.service';

@Injectable({ providedIn: 'root' })
export class MarketApiService {
  private readonly api = inject(ApiClient);

  getQuote(symbol: string, type: InstrumentType): Observable<QuoteResponse> {
    return this.api.get<QuoteResponse>(
      `quotes/${encodeURIComponent(symbol)}/${encodeURIComponent(type)}`
    );
  }

  // idk if this is the right place to put it but idgaf
  getStockInfo(symbol: string, type: InstrumentType, timeframe: string): Observable<PerformanceResponse[]> {
    return this.api.get<PerformanceResponse[]>(
      `candles/${encodeURIComponent(symbol)}/${encodeURIComponent(type)}/${encodeURIComponent(timeframe)}`
    );
  }

  getTodaysCandle(symbol: string, type: InstrumentType): Observable<Candle | null> {
    return this.api
      .get<Candle | Candle[] | null>(
        `candles/${encodeURIComponent(symbol)}/${encodeURIComponent(type)}/today`
      )
      .pipe(
        map((response) =>
          Array.isArray(response) ? response.at(-1) ?? null : response
        )
      );
  }
}
