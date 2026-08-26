import { Component, computed, signal, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';

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
  // ---------------------------------------------------------------------
  // STATE
  // ---------------------------------------------------------------------
  // `signal()` is Angular's reactive primitive: read it with `accounts()`,
  // write it with `.set(...)` or `.update(...)`. The template re-renders
  // automatically whenever a signal it reads changes.

  accounts = signal<Account[]>([
    { id: '1', name: 'Brokerage', type: 'Individual', balance: 24310.55 },
    { id: '2', name: 'Retirement', type: 'IRA', balance: 118432.02 },
    { id: '3', name: 'Active Trading', type: 'Margin', balance: 5602.13 },
  ]);

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

  // TODO : replace the hard-coded `accounts` signal with data loaded from an AccountsService using
  // Angular's `httpResource()`/`resource()` APIs or a plain HttpClient call
  // in the constructor. Not required to get the component working.
}
