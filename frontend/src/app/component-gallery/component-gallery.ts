import { Component, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { HomePage } from '../home-page/home-page';
import { Trades } from '../trade-screen/trade-screen';
import { TransactionHistory } from '../transaction-history/transaction-history';
import { PortfolioPerformance } from '../portfolio-performance/portfolio-performance';
import { MarketAnalysis } from '../market-analysis/market-analysis';
import { AccountsList, Account } from '../accounts-list/accounts-list';
import { PreviewPage } from '../preview-page/preview-page';
import { TradeRequest } from '../trade-screen/trade-screen';

interface GalleryEntry {
  name: string;
  component: Type<unknown>;
  inputs?: Record<string, unknown>;
}

const mockPreviewDraft: TradeRequest = {
  type: 'buy',
  account: 'acc-1',
  cashAvailable: 5000,
  stock: {
    abbrName: 'AAPL',
    fullName: 'Apple Inc.',
    price: 227.52,
    increaseValue: 1.32,
    increasePCT: 0.0058,
    volume: 48213000,
    ask: 227.55,
    bid: 227.49,
  },
  amountType: 'shares',
  amount: 10,
  orderType: 'market',
  timeInForce: 'day',
};

const mockPreviewAccount: Account = {
  id: 'acc-1',
  name: 'Individual',
  type: 'Individual',
  balance: 5000,
};

@Component({
  selector: 'app-component-gallery',
  imports: [NgComponentOutlet],
  templateUrl: './component-gallery.html',
  styleUrl: './component-gallery.css',
})
export class ComponentGallery {
  // Add a new component here to have it show up on this page — nothing
  // else needs to change.
  entries: GalleryEntry[] = [
    { name: 'Home Page', component: HomePage },
    { name: 'Trades', component: Trades },
    { name: 'Transaction History', component: TransactionHistory },
    { name: 'Portfolio Performance', component: PortfolioPerformance },
    { name: 'Market Analysis', component: MarketAnalysis },
    { name: 'Accounts List', component: AccountsList },
    {
      name: 'Preview Page',
      component: PreviewPage,
      inputs: { draft: mockPreviewDraft, account: mockPreviewAccount },
    },
  ];
}
