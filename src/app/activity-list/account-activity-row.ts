import { Component, HostBinding, HostListener, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { Order } from './activity-list.service';

@Component({
  selector: 'app-account-activity-row',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe, MatChipsModule],
  templateUrl: './account-activity-row.html',
  styleUrl: './account-activity-row.css',
})
export class AccountActivityRow {
  order = input.required<Order>();
  selected = input(false);

  // Lets the parent track a click-and-drag multi-row selection — mousedown
  // starts/toggles it, pointerenter (while the button is held) extends it.
  rowPointerDown = output<void>();
  rowPointerEnter = output<void>();

  @HostBinding('class.account-activity-row--selected')
  get isSelected() {
    return this.selected();
  }

  @HostListener('pointerdown')
  onPointerDown() {
    this.rowPointerDown.emit();
  }

  @HostListener('pointerenter', ['$event'])
  onPointerEnter(event: PointerEvent) {
    if (event.buttons === 1) {
      this.rowPointerEnter.emit();
    }
  }

  statusClass(): string {
    return `account-activity__status account-activity__status--${this.order().status}`;
  }
}
