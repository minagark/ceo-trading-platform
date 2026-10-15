import { Injectable, inject, signal } from '@angular/core';
import { Account } from './accounts-list';
import { UserApiService } from '../data-access/user-api.service';
import { Portfolio } from '../../../core/trading.models';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly userApi = inject(UserApiService);

  readonly accounts = signal<Account[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadForUser(userId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.userApi.getPortfolios(userId).subscribe({
      next: (portfolios) => this.accounts.set(portfolios.map((portfolio) => this.toAccount(portfolio))),
      error: () => {
        this.error.set('Unable to load portfolios.');
        this.loading.set(false);
      },
      complete: () => this.loading.set(false),
    });
  }

  private toAccount(portfolio: Portfolio): Account {
    return {
      id: portfolio.ID,
      name: `${portfolio.type} portfolio`,
      type: portfolio.type,
      balance: 0,
    };
  }
}