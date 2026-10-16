import { Component, inject, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AssetsService } from './assets.service';
import { Account } from '../../account/accounts-list/accounts-list';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { PreviewPage } from '../preview-page/preview-page';
import { TradeConfirmation } from '../trade-confirmation/trade-confirmation';
import { InstrumentType, SIDES } from '../../../core/trading.models';
import { Side } from '../../../core/trading.models';
import { CurrencyService } from './owned-currency.service';

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


const ORDER_TYPES = [
  { value: 'US_EQUITY', label: 'US Equity' },
  { value: 'INDIA_EQUITY', label: 'India Equity' },
  { value: 'CRYPTO', label: 'Cryptocurrency' },
  { value: 'FOREX', label: 'Foreign Exchange' },
  { value: 'DEPOSIT', label: 'Deposit' },
] as const;

type OrderType = typeof ORDER_TYPES[number]["value"];

type Instrument = {
  type: InstrumentType,
  symbol: string,
}

@Component({
  imports: [
    CurrencyPipe,
    ReactiveFormsModule,
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
  private currencyService = inject(CurrencyService);
  private readonly US_CURRENCY_SYMBOL: "USD" = "USD";
  private readonly IN_CURRENCY_SYMBOL: "INR" = "INR";
  readonly orderTypes = ORDER_TYPES;
  readonly sides = SIDES;

  private readonly fb = inject(NonNullableFormBuilder);
  readonly orderForm = this.fb.group({
    portfolioId: this.fb.control('', Validators.required),
    orderType: this.fb.control<OrderType>('US_EQUITY', Validators.required),
    symbol: this.fb.control('', [
      Validators.required,
      Validators.maxLength(20),
    ]),
    settlementCurrency: this.fb.control<string | null>(null),
    quantity: this.fb.control(1, [
      Validators.required,
      Validators.min(0.000001),
    ]),
    side: this.fb.control<Side>('BUY', Validators.required),
    changeThreshold: this.fb.control(0, [Validators.min(0), Validators.max(100)]),
  })


  submitOrder() {
    const orderInfo = this.orderForm.getRawValue();
    let addInstrument: Instrument; let subInstrument: Instrument;

    if (orderInfo.orderType === "US_EQUITY" || orderInfo.orderType === "INDIA_EQUITY") {
      ({ addInstrument, subInstrument } = this.parseInstrumentEquityOrder(
        orderInfo.symbol, 
        orderInfo.side, 
        orderInfo.orderType === "US_EQUITY" ? "US" : "IN",
      ));
    } else if (orderInfo.orderType === "CRYPTO") {
      ({ addInstrument, subInstrument } = this.parseInstrumentCryptoOrder(
        orderInfo.settlementCurrency || this.US_CURRENCY_SYMBOL,
        orderInfo.symbol, 
        orderInfo.side, 
      ));
    } else if (orderInfo.orderType === "FOREX") {
      ({ addInstrument, subInstrument } = this.parseInstrumentForexOrder(
        orderInfo.settlementCurrency || this.US_CURRENCY_SYMBOL,
        orderInfo.symbol, 
      ));
    } else {
      ({ addInstrument, subInstrument } = this.parseDepositOrder(
        orderInfo.symbol, 
      ));
    }
    
    const orderRequestDTO = {
      clientId: 'TEST ID',
      clientName: 'TEST NAME',
      portfolioId: orderInfo.portfolioId,
      addInstrumentSymbol: addInstrument.symbol, 
      addInstrumentType: addInstrument.type,
      subInstrumentSymbol: subInstrument.symbol,
      subInstrumentType: subInstrument.type,
      changeThreshold: orderInfo.changeThreshold,
    }
    
    // send(orderRequestDTO);

    return orderRequestDTO;
  }
  getSettlementMode() {
    const { orderType, side } = this.orderForm.getRawValue();

    if (orderType === 'US_EQUITY') {
      return { visible: false, fixedCurrency: 'USD' as const };
    }
    if (orderType === 'INDIA_EQUITY') {
      return { visible: false, fixedCurrency: 'INR' as const };
    }
    if (orderType === 'CRYPTO' && side === 'BUY') {
      return { visible: true, source: 'owned' as const };
    }
    if (orderType === 'CRYPTO' && side === 'SELL') {
      return { visible: true, source: 'any' as const };
    }
    if (orderType === 'FOREX') {
      return { visible: true, source: 'any' as const };
    }
    return { visible: false, fixedCurrency: null };
  }

  private parseInstrumentEquityOrder(symbol: string, side: Side, country: 'US' | 'IN') {
    let addInstrument: Instrument; let subInstrument: Instrument;
    if (side === 'BUY') {
      addInstrument = { symbol, type: 'EQUITY' };
      subInstrument = {
        symbol: country === 'US' ? this.US_CURRENCY_SYMBOL : this.IN_CURRENCY_SYMBOL,
        type: 'EQUITY',
      };
    } else /*if (side === 'SELL')*/ {
      addInstrument = {
        symbol: country === 'US' ? this.US_CURRENCY_SYMBOL : this.IN_CURRENCY_SYMBOL,
        type: 'EQUITY',
      };
      subInstrument = { symbol, type: 'EQUITY' };
    } 
    return { addInstrument, subInstrument };
  }

  private parseInstrumentCryptoOrder(settlementCurrencySymbol: string, symbol: string, side: Side) {
    let addInstrument: Instrument; let subInstrument: Instrument;
    if (side === 'BUY') {
      addInstrument = { symbol, type: 'CRYPTO' };
      subInstrument = { symbol: settlementCurrencySymbol, type: 'CASH' };
    } else /*if (side === 'SELL')*/ {
      addInstrument = { symbol: settlementCurrencySymbol, type: 'CASH' };
      subInstrument = { symbol, type: 'CRYPTO' };
    }
    return { addInstrument, subInstrument };
  }

  private parseInstrumentForexOrder(settlementCurrencySymbol: string, symbol: string) {
    let addInstrument: Instrument = { symbol, type: 'CASH' }; 
    let subInstrument: Instrument = { symbol: settlementCurrencySymbol, type: 'CASH' };
    return { addInstrument, subInstrument };
  }

  private parseDepositOrder(symbol: string) {
    return {
      addInstrument: { symbol, type: 'CASH' } as Instrument,
      subInstrument: { symbol: 'USD', type: 'CASH' } as Instrument,
    }
  }


  // Mock data for now — read with `stock()`, same as any other signal.
  // Once AssetsService switches to httpResource(), this becomes `.value()`.
  stock = this.assetsService.asset;
  accounts = this.accountsService.accounts;

  selectedAccount = signal<Account | null>(null);
  quantityType = signal<'cash' | 'shares'>('shares');
  quantity = signal(0);
  side = signal<'buy' | 'sell'>('buy');
  orderTypeOld = signal<'market' | 'limit'>('market');
  timeInForce = signal<'day' | 'gtc'>('day');

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
      orderType: this.orderTypeOld(),
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
