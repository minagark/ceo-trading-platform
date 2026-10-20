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

  readonly accounts = signal<Account[]>([
    {id: "edda8da3-fab9-4b3c-b792-c833abe8e146", name: "acc1", type: 'BROKERAGE', balance: 1000000},
    {id: "id2", name: "acc2", type: 'BROKERAGE', balance: 2000000},
    {id: "id3", name: "acc3", type: 'BROKERAGE', balance: 3000000},
  ]);
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly error = signal<string | null>(null);

  loadForUser(userId: string): void {
    this.loading.set(true);
    this.loaded.set(false);
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
    next: (accounts) => {
      this.accounts.set(accounts);
      this.loaded.set(true);
    },
    error: () => this.error.set('Unable to load portfolios.')
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