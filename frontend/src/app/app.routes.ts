import { Routes } from '@angular/router';
import { HomePage } from './home-page/home-page';
import { Trades } from './trade-screen/trade-screen';
import { MarketAnalysis } from './market-analysis/market-analysis';
import { PortfolioPerformance } from './portfolio-performance/portfolio-performance';
import { TransactionHistory } from './transaction-history/transaction-history';
import { ComponentGallery } from './component-gallery/component-gallery';

export const routes: Routes = [
  { path: 'home', component: HomePage },
  { path: 'trades', component: Trades },
  { path: 'history', component: TransactionHistory },
  { path: 'portfolio', component: PortfolioPerformance },
  { path: 'analysis', component: MarketAnalysis },
  { path: 'components', component: ComponentGallery },
];



/*
      <a href="ceos-mn-home"><i class="lni lni-home"></i> Home</a>
      <a href="ceos-mn-market-analysis"><i class="lni lni-home"></i> Trades</a>
      <a href="ceos-mn-home"><i class="lni lni-home"></i> Transaction History</a>
      <a href="ceos-mn-trades"><i class="lni lni-home"></i> Portfolio Performance</a>
      <a href="ceos-mn-transactions"><i class="lni lni-home"></i> Market Analysis</a>

*/