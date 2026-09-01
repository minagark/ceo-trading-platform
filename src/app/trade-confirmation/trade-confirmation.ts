import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { Trade } from '../trade-screen/trade-screen';

@Component({
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  selector: 'app-trade-confirmation',
  styleUrl: './trade-confirmation.css',
  templateUrl: './trade-confirmation.html',
})
export class TradeConfirmation {
  success = input.required<boolean>();
  trade = input<Trade | null>(null);
  message = input<string | null>(null);

  done = output<void>();
}
