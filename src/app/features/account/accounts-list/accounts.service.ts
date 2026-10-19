import { Injectable, inject, signal } from '@angular/core';
import { Account } from './accounts-list';
import { UserApiService } from '../data-access/user-api.service';
import { Portfolio } from '../../../core/trading.models';

@Injectable({ providedIn: 'root' })
export class AccountsService {
  private readonly userApi = inject(UserApiService);

  readonly accounts = signal<Account[]>([
    {id: "edda8da3-fab9-4b3c-b792-c833abe8e146", name: "acc1", type: 'BROKERAGE', balance: 1000000},
    {id: "id2", name: "acc2", type: 'BROKERAGE', balance: 2000000},
    {id: "id3", name: "acc3", type: 'BROKERAGE', balance: 3000000},
  ]);
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