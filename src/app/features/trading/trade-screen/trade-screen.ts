import { Component, inject, signal, computed } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { toSignal } from '@angular/core/rxjs-interop';
import { AssetsService } from './assets.service';
import { Account } from '../../account/accounts-list/accounts-list';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { PreviewPage } from '../preview-page/preview-page';
import { TradeConfirmation } from '../trade-confirmation/trade-confirmation';
import { InstrumentType, OrderRequest, SIDES } from '../../../core/trading.models';
import { Side } from '../../../core/trading.models';
import { CurrencyService, OwnedCurrency } from './owned-currency.service';
import { merge, startWith, switchMap } from 'rxjs';
import { OrderApiService } from '../data-access/order-api.service';
import { MarketApiService } from '../../market/data-access/market-api.service';

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
  private orderApiService = inject(OrderApiService);
  private marketApiService = inject(MarketApiService);
  private readonly US_CURRENCY_SYMBOL: "USD" = "USD";
  private readonly US_TIMEZONE_STRING = "America/New_York";
  private readonly IN_CURRENCY_SYMBOL: "INR" = "INR";
  private readonly IN_TIMEZONE_STRING = "Asia/Kolkata";
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
  });

  private readonly formState = toSignal(
    this.orderForm.valueChanges.pipe(
      startWith(this.orderForm.getRawValue()),
    ),
    {
      initialValue: this.orderForm.getRawValue(),
    },
  );

  constructor() {
    merge(
      this.orderForm.controls.orderType.valueChanges,
      this.orderForm.controls.side.valueChanges,
      this.orderForm.controls.portfolioId.valueChanges,
    ).subscribe(() => {
      this.updateSettlementCurrencyState();

      const portfolioId = this.orderForm.controls.portfolioId.value;
      if (portfolioId) {
        this.updateOwnedCurrencies();
      }
    });

    this.updateSettlementCurrencyState();
  }


  submitOrder() {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      return;
    }
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
    
    // TODO: CHANGE THE GET QUOTE TO THE CORRECT INSTRUMENT
    this.marketApiService.getQuote(addInstrument.symbol, addInstrument.type).pipe(
      switchMap(quote => {
        const quotedPrice =
          orderInfo.side === 'BUY'
            ? quote.ask
            : quote.bid;

        const orderRequest: OrderRequest = {
          clientId: '2c522b92-7151-4daa-92db-81a2253c772a',
          clientName: 'John Doe',
          portfolioId: orderInfo.portfolioId,
          addInstrumentSymbol: addInstrument.symbol,
          addInstrumentType: addInstrument.type,
          subtractInstrumentSymbol: subInstrument.symbol,
          subtractInstrumentType: subInstrument.type,
          changeThreshold: orderInfo.changeThreshold,
          quantity: orderInfo.quantity,
          side: orderInfo.side,
          quotedPrice,
          market: orderInfo.orderType === "INDIA_EQUITY" ? 
                  this.IN_TIMEZONE_STRING : 
                  this.US_TIMEZONE_STRING,
        };
        console.log(orderRequest);

        return this.orderApiService.submitOrder(orderRequest);
      }),
    ).subscribe({
      next: response => {
        console.log('Order submitted:', response);
      },
      error: error => {
        console.error('Unable to get quote or submit order:', error);
      },
    });

    // console.log("Submitting: ", orderRequestDTO);
    // this.orderApiService.submitOrder(orderRequestDTO);
    
    // return orderRequestDTO;
  }
  settlementMode = computed(() => {
    const { orderType, side } = this.formState();

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
  })

  sideActive = computed(() => {
    const { orderType } = this.formState();
    return orderType !== "FOREX";
  })

  ownedCurrencies = signal<OwnedCurrency[]>([]);
  private updateOwnedCurrencies() {
    const portfolioId = this.orderForm.value.portfolioId || "";
    this.currencyService.currenciesOwnedByPortfolio(portfolioId).subscribe({
      next: currencies => this.ownedCurrencies.set(currencies),
      error: error => {
        this.ownedCurrencies.set([]);
        console.error('Unable to load owned currencies', error);
      }
    });
  }

  private updateSettlementCurrencyState(): void {
    const control = this.orderForm.controls.settlementCurrency;
    const { orderType } = this.orderForm.getRawValue();

    if (orderType === 'US_EQUITY') {
      control.setValue('USD');
      control.clearValidators();
      control.disable({ emitEvent: false });
    } else if (orderType === 'INDIA_EQUITY') {
      control.setValue('INR');
      control.clearValidators();
      control.disable({ emitEvent: false });
    } else if (orderType === 'CRYPTO' || orderType === 'FOREX') {
      control.enable({ emitEvent: false });
      control.setValidators(Validators.required);
    } else {
      control.reset(null, { emitEvent: false });
      control.clearValidators();
      control.disable({ emitEvent: false });
    }

    control.updateValueAndValidity({ emitEvent: false });
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
    console.log('parse instrument forex');
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
