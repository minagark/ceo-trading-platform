import { Component, computed, HostBinding, HostListener, input, output } from '@angular/core';
import { CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { OrderResponse } from '../../../core/trading.models';

@Component({
  selector: 'app-account-activity-row',
  imports: [CurrencyPipe, DatePipe, DecimalPipe, TitleCasePipe],
  templateUrl: './account-activity-row.html',
  styleUrl: './account-activity-row.css',
})
export class AccountActivityRow {
  order = input.required<OrderResponse>();
  selected = input(false);

  // Lets the parent track a click-and-drag multi-row selection — mousedown
  // starts/toggles it, pointerenter (while the button is held) extends it.
  rowPointerDown = output<void>();
  rowPointerEnter = output<void>();

  primaryInstrument = computed(() => {
    if (this.order().addInstrumentType === "CASH" && this.order().subtractInstrumentType === "CASH") {
      return { type: this.order().addInstrumentType, symbol: this.order().addInstrumentSymbol };
    } else {
      if (this.order().side === "BUY" || this.order().side === "DEPOSIT") {
        return { type: this.order().addInstrumentType, symbol: this.order().addInstrumentSymbol };
      } else {
        return { type: this.order().subtractInstrumentType, symbol: this.order().subtractInstrumentSymbol };
      }
    }
  })

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
}
