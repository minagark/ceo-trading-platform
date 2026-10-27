import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Client, IFrame, IMessage, messageCallbackType } from '@stomp/stompjs';
import { Observable, of, throwError } from 'rxjs';
import { OrderUpdatesService, expiresWithin, webSocketUrl } from './order-updates.service';
import { OrderApiService } from './order-api.service';
import { AuthService } from '../../auth/auth/auth.service';
import { OrderResponse, OrderStatusUpdate } from '../../../core/trading.models';

// header.payload.signature with a base64url payload, like the backend's access tokens
function jwt(payload: object): string {
  const base64url = (value: object) =>
    btoa(JSON.stringify(value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${base64url({ alg: 'HS256', typ: 'JWT' })}.${base64url(payload)}.signature`;
}

// a token whose exp is `secondsFromNow` after the real clock
function jwtExpiringIn(secondsFromNow: number, extra: object = {}): string {
  return jwt({ sub: 'user-1', exp: Math.floor(Date.now() / 1000) + secondsFromNow, ...extra });
}

describe('expiresWithin', () => {
  const now = Date.parse('2026-10-26T12:00:00Z');
  const expIn = (seconds: number) => jwt({ sub: 'user-1', exp: now / 1000 + seconds });

  it('is false when exp is further away than the margin', () => {
    expect(expiresWithin(expIn(60), 30_000, now)).toBe(false);
    expect(expiresWithin(expIn(31), 30_000, now)).toBe(false);
  });

  it('is true when exp falls within the margin, including exactly at it', () => {
    expect(expiresWithin(expIn(29), 30_000, now)).toBe(true);
    expect(expiresWithin(expIn(30), 30_000, now)).toBe(true);
  });

  it('is true for an already expired token', () => {
    expect(expiresWithin(expIn(-1), 30_000, now)).toBe(true);
    expect(expiresWithin(expIn(-3600), 0, now)).toBe(true);
  });

  it('decodes base64url payloads (- and _ characters)', () => {
    // these characters make standard base64 emit + and /, which base64url swaps for - and _
    const token = jwt({ sub: '>>>???~~~', exp: now / 1000 + 600 });
    expect(token.split('.')[1]).toMatch(/[-_]/);
    expect(expiresWithin(token, 30_000, now)).toBe(false);
  });

  it('is true for garbage, a missing payload, bad JSON or a missing / non-numeric exp', () => {
    expect(expiresWithin('test-token', 30_000, now)).toBe(true);
    expect(expiresWithin('', 30_000, now)).toBe(true);
    expect(expiresWithin('a.%%%.c', 30_000, now)).toBe(true);
    expect(expiresWithin(`x.${btoa('not json')}.y`, 30_000, now)).toBe(true);
    expect(expiresWithin(jwt({ sub: 'user-1' }), 30_000, now)).toBe(true);
    expect(expiresWithin(jwt({ sub: 'user-1', exp: String(now / 1000 + 600) }), 30_000, now)).toBe(true);
  });

  it('defaults now to the current time', () => {
    expect(expiresWithin(jwtExpiringIn(3600), 30_000)).toBe(false);
    expect(expiresWithin(jwtExpiringIn(5), 30_000)).toBe(true);
  });
});

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
  let accessToken: ReturnType<typeof signal<string | null>>;

  const order = {
    orderId: 'order-1',
    currentStatus: 'FULFILLED',
    createdDate: '2026-10-21T10:00:00Z',
    resolvedDate: '2026-10-21T10:00:09Z',
  } as OrderResponse;

  beforeEach(() => {
    orderApi = { getOrder: vi.fn(() => of(order)) };
    accessToken = signal<string | null>(jwtExpiringIn(3600));
    TestBed.configureTestingModule({
      providers: [
        { provide: OrderApiService, useValue: orderApi },
        { provide: AuthService, useValue: { accessToken, refreshAccessToken: vi.fn() } },
      ],
    });
    service = TestBed.inject(OrderUpdatesService);
    client = service['client'];
    vi.spyOn(client, 'deactivate').mockResolvedValue();
  });

  describe('REST fallback', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('falls back to a REST read of the order when the socket fails to connect', () => {
      vi.spyOn(client, 'activate').mockImplementation(() => client.onWebSocketError(new Event('error')));
      const received: OrderStatusUpdate[] = [];
      let completed = false;

      service.watchOrder('order-1').subscribe({ next: u => received.push(u), complete: () => (completed = true) });
      vi.advanceTimersByTime(0);

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

      const subscription = service.watchOrder('order-1').subscribe(u => received.push(u));
      vi.advanceTimersByTime(0);

      expect(orderApi.getOrder).toHaveBeenCalledWith('order-1');
      expect(received).toEqual([expect.objectContaining({
        status: 'ACCEPTED',
        timestamp: '2026-10-21T10:00:00Z',
        terminal: false,
      })]);
      subscription.unsubscribe();
    });

    it('does NOT fail the watcher on an "Access token expired" error frame (stompjs reconnects instead)', () => {
      vi.spyOn(client, 'activate').mockImplementation(() =>
        client.onStompError({ headers: { message: 'Access token expired' } } as unknown as IFrame));
      let errored = false;
      let completed = false;

      const subscription = service.watchOrder('order-1').subscribe({
        error: () => (errored = true),
        complete: () => (completed = true),
      });
      vi.advanceTimersByTime(10_000);

      expect(errored).toBe(false);
      expect(completed).toBe(false);
      expect(subscription.closed).toBe(false);
      expect(orderApi.getOrder).not.toHaveBeenCalled();
      expect(service['watchers'].size).toBe(1);
      subscription.unsubscribe();
    });

    it('still falls back to polling for any other error message, and for an error frame with no message', () => {
      for (const headers of [{ message: 'Invalid access token' }, {}]) {
        orderApi.getOrder.mockClear();
        vi.spyOn(client, 'activate').mockImplementation(() =>
          client.onStompError({ headers } as unknown as IFrame));
        const received: string[] = [];

        const subscription = service.watchOrder('order-1').subscribe(u => received.push(u.status));
        vi.advanceTimersByTime(0);

        expect(orderApi.getOrder).toHaveBeenCalledWith('order-1');
        expect(received).toEqual(['FULFILLED']);
        subscription.unsubscribe();
      }
    });

    it('keeps polling until the order is terminal, skipping failed reads and repeated statuses', () => {
      orderApi.getOrder
        .mockReturnValueOnce(of({ ...order, currentStatus: 'ACCEPTED', resolvedDate: '' }))
        .mockReturnValueOnce(throwError(() => new Error('network')))
        .mockReturnValueOnce(of({ ...order, currentStatus: 'ACCEPTED', resolvedDate: '' }))
        .mockReturnValueOnce(of(order));
      vi.spyOn(client, 'activate').mockImplementation(() => client.onWebSocketError(new Event('error')));
      const received: string[] = [];
      let completed = false;

      service.watchOrder('order-1').subscribe({ next: u => received.push(u.status), complete: () => (completed = true) });
      vi.advanceTimersByTime(0);
      expect(received).toEqual(['ACCEPTED']);
      expect(completed).toBe(false);

      vi.advanceTimersByTime(9000);

      expect(orderApi.getOrder).toHaveBeenCalledTimes(4);
      expect(received).toEqual(['ACCEPTED', 'FULFILLED']);
      expect(completed).toBe(true);

      vi.advanceTimersByTime(9000);
      expect(orderApi.getOrder).toHaveBeenCalledTimes(4);
    });
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

  // the socket stays authorized until its token expires, so logout must close it right away
  describe('logout', () => {
    const setActive = (active: boolean) =>
      Object.defineProperty(client, 'active', { get: () => active, configurable: true });

    it('deactivates the client when the access token becomes null while it is active', () => {
      setActive(true);
      TestBed.tick();
      expect(client.deactivate).not.toHaveBeenCalled();

      accessToken.set(null);
      TestBed.tick();

      expect(client.deactivate).toHaveBeenCalledTimes(1);
    });

    it('does not deactivate an inactive client on logout', () => {
      setActive(false);
      accessToken.set(null);
      TestBed.tick();

      expect(client.deactivate).not.toHaveBeenCalled();
    });

    it('does not deactivate an active client when the token is merely refreshed', () => {
      setActive(true);
      TestBed.tick();
      accessToken.set(jwtExpiringIn(7200));
      TestBed.tick();

      expect(client.deactivate).not.toHaveBeenCalled();
    });
  });
});

// the backend authenticates the STOMP CONNECT frame, so a fresh token must be in connectHeaders on every (re)connect.
// was: a plain 'test-token' stub; tokens are now JWT-decoded (exp) and refreshed when close to expiry
describe('OrderUpdatesService STOMP connect headers', () => {
  let client: Client;
  let accessToken: ReturnType<typeof signal<string | null>>;
  let refreshAccessToken: ReturnType<typeof vi.fn<() => Observable<{ accessToken: string }>>>;
  const validToken = jwtExpiringIn(3600);
  const refreshedToken = jwtExpiringIn(900, { refreshed: true });

  beforeEach(() => {
    accessToken = signal<string | null>(validToken);
    refreshAccessToken = vi.fn(() => of({ accessToken: refreshedToken }));
    TestBed.configureTestingModule({
      providers: [
        { provide: OrderApiService, useValue: { getOrder: vi.fn() } },
        { provide: AuthService, useValue: { accessToken, refreshAccessToken } },
      ],
    });
    client = TestBed.inject(OrderUpdatesService)['client'];
  });

  it('sends a valid, non-expiring access token as a Bearer header without refreshing', async () => {
    await client.beforeConnect(client);

    expect(client.connectHeaders).toEqual({ Authorization: `Bearer ${validToken}` });
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });

  it('refreshes a token that expires within 30s and sends the refreshed one', async () => {
    accessToken.set(jwtExpiringIn(10));

    await client.beforeConnect(client);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(client.connectHeaders).toEqual({ Authorization: `Bearer ${refreshedToken}` });
  });

  it('refreshes an already expired token', async () => {
    accessToken.set(jwtExpiringIn(-60));

    await client.beforeConnect(client);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(client.connectHeaders).toEqual({ Authorization: `Bearer ${refreshedToken}` });
  });

  it('refreshes an unreadable (non-JWT) token', async () => {
    accessToken.set('test-token');

    await client.beforeConnect(client);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(client.connectHeaders).toEqual({ Authorization: `Bearer ${refreshedToken}` });
  });

  it('refreshes when there is no access token at all (e.g. after a page reload)', async () => {
    accessToken.set(null);

    await client.beforeConnect(client);

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(client.connectHeaders).toEqual({ Authorization: `Bearer ${refreshedToken}` });
  });

  it('connects with no headers when the refresh fails', async () => {
    accessToken.set(null);
    refreshAccessToken.mockReturnValue(throwError(() => new Error('401')));

    await client.beforeConnect(client);

    expect(client.connectHeaders).toEqual({});
  });

  it('clears a stale Authorization header when a later refresh fails (logout)', async () => {
    await client.beforeConnect(client);
    expect(client.connectHeaders).toEqual({ Authorization: `Bearer ${validToken}` });

    accessToken.set(null);
    refreshAccessToken.mockReturnValue(throwError(() => new Error('401')));
    await client.beforeConnect(client);

    expect(client.connectHeaders).toEqual({});
  });

  it('re-reads the token on each connect, so a newer token replaces the old one', async () => {
    await client.beforeConnect(client);
    const newer = jwtExpiringIn(5000, { newer: true });
    accessToken.set(newer);

    await client.beforeConnect(client);

    expect(client.connectHeaders).toEqual({ Authorization: `Bearer ${newer}` });
    expect(refreshAccessToken).not.toHaveBeenCalled();
  });
});
