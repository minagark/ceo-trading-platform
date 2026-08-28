import { Routes } from '@angular/router';
import { HomePage } from './home-page/home-page';
import { Trades } from './trades/trades';
import { TransactionHistory } from './transaction-history/transaction-history';
import { MarketAnalysis } from './market-analysis/market-analysis';
import { PortfolioPerformance } from './portfolio-performance/portfolio-performance';
import { PortfolioComposition } from './portfolio-composition/portfolio-composition';
import { ComponentGallery } from './component-gallery/component-gallery';

export const routes: Routes = [
  { path: 'home', component: HomePage },
  { path: 'trades', component: Trades },
  { path: 'history', component: TransactionHistory },
  { path: 'portfolio', component: PortfolioPerformance },
  { path: 'composition', component: PortfolioComposition },
  { path: 'analysis', component: MarketAnalysis },
  { path: 'components', component: ComponentGallery },
];
