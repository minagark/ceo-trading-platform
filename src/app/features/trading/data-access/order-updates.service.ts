import { Injectable, effect, inject } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { EMPTY, Observable, catchError, distinctUntilChanged, exhaustMap, firstValueFrom, map, takeWhile, timer } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { OrderStatus, OrderStatusUpdate } from '../../../core/trading.models';
import { AuthService } from '../../auth/auth/auth.service';
import { OrderApiService } from './order-api.service';

const TERMINAL_STATUSES: readonly OrderStatus[] = ['FULFILLED', 'REJECTED', 'CANCELLED'];

// how often the REST fallback re-reads the order while the socket is unavailable
const POLL_INTERVAL_MS = 3000;

// statuses only move forward; used to drop a stale snapshot that arrives after a newer live update
const STATUS_RANK: Record<OrderStatus, number> = {
  PENDING: 0,
  ACCEPTED: 1,
  FULFILLED: 2,
  REJECTED: 2,
  CANCELLED: 2,
};

// must match WebSocketSessionExpiry.EXPIRED_MESSAGE on the backend
const TOKEN_EXPIRED_MESSAGE = 'Access token expired';

// refresh before connecting if the token would expire this soon
const TOKEN_REFRESH_MARGIN_MS = 30_000;

// reads the JWT exp claim; an unreadable token counts as expired so it gets refreshed
export function expiresWithin(token: string, marginMs: number, now = Date.now()): boolean {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const exp = JSON.parse(atob(payload)).exp;
    return typeof exp !== 'number' || exp * 1000 - now <= marginMs;
  } catch {
    return true;
  }
}

// apiBaseUrl is 'http://localhost:8081/api' in dev and '/api' in prod -> ws://<host>/ws
export function webSocketUrl(apiBaseUrl: string, pageUrl: string): string {
  const url = new URL(apiBaseUrl, pageUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = url.pathname.replace(/\/api\/?$/, '') + '/ws';
  return url.toString();
}

@Injectable({ providedIn: 'root' })
export class OrderUpdatesService {
  private readonly orderApi = inject(OrderApiService);
  private readonly authService = inject(AuthService);

  // one shared connection, opened while at least one order is being watched
  private readonly client = new Client({
    brokerURL: webSocketUrl(environment.apiBaseUrl, window.location.href),
    reconnectDelay: 5000,
    // the backend authenticates the STOMP CONNECT frame (browsers can't add headers to the handshake).
    // runs before every (re)connect, and refreshes a missing or nearly expired token first
    beforeConnect: async client => {
      const token = await this.freshAccessToken();
      client.connectHeaders = token ? { Authorization: `Bearer ${token}` } : {};
    },
    onConnect: () => this.watchers.forEach(watcher => watcher.onConnect()),
    onWebSocketError: () => this.failWatchers('Order updates connection failed'),
    onStompError: frame => {
      // the backend closes a session once its token expires; stompjs reconnects and beforeConnect
      // fetches a new token, so keep the watchers instead of dropping them to polling
      if (frame.headers['message'] === TOKEN_EXPIRED_MESSAGE) {
        return;
      }
      this.failWatchers(frame.headers['message'] ?? 'Order updates error');
    },
  });
  private readonly watchers = new Set<{ onConnect: () => void; onError: (error: Error) => void }>();

  constructor() {
    // the socket stays authorized until its token expires, so close it as soon as the user logs out
    effect(() => {
      if (!this.authService.accessToken() && this.client.active) {
        void this.client.deactivate();
      }
    });
  }

  private async freshAccessToken(): Promise<string | null> {
    const token = this.authService.accessToken();
    if (token && !expiresWithin(token, TOKEN_REFRESH_MARGIN_MS)) {
      return token;
    }
    try {
      return (await firstValueFrom(this.authService.refreshAccessToken())).accessToken;
    } catch {
      // no session: connect without a token, get refused, and fall back to polling
      return null;
    }
  }

  // live status updates for one order; completes once a terminal status arrives.
  // if the socket can't be used, falls back to polling the order over REST until it is terminal
  watchOrder(orderId: string): Observable<OrderStatusUpdate> {
    return this.streamOrder(orderId).pipe(
      catchError(() => this.pollOrder(orderId)),
      takeWhile(update => !update.terminal, true),
    );
  }

  // a failed read is skipped and retried on the next tick; only status changes are emitted
  private pollOrder(orderId: string): Observable<OrderStatusUpdate> {
    return timer(0, POLL_INTERVAL_MS).pipe(
      exhaustMap(() => this.orderApi.getOrder(orderId).pipe(catchError(() => EMPTY))),
      map(order => ({
        orderId: order.orderId,
        status: order.currentStatus,
        message: '',
        timestamp: order.resolvedDate || order.createdDate,
        terminal: TERMINAL_STATUSES.includes(order.currentStatus),
      })),
      distinctUntilChanged((previous, current) => previous.status === current.status),
    );
  }

  private failWatchers(message: string) {
    [...this.watchers].forEach(watcher => watcher.onError(new Error(message)));
  }

  private streamOrder(orderId: string): Observable<OrderStatusUpdate> {
    return new Observable<OrderStatusUpdate>(subscriber => {
      let latest: OrderStatusUpdate | null = null;
      let stompSubscriptions: StompSubscription[] = [];

      const onMessage = (message: IMessage) => {
        const update: OrderStatusUpdate = JSON.parse(message.body);
        if (latest && STATUS_RANK[update.status] <= STATUS_RANK[latest.status]) {
          return;
        }
        latest = update;
        subscriber.next(update);
      };

      // runs on every (re)connect: live topic first, then ask for the current status
      // so anything that happened before we subscribed isn't missed
      const subscribe = () => {
        stompSubscriptions.forEach(subscription => subscription.unsubscribe());
        stompSubscriptions = [
          this.client.subscribe(`/topic/orders/${orderId}`, onMessage),
          this.client.subscribe(`/app/orders/${orderId}`, onMessage),
        ];
      };

      const watcher = { onConnect: subscribe, onError: (error: Error) => subscriber.error(error) };
      this.watchers.add(watcher);
      if (this.client.connected) {
        subscribe();
      } else if (!this.client.active) {
        this.client.activate();
      }

      return () => {
        this.watchers.delete(watcher);
        if (this.client.connected) {
          stompSubscriptions.forEach(subscription => subscription.unsubscribe());
        }
        if (this.watchers.size === 0) {
          void this.client.deactivate();
        }
      };
    });
  }
}
