import { Injectable } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { InstrumentType } from './trading.models';
import { OrderStatusEvent, QuoteSubscriptionRequest, QuoteUpdateEvent } from './realtime.models';

@Injectable({ providedIn: 'root' })
export class RealtimeService {
  private client: Client | null = null;

  private getClient(): Client {
    if (this.client) {
      return this.client;
    }

    this.client = new Client({
      brokerURL: environment.wsUrl,
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
    });

    this.client.activate();
    return this.client;
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

    this.publish('/app/quotes/subscribe', {
      symbol: normalizedSymbol,
      type,
    } satisfies QuoteSubscriptionRequest);

    return this.subscribe(destination);
  }

  private subscribe<T>(destination: string): Observable<T> {
    return new Observable<T>((observer) => {
      const client = this.getClient();
      let subscription: StompSubscription | null = null;

      const connectAndSubscribe = () => {
        subscription = client.subscribe(destination, (message: IMessage) => {
          try {
            observer.next(JSON.parse(message.body) as T);
          } catch {
            observer.error(new Error(`Invalid realtime payload for ${destination}`));
          }
        });
      };

      this.whenConnected(connectAndSubscribe);

      return () => {
        subscription?.unsubscribe();
      };
    });
  }

  private publish(destination: string, body: object): void {
    const client = this.getClient();

    const doPublish = () => {
      client.publish({ destination, body: JSON.stringify(body) });
    };

    this.whenConnected(doPublish);
  }

  private whenConnected(callback: () => void): void {
    const client = this.getClient();
    if (client.connected) {
      callback();
      return;
    }

    const timer = setInterval(() => {
      if (client.connected) {
        clearInterval(timer);
        callback();
      }
    }, 100);
  }
}
