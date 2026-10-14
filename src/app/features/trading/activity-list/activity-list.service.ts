import { Injectable, inject, signal } from '@angular/core';
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
      },
      error: () => {
        this.error.set('Unable to load account activity.');
        this.loading.set(false);
      },
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
