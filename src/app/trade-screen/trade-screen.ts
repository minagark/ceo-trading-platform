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
import { TradeConfirmation } from '../trade-confirmation/trade-confirmation';

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
    TradeConfirmation,
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

  // Real implementation — start on the order form, no result yet.
  // screen = signal<'form' | 'preview' | 'confirmation'>('form');
  // confirmationResult = signal<{ success: boolean; trade: Trade | null; message: string | null }>({
  //   success: false,
  //   trade: null,
  //   message: null,
  // });

  // Mock data — jumps straight to the confirmation screen so it can be
  // previewed without clicking through the form/preview flow, ahead of
  // the trade API existing. Swap back to the real implementation above
  // once that's wired up. Flip `success` to `false` (and drop `trade` in
  // favor of a `message`) to preview the failure state instead.
  screen = signal<'form' | 'preview' | 'confirmation'>('confirmation');
  confirmationResult = signal<{ success: boolean; trade: Trade | null; message: string | null }>({
    success: true,
    trade: {
      id: 'mock-trade-1',
      type: 'buy',
      account: 'acc-1',
      cashAvailable: 24310.55,
      stock: {
        abbrName: 'AAPL',
        fullName: 'Apple Inc.',
        price: 227.52,
        increaseValue: 1.32,
        increasePCT: 0.0058,
        volume: 48213000,
        ask: 227.55,
        bid: 227.49,
      },
      amountType: 'shares',
      amount: 10,
      orderType: 'market',
      timeInForce: 'day',
      date: new Date().toISOString(),
    },
    message: null,
  });

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
    this.screen.set('preview');
  }

  cancelPreview() {
    this.screen.set('form');
  }

  onTradeConfirmed(trade: Trade) {
    this.confirmationResult.set({ success: true, trade, message: null });
    this.screen.set('confirmation');
  }

  onTradeFailed(message: string) {
    this.confirmationResult.set({ success: false, trade: null, message });
    this.screen.set('confirmation');
  }

  finishConfirmation() {
    this.quantity.set(0);
    this.screen.set('form');
  }
}
