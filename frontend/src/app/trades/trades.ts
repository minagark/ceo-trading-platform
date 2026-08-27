import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatSlideToggle } from '@angular/material/slide-toggle';

interface PriceHistoryPoint {
  time: string;
  price: number;
}

@Component({
  imports: [CommonModule, FormsModule, DecimalPipe, MatSlideToggle],
  selector: 'app-trades',
  styleUrl: './trades.css',
  templateUrl: './trades.html',
})
export class Trades {

  // Example data, all of this comes from backend/db
  name = 'Example Corp';
  symbol = 'EXC';
  currentPrice = 152.34;
  previousClose = 149.87;
  highPriceToday = 154.10;
  lowPriceToday = 148.92;
  timeFrames = ['1D', '1W', '1M', '3M', '1Y', '5Y'];
  selectedTimeFrame = '1D';
  // Example data end

  get priceChange(): number {
    return this.currentPrice - this.previousClose;
  }

  get priceChangePercent(): number {
    return (this.priceChange / this.previousClose) * 100;
  }

  priceHistory: PriceHistoryPoint[] = [];
}