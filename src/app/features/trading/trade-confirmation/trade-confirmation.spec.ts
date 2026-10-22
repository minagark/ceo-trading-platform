import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { TradeConfirmation } from './trade-confirmation';
import { OrderUpdatesService } from '../data-access/order-updates.service';
import { OrderResponse, OrderStatus, OrderStatusUpdate } from '../../../core/trading.models';

describe('TradeConfirmation', () => {
  let component: TradeConfirmation;
  let fixture: ComponentFixture<TradeConfirmation>;
  let updates$: Subject<OrderStatusUpdate>;
  let orderUpdates: { watchOrder: ReturnType<typeof vi.fn> };

  const order: OrderResponse = {
    orderId: 'order-1',
    clientId: 'client-1',
    portfolioId: 'portfolio-1',
    addInstrumentSymbol: 'AAPL',
    addInstrumentType: 'EQUITY',
    addInstrumentFullName: 'Apple Inc.',
    subtractInstrumentSymbol: 'USD',
    subtractInstrumentType: 'CASH',
    subtractInstrumentFullName: 'US Dollar',
    quantity: 10,
    quotedPrice: 227.52,
    side: 'BUY',
    changeThreshold: 0.05,
    createdDate: '2026-10-21T10:00:00Z',
    resolvedDate: '',
    currentStatus: 'PENDING',
  };

  const update = (status: OrderStatus, message = ''): OrderStatusUpdate => ({
    orderId: order.orderId,
    status,
    message,
    timestamp: '2026-10-21T10:00:05Z',
    terminal: ['FULFILLED', 'REJECTED', 'CANCELLED'].includes(status),
  });

  const el = () => fixture.nativeElement as HTMLElement;
  const steps = () => component.steps().map(step => [step.label, step.state]);
  const stepLabels = () => [...el().querySelectorAll('.status-step__label')].map(node => node.textContent!.trim());
  const button = () => el().querySelector('.result-done') as HTMLButtonElement;
  const activityButton = () => el().querySelector('.result-activity') as HTMLButtonElement | null;
  const badge = () => el().querySelector('.status-badge') as HTMLElement;

  async function push(...statuses: [OrderStatus, string?][]) {
    for (const [status, message] of statuses) {
      updates$.next(update(status, message));
    }
    await fixture.whenStable();
  }

  beforeEach(async () => {
    updates$ = new Subject<OrderStatusUpdate>();
    orderUpdates = { watchOrder: vi.fn(() => updates$) };

    await TestBed.configureTestingModule({
      imports: [TradeConfirmation],
      providers: [{ provide: OrderUpdatesService, useValue: orderUpdates }],
    }).compileComponents();

    fixture = TestBed.createComponent(TradeConfirmation);
    component = fixture.componentInstance;
  });

  describe('with a placed order', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('order', order);
      await fixture.whenStable();
    });

    it('emits viewActivity from the View activity button', () => {
      const viewActivity = vi.fn();
      const done = vi.fn();
      component.viewActivity.subscribe(viewActivity);
      component.done.subscribe(done);

      expect(activityButton()!.textContent!.trim()).toBe('View activity');
      activityButton()!.click();

      expect(viewActivity).toHaveBeenCalledOnce();
      expect(done).not.toHaveBeenCalled();
    });

    it('shows the estimated total row for a BUY', () => {
      expect(component.estimatedTotal()).toBeCloseTo(2275.2, 6);
      const row = el().querySelector('.order-details__row--total')!;
      expect(row.querySelector('dt')!.textContent!.trim()).toBe('Estimated total');
      expect(row.querySelector('dd')!.textContent!.trim()).toBe('2,275.20 USD');
    });

    it('shortens a long order id to first 8 characters, an ellipsis and the last 4', () => {
      expect(component.shortOrderId()).toBe('order-1');
      fixture.componentRef.setInput('order', { ...order, orderId: '3f2a9c1e-7b44-4d2e-9a10-5c6d7e8f9abc' });
      expect(component.shortOrderId()).toBe('3f2a9c1e…9abc');
    });

    it('watches the order and starts as processing', () => {
      expect(component.badge()).toBe('Processing');
      expect(badge().classList).toContain('status-badge--processing');
      expect(orderUpdates.watchOrder).toHaveBeenCalledWith('order-1');
      expect(component.title()).toBe('Processing order…');
      expect(el().querySelector('.result-title')!.textContent).toContain('Processing order…');
      expect(steps()).toEqual([
        ['Submitted', 'done'],
        ['Accepted', 'current'],
        ['Filled', 'upcoming'],
      ]);
      expect(component.reason()).toBeNull();
    });

    it('shows a filled order after ACCEPTED then FULFILLED', async () => {
      await push(['ACCEPTED']);
      expect(component.title()).toBe('Processing order…');
      expect(steps()).toEqual([
        ['Submitted', 'done'],
        ['Accepted', 'done'],
        ['Filled', 'current'],
      ]);

      await push(['FULFILLED']);
      expect(component.title()).toBe('Order filled');
      expect(el().querySelector('.result-title')!.textContent).toContain('Order filled');
      expect(steps()).toEqual([
        ['Submitted', 'done'],
        ['Accepted', 'done'],
        ['Filled', 'done'],
      ]);
      expect(stepLabels()).toEqual(['Submitted', 'Accepted', 'Filled']);
      expect(button().textContent!.trim()).toBe('New order');
      expect(component.badge()).toBe('Filled');
      expect(badge().textContent).toContain('Filled');
      expect(badge().classList).toContain('status-badge--filled');
    });

    it('shows Submitted then Rejected, with the reason, when rejected straight after PENDING', async () => {
      await push(['PENDING'], ['REJECTED', 'Insufficient funds']);

      expect(component.title()).toBe('Order rejected');
      expect(steps()).toEqual([
        ['Submitted', 'done'],
        ['Rejected', 'failed'],
      ]);
      expect(stepLabels()).toEqual(['Submitted', 'Rejected']);
      expect(el().querySelector('.result-reason')!.textContent).toContain('Insufficient funds');
      expect(button().textContent!.trim()).toBe('New order');
      expect(component.badge()).toBe('Rejected');
      expect(badge().textContent).toContain('Rejected');
      expect(badge().classList).toContain('status-badge--rejected');
    });

    it('shows Submitted, Accepted, Rejected when rejected after ACCEPTED', async () => {
      await push(['ACCEPTED'], ['REJECTED', 'Price moved beyond tolerance']);

      expect(component.title()).toBe('Order rejected');
      expect(steps()).toEqual([
        ['Submitted', 'done'],
        ['Accepted', 'done'],
        ['Rejected', 'failed'],
      ]);
      expect(stepLabels()).toEqual(['Submitted', 'Accepted', 'Rejected']);
      expect(el().querySelector('.result-reason')!.textContent).toContain('Price moved beyond tolerance');
    });

    it('emits done when the button is clicked', () => {
      const done = vi.fn();
      component.done.subscribe(done);

      button().click();

      expect(done).toHaveBeenCalledOnce();
    });
  });

  it('has no estimated total row for a SELL', async () => {
    fixture.componentRef.setInput('order', {
      ...order, side: 'SELL', addInstrumentSymbol: 'USD', subtractInstrumentSymbol: 'AAPL',
    });
    await fixture.whenStable();

    expect(component.estimatedTotal()).toBeNull();
    expect(el().querySelector('.order-details')).not.toBeNull();
    expect(el().querySelector('.order-details__row--total')).toBeNull();
    expect(el().textContent).not.toContain('Estimated total');
  });

  describe('with only a failure message', () => {
    beforeEach(async () => {
      fixture.componentRef.setInput('message', 'Insufficient funds');
      await fixture.whenStable();
    });

    it('shows the failure and never watches an order', () => {
      expect(component.title()).toBe('Order failed');
      expect(el().querySelector('.result-title')!.textContent).toContain('Order failed');
      expect(el().querySelector('.result-reason')!.textContent).toContain('Insufficient funds');
      expect(el().querySelectorAll('.status-step').length).toBe(0);
      expect(button().textContent!.trim()).toBe('Try again');
      expect(orderUpdates.watchOrder).not.toHaveBeenCalled();
      expect(component.badge()).toBe('Not placed');
      expect(badge().textContent).toContain('Not placed');
      expect(badge().classList).toContain('status-badge--failed');
      expect(activityButton()).toBeNull();
      expect(component.estimatedTotal()).toBeNull();
      expect(el().querySelector('.order-details')).toBeNull();
    });

    it('emits done when Try again is clicked', () => {
      const done = vi.fn();
      component.done.subscribe(done);

      button().click();

      expect(done).toHaveBeenCalledOnce();
    });
  });
});
