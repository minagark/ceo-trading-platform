import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { RealtimeService } from '../../../core/realtime.service';
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
export class StockDisplay implements OnInit, OnDestroy {
  private router: Router = inject(Router);
  private realtime = inject(RealtimeService);
  private marketApi = inject(MarketApiService);
  private quoteSubscription: Subscription | null = null;

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
    return {
      name: 'Apple Inc.',
      symbol: 'AAPL',
      currentPrice: 152.34,
      previousClose: 149.87,
      highPriceToday: 154.10,
      lowPriceToday: 147.38,
      timeUpdated: new Date(),
    };
  }

  ngOnInit(): void {
    this.marketApi.getQuote(this.stockDisplayInfo.symbol, 'EQUITY' as InstrumentType).subscribe({
      next: (quote) => {
        this.stockDisplayInfo = {
          ...this.stockDisplayInfo,
          currentPrice: quote.price,
          previousClose: quote.previousClose,
          timeUpdated: new Date(quote.asOf),
        };
      },
    });

    this.quoteSubscription = this.realtime
      .subscribeToQuote(this.stockDisplayInfo.symbol, 'EQUITY' as InstrumentType)
      .subscribe((quote) => {
        this.stockDisplayInfo = {
          ...this.stockDisplayInfo,
          currentPrice: quote.price,
          previousClose: quote.previousClose,
          timeUpdated: new Date(quote.asOf),
        };
      });
  }

  ngOnDestroy(): void {
    this.quoteSubscription?.unsubscribe();
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