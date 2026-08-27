import { Component, inject, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AssetsService } from './assets.service';
import { TradesService } from './trades.service';
import { Account } from '../accounts-list/accounts-list';
import { AccountsService } from '../accounts-list/accounts.service';

export interface Asset {
  abbrName: string;
  fullName: string;
  price: number;
  increaseValue: number;
  increasePCT: number;
  volume: number;
  ask: number;
  bid: number;
}

export interface Trade {
  id: string;
  type: 'buy' | 'sell';
  account: string;
  cashAvailable: number;
  stock: Asset;
  amountType: 'cash' | 'shares';
  amount: number;
  orderType: 'market' | 'limit';
  timeInForce: 'day' | 'gtc';
  date: string;
}

@Component({
  imports: [CurrencyPipe, FormsModule],
  selector: 'app-trades-screen',
  styleUrl: './trade-screen.css',
  templateUrl: './trade-screen.html',
})
export class Trades {
  private assetsService = inject(AssetsService);
  private tradesService = inject(TradesService);
  private accountsService = inject(AccountsService);

  // Mock data for now — read with `stock()`, same as any other signal.
  // Once AssetsService switches to httpResource(), this becomes `.value()`.
  stock = this.assetsService.asset;
  accounts = this.accountsService.accounts;

  selectedAccount = signal<Account | null>(null);
  quantityType = signal<'cash' | 'shares'>('shares');
  quantity = signal(0);
  side = signal<'buy' | 'sell'>('buy');
  orderType = signal<'market' | 'limit'>('market');
  timeInForce = signal<'day' | 'gtc'>('day');

  submitting = signal(false);
  submitError = signal<string | null>(null);

  estimatedCost = computed(() => {
    const stock = this.stock();
    const unitPrice = this.side() === 'buy' ? stock.ask : stock.bid;
    return unitPrice * this.quantity();
  });

  onAccountIdChange(id: string) {
    this.selectedAccount.set(this.accounts().find((a) => a.id === id) ?? null);
  }

  placeOrder() {
    const account = this.selectedAccount();
    if (!account) return;
    this.submitTrade(account.id, account.balance);
  }

  submitTrade(account: string, cashAvailable: number) {
    if (this.quantity() <= 0) return;

    this.submitting.set(true);
    this.submitError.set(null);

    this.tradesService
      .placeTrade({
        type: this.side(),
        account,
        cashAvailable,
        stock: this.stock(),
        amountType: this.quantityType(),
        amount: this.quantity(),
        orderType: this.orderType(),
        timeInForce: this.timeInForce(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.quantity.set(0);
        },
        error: (err) => {
          this.submitting.set(false);
          this.submitError.set(err.message ?? 'Failed to place trade');
        },
      });
  }
}
