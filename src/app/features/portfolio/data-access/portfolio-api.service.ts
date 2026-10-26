import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/api-client.service';
import { Portfolio, PortfolioType } from '../../../core/trading.models';
import { HoldingSummaryResponse } from '../../../core/portfolio-holdings.models';
import { TimeFrame } from '../../market/stock-display/stock-display';
import { PerformanceResponse } from '../../../core/portfolio-performance.models';

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

  getHoldings(portfolioId: string): Observable<HoldingSummaryResponse[]> {
    return this.api.get<HoldingSummaryResponse[]>(
      `portfolio/${encodeURIComponent(portfolioId)}/holdings`,
    );
  }

  getPerformance(portfolioId: string, timeframe: TimeFrame): Observable<PerformanceResponse[]> {
    return this.api.get<PerformanceResponse[]>(
      `portfolio/${encodeURIComponent(portfolioId)}/performance/${encodeURIComponent(timeframe)}`
    );
  }

  createPortfolio(portfolioType: PortfolioType, clientId: string): Observable<Portfolio> {
    return this.api.get<Portfolio>(
      `portfolio/new/${encodeURIComponent(portfolioType)}/${encodeURIComponent(clientId)}`
    );
  }
    
}
