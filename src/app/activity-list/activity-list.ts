import { Component, HostListener, computed, inject, signal, input } from '@angular/core';
import { AccountActivityRow } from './account-activity-row';
import { ActivityListService, Order } from './activity-list.service';
import { SlicePipe } from '@angular/common';


@Component({
  selector: 'app-activity-list',
  imports: [AccountActivityRow, SlicePipe],
  templateUrl: './activity-list.html',
  styleUrl: './activity-list.css',
})
export class ActivityList {
  private activityListService = inject(ActivityListService);
  showLess = input<boolean>(false);

  rows = computed<Order[]>(() =>
    [...this.activityListService.orders()].sort(
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
