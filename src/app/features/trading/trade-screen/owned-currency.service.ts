import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { PortfolioApiService } from '../../portfolio/data-access/portfolio-api.service';

export interface OwnedCurrency {
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
                    currencies.set(holding.symbol, {
                        symbol: holding.symbol,
                        name: holding.instrumentName,
                    });
                }
                return [...currencies.values()];
            }),
        );
    }
}