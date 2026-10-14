import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/api-client.service';
import { OrderRequest, OrderResponse } from '../../../core/trading.models';

@Injectable({ providedIn: 'root' })
export class OrderApiService {
  private readonly api = inject(ApiClient);

  getAllOrders(): Observable<OrderResponse[]> {
    return this.api.getRoot<OrderResponse[]>('order');
  }

  getClientOrders(clientId: string): Observable<OrderResponse[]> {
    return this.api.getRoot<OrderResponse[]>(
      `order/by_client/${encodeURIComponent(clientId)}`,
    );
  }

  getOrder(orderId: string): Observable<OrderResponse> {
    return this.api.getRoot<OrderResponse>(
      `order/${encodeURIComponent(orderId)}`,
    );
  }

  submitOrder(request: OrderRequest): Observable<OrderResponse> {
    return this.api.postRoot<OrderResponse, OrderRequest>('order/new', request);
  }
}
