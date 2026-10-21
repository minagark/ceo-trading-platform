import { Injectable } from '@angular/core';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InstrumentType } from './trading.models';
import { OrderStatusEvent, QuoteSubscriptionRequest, QuoteUpdateEvent } from './realtime.models';

interface TrackedSubscription {
  destination: string;
  onMessage: (message: IMessage) => void;
  onSubscribed?: () => void;
  stompSubscription: StompSubscription | null;
}

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private readonly client: Client;
  private readonly tracked = new Map<object, TrackedSubscription>();

  constructor() {
    this.client = new Client({
      brokerURL: environment.wsUrl,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => this.resubscribeAll(),
      onStompError: (frame: IFrame) =>
        console.error('Realtime STOMP error:', frame.headers['message'], frame.body),
      onWebSocketError: (event) => console.error('Realtime WebSocket error:', event),
      onWebSocketClose: (event) => console.warn('Realtime WebSocket closed:', event.reason),
    });

    this.client.activate();
  }

  subscribeToUserOrders(clientId: string): Observable<OrderStatusEvent> {
    return this.subscribe(`/topic/users/${clientId}/orders`);
  }

  subscribeToOrder(orderId: string): Observable<OrderStatusEvent> {
    return this.subscribe(`/topic/orders/${orderId}`);
  }

  subscribeToQuote(symbol: string, type: InstrumentType): Observable<QuoteUpdateEvent> {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const destination = `/topic/quotes/${normalizedSymbol}/${type}`;
    const request: QuoteSubscriptionRequest = { symbol: normalizedSymbol, type };

    return this.subscribe<QuoteUpdateEvent>(destination, () =>
      this.send('/app/quotes/subscribe', request),
    );
  }

  private subscribe<T>(destination: string, onSubscribed?: () => void): Observable<T> {
    return new Observable<T>((observer) => {
      const key = {};
      const entry: TrackedSubscription = {
        destination,
        onSubscribed,
        stompSubscription: null,
        onMessage: (message) => {
          try {
            observer.next(JSON.parse(message.body) as T);
          } catch {
            observer.error(new Error(`Invalid realtime payload for ${destination}`));
          }
        },
      };

      this.tracked.set(key, entry);
      if (this.client.connected) {
        this.activate(entry);
      }

      return () => {
        entry.stompSubscription?.unsubscribe();
        this.tracked.delete(key);
      };
    });
  }

  private resubscribeAll(): void {
    for (const entry of this.tracked.values()) {
      this.activate(entry);
    }
  }

  private activate(entry: TrackedSubscription): void {
    entry.stompSubscription = this.client.subscribe(entry.destination, entry.onMessage);
    entry.onSubscribed?.();
  }

  private send(destination: string, body: object): void {
    if (!this.client.connected) {
      return;
    }
    this.client.publish({ destination, body: JSON.stringify(body) });
  }
}
