import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountActivityRow } from './account-activity-row';
import { OrderResponse, OrderStatus } from '../../../core/trading.models';

const createOrder = (currentStatus: OrderStatus): OrderResponse => ({
  orderId: 'order-1',
  clientId: 'client-1',
  portfolioId: 'portfolio-1',
  addInstrumentSymbol: 'AAPL',
  addInstrumentType: 'EQUITY',
  addInstrumentFullName: 'Apple Inc.',
  subtractInstrumentSymbol: 'USD',
  subtractInstrumentType: 'CASH',
  subtractInstrumentFullName: 'US Dollar',
  quantity: 1,
  quotedPrice: 100,
  resolvedPrice: 100,
  side: 'BUY',
  changeThreshold: 0,
  createdDate: '2026-01-01T00:00:00Z',
  resolvedDate: '2026-01-01T00:00:00Z',
  currentStatus,
});

describe('AccountActivityRow', () => {
  let component: AccountActivityRow;
  let fixture: ComponentFixture<AccountActivityRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountActivityRow],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountActivityRow);
    component = fixture.componentInstance;
  });

  it('renders a labeled badge with the matching status class', () => {
    const statuses: OrderStatus[] = ['PENDING', 'ACCEPTED', 'REJECTED', 'FULFILLED', 'CANCELLED'];

    for (const status of statuses) {
      fixture.componentRef.setInput('order', createOrder(status));
      fixture.detectChanges();

      const badge: HTMLElement = fixture.nativeElement.querySelector('.account-activity__status');
      expect(badge.classList).toContain(`account-activity__status--${status.toLowerCase()}`);
      expect(badge.textContent?.trim().toUpperCase()).toBe(status);
    }
  });

  it('renders the primary instrument and a placeholder for an unresolved date', () => {
    fixture.componentRef.setInput('order', { ...createOrder('PENDING'), resolvedDate: '' });
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.account-activity-row__symbol')?.textContent?.trim()).toBe('AAPL');
    expect(element.querySelectorAll('.account-activity-row__time')[1].textContent?.trim()).toBe('—');
  });

  it('preserves selected styling and pointer selection events', () => {
    fixture.componentRef.setInput('order', createOrder('FULFILLED'));
    fixture.componentRef.setInput('selected', true);
    fixture.detectChanges();

    const down = vi.fn();
    const enter = vi.fn();
    component.rowPointerDown.subscribe(down);
    component.rowPointerEnter.subscribe(enter);
    const element: HTMLElement = fixture.nativeElement;

    expect(element.classList).toContain('account-activity-row--selected');
    element.dispatchEvent(new Event('pointerdown'));
    component.onPointerEnter({ buttons: 0 } as PointerEvent);
    expect(enter).not.toHaveBeenCalled();
    component.onPointerEnter({ buttons: 1 } as PointerEvent);
    expect(down).toHaveBeenCalledOnce();
    expect(enter).toHaveBeenCalledOnce();
  });
});
