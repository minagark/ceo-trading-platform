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
                // holdings are a ledger (one row per order leg, debits negative), so sum per symbol.
                // only cash can settle a trade, so skip stocks and crypto the portfolio also holds
                const currencies = new Map<string, OwnedCurrency & { balance: number }>();
                for (const holding of holdings) {
                    if (holding.instrumentType !== 'CASH') {
                        continue;
                    }
                    const existing = currencies.get(holding.symbol);
                    currencies.set(holding.symbol, {
                        symbol: holding.symbol,
                        name: holding.instrumentName,
                        balance: (existing?.balance ?? 0) + holding.quantity,
                    });
                }
                return [...currencies.values()]
                    .filter(currency => currency.balance > 0)
                    .map(({ symbol, name }) => ({ symbol, name }));
            }),
        );
    }
}