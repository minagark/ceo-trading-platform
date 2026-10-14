import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../core/api-client.service';
import { QuoteResponse } from '../core/api.models';

@Injectable({ providedIn: 'root' })
export class MarketApiService {
  private readonly api = inject(ApiClient);

  getQuote(symbol: string): Observable<QuoteResponse> {
    return this.api.get<QuoteResponse>(`quotes/${encodeURIComponent(symbol)}`);
  }
}
