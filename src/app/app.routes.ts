import { Routes } from '@angular/router';
import { LoginPage } from './features/auth/login-page/login-page';
import { HomePage } from './features/home/home-page/home-page';
import { Trades } from './features/trading/trade-screen/trade-screen';
import { AccountActivity } from './features/account/account-activity/account-activity';
import { MarketAnalysis } from './features/market/market-analysis/market-analysis';
import { PortfolioPerformance } from './features/portfolio/portfolio-performance/portfolio-performance';
import { PortfolioComposition } from './features/portfolio/portfolio-composition/portfolio-composition';
import { PortfolioHoldingsPage } from './features/portfolio/portfolio-holdings-page/portfolio-holdings-page';
import { ComponentGallery } from './features/dev/component-gallery/component-gallery';
import { StockDisplay } from './features/market/stock-display/stock-display';
import { AccountPage } from './features/account/account-page/account-page';
import { SettingsPage } from './features/account/settings-page/settings-page';
import { authGuard } from './features/auth/auth/auth.guard';
import { CreatePortfolio } from './features/portfolio/create-portfolio/create-portfolio';
import { ConfirmPortfolio } from './features/portfolio/confirm-portfolio/confirm-portfolio';

export const routes: Routes = [
  { path: 'login', component: LoginPage },
  { path: 'home', component: HomePage, canActivate: [authGuard] },
  { path: 'stock', component: StockDisplay, canActivate: [authGuard] },
  { path: 'trades', component: Trades, canActivate: [authGuard] },
  { path: 'history', component: AccountActivity, canActivate: [authGuard] },
  { path: 'portfolio', component: PortfolioPerformance, canActivate: [authGuard] },
  { path: 'composition', component: PortfolioComposition, canActivate: [authGuard] },
  { path: 'holdings', component: PortfolioHoldingsPage, canActivate: [authGuard] },
  { path: 'analysis', component: MarketAnalysis, canActivate: [authGuard] },
  { path: 'components', component: ComponentGallery, canActivate: [authGuard] },
  { path: 'account', component: AccountPage, canActivate: [authGuard] },
  { path: 'account/:userId', component: AccountPage, canActivate: [authGuard] },
  { path: 'settings', component: SettingsPage, canActivate: [authGuard] },
  { path: 'create-portfolio', component: CreatePortfolio, canActivate: [authGuard] },
  { path: 'confirm-portfolio', component: ConfirmPortfolio, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
