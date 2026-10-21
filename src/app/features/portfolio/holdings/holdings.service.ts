import { Injectable, effect, inject, signal } from '@angular/core';
import { forkJoin, Subscription } from 'rxjs';
export type { ChangePeriod } from '../../../core/portfolio-holdings.models';
import { ChangePeriod, HoldingSummaryResponse } from '../../../core/portfolio-holdings.models';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { PortfolioApiService } from '../data-access/portfolio-api.service';

export interface Holding extends HoldingSummaryResponse {
  logoDomain: string;
}

@Injectable({ providedIn: 'root' })
export class HoldingsService {
  private readonly accountsService = inject(AccountsService);
  private readonly portfolioApi = inject(PortfolioApiService);

  readonly holdings = signal<Holding[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private holdingsSubscription: Subscription | null = null;

  constructor() {
    effect(() => {
      const portfolioIds = this.accountsService.accounts().map((account) => account.id);
      if (!portfolioIds.length) {
        this.holdingsSubscription?.unsubscribe();
        this.holdings.set([]);
        this.loading.set(false);
        return;
      }

      this.loadHoldings(portfolioIds);
    });
  }

  private loadHoldings(portfolioIds: string[]): void {
    this.holdingsSubscription?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    this.holdingsSubscription = forkJoin(
      portfolioIds.map((portfolioId) => this.portfolioApi.getHoldings(portfolioId)),
    ).subscribe({
      next: (responses) => {
        this.holdings.set(
          responses.flat().map((holding) => this.toHolding(holding)),
        );
      },
      error: () => {
        this.error.set('Unable to load holdings.');
        this.holdings.set([]);
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private toHolding(holding: HoldingSummaryResponse): Holding {
    return {
      ...holding,
      logoDomain: this.logoDomainFor(holding.instrumentSymbol),
    };
  }

  private logoDomainFor(symbol: string): string {
    return `${symbol.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  }
}
