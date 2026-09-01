import { Routes } from '@angular/router';
import { LoginPage } from './login-page/login-page';
import { HomePage } from './home-page/home-page';
import { Trades } from './trade-screen/trade-screen';
import { TransactionHistory } from './transaction-history/transaction-history';
import { MarketAnalysis } from './market-analysis/market-analysis';
import { PortfolioPerformance } from './portfolio-performance/portfolio-performance';
import { PortfolioComposition } from './portfolio-composition/portfolio-composition';
import { ComponentGallery } from './component-gallery/component-gallery';
import { StockDisplay } from './stock-display/stock-display';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'home', component: HomePage, canActivate: [authGuard] },
  { path: 'stock', component: StockDisplay, canActivate: [authGuard] },
  { path: 'trades', component: Trades, canActivate: [authGuard] },
  { path: 'history', component: TransactionHistory, canActivate: [authGuard] },
  { path: 'portfolio', component: PortfolioPerformance, canActivate: [authGuard] },
  { path: 'composition', component: PortfolioComposition, canActivate: [authGuard] },
  { path: 'analysis', component: MarketAnalysis, canActivate: [authGuard] },
  { path: 'components', component: ComponentGallery, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
