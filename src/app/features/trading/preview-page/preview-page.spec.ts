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
  const backButton = () => fixture.nativeElement.querySelector('.review-back') as HTMLButtonElement;
  const confirmButton = () => fixture.nativeElement.querySelector('.review-confirm') as HTMLButtonElement;

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

  const depositRequest: OrderRequest = {
    ...buyRequest,
    addInstrumentSymbol: 'USD',
    addInstrumentType: 'CASH',
    subtractInstrumentSymbol: '',
    subtractInstrumentType: '',
    quantity: 500,
    quotedPrice: 1,
    side: 'DEPOSIT',
  };

  const legs = () => [...(fixture.nativeElement as HTMLElement).querySelectorAll('.leg')];
  const legText = (leg: Element, part: string) => leg.querySelector(`.leg__${part}`)!.textContent!.replace(/\s+/g, ' ').trim();
  const getLeg = () => (fixture.nativeElement as HTMLElement).querySelector('.leg--get')!;
  const payLeg = () => legs().find(leg => !leg.classList.contains('leg--get'));

  it('BUY: pays the estimated total in USD and gets 10 AAPL, with Rate and max price', async () => {
    await setup(buyRequest);

    expect(component.pay()).toEqual({ symbol: 'USD', amount: expect.closeTo(2275.2, 6), estimate: true });
    expect(component.get()).toEqual({ symbol: 'AAPL', amount: 10, estimate: false });
    expect(component.maxPrice()).toBeCloseTo(238.896, 6);

    expect(legText(payLeg()!, 'label')).toBe('You pay');
    expect(legText(payLeg()!, 'value')).toBe('≈ 2,275.20');
    expect(legText(payLeg()!, 'symbol')).toBe('USD');
    expect(legText(getLeg(), 'label')).toBe('You get');
    expect(legText(getLeg(), 'value')).toBe('10');
    expect(legText(getLeg(), 'symbol')).toBe('AAPL');

    expect(text()).toContain('Rate');
    expect(text()).toContain('1 AAPL = 227.52 USD');
    expect(text()).toContain('Price tolerance');
    expect(text()).toContain('± 5%');
    expect(text()).toContain('(max 238.896)');
    expect(text()).toContain('Brokerage');
  });

  it('SELL: pays 10 AAPL, gets USD at market price, no Rate row', async () => {
    await setup(sellRequest);

    expect(component.pay()).toEqual({ symbol: 'AAPL', amount: 10, estimate: false });
    expect(component.get().amount).toBeNull();
    expect(component.maxPrice()).toBeNull();

    expect(legText(payLeg()!, 'value')).toBe('10.00');
    expect(legText(payLeg()!, 'symbol')).toBe('AAPL');
    expect(legText(getLeg(), 'value')).toBe('At market price');
    expect(legText(getLeg(), 'symbol')).toBe('USD');

    expect(text()).not.toContain('Rate');
    expect(text()).not.toContain('≈');
    expect(text()).not.toContain('max');
    expect(text()).toContain('Price tolerance');
  });

  it('DEPOSIT: has no pay leg, only what arrives', async () => {
    await setup(depositRequest);

    expect(component.pay()).toBeNull();
    expect(legs().length).toBe(1);
    expect(text()).not.toContain('You pay');
    expect(legText(getLeg(), 'value')).toBe('500');
    expect(legText(getLeg(), 'symbol')).toBe('USD');
    expect(text()).not.toContain('Rate');
    expect(text()).toContain('Price tolerance');
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
