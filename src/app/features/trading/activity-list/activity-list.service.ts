import { Injectable, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { OrderStatusEvent } from '../../../core/realtime.models';
import { RealtimeService } from '../../../core/realtime.service';
import { OrderResponse } from '../../../core/trading.models';
import { OrderApiService } from '../data-access/order-api.service';

export type InstrumentType = 'equity' | 'foreign exchange' | 'crypto';
export type OrderAction = 'buy' | 'sell';
export type OrderStatus = 'fulfilled' | 'pending' | 'cancelled' | 'rejected';

export interface Order {
  orderId: string;
  instrumentId: string;
  holdingId: string;
  instrumentType: InstrumentType;
  action: OrderAction;
  quotedPrice: number;
  actualPrice: number | null;
  amount: number;
  time: string;
  status: OrderStatus;
}

@Injectable({ providedIn: 'root' })
export class ActivityListService {
  private readonly orderApi = inject(OrderApiService);
  private readonly realtimeService = inject(RealtimeService);

  private orderStatusSubscription: Subscription | null = null;
  private activeClientId: string | null = null;

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadForClient(clientId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.orderApi.getClientOrders(clientId).subscribe({
      next: (orders) => {
        this.orders.set(orders.map((order) => this.toActivityOrder(order)));
        this.loading.set(false);
        this.subscribeToLiveOrderStatus(clientId);
      },
      error: () => {
        this.error.set('Unable to load account activity.');
        this.loading.set(false);
      },
    });
  }

  private subscribeToLiveOrderStatus(clientId: string): void {
    if (this.activeClientId === clientId && this.orderStatusSubscription) {
      return;
    }

    this.orderStatusSubscription?.unsubscribe();
    this.activeClientId = clientId;

    this.orderStatusSubscription = this.realtimeService
      .subscribeToUserOrders(clientId)
      .subscribe((event) => this.applyOrderStatusEvent(event));
  }

  private applyOrderStatusEvent(event: OrderStatusEvent): void {
    this.orders.update((existingOrders) => {
      const index = existingOrders.findIndex((o) => o.orderId === event.orderId);
      if (index === -1) {
        this.orderApi.getOrder(event.orderId).subscribe({
          next: (order) => {
            this.orders.update((current) => {
              if (current.some((existing) => existing.orderId === order.orderId)) {
                return current;
              }
              return [this.toActivityOrder(order), ...current];
            });
          },
        });
        return existingOrders;
      }

      const next = [...existingOrders];
      next[index] = {
        ...next[index],
        status: event.status.toLowerCase() as OrderStatus,
        time: event.statusDate,
      };
      return next;
    });
  }

  private toActivityOrder(order: OrderResponse): Order {
    return {
      orderId: order.orderId,
      instrumentId: order.addInstrumentSymbol,
      holdingId: '',
      instrumentType: order.addInstrumentType.toLowerCase() as InstrumentType,
      action: order.side.toLowerCase() as OrderAction,
      quotedPrice: order.quotedPrice,
      actualPrice: null,
      amount: order.quantity,
      time: order.createdDate,
      status: order.currentStatus.toLowerCase() as OrderStatus,
    };
  }
}
