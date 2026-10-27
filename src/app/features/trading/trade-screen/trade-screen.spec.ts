import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Trades } from './trade-screen';
import { MarketApiService } from '../../market/data-access/market-api.service';
import { of } from 'rxjs';

describe('Trades', () => {
  let component: Trades;
  let fixture: ComponentFixture<Trades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trades],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Trades);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('uses CASH for the subtract instrument when buying a US equity', () => {
    const marketApi = TestBed.inject(MarketApiService);
    vi.spyOn(marketApi, 'getQuote').mockReturnValue(of({
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
    }));

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
});
