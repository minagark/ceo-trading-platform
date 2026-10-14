import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/api-client.service';
import { Holding, Portfolio } from '../../../core/trading.models';

@Injectable({ providedIn: 'root' })
export class PortfolioApiService {
  private readonly api = inject(ApiClient);

  getPortfolio(portfolioId: string): Observable<Portfolio> {
    return this.api.get<Portfolio>(
      `portfolio/${encodeURIComponent(portfolioId)}`,
    );
  }

  getBuyingPower(portfolioId: string): Observable<number> {
    return this.api.get<number>(
      `portfolio/${encodeURIComponent(portfolioId)}/buying_power`,
    );
  }

  getTotalValue(portfolioId: string): Observable<number> {
    return this.api.get<number>(
      `portfolio/${encodeURIComponent(portfolioId)}/total_value`,
    );
  }

  getHoldings(portfolioId: string): Observable<Holding[]> {
    return this.api.get<Holding[]>(
      `portfolio/${encodeURIComponent(portfolioId)}/holdings`,
    );
  }
}
