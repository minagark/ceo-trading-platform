import { Component, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { HomePage } from '../home-page/home-page';
import { Trades } from '../trade-screen/trade-screen';
import { TransactionHistory } from '../transaction-history/transaction-history';
import { PortfolioPerformance } from '../portfolio-performance/portfolio-performance';
import { MarketAnalysis } from '../market-analysis/market-analysis';
import { AccountsList } from '../accounts-list/accounts-list';

interface GalleryEntry {
  name: string;
  component: Type<unknown>;
}

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
  ];
}
