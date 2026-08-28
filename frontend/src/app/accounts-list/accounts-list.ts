import { Component, computed, inject, signal, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { AccountsService } from './accounts.service';

export interface Account {
  id: string;
  name: string;
  type: 'Individual' | 'IRA' | 'Margin';
  balance: number;
}

@Component({
  selector: 'app-accounts-list',
  imports: [CurrencyPipe],
  templateUrl: './accounts-list.html',
  styleUrl: './accounts-list.css',
})
export class AccountsList {
  private accountsService = inject(AccountsService);

  // ---------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------
  // `signal()` is Angular's reactive primitive: read it with `accounts()`,
  // write it with `.set(...)` or `.update(...)`. The template re-renders
  // automatically whenever a signal it reads changes.

  accounts = this.accountsService.accounts;

  // Tracks which account row is highlighted. `null` means "All Accounts" is selected.
  selectedAccountId = signal<string | null>(null);

  totalBalance = computed(() =>
    this.accounts().reduce((sum, account) => sum + account.balance, 0)
  );

  accountSelected = output<Account | null>();

  selectAccount(account: Account) {
    this.selectedAccountId.set(account.id);
    this.accountSelected.emit(account);
  }

  selectAllAccounts() {
    this.selectedAccountId.set(null);
    this.accountSelected.emit(null);
  }
}
