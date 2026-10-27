import { Component, inject, signal } from '@angular/core';
import { InstrumentType } from '../../../core/trading.models';
import { MarketApiService } from '../data-access/market-api.service';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PortfolioPerformance } from '../../portfolio/portfolio-performance/portfolio-performance';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, forkJoin, map, switchMap } from 'rxjs';
import { InstrumentSearch } from '../../trading/instrument-search/instrument-search';
import { NonDepositOrderType } from '../../../core/trading.models';

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
    PortfolioPerformance,
    InstrumentSearch
  ],
  selector: 'app-stock-display',
  styleUrl: './stock-display.css',
  templateUrl: './stock-display.html',
})
export class StockDisplay {
  private router: Router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly marketApi = inject(MarketApiService);

  readonly TIME_FRAMES = TIME_FRAMES;
  // defualt values
  selectedTimeFrame: TimeFrame = '1D';
  symbol = 'AAPL';
  type: InstrumentType = 'EQUITY';
  name = '';


  stockDisplayInfo = signal<StockDisplayInfo>({
    name: '',
    symbol: '',
    currentPrice: 0,
    previousClose: 0,
    timeUpdated: new Date(),
  });
  constructor() {
    this.route.queryParamMap.pipe(
      map((params) => {
        const symbol = params.get('symbol')?.trim().toUpperCase() || 'AAPL';
        const orderType = params.get('type') as NonDepositOrderType | null;

        return {
          symbol,
          type: orderType ? this.instrumentTypeFor(orderType) : 'EQUITY' as InstrumentType,
        };
      }),
      distinctUntilChanged(
        (previous, current) =>
          previous.symbol === current.symbol && previous.type === current.type,
      ),
      switchMap(({ symbol, type }) =>
        forkJoin({
          symbol: [symbol],
          type: [type],
          name: this.marketApi.getInstrumentFullName(symbol, type),
          history: this.marketApi.getStockInfo(symbol, type, this.selectedTimeFrame),
          today: this.marketApi.getTodaysCandle(symbol, type),
          currentQuote: this.marketApi.getQuote(symbol, type),
        }),
      ),
    ).subscribe({
      next: ({ symbol, type, name, history, today, currentQuote }) => {
        this.symbol = symbol;
        this.type = type;
        this.name = name.trim() || symbol;
        const latestHistoryPoint = history.at(-1);

        this.stockDisplayInfo.set({
          name: this.name,
          symbol,
          currentPrice: currentQuote.price,
          previousClose: latestHistoryPoint?.balance ?? today?.close ?? 0,
          highPriceToday: today?.high,
          lowPriceToday: today?.low,
          timeUpdated: new Date(),
        });
      },
      error: (error) => {
        console.error('Unable to load stock information:', error);
      },
    });
  }

  get priceChange(): number {
    return this.stockDisplayInfo().currentPrice - this.stockDisplayInfo().previousClose;
  }

  get priceChangePercent(): number {
    return (this.priceChange / this.stockDisplayInfo().previousClose) * 100;
  }

  priceHistory: PriceHistoryPoint[] = [];

  private instrumentTypeFor(orderType: NonDepositOrderType): InstrumentType {
    switch (orderType) {
      case 'CRYPTO':
        return 'CRYPTO';
      case 'FOREX':
        return 'CASH';
      case 'US_EQUITY':
      case 'INDIA_EQUITY':
      default:
        return 'EQUITY';
    }
  }

  handleTrade() {
    console.log("Trading!");
    // This will likely have to be refactored into a pop-up for trades rather than
    // a navigation to a full trades page.
    this.router.navigate(["trades"], {
      queryParams: { 
        name: this.stockDisplayInfo().name, 
        symbol: this.stockDisplayInfo().symbol, 
        currentPrice: this.stockDisplayInfo().currentPrice 
      }
    });
  }
}