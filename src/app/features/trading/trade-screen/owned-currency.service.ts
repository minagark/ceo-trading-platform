import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PortfolioApiService } from '../../portfolio/data-access/portfolio-api.service';

export interface OwnedCurrency {
  id: string;
  symbol: string;
  name: string;
}

@Injectable({ providedIn: 'root' })
export class CurrencyService {
    private readonly api = inject(PortfolioApiService);

    currenciesOwnedByPortfolio(portfolioId: string): Observable<OwnedCurrency[]> {
        return this.api.getHoldings(portfolioId).pipe(
            map(holdings => {
                const currencies = new Map<string, OwnedCurrency>();
                for (const holding of holdings) {
                    currencies.set(holding.instrumentId, {
                        id: holding.instrumentId,
                        symbol: holding.instrumentSymbol,
                        name: holding.instrumentName,
                    });
                }
                return [...currencies.values()];
            }),
        );
    }
}