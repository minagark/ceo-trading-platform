import { Routes } from '@angular/router';
import { HomePage } from './home-page/home-page';

export const routes: Routes = [
  { path: 'home', component: HomePage },
  { path: 'trades', component: HomePage },
  { path: 'history', component: HomePage },
  { path: 'portfolio', component: HomePage },
  { path: 'analysis', component: HomePage },
];



/*
      <a href="ceos-mn-home"><i class="lni lni-home"></i> Home</a>
      <a href="ceos-mn-market-analysis"><i class="lni lni-home"></i> Trades</a>
      <a href="ceos-mn-home"><i class="lni lni-home"></i> Transaction History</a>
      <a href="ceos-mn-trades"><i class="lni lni-home"></i> Portfolio Performance</a>
      <a href="ceos-mn-transactions"><i class="lni lni-home"></i> Market Analysis</a>

*/