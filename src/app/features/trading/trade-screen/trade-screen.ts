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
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { PreviewPage } from '../preview-page/preview-page';
import { TradeConfirmation } from '../trade-confirmation/trade-confirmation';
import { InstrumentType, isInstrumentType, isNonDepositOrderType, ORDER_TYPES, OrderRequest, OrderResponse, OrderType, SIDES } from '../../../core/trading.models';
import { Side } from '../../../core/trading.models';
import { CurrencyService, OwnedCurrency } from './owned-currency.service';
import { merge, of, startWith, switchMap } from 'rxjs';
import { OrderApiService } from '../data-access/order-api.service';
import { MarketApiService } from '../../market/data-access/market-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth/auth.service';

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


type Instrument = {
  type: InstrumentType,
  symbol: string,
}

@Component({
  imports: [
    // CurrencyPipe,
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
  private authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
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
    this.route.queryParamMap.subscribe(params => {
      const symbol = params.get('symbol');
      const type = params.get('type');
      if (symbol) {
        this.orderForm.controls.symbol.setValue(symbol);
      }
      if (isNonDepositOrderType(type)) {
        this.orderForm.controls.orderType.setValue(type);
      }
    })
    
    this.updateSettlementCurrencyState();

    // drop the "please fix" message as soon as the form becomes valid
    this.orderForm.statusChanges.subscribe(status => {
      if (status === 'VALID') {
        this.formError.set(null);
      }
    });
  }


  // form -> preview (review the built order) -> confirmation (live order status)
  screen = signal<'form' | 'preview' | 'confirmation'>('form');
  draft = signal<OrderRequest | null>(null);
  draftPortfolioLabel = signal('');
  submittedOrder = signal<OrderResponse | null>(null);
  submitError = signal<string | null>(null);

  // shown above the review button when the form is invalid or the quote can't be fetched
  formError = signal<string | null>(null);

  private readonly FIELD_LABELS: Record<string, string> = {
    portfolioId: 'Portfolio',
    orderType: 'Order type',
    side: 'Side',
    symbol: 'Symbol',
    settlementCurrency: 'Settlement currency',
    quantity: 'Quantity',
    changeThreshold: 'Change threshold',
  };

  reviewOrder() {
    if (this.orderForm.invalid) {
      this.orderForm.markAllAsTouched();
      const invalidFields = Object.entries(this.orderForm.controls)
        .filter(([, control]) => control.invalid)
        .map(([name]) => this.FIELD_LABELS[name] ?? name);
      this.formError.set(`Please fix: ${invalidFields.join(', ')}.`);
      return;
    }
    this.formError.set(null);
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
        let quotedPrice =
          orderInfo.side === 'BUY'
            ? quote.ask
            : quote.bid;
        if (quotedPrice === null) {
          quotedPrice = quote.price;
        }

        let side: Side;
        if (orderInfo.orderType === "DEPOSIT") {
          side = "DEPOSIT";
        } else {
          side = orderInfo.side
        }
        const orderRequest: OrderRequest = {
          clientId: this.authService.currentUserId() || '2c522b92-7151-4daa-92db-81a2253c772a', 
          clientName: this.authService.currentUserFullName() || "Unknown user",
          portfolioId: orderInfo.portfolioId,
          addInstrumentSymbol: addInstrument.symbol,
          addInstrumentType: addInstrument.type,
          subtractInstrumentSymbol: subInstrument.symbol,
          subtractInstrumentType: subInstrument.type,
          changeThreshold: orderInfo.changeThreshold,
          quantity: orderInfo.quantity,
          side,
          quotedPrice,
          market: orderInfo.orderType === "INDIA_EQUITY" ? 
                  this.IN_TIMEZONE_STRING : 
                  this.US_TIMEZONE_STRING,
        };
        console.log("Submitting: ", orderRequest);
        return of(orderRequest);
      }),
    ).subscribe({
      next: orderRequest => {
        const portfolio = this.accounts().find(account => account.id === orderRequest.portfolioId);
        this.draftPortfolioLabel.set(portfolio ? `${portfolio.id} (${portfolio.type})` : orderRequest.portfolioId);
        this.draft.set(orderRequest);
        this.screen.set('preview');
      },
      error: error => {
        console.error('Unable to get quote:', error);
        this.formError.set(`Couldn't get a quote: ${error?.error?.message ?? error?.message ?? 'unknown error'}`);
      },
    });
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

  activeSides = computed<Side[]>(() => {
    const { orderType } = this.formState();
    if (orderType === "DEPOSIT" || orderType === "FOREX") {
      return [];
    } else {
      return ["BUY", "SELL"]
    }
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
        type: 'CASH',
      };
    } else /*if (side === 'SELL')*/ {
      addInstrument = {
        symbol: country === 'US' ? this.US_CURRENCY_SYMBOL : this.IN_CURRENCY_SYMBOL,
        type: 'CASH',
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

  cancelPreview() {
    this.screen.set('form');
  }

  onOrderPlaced(order: OrderResponse) {
    this.submittedOrder.set(order);
    this.submitError.set(null);
    this.screen.set('confirmation');
  }

  onOrderFailed(message: string) {
    this.submittedOrder.set(null);
    this.submitError.set(message);
    this.screen.set('confirmation');
  }

  viewActivity() {
    void this.router.navigate(['/history']);
  }

  finishConfirmation() {
    this.submittedOrder.set(null);
    this.submitError.set(null);
    this.screen.set('form');
  }
}
