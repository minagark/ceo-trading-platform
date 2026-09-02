import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PortfolioPerformance } from '../portfolio-performance/portfolio-performance';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

interface PriceHistoryPoint {
  time: string;
  price: number;
}

// TODO: Once we get API, change this interface to match it. 
interface StockDisplayInfo {
  name: string;
  symbol: string;
  currentPrice: number;
  previousClose: number;
  highPriceToday?: number;
  lowPriceToday?: number;
  otherPriceInfo?: {[label: string]: number};
  timeUpdated: Date;
}

const TIME_FRAMES = ['1D', '1W', '1M', '3M', '1Y', '5Y'] as const;
export type TimeFrame = typeof TIME_FRAMES[number];

@Component({
  imports: [
    FormsModule, 
    DecimalPipe, 
    MatCardModule, 
    MatFormFieldModule, 
    MatSelectModule, 
    MatButtonModule, 
    PortfolioPerformance
  ],
  selector: 'app-stock-display',
  styleUrl: './stock-display.css',
  templateUrl: './stock-display.html',
})
export class StockDisplay {
  private router: Router = inject(Router);

  stockDisplayInfo: StockDisplayInfo;
  constructor() {
    this.stockDisplayInfo = this.fetchStockInfo();
  }

  // Example data, all of this comes from backend/db
  readonly TIME_FRAMES = TIME_FRAMES;
  selectedTimeFrame: TimeFrame = '1D';
  // Example data end

  get priceChange(): number {
    return this.stockDisplayInfo.currentPrice - this.stockDisplayInfo.previousClose;
  }

  get priceChangePercent(): number {
    return (this.priceChange / this.stockDisplayInfo.previousClose) * 100;
  }

  priceHistory: PriceHistoryPoint[] = [];

  fetchStockInfo() {
    // TODO: Replace this with real fetch information
    return {
      name: "Example Corp",
      symbol: "EXC",
      currentPrice: 152.34,
      previousClose: 149.87,
      highPriceToday: 154.10,
      lowPriceToday: 147.38,
      timeUpdated: new Date(),
    }
  }

  handleTrade() {
    console.log("Trading!");
    // This will likely have to be refactored into a pop-up for trades rather than
    // a navigation to a full trades page.
    this.router.navigate(["trades"], {
      queryParams: { 
        name: this.stockDisplayInfo.name, 
        symbol: this.stockDisplayInfo.symbol, 
        currentPrice: this.stockDisplayInfo.currentPrice 
      }
    });
  }
}