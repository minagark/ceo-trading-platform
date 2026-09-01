import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { of, delay } from 'rxjs';
import { Trade, TradeRequest } from '../trade-screen/trade-screen';

@Injectable({ providedIn: 'root' })
export class PreviewService {
  private http = inject(HttpClient);

  // Real implementation —
  // placeTrade(request: TradeRequest) {
  //   return this.http.post<Trade>('/api/trades', request);
  // }

  // Mock implementation — no backend yet, so we fabricate the response
  // instead of hitting the network. `delay` keeps `submitting()` visible
  // in the UI so the loading state is actually testable.
  placeTrade(request: TradeRequest) {
    const trade: Trade = {
      ...request,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    return of(trade).pipe(delay(400));
  }
}
