import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { AccountActivityRow } from './account-activity-row';
import { AccountActivityService, Order } from './account-activity.service';

@Component({
  selector: 'app-account-activity',
  imports: [MatCardModule, AccountActivityRow],
  templateUrl: './account-activity.html',
  styleUrl: './account-activity.css',
})
export class AccountActivity {
  private accountActivityService = inject(AccountActivityService);

  rows = computed<Order[]>(() =>
    [...this.accountActivityService.orders()].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    ),
  );

  private selectedIds = signal<ReadonlySet<string>>(new Set());

  // Whether the in-progress drag is selecting or deselecting rows — set by
  // whichever row started the drag, then applied to every row dragged over.
  private dragSelecting: boolean | null = null;

  isSelected(orderId: string): boolean {
    return this.selectedIds().has(orderId);
  }

  onRowPointerDown(orderId: string) {
    const nowSelected = !this.selectedIds().has(orderId);
    this.dragSelecting = nowSelected;
    this.setSelected(orderId, nowSelected);
  }

  onRowPointerEnter(orderId: string) {
    if (this.dragSelecting !== null) {
      this.setSelected(orderId, this.dragSelecting);
    }
  }

  @HostListener('document:pointerup')
  onPointerUp() {
    this.dragSelecting = null;
  }

  private setSelected(orderId: string, selected: boolean) {
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (selected) {
        next.add(orderId);
      } else {
        next.delete(orderId);
      }
      return next;
    });
  }
}
