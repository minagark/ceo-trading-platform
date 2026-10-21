import { Injectable, inject } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable, catchError, map, takeWhile } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { OrderStatus, OrderStatusUpdate } from '../../../core/trading.models';
import { OrderApiService } from './order-api.service';

const TERMINAL_STATUSES: readonly OrderStatus[] = ['FULFILLED', 'REJECTED', 'CANCELLED'];

// statuses only move forward; used to drop a stale snapshot that arrives after a newer live update
const STATUS_RANK: Record<OrderStatus, number> = {
  PENDING: 0,
  ACCEPTED: 1,
  FULFILLED: 2,
  REJECTED: 2,
  CANCELLED: 2,
};

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

  // one shared connection, opened while at least one order is being watched
  private readonly client = new Client({
    brokerURL: webSocketUrl(environment.apiBaseUrl, window.location.href),
    reconnectDelay: 5000,
    onConnect: () => this.watchers.forEach(watcher => watcher.onConnect()),
    onWebSocketError: () => this.failWatchers('Order updates connection failed'),
    onStompError: frame => this.failWatchers(frame.headers['message'] ?? 'Order updates error'),
  });
  private readonly watchers = new Set<{ onConnect: () => void; onError: (error: Error) => void }>();

  // live status updates for one order; completes once a terminal status arrives.
  // if the socket can't be used, falls back to a single REST read of the order
  watchOrder(orderId: string): Observable<OrderStatusUpdate> {
    return this.streamOrder(orderId).pipe(
      takeWhile(update => !update.terminal, true),
      catchError(() => this.orderApi.getOrder(orderId).pipe(
        map(order => ({
          orderId: order.orderId,
          status: order.currentStatus,
          message: '',
          timestamp: order.resolvedDate || order.createdDate,
          terminal: TERMINAL_STATUSES.includes(order.currentStatus),
        })),
      )),
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
