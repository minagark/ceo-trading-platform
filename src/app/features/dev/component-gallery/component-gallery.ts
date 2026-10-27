import { Component, Type } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { HomePage } from '../../home/home-page/home-page';
import { Trades } from '../../trading/trade-screen/trade-screen';
import { AccountActivity } from '../../account/account-activity/account-activity';
import { PortfolioPerformance } from '../../portfolio/portfolio-performance/portfolio-performance';
import { MarketAnalysis } from '../../market/market-analysis/market-analysis';
import { AccountsList } from '../../account/accounts-list/accounts-list';
import { PreviewPage } from '../../trading/preview-page/preview-page';
import { OrderRequest } from '../../../core/trading.models';
import { TradeConfirmation } from '../../trading/trade-confirmation/trade-confirmation';
import { HoldingsList } from '../../portfolio/holdings/holdings-list';
import { PortfolioHoldingsPage } from '../../portfolio/portfolio-holdings-page/portfolio-holdings-page';

interface GalleryEntry {
  name: string;
  component: Type<unknown>;
  inputs?: Record<string, unknown>;
}

const mockOrderRequest: OrderRequest = {
  clientId: 'client-1',
  clientName: 'John Doe',
  portfolioId: 'portfolio-1',
  addInstrumentSymbol: 'AAPL',
  addInstrumentType: 'EQUITY',
  subtractInstrumentSymbol: 'USD',
  subtractInstrumentType: 'EQUITY',
  quantity: 10,
  quotedPrice: 227.55,
  side: 'BUY',
  changeThreshold: 0.02,
  market: 'America/New_York',
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
    { name: 'Account Activity', component: AccountActivity },
    { name: 'Portfolio Performance', component: PortfolioPerformance },
    { name: 'Market Analysis', component: MarketAnalysis },
    { name: 'Accounts List', component: AccountsList },
    {
      name: 'Preview Page',
      component: PreviewPage,
      inputs: { request: mockOrderRequest, portfolioLabel: 'portfolio-1 (BROKERAGE)' },
    },
    {
      name: 'Trade Confirmation',
      component: TradeConfirmation,
      // the success state follows a real order over the WebSocket, so the gallery shows the failure state
      inputs: { message: 'Market API returned 429: daily quota exhausted.' },
    },
    {
      name: 'Holdings List',
      component: HoldingsList,
      inputs: {},
    },
    { name: 'Portfolio Holdings Page', component: PortfolioHoldingsPage },
  ];
}
