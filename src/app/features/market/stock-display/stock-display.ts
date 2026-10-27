import { Component, inject } from '@angular/core';
import { InstrumentType } from '../../../core/trading.models';
import { MarketApiService } from '../data-access/market-api.service';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PortfolioPerformance } from '../../portfolio/portfolio-performance/portfolio-performance';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

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
  readonly marketApi = inject(MarketApiService);

  stockDisplayInfo: StockDisplayInfo;
  constructor() {
    this.stockDisplayInfo = {
      name: this.name,
      symbol: this.symbol,
      currentPrice: 0,
      previousClose: 0,
      timeUpdated: new Date(),
    };
    this.fetchStockInfo();
  }

  // Example data, all of this comes from backend/db
  readonly TIME_FRAMES = TIME_FRAMES;
  selectedTimeFrame: TimeFrame = '1D';
  // get the stock name and type
  name: string = "Apple";
  symbol: string = "AAPL";
  type: InstrumentType = "EQUITY"; // for now, need toget from input
  // Example data end

  get priceChange(): number {
    return this.stockDisplayInfo.currentPrice - this.stockDisplayInfo.previousClose;
  }

  get priceChangePercent(): number {
    return (this.priceChange / this.stockDisplayInfo.previousClose) * 100;
  }

  priceHistory: PriceHistoryPoint[] = [];

  fetchStockInfo(): void {
    forkJoin({
      history: this.marketApi.getStockInfo(
        this.symbol,
        this.type,
        this.selectedTimeFrame,
      ),
      today: this.marketApi.getTodaysCandle(this.symbol, this.type),
      currentQuote: this.marketApi.getQuote(this.symbol, this.type)
    }).subscribe({
      next: ({ history, today, currentQuote }) => {
        const latestHistoryPoint = history.at(-1);
        const previousClose = latestHistoryPoint?.balance ?? today?.close ?? 0;

        this.stockDisplayInfo = {
          name: this.name,
          symbol: this.symbol,
          currentPrice: currentQuote.price,
          previousClose,
          highPriceToday: today?.high,
          lowPriceToday: today?.low,
          timeUpdated: new Date(),
        };
      },
      error: (error) => {
        console.error('Unable to load stock information:', error);
      },
    });
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