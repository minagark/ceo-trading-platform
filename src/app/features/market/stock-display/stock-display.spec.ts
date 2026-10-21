import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RealtimeService } from '../../../core/realtime.service';
import { MarketApiService } from '../data-access/market-api.service';
import { StockDisplay } from './stock-display';

describe('Stock Display', () => {
  let component: StockDisplay;
  let fixture: ComponentFixture<StockDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockDisplay],
      providers: [
        {
          provide: RealtimeService,
          useValue: {
            subscribeToQuote: () =>
              of({
                requestedSymbol: 'AAPL',
                instrumentType: 'EQUITY',
                marketSymbol: 'AAPL',
                price: 200,
                bid: 199,
                ask: 201,
                change: 1,
                changePercent: 0.5,
                previousClose: 199,
                currency: 'USD',
                asOf: '2026-01-01T00:00:00Z',
                marketState: 'OPEN',
              }),
          },
        },
        {
          provide: MarketApiService,
          useValue: {
            getQuote: () =>
              of({
                symbol: 'AAPL',
                price: 201,
                bid: 200.9,
                ask: 201.1,
                spreadBps: 0,
                currency: 'USD',
                change: 2,
                changePercent: 0.01,
                previousClose: 199,
                asOf: '2026-01-01T00:00:00Z',
                marketState: 'OPEN',
              }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StockDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});