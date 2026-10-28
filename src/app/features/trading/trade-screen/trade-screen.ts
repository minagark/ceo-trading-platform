import { Component, effect, inject, signal, computed } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { QuoteResponse } from '../../../core/api.models';
import { AssetsService } from './assets.service';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { PreviewPage } from '../preview-page/preview-page';
import { TradeConfirmation } from '../trade-confirmation/trade-confirmation';
import { InstrumentType, isInstrumentType, isNonDepositOrderType, ORDER_TYPES, OrderRequest, OrderResponse, OrderType, SIDES } from '../../../core/trading.models';
import { Side } from '../../../core/trading.models';
import { CurrencyService, OwnedCurrency } from './owned-currency.service';
import { EMPTY, catchError, debounceTime, distinctUntilChanged, filter, ignoreElements, merge, of, startWith, switchMap, tap, timer } from 'rxjs';
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

type Sparkline = { line: string; area: string };

// how often the quote panel re-fetches while the ticket is open
const QUOTE_REFRESH_MS = 15_000;

// turns a price series into SVG paths for a 600x120 viewBox
function buildSparkline(values: number[]): Sparkline | null {
  if (values.length < 2) return null;
  const lo = Math.min(...values);
  const span = Math.max(...values) - lo || 1;
  const line = values
    .map((value, i) => {
      const x = (i / (values.length - 1)) * 600;
      const y = 108 - ((value - lo) / span) * 96;
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join('');
  return { line, area: `${line}L600 120L0 120Z` };
}

@Component({
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    PreviewPage,
    TradeConfirmation,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
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

  readonly formState = toSignal(
    this.orderForm.valueChanges.pipe(
      startWith(this.orderForm.getRawValue()),
    ),
    {
      initialValue: this.orderForm.getRawValue(),
    },
  );

  // short labels so all five order types fit on one tab row; full label is the tooltip
  readonly orderTypeTabLabels: Record<OrderType, string> = {
    US_EQUITY: 'US equity',
    INDIA_EQUITY: 'India',
    CRYPTO: 'Crypto',
    FOREX: 'FX',
    DEPOSIT: 'Deposit',
  };
  readonly orderTypeIndex = computed(() =>
    Math.max(0, this.orderTypes.findIndex(type => type.value === this.formState().orderType)),
  );

  readonly thresholdPresets = [0, 0.5, 1, 2];
  readonly customThreshold = signal(false);

  // the instrument being traded, which is what the quote panel shows (not the cash leg)
  private readonly quoteTarget = computed<Instrument | null>(() => {
    const { orderType, symbol } = this.formState();
    const trimmed = (symbol ?? '').trim();
    if (!trimmed || orderType === 'DEPOSIT') return null;
    const type: InstrumentType = orderType === 'CRYPTO' ? 'CRYPTO' : orderType === 'FOREX' ? 'CASH' : 'EQUITY';
    return { symbol: trimmed, type };
  });

  readonly quote = signal<QuoteResponse | null>(null);
  readonly quoteStatus = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  readonly sparkline = signal<Sparkline | null>(null);
  // flash-up-a / flash-up-b etc.; alternating a/b restarts the CSS animation on every tick
  readonly priceFlash = signal('');
  private flashToggle = false;

  readonly quoteUp = computed(() => (this.quote()?.change ?? 0) >= 0);
  readonly marketOpen = computed(() => /open|regular/i.test(this.quote()?.marketState ?? ''));
  readonly marketLabel = computed(() => {
    const state = this.quote()?.marketState;
    return state ? `Market ${state.toLowerCase().replace(/_/g, ' ')}` : '';
  });
  readonly priceFormat = computed(() => {
    const price = this.quote()?.price ?? 1;
    return price < 0.1 ? '1.5-5' : price < 10 ? '1.4-4' : '1.2-2';
  });

  // the side control keeps its last value while hidden (FX), so only trust it when it's shown
  readonly effectiveSide = computed<Side>(() =>
    this.activeSides().length ? this.formState().side ?? 'BUY' : 'BUY',
  );

  // the side of the book this order would fill against
  readonly tradePrice = computed(() => {
    const quote = this.quote();
    if (!quote) return null;
    const price = this.effectiveSide() === 'SELL' ? quote.bid : quote.ask;
    return price ?? quote.price;
  });
  readonly estimatedTotal = computed(() => {
    const price = this.tradePrice();
    const quantity = Number(this.formState().quantity);
    return price !== null && quantity > 0 ? price * quantity : null;
  });
  // furthest the price can move before the change threshold rejects the order
  readonly worstPrice = computed(() => {
    const price = this.tradePrice();
    if (price === null) return null;
    const threshold = (Number(this.formState().changeThreshold) || 0) / 100;
    return this.effectiveSide() === 'SELL' ? price * (1 - threshold) : price * (1 + threshold);
  });

  readonly quantityLabel = computed(() => {
    const { orderType } = this.formState();
    return orderType === 'DEPOSIT' || orderType === 'FOREX' ? 'Amount' : 'Quantity';
  });
  readonly reviewLabel = computed(() => {
    const { orderType, symbol } = this.formState();
    const verb = orderType === 'DEPOSIT' ? 'deposit' : orderType === 'FOREX' ? 'exchange' : this.effectiveSide() === 'SELL' ? 'sell' : 'buy';
    const trimmed = (symbol ?? '').trim();
    return trimmed ? `Review ${verb} · ${trimmed}` : 'Review order';
  });

  // true after "Back" from review, so the form slides in from the left instead of the right
  readonly returnedToForm = signal(false);

  constructor() {
    effect(() => {
      const userId = this.authService.currentUserId();
      if (userId) {
        this.accountsService.loadForUser(userId); // need to loadUser information here so data will populate
      }
    });

    const navigationState = (this.router.getCurrentNavigation()?.extras.state ?? history.state) as {
      portfolioId?: string;
      orderType?: OrderType;
    } | undefined;

    const navigationPortfolioId = navigationState?.portfolioId;
    const navigationOrderType = navigationState?.orderType;

    if (navigationPortfolioId) {
      this.orderForm.controls.portfolioId.setValue(navigationPortfolioId);
    }
    if (navigationOrderType) {
      this.orderForm.controls.orderType.setValue(navigationOrderType);
    }

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

    // live quote: wait for typing to settle, then poll; a new symbol cancels the old poll
    toObservable(this.quoteTarget).pipe(
      debounceTime(400),
      distinctUntilChanged((a, b) => a?.symbol === b?.symbol && a?.type === b?.type),
      switchMap(target => {
        this.quote.set(null);
        this.sparkline.set(null);
        this.priceFlash.set('');
        if (!target) {
          this.quoteStatus.set('idle');
          return EMPTY;
        }
        this.quoteStatus.set('loading');
        return merge(
          this.marketApiService.getStockInfo(target.symbol, target.type, '1D').pipe(
            catchError(() => of([])),
            tap(points => this.sparkline.set(buildSparkline(points.map(point => point.balance)))),
            ignoreElements(),
          ),
          timer(0, QUOTE_REFRESH_MS).pipe(
            // skip refreshes while reviewing/confirming or in a background tab
            filter((tick) => tick === 0 || (this.screen() === 'form' && !document.hidden)),
            switchMap(() => this.marketApiService.getQuote(target.symbol, target.type).pipe(
              catchError(() => of(null)),
            )),
          ),
        );
      }),
      takeUntilDestroyed(),
    ).subscribe(quote => this.applyQuote(quote));
  }

  private applyQuote(quote: QuoteResponse | null) {
    const previous = this.quote();
    if (!quote) {
      // a failed refresh keeps the last good quote on screen
      if (!previous) this.quoteStatus.set('error');
      return;
    }
    if (previous && previous.symbol === quote.symbol && previous.price !== quote.price) {
      this.flashToggle = !this.flashToggle;
      const direction = quote.price > previous.price ? 'up' : 'down';
      this.priceFlash.set(`flash-${direction}-${this.flashToggle ? 'a' : 'b'}`);
    }
    this.quote.set(quote);
    this.quoteStatus.set('ready');
  }

  selectOrderType(type: OrderType) {
    this.orderForm.controls.orderType.setValue(type);
    // deposits have no change threshold field, so don't let a hidden value ride along
    if (type === 'DEPOSIT') {
      this.selectThreshold(0);
    }
  }

  selectSide(side: Side) {
    this.orderForm.controls.side.setValue(side);
  }

  selectThreshold(value: number) {
    this.customThreshold.set(false);
    this.orderForm.controls.changeThreshold.setValue(value);
  }

  stepQuantity(direction: 1 | -1) {
    const { orderType } = this.formState();
    const step = orderType === 'CRYPTO' ? 0.01 : orderType === 'FOREX' || orderType === 'DEPOSIT' ? 100 : 1;
    const current = Number(this.orderForm.controls.quantity.value) || 0;
    // never step to 0: quantity must be positive
    const next = Math.max(step, +(current + direction * step).toFixed(8));
    this.orderForm.controls.quantity.setValue(next);
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
          clientId: this.authService.currentUserId()!, 
          clientName: this.authService.currentUserFullName()!,
          portfolioId: orderInfo.portfolioId,
          addInstrumentSymbol: addInstrument.symbol,
          addInstrumentType: addInstrument.type,
          subtractInstrumentSymbol: subInstrument.symbol,
          subtractInstrumentType: subInstrument.type,
          changeThreshold: orderInfo.changeThreshold / 100,
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
        this.returnedToForm.set(false);
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
    this.returnedToForm.set(true);
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
    this.returnedToForm.set(true);
    this.screen.set('form');
  }
}
