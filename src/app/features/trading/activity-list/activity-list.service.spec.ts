import { TestBed } from '@angular/core/testing';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { RealtimeService } from '../../../core/realtime.service';
import { OrderResponse } from '../../../core/trading.models';
import { OrderApiService } from '../data-access/order-api.service';
import { ActivityListService } from './activity-list.service';

describe('ActivityListService', () => {
  let service: ActivityListService;
  let orderApi: { getClientOrders: ReturnType<typeof vi.fn> };
  let realtime: { subscribeToUserOrders: ReturnType<typeof vi.fn> };
  let events$: Subject<any>;

  const baseOrder: OrderResponse = {
    orderId: 'order-1',
    clientId: 'client-1',
    portfolioId: 'portfolio-1',
    addInstrumentSymbol: 'AAPL',
    addInstrumentType: 'EQUITY',
    addInstrumentFullName: 'Apple Inc.',
    subtractInstrumentSymbol: 'USD',
    subtractInstrumentType: 'CASH',
    subtractInstrumentFullName: 'US Dollar',
    quantity: 5,
    quotedPrice: 100,
    side: 'BUY',
    changeThreshold: 0.02,
    createdDate: '2026-01-01T00:00:00Z',
    resolvedDate: '',
    currentStatus: 'PENDING',
  };

  beforeEach(() => {
    events$ = new Subject();
    orderApi = {
      getClientOrders: vi.fn().mockReturnValue(of([baseOrder])),
    };
    realtime = {
      subscribeToUserOrders: vi.fn().mockReturnValue(events$.asObservable()),
    };

    TestBed.configureTestingModule({
      providers: [
        ActivityListService,
        { provide: OrderApiService, useValue: orderApi },
        { provide: RealtimeService, useValue: realtime },
      ],
    });

    service = TestBed.inject(ActivityListService);
  });

  it('loads initial orders and applies realtime status updates', () => {
    service.loadForClient('client-1');

    expect(service.orders().length).toBe(1);
    expect(service.orders()[0].status).toBe('pending');

    events$.next({
      orderId: 'order-1',
      clientId: 'client-1',
      portfolioId: 'portfolio-1',
      status: 'FULFILLED',
      message: 'order fulfilled',
      statusDate: '2026-01-01T00:01:00Z',
      createdDate: '2026-01-01T00:00:00Z',
    });

    expect(service.orders()[0].status).toBe('fulfilled');
    expect(service.orders()[0].time).toBe('2026-01-01T00:01:00Z');
  });
});
