import { Component, computed, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { AccountsService } from './accounts.service';
import { AccountSelectionService } from './account-selection.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface Account {
  id: string;
  name: string;
  type: 'Individual' | 'IRA' | 'Margin' | 'RETIREMENT' | 'BROKERAGE';
  balance: number;
}

@Component({
  selector: 'app-accounts-list',
  imports: [CurrencyPipe, MatListModule, MatIconModule, MatButtonModule],
  templateUrl: './accounts-list.html',
  styleUrl: './accounts-list.css',
})
export class AccountsList {
  private accountsService = inject(AccountsService);
  private accountSelectionService = inject(AccountSelectionService);
  readonly router = inject(Router);

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
      }
    });
  }

  // Tracks which account row is highlighted. `null` means "All Accounts" is selected.
  // selectedAccountId = signal<string | null>(null);
  selectedAccountId = computed(() => this.accountSelectionService.selectedAccount()?.id ?? null);

  totalBalance = computed(() =>
    this.accounts().reduce((sum, account) => sum + account.balance, 0)
  );

  selectAccount(account: Account) {
    this.accountSelectionService.onAccountSelected(account);
  }

  selectAllAccounts() {
    this.accountSelectionService.onAccountSelected(null);
  }

  createPortfolio() {
    this.router.navigate(['/create-portfolio']);
  }
}
