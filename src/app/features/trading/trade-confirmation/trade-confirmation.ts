import { Component, computed, inject, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { of, scan, startWith, switchMap } from 'rxjs';

import { OrderResponse, OrderStatus, OrderStatusUpdate } from '../../../core/trading.models';
import { OrderUpdatesService } from '../data-access/order-updates.service';

type SeenUpdates = Partial<Record<OrderStatus, OrderStatusUpdate>>;

interface Step {
  label: string;
  state: 'done' | 'current' | 'upcoming' | 'failed';
  timestamp: string | null;
}

// Result of placing an order. With an `order` it follows the order live over the WebSocket
// (Submitted -> Accepted -> Filled, or Rejected with the reason); with only a `message` the submit itself failed.
@Component({
  imports: [DatePipe, DecimalPipe, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  selector: 'app-trade-confirmation',
  styleUrl: './trade-confirmation.css',
  templateUrl: './trade-confirmation.html',
})
export class TradeConfirmation {
  private readonly orderUpdates = inject(OrderUpdatesService);

  order = input<OrderResponse | null>(null);
  message = input<string | null>(null);

  done = output<void>();

  // every status update received so far, keyed by status
  private readonly updates = toSignal(
    toObservable(this.order).pipe(
      switchMap(order => !order ? of({} as SeenUpdates) : this.orderUpdates.watchOrder(order.orderId).pipe(
        scan((seen, update) => ({ ...seen, [update.status]: update }), {} as SeenUpdates),
        startWith({} as SeenUpdates),
      )),
    ),
    { initialValue: {} as SeenUpdates },
  );

  status = computed<OrderStatus | null>(() => {
    const order = this.order();
    if (!order) return null;
    const seen = this.updates();
    return (['FULFILLED', 'REJECTED', 'CANCELLED', 'ACCEPTED', 'PENDING'] as const)
      .find(status => seen[status]) ?? order.currentStatus;
  });

  outcome = computed<'processing' | 'filled' | 'rejected' | 'cancelled' | 'failed'>(() => {
    switch (this.status()) {
      case null: return 'failed';
      case 'FULFILLED': return 'filled';
      case 'REJECTED': return 'rejected';
      case 'CANCELLED': return 'cancelled';
      default: return 'processing';
    }
  });

  title = computed(() => ({
    processing: 'Processing order…',
    filled: 'Order filled',
    rejected: 'Order rejected',
    cancelled: 'Order cancelled',
    failed: 'Order failed',
  })[this.outcome()]);

  reason = computed(() => {
    if (this.outcome() === 'failed') {
      return this.message() ?? 'Something went wrong placing your order.';
    }
    const seen = this.updates();
    return seen.REJECTED?.message || seen.CANCELLED?.message || null;
  });

  steps = computed<Step[]>(() => {
    const order = this.order();
    if (!order) return [];
    const seen = this.updates();
    const status = this.status();
    const failed = status === 'REJECTED' || status === 'CANCELLED';
    const failedStep: Step = {
      label: status === 'CANCELLED' ? 'Cancelled' : 'Rejected',
      state: 'failed',
      timestamp: (seen.REJECTED ?? seen.CANCELLED)?.timestamp ?? null,
    };
    const accepted = !!seen.ACCEPTED || status === 'ACCEPTED' || status === 'FULFILLED';

    const steps: Step[] = [
      { label: 'Submitted', state: 'done', timestamp: seen.PENDING?.timestamp ?? order.createdDate },
    ];
    // rejected during validation: it never got accepted, so there is no fill step to show
    if (failed && !accepted) {
      return [...steps, failedStep];
    }
    steps.push({ label: 'Accepted', state: accepted ? 'done' : 'current', timestamp: seen.ACCEPTED?.timestamp ?? null });
    steps.push(failed ? failedStep : {
      label: 'Filled',
      state: status === 'FULFILLED' ? 'done' : accepted ? 'current' : 'upcoming',
      timestamp: seen.FULFILLED?.timestamp ?? null,
    });
    return steps;
  });
}
