import { Component, inject, input, output, computed, signal } from '@angular/core';
import { DatePipe, DecimalPipe, PercentPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { OrderRequest, OrderResponse } from '../../../core/trading.models';
import { OrderApiService } from '../data-access/order-api.service';

// "Review order" step: shows the order built from the trade form and submits it on confirm
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

  // a SELL gives up the subtract instrument; everything else gains the add instrument
  assetSymbol = computed(() => {
    const request = this.request();
    return request.side === 'SELL' ? request.subtractInstrumentSymbol : request.addInstrumentSymbol;
  });

  counterSymbol = computed(() => {
    const request = this.request();
    return request.side === 'SELL' ? request.addInstrumentSymbol : request.subtractInstrumentSymbol;
  });

  // the quote is fetched for the add instrument, so it is only the asset's price on a BUY
  estimatedTotal = computed(() => {
    const request = this.request();
    return request.side === 'BUY' ? request.quantity * request.quotedPrice : null;
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
