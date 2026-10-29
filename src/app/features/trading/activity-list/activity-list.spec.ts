import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityList } from './activity-list';
import { signal } from '@angular/core';
import { ActivityListService } from './activity-list.service';
import { AuthService } from '../../auth/auth/auth.service';
import { OrderResponse } from '../../../core/trading.models';

const createOrder = (index: number): OrderResponse => ({
  orderId: `order-${index}`,
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
  createdDate: `2026-01-0${index + 1}T00:00:00Z`,
  resolvedDate: '',
  currentStatus: 'PENDING',
});

describe('ActivityList', () => {
  let component: ActivityList;
  let fixture: ComponentFixture<ActivityList>;
  let orders: ReturnType<typeof signal<OrderResponse[]>>;
  const loading = signal(false);
  const error = signal<string | null>(null);

  beforeEach(async () => {
    orders = signal<OrderResponse[]>([]);
    loading.set(false);
    error.set(null);
    await TestBed.configureTestingModule({
      imports: [ActivityList],
      providers: [
        {
          provide: ActivityListService,
          useValue: { orders, loading, error, loadForClient: vi.fn() },
        },
        { provide: AuthService, useValue: { currentUserId: signal(null) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows a loading spinner instead of an empty state while loading activity', () => {
    loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.account-activity__empty')).toBeNull();

    orders.set([createOrder(0)]);
    loading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('[role="listitem"]')).toHaveLength(1);
  });

  it('replaces loading with an error when activity cannot be loaded', () => {
    loading.set(true);
    fixture.detectChanges();
    error.set('Unable to load account activity.');
    loading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(error());
    expect(fixture.nativeElement.querySelector('.account-activity__empty')).toBeNull();
  });

  it('shows the empty state without a table when there are no orders', () => {
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.account-activity__empty')?.textContent).toContain(
      'No account activity yet.',
    );
    expect(element.querySelector('.account-activity__table')).toBeNull();
  });

  it('renders all nine headers and newest-first rows inside a focusable scroll region', () => {
    orders.set([createOrder(0), createOrder(1)]);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    const region = element.querySelector('[role="region"]');
    expect(region?.getAttribute('tabindex')).toBe('0');
    expect(region?.getAttribute('aria-label')).toBe('Account activity');
    expect(element.querySelectorAll('.account-activity__col-headers > span')).toHaveLength(9);
    expect(element.querySelectorAll('[role="listitem"]')).toHaveLength(2);
    expect(component.rows()[0].orderId).toBe('order-1');
  });

  it('keeps the compact preview limited to five rows', () => {
    orders.set(Array.from({ length: 6 }, (_, index) => createOrder(index)));
    fixture.componentRef.setInput('showLess', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role="listitem"]')).toHaveLength(5);

    fixture.componentRef.setInput('showLess', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[role="listitem"]')).toHaveLength(6);
  });

  it('preserves drag selection and stops selecting on pointer up', () => {
    component.onRowPointerDown('order-0');
    component.onRowPointerEnter('order-1');
    component.onPointerUp();
    component.onRowPointerEnter('order-2');

    expect(component.isSelected('order-0')).toBe(true);
    expect(component.isSelected('order-1')).toBe(true);
    expect(component.isSelected('order-2')).toBe(false);
  });
});
