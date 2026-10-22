import { Component, inject, input, output, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { OrderRequest, OrderResponse } from '../../../core/trading.models';
import { OrderApiService } from '../data-access/order-api.service';

interface Leg {
  symbol: string;
  // null when we can't estimate it (see estimatedTotal)
  amount: number | null;
  estimate: boolean;
}

// "Review order" step: shows the order built from the trade form as "you pay / you get" and submits it on confirm
@Component({
  imports: [DatePipe, DecimalPipe, PercentPipe, MatCardModule, MatButtonModule],
  selector: 'app-preview-page',
  styleUrl: './preview-page.css',
  templateUrl: './preview-page.html',
})
export class PreviewPage {
  private orderApi = inject(OrderApiService);

  request = input.required<OrderRequest>();
  portfolioLabel = input<string>('');

  back = output<void>();
  confirmed = output<OrderResponse>();
  failed = output<string>();

  submitting = signal(false);

  previewTime = new Date();

  sideLabel = computed(() => {
    const side = this.request().side;
    return side === 'BUY' ? 'Buy' : side === 'SELL' ? 'Sell' : 'Deposit';
  });

  // the quote is fetched for the add instrument, so it is only the asset's price on a BUY
  estimatedTotal = computed(() => {
    const request = this.request();
    return request.side === 'BUY' ? request.quantity * request.quotedPrice : null;
  });

  // what leaves the portfolio; a deposit has nothing to pay
  pay = computed<Leg | null>(() => {
    const request = this.request();
    if (request.side === 'DEPOSIT') return null;
    if (request.side === 'SELL') {
      return { symbol: request.subtractInstrumentSymbol, amount: request.quantity, estimate: false };
    }
    return { symbol: request.subtractInstrumentSymbol, amount: this.estimatedTotal(), estimate: true };
  });

  // what arrives in the portfolio
  get = computed<Leg>(() => {
    const request = this.request();
    if (request.side === 'SELL') {
      return { symbol: request.addInstrumentSymbol, amount: null, estimate: true };
    }
    return { symbol: request.addInstrumentSymbol, amount: request.quantity, estimate: false };
  });

  // highest price a BUY will accept before it is rejected for moving past the tolerance
  maxPrice = computed(() => {
    const request = this.request();
    return request.side === 'BUY' ? request.quotedPrice * (1 + request.changeThreshold) : null;
  });

  confirm() {
    this.submitting.set(true);

    this.orderApi.submitOrder(this.request()).subscribe({
      next: (order) => {
        this.submitting.set(false);
        this.confirmed.emit(order);
      },
      error: (err) => {
        this.submitting.set(false);
        this.failed.emit(err?.error?.message ?? err?.message ?? 'Failed to place order');
      },
    });
  }
}
