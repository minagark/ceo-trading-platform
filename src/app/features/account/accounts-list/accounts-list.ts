import { Component, computed, inject, signal, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { AccountsService } from './accounts.service';
import { AccountSelectionService } from './account-selection.service';

export interface Account {
  id: string;
  name: string;
  type: 'Individual' | 'IRA' | 'Margin';
  balance: number;
}

@Component({
  selector: 'app-accounts-list',
  imports: [CurrencyPipe, MatListModule],
  templateUrl: './accounts-list.html',
  styleUrl: './accounts-list.css',
})
export class AccountsList {
  private accountsService = inject(AccountsService);
  private accountSelectionService = inject(AccountSelectionService);

  // ---------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------
  // `signal()` is Angular's reactive primitive: read it with `accounts()`,
  // write it with `.set(...)` or `.update(...)`. The template re-renders
  // automatically whenever a signal it reads changes.

  accounts = this.accountsService.accounts;

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
}
