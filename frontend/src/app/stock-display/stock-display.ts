import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

interface PriceHistoryPoint {
  time: string;
  price: number;
}

@Component({
  imports: [
    FormsModule, 
    DecimalPipe, 
    MatCardModule, 
    MatFormFieldModule, 
    MatSelectModule,
    MatButtonModule,
  ],
  selector: 'app-stock-display',
  styleUrl: './stock-display.css',
  templateUrl: './stock-display.html',
})
export class StockDisplay {
  private router: Router = inject(Router);

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


  handleTrade() {
    console.log("Trading!");
    // This will likely have to be refactored into a pop-up for trades rather than
    // a navigation to a full trades page.
    this.router.navigate(["trades"], {
      queryParams: { name: this.name, symbol: this.symbol, currentPrice: this.currentPrice }
    });
  }
}