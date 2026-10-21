import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { PreviewPage } from './preview-page';
import { OrderApiService } from '../data-access/order-api.service';
import { OrderRequest, OrderResponse } from '../../../core/trading.models';

describe('PreviewPage', () => {
  let component: PreviewPage;
  let fixture: ComponentFixture<PreviewPage>;
  let submit$: Subject<OrderResponse>;
  let orderApi: { submitOrder: ReturnType<typeof vi.fn> };

  const buyRequest: OrderRequest = {
    clientId: 'client-1',
    clientName: 'Jane',
    portfolioId: 'portfolio-1',
    addInstrumentSymbol: 'AAPL',
    addInstrumentType: 'EQUITY',
    subtractInstrumentSymbol: 'USD',
    subtractInstrumentType: 'CASH',
    quantity: 10,
    quotedPrice: 227.52,
    side: 'BUY',
    changeThreshold: 0.05,
    market: 'US_EQUITY',
  };

  const sellRequest: OrderRequest = {
    ...buyRequest,
    addInstrumentSymbol: 'USD',
    addInstrumentType: 'CASH',
    subtractInstrumentSymbol: 'AAPL',
    subtractInstrumentType: 'EQUITY',
    side: 'SELL',
  };

  const response = { orderId: 'order-1', currentStatus: 'PENDING' } as OrderResponse;

  const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
  const backButton = () => fixture.nativeElement.querySelector('.preview-back') as HTMLButtonElement;
  const confirmButton = () => fixture.nativeElement.querySelector('.preview-confirm') as HTMLButtonElement;

  async function setup(request: OrderRequest) {
    fixture = TestBed.createComponent(PreviewPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('request', request);
    fixture.componentRef.setInput('portfolioLabel', 'Brokerage');
    await fixture.whenStable();
  }

  beforeEach(async () => {
    submit$ = new Subject<OrderResponse>();
    orderApi = { submitOrder: vi.fn(() => submit$) };

    await TestBed.configureTestingModule({
      imports: [PreviewPage],
      providers: [{ provide: OrderApiService, useValue: orderApi }],
    }).compileComponents();
  });

  it('renders side, quantity and asset plus the estimated total for a BUY', async () => {
    await setup(buyRequest);
    expect(text()).toContain('Buy 10 AAPL');
    expect(text()).toContain('≈ 2,275.20 USD');
    expect(text()).toContain('Brokerage');
  });

  it('renders the sold asset and no estimated total for a SELL', async () => {
    await setup(sellRequest);
    expect(text()).toContain('Sell 10 AAPL');
    expect(text()).not.toContain('≈');
    expect(component.estimatedTotal()).toBeNull();
  });

  it('submits the request and disables both buttons while submitting', async () => {
    await setup(buyRequest);
    expect(backButton().disabled).toBe(false);
    expect(confirmButton().disabled).toBe(false);

    confirmButton().click();
    await fixture.whenStable();

    expect(orderApi.submitOrder).toHaveBeenCalledOnce();
    expect(orderApi.submitOrder).toHaveBeenCalledWith(buyRequest);
    expect(backButton().disabled).toBe(true);
    expect(confirmButton().disabled).toBe(true);
  });

  it('emits confirmed with the response and re-enables the buttons', async () => {
    await setup(buyRequest);
    const confirmed = vi.fn();
    const failed = vi.fn();
    component.confirmed.subscribe(confirmed);
    component.failed.subscribe(failed);

    confirmButton().click();
    submit$.next(response);
    await fixture.whenStable();

    expect(confirmed).toHaveBeenCalledWith(response);
    expect(failed).not.toHaveBeenCalled();
    expect(component.submitting()).toBe(false);
    expect(confirmButton().disabled).toBe(false);
  });

  it('emits failed with the server error message', async () => {
    await setup(buyRequest);
    const confirmed = vi.fn();
    const failed = vi.fn();
    component.confirmed.subscribe(confirmed);
    component.failed.subscribe(failed);

    confirmButton().click();
    submit$.error({ error: { message: 'Insufficient funds' }, message: 'Http failure response' });
    await fixture.whenStable();

    expect(failed).toHaveBeenCalledWith('Insufficient funds');
    expect(confirmed).not.toHaveBeenCalled();
    expect(component.submitting()).toBe(false);
    expect(backButton().disabled).toBe(false);
  });

  it('falls back to the error message, then a default, when no server message', async () => {
    await setup(buyRequest);
    const failed = vi.fn();
    component.failed.subscribe(failed);

    confirmButton().click();
    submit$.error(new Error('Network down'));
    expect(failed).toHaveBeenLastCalledWith('Network down');

    submit$ = new Subject<OrderResponse>();
    component.confirm();
    submit$.error({});
    expect(failed).toHaveBeenLastCalledWith('Failed to place order');
  });

  it('emits back when Back is clicked', async () => {
    await setup(buyRequest);
    const back = vi.fn();
    component.back.subscribe(back);

    backButton().click();

    expect(back).toHaveBeenCalledOnce();
    expect(orderApi.submitOrder).not.toHaveBeenCalled();
  });
});
