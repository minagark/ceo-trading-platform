import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserResponse } from '../../../core/user.models';
import { Portfolio } from '../../../core/trading.models';
import { UserApiService } from '../data-access/user-api.service';
import { AccountsService } from '../accounts-list/accounts.service';
import { AuthService } from '../../auth/auth/auth.service';
import { HoldingsService } from '../../portfolio/holdings/holdings.service';

interface PortfolioSummary extends Portfolio {
  holdingCount: number;
  breakdown: { cash: number; stocks: number; crypto: number };
}

@Component({
  selector: 'app-account-page',
  imports: [CurrencyPipe, DatePipe],
  templateUrl: './account-page.html',
  styleUrl: './account-page.css',
})
export class AccountPage {
  private readonly route = inject(ActivatedRoute);
  private readonly userApi = inject(UserApiService);
  private readonly authService = inject(AuthService);
  private readonly holdingsService = inject(HoldingsService);
  private readonly accountsService = inject(AccountsService);

  readonly user = signal<UserResponse | null>(null);
  readonly portfolios = signal<Portfolio[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly userId = signal<string | null>(null);
  readonly totalBalance = computed(() =>
    this.accountsService.accounts().reduce((sum, account) => sum + account.balance, 0),
  );
  readonly balanceBreakdown = computed(() => {
    const breakdown = { cash: 0, stocks: 0, crypto: 0 };
    for (const holding of this.holdingsService.holdings()) {
      const value = holding.quantity * holding.currentPrice;
      const type = holding.instrumentType.toUpperCase();
      if (type === 'CASH' || holding.symbol.toUpperCase() === 'USD') {
        breakdown.cash += value;
      } else if (type === 'CRYPTO') {
        breakdown.crypto += value;
      } else {
        breakdown.stocks += value;
      }
    }
    return breakdown;
  });
  readonly portfolioSummaries = computed<PortfolioSummary[]>(() => {
    const holdings = this.holdingsService.holdings();
    return this.portfolios().map((portfolio) => {
      const portfolioHoldings = holdings.filter((holding) => holding.portfolioId === portfolio.ID);
      const breakdown = { cash: 0, stocks: 0, crypto: 0 };
      for (const holding of portfolioHoldings) {
        const value = holding.quantity * holding.currentPrice;
        const type = holding.instrumentType.toUpperCase();
        if (type === 'CASH' || holding.symbol.toUpperCase() === 'USD') {
          breakdown.cash += value;
        } else if (type === 'CRYPTO') {
          breakdown.crypto += value;
        } else {
          breakdown.stocks += value;
        }
      }
      return { ...portfolio, holdingCount: portfolioHoldings.length, breakdown };
    });
  });

  constructor() {
    const userId =
      this.route.snapshot.paramMap.get('userId') ?? this.authService.currentUserId();
    this.userId.set(userId);
    if (userId) {
      this.accountsService.loadForUser(userId);
      this.loadAccount(userId);
    }
  }

  private loadAccount(userId: string): void {
    this.loading.set(true);
    this.userApi.getUser(userId).subscribe({
      next: (user) => this.user.set(user),
      error: () => this.error.set('Unable to load account details.'),
    });

    this.userApi.getPortfolios(userId).subscribe({
      next: (portfolios) => this.portfolios.set(portfolios),
      error: () => this.error.set('Unable to load portfolios.'),
      complete: () => this.loading.set(false),
    });
  }

}
