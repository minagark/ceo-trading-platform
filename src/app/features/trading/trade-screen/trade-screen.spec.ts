import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Trades } from './trade-screen';
import { MarketApiService } from '../../market/data-access/market-api.service';
import { CurrencyService } from './owned-currency.service';
import { QuoteResponse } from '../../../core/api.models';
import { OrderType, Side } from '../../../core/trading.models';
import { of } from 'rxjs';

function makeQuote(overrides: Partial<QuoteResponse> = {}): QuoteResponse {
  return {
    symbol: 'AAPL',
    price: 100,
    bid: 99,
    ask: 101,
    spreadBps: 0,
    currency: 'USD',
    change: 0,
    changePercent: 0,
    previousClose: 100,
    asOf: '',
    marketState: '',
    ...overrides,
  };
}

describe('Trades', () => {
  let component: Trades;
  let fixture: ComponentFixture<Trades>;
  let marketApi: MarketApiService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trades],
      providers: [provideRouter([])],
    }).compileComponents();

    // keep the owned-currency lookup and the live quote poll off the network
    const currencyService = TestBed.inject(CurrencyService);
    vi.spyOn(currencyService, 'currenciesOwnedByPortfolio').mockReturnValue(of([]));
    marketApi = TestBed.inject(MarketApiService);
    vi.spyOn(marketApi, 'getStockInfo').mockReturnValue(of([]));
    vi.spyOn(marketApi, 'getQuote').mockReturnValue(of(makeQuote()));

    fixture = TestBed.createComponent(Trades);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  function fillForm(values: {
    orderType?: OrderType;
    symbol?: string;
    settlementCurrency?: string | null;
    side?: Side;
    quantity?: number;
    portfolioId?: string;
    changeThreshold?: number;
  } = {}) {
    component.orderForm.setValue({
      portfolioId: values.portfolioId ?? 'portfolio-1',
      orderType: values.orderType ?? 'US_EQUITY',
      symbol: values.symbol ?? 'AAPL',
      settlementCurrency: values.settlementCurrency ?? 'USD',
      quantity: values.quantity ?? 1,
      side: values.side ?? 'BUY',
      changeThreshold: values.changeThreshold ?? 0,
    });
  }

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses CASH for the subtract instrument when buying a US equity', () => {
    component.orderForm.setValue({
      portfolioId: 'portfolio-1',
      orderType: 'US_EQUITY',
      symbol: 'AAPL',
      settlementCurrency: 'USD',
      quantity: 1,
      side: 'BUY',
      changeThreshold: 5,
    }, { emitEvent: false });

    component.reviewOrder();

    expect(component.draft()?.subtractInstrumentSymbol).toBe('USD');
    expect(component.draft()?.subtractInstrumentType).toBe('CASH');
    expect(component.draft()?.changeThreshold).toBe(0.05);
  });

  describe('reviewOrder quoting', () => {
    it('SELL US equity quotes the stock and uses its bid', () => {
      const getQuote = vi.mocked(marketApi.getQuote);
      getQuote.mockReturnValue(of(makeQuote({ bid: 99, ask: 101, price: 100 })));
      fillForm({ orderType: 'US_EQUITY', symbol: 'AAPL', side: 'SELL' });
      getQuote.mockClear();

      component.reviewOrder();

      expect(getQuote).toHaveBeenCalledTimes(1);
      expect(getQuote).toHaveBeenCalledWith('AAPL', 'EQUITY');
      const draft = component.draft();
      expect(draft?.side).toBe('SELL');
      expect(draft?.quotedPrice).toBe(99);
      expect(draft?.addInstrumentSymbol).toBe('USD');
      expect(draft?.addInstrumentType).toBe('CASH');
      expect(draft?.subtractInstrumentSymbol).toBe('AAPL');
      expect(draft?.subtractInstrumentType).toBe('EQUITY');
    });

    it('BUY US equity quotes the stock and uses its ask', () => {
      const getQuote = vi.mocked(marketApi.getQuote);
      getQuote.mockReturnValue(of(makeQuote({ bid: 99, ask: 101, price: 100 })));
      fillForm({ orderType: 'US_EQUITY', symbol: 'AAPL', side: 'BUY' });
      getQuote.mockClear();

      component.reviewOrder();

      expect(getQuote).toHaveBeenCalledTimes(1);
      expect(getQuote).toHaveBeenCalledWith('AAPL', 'EQUITY');
      expect(component.draft()?.side).toBe('BUY');
      expect(component.draft()?.quotedPrice).toBe(101);
    });

    it('FOREX ignores a leftover SELL side: BUY, quotes the target currency, uses ask', () => {
      const getQuote = vi.mocked(marketApi.getQuote);
      getQuote.mockReturnValue(of(makeQuote({ symbol: 'EUR', bid: 1.08, ask: 1.1, price: 1.09 })));
      // a SELL order on equities first, then switch to FX without touching side
      fillForm({ orderType: 'US_EQUITY', symbol: 'AAPL', side: 'SELL' });
      fillForm({ orderType: 'FOREX', symbol: 'EUR', settlementCurrency: 'USD', side: 'SELL', quantity: 100 });
      expect(component.orderForm.controls.side.value).toBe('SELL');
      getQuote.mockClear();

      component.reviewOrder();

      expect(getQuote).toHaveBeenCalledTimes(1);
      expect(getQuote).toHaveBeenCalledWith('EUR', 'CASH');
      const draft = component.draft();
      expect(draft?.side).toBe('BUY');
      expect(draft?.addInstrumentSymbol).toBe('EUR');
      expect(draft?.addInstrumentType).toBe('CASH');
      expect(draft?.quotedPrice).toBe(1.1);
    });
  });

  describe('availableCash', () => {
    it('returns the owned USD balance for a US equity order', () => {
      fillForm({ orderType: 'US_EQUITY' });
      component.ownedCurrencies.set([{ symbol: 'USD', name: 'US Dollar', balance: 500 }]);

      expect(component.cashCurrency()).toBe('USD');
      expect(component.availableCash()).toBe(500);
    });

    it('returns 0 when the cash currency is not owned', () => {
      fillForm({ orderType: 'US_EQUITY' });
      component.ownedCurrencies.set([{ symbol: 'EUR', name: 'Euro', balance: 300 }]);

      expect(component.availableCash()).toBe(0);
    });

    it('returns 0 when nothing is owned at all', () => {
      fillForm({ orderType: 'US_EQUITY' });
      component.ownedCurrencies.set([]);

      expect(component.availableCash()).toBe(0);
    });

    it('returns null when no portfolio is selected', () => {
      fillForm({ orderType: 'US_EQUITY', portfolioId: '' });
      component.ownedCurrencies.set([{ symbol: 'USD', name: 'US Dollar', balance: 500 }]);

      expect(component.availableCash()).toBeNull();
    });

    it('uses the settlement currency for CRYPTO', () => {
      fillForm({ orderType: 'CRYPTO', symbol: 'BTC', settlementCurrency: 'EUR' });
      component.ownedCurrencies.set([
        { symbol: 'USD', name: 'US Dollar', balance: 500 },
        { symbol: 'EUR', name: 'Euro', balance: 250 },
      ]);

      expect(component.cashCurrency()).toBe('EUR');
      expect(component.availableCash()).toBe(250);
    });
  });

  describe('cashShortfall', () => {
    it('is true when a BUY costs more than the available USD', () => {
      fillForm({ orderType: 'US_EQUITY', side: 'BUY', quantity: 5 });
      component.ownedCurrencies.set([{ symbol: 'USD', name: 'US Dollar', balance: 500 }]);
      component.quote.set(makeQuote({ ask: 101, currency: 'USD' }));

      expect(component.estimatedTotal()).toBe(505);
      expect(component.cashShortfall()).toBe(true);
    });

    it('is false when a BUY fits within the available USD', () => {
      fillForm({ orderType: 'US_EQUITY', side: 'BUY', quantity: 4 });
      component.ownedCurrencies.set([{ symbol: 'USD', name: 'US Dollar', balance: 500 }]);
      component.quote.set(makeQuote({ ask: 101, currency: 'USD' }));

      expect(component.estimatedTotal()).toBe(404);
      expect(component.cashShortfall()).toBe(false);
    });

    it('is false for a SELL even when proceeds exceed the cash balance', () => {
      fillForm({ orderType: 'US_EQUITY', side: 'SELL', quantity: 50 });
      component.ownedCurrencies.set([{ symbol: 'USD', name: 'US Dollar', balance: 500 }]);
      component.quote.set(makeQuote({ bid: 99, ask: 101, currency: 'USD' }));

      expect(component.effectiveSide()).toBe('SELL');
      expect(component.cashShortfall()).toBe(false);
    });

    it('is false when the quote currency differs from the cash currency', () => {
      fillForm({ orderType: 'US_EQUITY', side: 'BUY', quantity: 50 });
      component.ownedCurrencies.set([{ symbol: 'USD', name: 'US Dollar', balance: 500 }]);
      component.quote.set(makeQuote({ ask: 101, currency: 'EUR' }));

      expect(component.cashShortfall()).toBe(false);
    });
  });

  describe('template', () => {
    function summaryRow(label: string): HTMLElement | undefined {
      const rows = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('.order-summary__row'),
      );
      return rows.find(row => row.querySelector('dt')?.textContent?.trim() === label);
    }

    it('shows a "Cash available" row with the balance', async () => {
      fillForm({ orderType: 'US_EQUITY', side: 'BUY', quantity: 1 });
      component.ownedCurrencies.set([{ symbol: 'USD', name: 'US Dollar', balance: 500 }]);
      component.quote.set(makeQuote({ ask: 101, currency: 'USD' }));
      fixture.detectChanges();
      await fixture.whenStable();

      const row = summaryRow('Cash available');
      expect(row).toBeTruthy();
      expect(row!.querySelector('dd')!.textContent).toContain('500.00');
      expect(row!.querySelector('dd')!.textContent).toContain('USD');
      expect((fixture.nativeElement as HTMLElement).querySelector('[role="status"]')).toBeNull();
    });

    it('shows a role="status" warning when the estimated cost exceeds the cash', async () => {
      fillForm({ orderType: 'US_EQUITY', side: 'BUY', quantity: 10 });
      component.ownedCurrencies.set([{ symbol: 'USD', name: 'US Dollar', balance: 500 }]);
      component.quote.set(makeQuote({ ask: 101, currency: 'USD' }));
      fixture.detectChanges();
      await fixture.whenStable();

      const statuses = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>('[role="status"]'),
      );
      const warning = statuses.find(el => el.textContent?.includes('Estimated cost is more than'));
      expect(warning).toBeTruthy();
    });
  });

  describe('form helpers', () => {
    it('stepQuantity(-1) from 1 on US_EQUITY stays at 1', () => {
      fillForm({ orderType: 'US_EQUITY', quantity: 1 });

      component.stepQuantity(-1);

      expect(component.orderForm.controls.quantity.value).toBe(1);
    });

    it('selectOrderType("DEPOSIT") resets changeThreshold to 0', () => {
      fillForm({ orderType: 'US_EQUITY', changeThreshold: 5 });
      expect(component.orderForm.controls.changeThreshold.value).toBe(5);

      component.selectOrderType('DEPOSIT');

      expect(component.orderForm.controls.changeThreshold.value).toBe(0);
    });
  });
});
