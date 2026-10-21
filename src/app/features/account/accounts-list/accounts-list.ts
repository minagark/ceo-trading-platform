import { Component, OnDestroy, computed, effect, inject, input } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrderStatusEvent } from '../../../core/realtime.models';
import { RealtimeService } from '../../../core/realtime.service';
import { CurrencyPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { AccountsService } from './accounts.service';
import { AccountSelectionService } from './account-selection.service';

export interface Account {
  id: string;
  name: string;
  type: 'Individual' | 'IRA' | 'Margin' | 'RETIREMENT' | 'BROKERAGE';
  balance: number;
}

@Component({
  selector: 'app-accounts-list',
  imports: [CurrencyPipe, MatListModule],
  templateUrl: './accounts-list.html',
  styleUrl: './accounts-list.css',
})
export class AccountsList implements OnDestroy {
  private accountsService = inject(AccountsService);
  private accountSelectionService = inject(AccountSelectionService);
  private realtimeService = inject(RealtimeService);
  private orderEventsSubscription: Subscription | null = null;

  // ---------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------
  // `signal()` is Angular's reactive primitive: read it with `accounts()`,
  // write it with `.set(...)` or `.update(...)`. The template re-renders
  // automatically whenever a signal it reads changes.

  accounts = this.accountsService.accounts;
  userId = input<string | null>(null);

  constructor() {
    effect(() => {
      const userId = this.userId();
      if (userId) {
        this.accountsService.loadForUser(userId);
        this.subscribeToPortfolioUpdates(userId);
      }
    });
  }

  // Tracks which account row is highlighted. `null` means "All Accounts" is selected.
  // selectedAccountId = signal<string | null>(null);
  selectedAccountId = this.accountSelectionService.selectedAccount()?.id ?? null; // default all

  totalBalance = computed(() =>
    this.accounts().reduce((sum, account) => sum + account.balance, 0)
  );

  selectAccount(account: Account) {
    this.accountSelectionService.onAccountSelected(account); // update the service
    this.selectedAccountId = this.accountSelectionService.selectedAccount()!.id; // defualt read only?

  }

  selectAllAccounts() {
    this.accountSelectionService.onAccountSelected(null);
    this.selectedAccountId = null;
  }

  ngOnDestroy(): void {
    this.orderEventsSubscription?.unsubscribe();
  }

  private subscribeToPortfolioUpdates(userId: string): void {
    this.orderEventsSubscription?.unsubscribe();
    this.orderEventsSubscription = this.realtimeService
      .subscribeToUserOrders(userId)
      .subscribe((event) => this.applyPortfolioUpdate(event));
  }

  private applyPortfolioUpdate(event: OrderStatusEvent): void {
    if (event.status !== 'FULFILLED') {
      return;
    }

    this.accountsService.refreshAccountBalance(event.portfolioId);
  }
}
