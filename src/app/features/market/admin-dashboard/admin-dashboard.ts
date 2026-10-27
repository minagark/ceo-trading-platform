import { DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiClient } from '../../../core/api-client.service';
import { AuthService } from '../../auth/auth/auth.service';
import { AdminOrderResponse, ORDER_STATUSES, OrderStatus } from '../../../core/trading.models';

interface OrdersPage {
  content: AdminOrderResponse[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

interface OrderHistoryEntry {
  status?: OrderStatus | string;
  timestamp?: string;
  message?: string;
  createdDate?: string;
}

@Component({
  imports: [DecimalPipe, FormsModule, TitleCasePipe],
  selector: 'app-admin-dashboard',
  styleUrl: './admin-dashboard.css',
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard {
  private readonly api = inject(ApiClient);
  readonly authService = inject(AuthService);

  readonly statuses = ORDER_STATUSES;
  readonly orders = signal<AdminOrderResponse[]>([]);
  readonly selectedOrder = signal<AdminOrderResponse | null>(null);
  readonly history = signal<OrderHistoryEntry[]>([]);
  readonly loading = signal(true);
  readonly historyLoading = signal(false);
  readonly error = signal<string | null>(null);
  readonly historyError = signal<string | null>(null);
  readonly totalElements = signal(0);
  readonly totalPages = signal(0);
  readonly page = signal(0);
  readonly pageSize = 20;

  orderId = '';
  clientId = '';
  status: OrderStatus | '' = '';
  ticker = '';
  from = '';
  to = '';

  constructor() {
    this.search();
  }

  search(): void {
    const requestedOrderId = this.orderId.trim();
    if (requestedOrderId) {
      this.findOrder(requestedOrderId);
      return;
    }

    this.page.set(0);
    this.loadOrders();
  }

  nextPage(): void {
    if (this.page() + 1 < this.totalPages()) {
      this.page.update(value => value + 1);
      this.loadOrders();
    }
  }

  previousPage(): void {
    if (this.page() > 0) {
      this.page.update(value => value - 1);
      this.loadOrders();
    }
  }

  clearFilters(): void {
    this.orderId = '';
    this.clientId = '';
    this.status = '';
    this.ticker = '';
    this.from = '';
    this.to = '';
    this.search();
  }

  inspect(order: AdminOrderResponse): void {
    this.selectedOrder.set(order);
    this.history.set([]);
    this.historyError.set(null);
    this.historyLoading.set(true);
    this.api.get<OrderHistoryEntry[]>(`admin/orders/${encodeURIComponent(order.orderId)}/history`).subscribe({
      next: entries => {
        this.history.set(entries);
        this.historyLoading.set(false);
      },
      error: () => {
        this.historyError.set('The order was found, but its audit history could not be loaded.');
        this.historyLoading.set(false);
      },
    });
  }

  closeDetails(): void {
    this.selectedOrder.set(null);
    this.history.set([]);
  }

  statusClass(status: string | null | undefined): string {
    return status ? status.toLowerCase() : 'unknown';
  }

  statusLabel(status: string | null | undefined): string {
    return status ? status : 'N/A';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return 'N/A';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? 'Could not be found'
      : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(date);
  }

  formatText(value: string | null | undefined, fallback = 'N/A'): string {
    return value?.trim() ? value : fallback;
  }

  formatNumber(value: number | null | undefined, maximumFractionDigits = 6): string {
    return value === null || value === undefined
      ? 'N/A'
      : value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits });
  }

  trackOrder(_: number, order: AdminOrderResponse): string {
    return order.orderId;
  }

  instrumentLabel(order: AdminOrderResponse): string {
    if (order.side === 'DEPOSIT') return order.addInstrumentSymbol || order.subtractInstrumentSymbol || 'N/A';
    if (order.side === 'SELL') return order.subtractInstrumentSymbol || order.addInstrumentSymbol || 'N/A';
    return order.addInstrumentSymbol || order.subtractInstrumentSymbol || 'N/A';
  }

  executionLabel(order: AdminOrderResponse): string {
    if (order.side === 'DEPOSIT') return 'N/A';
    return order.side === 'BUY'
      ? this.formatSettlementPrice(order.addPurchasePrice)
      : this.formatSettlementPrice(order.subtractPurchasePrice);
  }

  formatPrice(value: number | null, applies = true): string {
    if (!applies) return 'N/A';
    return value === null || value === undefined ? 'Unsettled' : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  }

  formatAmount(value: number | null, applies = true): string {
    if (!applies) return 'N/A';
    return value === null || value === undefined ? 'Unsettled' : value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
  }

  formatSettlementPrice(value: number | null): string {
    return value === null || value === undefined ? 'Unsettled' : this.formatPrice(value);
  }

  cashDifferenceApplies(order: AdminOrderResponse): boolean {
    return order.side === 'DEPOSIT' || order.side === 'BUY' || order.side === 'SELL';
  }

  instrumentTypeLabel(order: AdminOrderResponse): string {
    if (order.side === 'DEPOSIT') return order.addInstrumentType || order.subtractInstrumentType || 'N/A';
    return order.side === 'SELL'
      ? order.subtractInstrumentType || order.addInstrumentType || 'N/A'
      : order.addInstrumentType || order.subtractInstrumentType || 'N/A';
  }

  private loadOrders(): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedOrder.set(null);
    this.api.get<OrdersPage>('admin/orders', {
      userId: this.clientId.trim() || undefined,
      status: this.status || undefined,
      ticker: this.ticker.trim().toUpperCase() || undefined,
      from: this.from || undefined,
      to: this.to || undefined,
      page: this.page(),
      size: this.pageSize,
    }).subscribe({
      next: response => {
        this.orders.set(response.content ?? []);
        this.totalElements.set(response.totalElements ?? 0);
        this.totalPages.set(response.totalPages ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.error.set('Order records could not be loaded. Confirm that the backend is running and that this account has admin access.');
        this.loading.set(false);
      },
    });
  }

  private findOrder(orderId: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.selectedOrder.set(null);
    this.api.get<AdminOrderResponse>(`admin/orders/${encodeURIComponent(orderId)}`).subscribe({
      next: order => {
        this.orders.set([order]);
        this.totalElements.set(1);
        this.totalPages.set(1);
        this.page.set(0);
        this.loading.set(false);
      },
      error: () => {
        this.orders.set([]);
        this.totalElements.set(0);
        this.totalPages.set(0);
        this.error.set('No order was found for that order ID.');
        this.loading.set(false);
      },
    });
  }
}