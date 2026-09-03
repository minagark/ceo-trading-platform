import { Component, computed, inject } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { AccountActivityService, Order } from './account-activity.service';

@Component({
  selector: 'app-account-activity',
  imports: [MatTableModule, MatCardModule, MatChipsModule, CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe],
  templateUrl: './account-activity.html',
  styleUrl: './account-activity.css',
})
export class AccountActivity {
  private accountActivityService = inject(AccountActivityService);

  displayedColumns = ['time', 'action', 'instrumentType', 'amount', 'quotedPrice', 'actualPrice', 'status'];

  rows = computed<Order[]>(() =>
    [...this.accountActivityService.orders()].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    ),
  );

  statusClass(status: Order['status']): string {
    return `account-activity__status account-activity__status--${status}`;
  }
}
