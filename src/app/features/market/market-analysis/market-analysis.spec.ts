import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { AnalyticsApiService } from '../data-access/analytics-api.service';
import { Candle } from '../data-access/analytics-api.service';
import { MarketAnalysis } from './market-analysis';

describe('MarketAnalysis', () => {
  let component: MarketAnalysis;
  let fixture: ComponentFixture<MarketAnalysis>;
  let candleResponse: Observable<Candle[]>;

  beforeEach(async () => {
    candleResponse = of([{ date: '2026-01-02', open: 272.26, high: 277.84, low: 269, close: 271.01, volume: 37838100 }]);
    await TestBed.configureTestingModule({
      imports: [MarketAnalysis],
      providers: [{
        provide: AnalyticsApiService,
        useValue: {
          getVolume: () => of({ totalNotional: 5251.8, totalQuantity: 15, executedTrades: 3 }),
          getTopInstruments: () => of([
            { symbol: 'NVDA', totalNotional: 2197.5, totalQuantity: 5, executedTrades: 1 },
            { symbol: 'TSLA', totalNotional: 1835.3, totalQuantity: 5, executedTrades: 1 },
          ]),
          getTopMovers: () => of([
            { symbol: 'META', currentPrice: 643.417, percentageChange: -7.75648 },
            { symbol: 'INTU', currentPrice: 353.84, percentageChange: 5.4319 },
            { symbol: 'MCD', currentPrice: 251.57, percentageChange: 2.1604 },
            { symbol: 'NVDA', currentPrice: 212.635, percentageChange: -4.2055 },
            { symbol: 'TSLA', currentPrice: 378.18, percentageChange: -2.145 },
          ]),
          getClientActivityTrends: () => of([{ periodStart: '2026-10-19T00:00:00Z', clientSegment: 'RETAIL', totalNotional: 5251.8, totalQuantity: 15, executedTrades: 3 }]),
          getCandles: () => candleResponse,
        },
      }],
    }).compileComponents();

    fixture = TestBed.createComponent(MarketAnalysis);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders KPI values from the analytics response', () => {
    expect(fixture.nativeElement.textContent).toContain('$5,251.80');
    expect(fixture.nativeElement.textContent).toContain('15');
    expect(fixture.nativeElement.textContent).toContain('3');
  });

  it('uses the OHLC summary for a single candle', () => {
    expect(fixture.nativeElement.textContent).toContain('Open');
    expect(fixture.nativeElement.textContent).toContain('$272.26');
    expect(fixture.nativeElement.textContent).toContain('Market volume: 37,838,100');
  });

  it('shows separate gainers and decliners from the market movers response', () => {
    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Top market movers');
    expect(text).toContain('Top 5 Gainers');
    expect(text).toContain('Top 5 Decliners');
    expect(text).toContain('INTU');
    expect(text).toContain('+5.43%');
    expect(text).toContain('$353.84');
    expect(text).toContain('META');
    expect(text).toContain('-7.76%');
    expect(component.topGainers().map((mover) => mover.symbol)).toEqual(['INTU', 'MCD']);
    expect(component.topDecliners().map((mover) => mover.symbol)).toEqual(['META', 'NVDA', 'TSLA']);
  });

  it('shows a quota warning for HTTP 429', () => {
    candleResponse = throwError(() => new HttpErrorResponse({ status: 429 }));

    component.refresh();

    expect(component.candleError()).toBe('Market-data quota exceeded. Try again later.');
  });

  it('shows a route or symbol message for HTTP 404', () => {
    candleResponse = throwError(() => new HttpErrorResponse({ status: 404 }));

    component.refresh();

    expect(component.candleError()).toBe('Market data route or symbol was not found. Check the symbol and try again.');
  });

  it('shows a general message for other market-data errors', () => {
    candleResponse = throwError(() => new HttpErrorResponse({ status: 500 }));

    component.refresh();

    expect(component.candleError()).toBe('Market price history could not be loaded. Please try again later.');
  });

  it('recognizes a quota error code outside HTTP 429', () => {
    candleResponse = throwError(() => new HttpErrorResponse({ status: 503, error: { code: 'QUOTA_EXCEEDED' } }));

    component.refresh();

    expect(component.candleError()).toBe('Market-data quota exceeded. Try again later.');
  });
});
