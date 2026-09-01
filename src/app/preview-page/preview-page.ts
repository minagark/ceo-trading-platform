import { Component, inject, input, output, computed, signal } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { Account } from '../accounts-list/accounts-list';
import { Trade, TradeRequest } from '../trade-screen/trade-screen';
import { PreviewService } from './preview-page.service';

@Component({
  imports: [CurrencyPipe, DatePipe, DecimalPipe, MatCardModule, MatButtonModule],
  selector: 'app-preview-page',
  styleUrl: './preview-page.css',
  templateUrl: './preview-page.html',
})
export class PreviewPage {
  private previewService = inject(PreviewService);

  draft = input.required<TradeRequest>();
  account = input.required<Account>();

  back = output<void>();
  confirmed = output<Trade>();
  failed = output<string>();

  submitting = signal(false);

  previewTime = new Date();

  private unitPrice = computed(() => {
    const draft = this.draft();
    return draft.type === 'buy' ? draft.stock.ask : draft.stock.bid;
  });

  shares = computed(() => {
    const draft = this.draft();
    if (draft.amountType === 'shares') return draft.amount;
    const price = this.unitPrice();
    return price > 0 ? draft.amount / price : 0;
  });

  estimatedTotal = computed(() => {
    const draft = this.draft();
    return draft.amountType === 'cash' ? draft.amount : draft.amount * this.unitPrice();
  });

  confirm() {
    this.submitting.set(true);

    this.previewService.placeTrade(this.draft()).subscribe({
      next: (trade) => {
        this.submitting.set(false);
        this.confirmed.emit(trade);
      },
      error: (err) => {
        this.submitting.set(false);
        this.failed.emit(err.message ?? 'Failed to place trade');
      },
    });
  }
}