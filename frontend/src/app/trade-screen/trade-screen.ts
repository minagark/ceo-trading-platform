import { Component, inject, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AssetsService } from './assets.service';
import { Account } from '../accounts-list/accounts-list';
import { AccountsService } from '../accounts-list/accounts.service';
import { PreviewPage } from '../preview-page/preview-page';

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

export type TradeRequest = Omit<Trade, 'id' | 'date'>;

@Component({
  imports: [
    CurrencyPipe,
    FormsModule,
    PreviewPage,
    MatCardModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
  ],
  selector: 'app-trades-screen',
  styleUrl: './trade-screen.css',
  templateUrl: './trade-screen.html',
})
export class Trades {
  private assetsService = inject(AssetsService);
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

  showPreview = signal(false);

  estimatedCost = computed(() => {
    const stock = this.stock();
    const unitPrice = this.side() === 'buy' ? stock.ask : stock.bid;
    return unitPrice * this.quantity();
  });

  currentDraft = computed<TradeRequest | null>(() => {
    const account = this.selectedAccount();
    if (!account) return null;
    return {
      type: this.side(),
      account: account.id,
      cashAvailable: account.balance,
      stock: this.stock(),
      amountType: this.quantityType(),
      amount: this.quantity(),
      orderType: this.orderType(),
      timeInForce: this.timeInForce(),
    };
  });

  onAccountIdChange(id: string) {
    this.selectedAccount.set(this.accounts().find((a) => a.id === id) ?? null);
  }

  reviewOrder() {
    if (!this.selectedAccount() || this.quantity() <= 0) return;
    this.showPreview.set(true);
  }

  cancelPreview() {
    this.showPreview.set(false);
  }

  onTradeConfirmed() {
    this.showPreview.set(false);
    this.quantity.set(0);
  }
}
