import { TestBed } from '@angular/core/testing';
import { Client, IFrame, IMessage, messageCallbackType } from '@stomp/stompjs';
import { of } from 'rxjs';
import { OrderUpdatesService, webSocketUrl } from './order-updates.service';
import { OrderApiService } from './order-api.service';
import { OrderResponse, OrderStatusUpdate } from '../../../core/trading.models';

describe('webSocketUrl', () => {
  it('maps an absolute http API base to ws://<host>/ws regardless of the page URL', () => {
    expect(webSocketUrl('http://localhost:8081/api', 'http://localhost:4200/trade')).toBe('ws://localhost:8081/ws');
    expect(webSocketUrl('http://localhost:8081/api', 'https://example.com/trades')).toBe('ws://localhost:8081/ws');
  });

  it('resolves a relative API base against the page and uses wss on https', () => {
    expect(webSocketUrl('/api', 'https://example.com/trades')).toBe('wss://example.com/ws');
  });

  it('uses ws for a relative API base on an http page', () => {
    expect(webSocketUrl('/api', 'http://example.com/trades')).toBe('ws://example.com/ws');
  });
});

// The real stompjs Client is kept (so the callbacks wired in the service's config stay real);
// only its network-touching members are stubbed.
describe('OrderUpdatesService.watchOrder', () => {
  let service: OrderUpdatesService;
  let client: Client;
  let orderApi: { getOrder: ReturnType<typeof vi.fn> };

  const order = {
    orderId: 'order-1',
    currentStatus: 'FULFILLED',
    createdDate: '2026-10-21T10:00:00Z',
    resolvedDate: '2026-10-21T10:00:09Z',
  } as OrderResponse;

  beforeEach(() => {
    orderApi = { getOrder: vi.fn(() => of(order)) };
    TestBed.configureTestingModule({
      providers: [{ provide: OrderApiService, useValue: orderApi }],
    });
    service = TestBed.inject(OrderUpdatesService);
    client = service['client'];
    vi.spyOn(client, 'deactivate').mockResolvedValue();
  });

  it('falls back to a REST read of the order when the socket fails to connect', () => {
    vi.spyOn(client, 'activate').mockImplementation(() => client.onWebSocketError(new Event('error')));
    const received: OrderStatusUpdate[] = [];
    let completed = false;

    service.watchOrder('order-1').subscribe({ next: u => received.push(u), complete: () => (completed = true) });

    expect(orderApi.getOrder).toHaveBeenCalledWith('order-1');
    expect(received).toEqual([{
      orderId: 'order-1',
      status: 'FULFILLED',
      message: '',
      timestamp: '2026-10-21T10:00:09Z',
      terminal: true,
    }]);
    expect(completed).toBe(true);
  });

  it('falls back to REST on a STOMP error frame, and marks a non-terminal status as such', () => {
    orderApi.getOrder.mockReturnValue(of({ ...order, currentStatus: 'ACCEPTED', resolvedDate: '' }));
    vi.spyOn(client, 'activate').mockImplementation(() =>
      client.onStompError({ headers: { message: 'broker down' } } as unknown as IFrame));
    const received: OrderStatusUpdate[] = [];

    service.watchOrder('order-1').subscribe(u => received.push(u));

    expect(orderApi.getOrder).toHaveBeenCalledWith('order-1');
    expect(received).toEqual([expect.objectContaining({
      status: 'ACCEPTED',
      timestamp: '2026-10-21T10:00:00Z',
      terminal: false,
    })]);
  });

  describe('when connected', () => {
    const handlers = new Map<string, messageCallbackType>();
    const send = (destination: string, body: OrderStatusUpdate) =>
      handlers.get(destination)!({ body: JSON.stringify(body) } as IMessage);
    const update = (status: OrderStatusUpdate['status'], terminal = false): OrderStatusUpdate =>
      ({ orderId: 'order-1', status, message: '', timestamp: 't', terminal });

    beforeEach(() => {
      handlers.clear();
      Object.defineProperty(client, 'connected', { get: () => true, configurable: true });
      vi.spyOn(client, 'subscribe').mockImplementation((destination, callback) => {
        handlers.set(destination, callback);
        return { id: destination, unsubscribe: vi.fn() };
      });
    });

    it('subscribes to the topic and snapshot, drops stale updates and completes on terminal', () => {
      const received: string[] = [];
      let completed = false;

      service.watchOrder('order-1').subscribe({ next: u => received.push(u.status), complete: () => (completed = true) });

      expect([...handlers.keys()]).toEqual(['/topic/orders/order-1', '/app/orders/order-1']);
      send('/topic/orders/order-1', update('ACCEPTED'));
      send('/app/orders/order-1', update('PENDING'));    // stale snapshot arriving late
      send('/topic/orders/order-1', update('FULFILLED', true));

      expect(received).toEqual(['ACCEPTED', 'FULFILLED']);
      expect(completed).toBe(true);
      expect(orderApi.getOrder).not.toHaveBeenCalled();
      expect(client.deactivate).toHaveBeenCalled();
    });
  });
});
