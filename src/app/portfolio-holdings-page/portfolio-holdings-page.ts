import { Component, signal } from '@angular/core';
import { AccountsList, Account } from '../accounts-list/accounts-list';
import { HoldingsList } from '../holdings/holdings-list';

@Component({
  selector: 'app-portfolio-holdings-page',
  imports: [AccountsList, HoldingsList],
  templateUrl: './portfolio-holdings-page.html',
  styleUrl: './portfolio-holdings-page.css',
})
export class PortfolioHoldingsPage {
  // null = "All Accounts", same convention AccountsList itself uses.
  selectedAccount = signal<Account | null>(null);

  onAccountSelected(account: Account | null) {
    this.selectedAccount.set(account);
  }
}
