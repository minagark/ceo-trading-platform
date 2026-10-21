import { Injectable, inject, signal } from '@angular/core';
import { Account } from './accounts-list';
import { UserApiService } from '../data-access/user-api.service';
import { Portfolio } from '../../../core/trading.models';
import { PortfolioApiService } from '../../portfolio/data-access/portfolio-api.service';
import { finalize, forkJoin, map, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly userApi = inject(UserApiService);
  private readonly portfolioApi = inject(PortfolioApiService);

  readonly accounts = signal<Account[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadForUser(userId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.userApi.getPortfolios(userId).pipe(
      switchMap((portfolios) => 
        forkJoin(portfolios.map((portfolio) => 
          this.portfolioApi.getTotalValue(portfolio.ID).pipe(
            map((balance) => this.toAccount(portfolio, balance))
          )))
    ),
    finalize(() => this.loading.set(false))
  ).subscribe({
    next: (accounts) => this.accounts.set(accounts),
    error: () => this.error.set('Unable to load portfolios.')
  });
  }

  refreshAccountBalance(portfolioId: string): void {
    this.portfolioApi.getTotalValue(portfolioId).subscribe({
      next: (balance) => {
        this.accounts.update((accounts) =>
          accounts.map((account) =>
            account.id === portfolioId ? { ...account, balance } : account,
          ),
        );
      },
    });
  }

  private toAccount(portfolio: Portfolio, balance: number): Account {
    return {
      id: portfolio.ID,
      name: `${portfolio.type} portfolio`,
      type: portfolio.type,
      balance: balance
    };
  }
}