import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockDisplay } from './stock-display';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Subject, of } from 'rxjs';
import { QuoteResponse } from '../../../core/api.models';
import { MarketApiService } from '../data-access/market-api.service';
import { PortfolioPerformance } from '../../portfolio/portfolio-performance/portfolio-performance';
import { InstrumentSearch } from '../../trading/instrument-search/instrument-search';

describe('Stock Display', () => {
  let component: StockDisplay;
  let fixture: ComponentFixture<StockDisplay>;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let names: Subject<string>[];
  let quotes: Subject<QuoteResponse>[];
  const quote: QuoteResponse = {
    symbol: 'AAPL',
    price: 100,
    bid: 99,
    ask: 101,
    spreadBps: 20,
    currency: 'USD',
    change: 1,
    changePercent: 1,
    previousClose: 99,
    asOf: '2026-10-29T12:00:00Z',
    marketState: 'OPEN',
  };

  beforeEach(async () => {
    params = new BehaviorSubject(convertToParamMap({}));
    names = [];
    quotes = [];
    await TestBed.configureTestingModule({
      imports: [StockDisplay],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParamMap: params } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: MarketApiService,
          useValue: {
            getInstrumentFullName: () => {
              const response = new Subject<string>();
              names.push(response);
              return response;
            },
            getQuote: () => {
              const response = new Subject<QuoteResponse>();
              quotes.push(response);
              return response;
            },
            getStockInfo: () => of([{ date: '2026-10-28', balance: 99 }]),
            getTodaysCandle: () => of(null),
          },
        },
      ],
    })
      .overrideComponent(StockDisplay, {
        remove: { imports: [PortfolioPerformance, InstrumentSearch] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(StockDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows loading until every stock information request completes', () => {
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.current-price')).toBeNull();
    expect(fixture.nativeElement.querySelector('.trade-button')).toBeNull();

    names[0].next('Apple Inc.');
    names[0].complete();
    fixture.detectChanges();
    expect(component.loading()).toBe(true);
    quotes[0].next(quote);
    quotes[0].complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('.stock-display-name').textContent).toContain(
      'Apple Inc.',
    );
    expect(fixture.nativeElement.querySelector('.trade-button')).not.toBeNull();
  });

  it('keeps loading when navigation cancels a previous stock request', () => {
    params.next(convertToParamMap({ symbol: 'MSFT' }));
    fixture.detectChanges();
    names[0].next('Apple Inc.');
    names[0].complete();
    quotes[0].next(quote);
    quotes[0].complete();
    expect(component.loading()).toBe(true);
    names[1].next('Microsoft');
    names[1].complete();
    quotes[1].next({ ...quote, symbol: 'MSFT' });
    quotes[1].complete();
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
    expect(component.stockDisplayInfo().symbol).toBe('MSFT');
  });

  it('stops loading on failure and can load a different stock afterward', () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    try {
      quotes[0].error(new Error('Unavailable'));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
      expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
        'Unable to load',
      );
      expect(fixture.nativeElement.querySelector('.trade-button')).toBeNull();
      expect(log).toHaveBeenCalledOnce();

      params.next(convertToParamMap({ symbol: 'MSFT' }));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
      names[1].next('Microsoft');
      names[1].complete();
      quotes[1].next({ ...quote, symbol: 'MSFT' });
      quotes[1].complete();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
      expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    } finally {
      log.mockRestore();
    }
  });
});
