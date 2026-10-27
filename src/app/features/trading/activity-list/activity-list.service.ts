import { Injectable, inject, signal } from '@angular/core';
import { OrderResponse } from '../../../core/trading.models';
import { OrderApiService } from '../data-access/order-api.service';


@Injectable({ providedIn: 'root' })
export class ActivityListService {
  private readonly orderApi = inject(OrderApiService);

  readonly orders = signal<OrderResponse[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  loadForClient(clientId: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.orderApi.getClientOrders(clientId).subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Unable to load account activity.');
        this.loading.set(false);
      },
    });
  }
}
