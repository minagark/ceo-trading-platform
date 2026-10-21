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

    it('watches the order and starts as processing', () => {
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
    });

    it('emits done when Try again is clicked', () => {
      const done = vi.fn();
      component.done.subscribe(done);

      button().click();

      expect(done).toHaveBeenCalledOnce();
    });
  });
});
