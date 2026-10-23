import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AnalyticsApiService } from './analytics-api.service';

describe('AnalyticsApiService', () => {
  let service: AnalyticsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AnalyticsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AnalyticsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('normalizes a single candle response to an array', () => {
    let result: unknown;
    service.getCandles('AAPL').subscribe((candles) => result = candles);

    const request = http.expectOne((request) => request.url.endsWith('/analytics/candles/AAPL'));
    request.flush({ date: '2026-01-02', open: 272.26, high: 277.84, low: 269, close: 271.01, volume: 37838100 });

    expect(result).toEqual([{ date: '2026-01-02', open: 272.26, high: 277.84, low: 269, close: 271.01, volume: 37838100 }]);
  });

  it('passes the top instruments limit to the backend', () => {
    service.getTopInstruments(10, { from: '2026-01-01', to: '2027-01-01', symbol: 'ALL', clientSegment: 'ALL' }).subscribe();

    const request = http.expectOne((request) => request.url.endsWith('/analytics/top-instruments'));
    expect(request.request.params.get('limit')).toBe('10');
    request.flush([]);
  });

  it('loads top market movers with the requested limit', () => {
    let result: unknown;
    service.getTopMovers(5).subscribe((movers) => result = movers);

    const request = http.expectOne((request) => request.url.endsWith('/analytics/top-movers'));
    expect(request.request.params.get('limit')).toBe('5');
    request.flush([{ symbol: 'INTU', currentPrice: 353.84, previousClose: 335.61, percentageChange: 5.4319 }]);

    expect(result).toEqual([{ symbol: 'INTU', currentPrice: 353.84, previousClose: 335.61, percentageChange: 5.4319 }]);
  });
});
