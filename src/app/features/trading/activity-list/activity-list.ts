import { Component, HostListener, computed, effect, inject, signal, input } from '@angular/core';
import { AccountActivityRow } from './account-activity-row';
import { ActivityListService } from './activity-list.service';
import { SlicePipe } from '@angular/common';
import { AuthService } from '../../auth/auth/auth.service';
import { OrderResponse } from '../../../core/trading.models';
import { LoadingIndicator } from '../../../shared/loading-indicator/loading-indicator';


@Component({
  selector: 'app-activity-list',
  imports: [AccountActivityRow, SlicePipe, LoadingIndicator],
  templateUrl: './activity-list.html',
  styleUrl: './activity-list.css',
})
export class ActivityList {
  private activityListService = inject(ActivityListService);
  private authService = inject(AuthService);
  readonly loading = this.activityListService.loading;
  readonly error = this.activityListService.error;
  showLess = input<boolean>(false);
  clientId = computed(() => this.authService.currentUserId());

  constructor() {
    effect(() => {
      const clientId = this.clientId();
      if (clientId) {
        this.activityListService.loadForClient(clientId);
      }
    });
  }

  rows = computed<OrderResponse[]>(() =>
    [...this.activityListService.orders()].sort(
      (a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
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
