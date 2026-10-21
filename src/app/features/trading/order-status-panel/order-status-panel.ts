import { Component, computed, inject, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { scan, startWith, switchMap } from 'rxjs';
import { OrderResponse, OrderStatus, OrderStatusUpdate } from '../../../core/trading.models';
import { OrderUpdatesService } from '../data-access/order-updates.service';

interface Step {
  label: string;
  state: 'done' | 'current' | 'upcoming' | 'failed';
  timestamp: string | null;
}

// shows an order's progress live after it is submitted: Submitted -> Accepted -> Filled (or Rejected)
@Component({
  imports: [DatePipe, MatCardModule, MatButtonModule, MatProgressSpinnerModule],
  selector: 'app-order-status-panel',
  styleUrl: './order-status-panel.css',
  templateUrl: './order-status-panel.html',
})
export class OrderStatusPanel {
  private readonly orderUpdates = inject(OrderUpdatesService);

  order = input.required<OrderResponse>();
  done = output<void>();

  // every update received so far, keyed by status
  private readonly updates = toSignal(
    toObservable(this.order).pipe(
      switchMap(order => this.orderUpdates.watchOrder(order.orderId).pipe(
        scan((seen, update) => ({ ...seen, [update.status]: update }), {} as Partial<Record<OrderStatus, OrderStatusUpdate>>),
        startWith({} as Partial<Record<OrderStatus, OrderStatusUpdate>>),
      )),
    ),
    { initialValue: {} as Partial<Record<OrderStatus, OrderStatusUpdate>> },
  );

  status = computed<OrderStatus>(() => {
    const seen = this.updates();
    return (['FULFILLED', 'REJECTED', 'CANCELLED', 'ACCEPTED', 'PENDING'] as const)
      .find(status => seen[status]) ?? this.order().currentStatus;
  });

  finished = computed(() => ['FULFILLED', 'REJECTED', 'CANCELLED'].includes(this.status()));

  failureMessage = computed(() => {
    const seen = this.updates();
    return seen.REJECTED?.message || seen.CANCELLED?.message || null;
  });

  steps = computed<Step[]>(() => {
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
      { label: 'Submitted', state: 'done', timestamp: seen.PENDING?.timestamp ?? this.order().createdDate },
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
