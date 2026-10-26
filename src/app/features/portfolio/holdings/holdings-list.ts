import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { AccountSelectionService } from '../../account/accounts-list/account-selection.service';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { CurrencyPipe, DecimalPipe, PercentPipe, SlicePipe } from '@angular/common';
import { ChangePeriod, HoldingsService } from './holdings.service';
import { HoldingSummaryResponse } from '../../../core/portfolio-holdings.models';
import { PortfolioApiService } from '../data-access/portfolio-api.service';
import { forkJoin, Subscription } from 'rxjs';

export interface HoldingRow extends HoldingSummaryResponse {
  marketValue: number;
  dayChangeTotal: number;
  totalGainPct: number;
  selectedPeriodChangePct: number | null;
  // Where currentPrice sits within [weekLow52, weekHigh52], as a 0-100 %,
  // for positioning the marker on the 52-week range bar.
  weekRangePosition: number;
}

@Component({
  selector: 'app-holdings-list',
  imports: [CurrencyPipe, DecimalPipe, PercentPipe, SlicePipe],
  templateUrl: './holdings-list.html',
  styleUrl: './holdings-list.css',
})
export class HoldingsList {
  private holdingsService = inject(HoldingsService);
  private accountsService = inject(AccountsService);
  private accountSelectionService = inject(AccountSelectionService);
  private readonly portfolioApi = inject(PortfolioApiService);
  private totalValueSubscription: Subscription | null = null;
  

  // The portfolio to show holdings for. `null` means "All Portfolios", matching
  // the semantics of AccountsList's shared selection output.
  activePortfolio = computed(() => {
    return this.accountSelectionService.selectedAccount();
  });

  // Period used for the "% Change" column — user-selectable via the column
  // header dropdown. The $ change next to the price is always "today".
  periods: ChangePeriod[] = ['1D', '5D', '1M', '6M', '1Y'];
  selectedPeriod = signal<ChangePeriod>('1D');

  private allHoldings = this.holdingsService.holdings;

  showLess = input<boolean>(false);

  rows = computed<HoldingRow[]>(() => {
    const portfolioId = this.activePortfolio()?.id ?? null;
    const holdings = portfolioId
      ? this.allHoldings().filter((h) => h.portfolioId === portfolioId)
      : this.allHoldings();
    const period = this.selectedPeriod();

    return holdings.map((h) => {
      const isCash = h.instrumentType == "CASH";
      // const marketValue = isCash ? h.currentPrice : h.shares * h.currentPrice;
      const marketValue = h.quantity * h.currentPrice;
      const dayChangeTotal = isCash ? h.dayChangeValue : h.quantity * h.dayChangeValue;
      const totalGainPct = isCash ? 0 : (h.currentPrice - h.avgCost) / h.avgCost;
      const range = h.weekHigh52 - h.weekLow52;
      const rawPosition = isCash || range === 0 ? 50 : ((h.currentPrice - h.weekLow52) / range) * 100;
      return {
        ...h,
        marketValue,
        dayChangeTotal,
        totalGainPct,
        selectedPeriodChangePct: isCash ? 0 : h.percentChange[period],
        weekRangePosition: Math.min(100, Math.max(0, rawPosition)),
      };
    });
  });

  totalMarketValue = signal(0);

  constructor() {
    effect(() => {
      const selectedPortfolio = this.activePortfolio();
      const accounts = this.accountsService.accounts();
      const portfolioIds = selectedPortfolio
        ? [selectedPortfolio.id]
        : accounts.map((account) => account.id);

      this.totalValueSubscription?.unsubscribe();

      if (portfolioIds.length === 0) {
        this.totalMarketValue.set(0);
        return;
      }

      this.totalValueSubscription = forkJoin(
        portfolioIds.map((portfolioId) =>
          this.portfolioApi.getTotalValue(portfolioId)
        )
      ).subscribe({
        next: (values) => this.totalMarketValue.set(
          values.reduce((total, value) => total + value, 0)
        ),
        error: () => this.totalMarketValue.set(0),
      });
    });
  }

  
  totalDayChange = computed(() => this.rows().reduce((sum, r) => sum + r.dayChangeTotal, 0));
  totalDayChangePct = computed(() => {
    const previousValue = this.totalMarketValue() - this.totalDayChange();
    return previousValue === 0 ? 0 : this.totalDayChange() / previousValue;
  });

  onPeriodChange(event: Event) {
    this.selectedPeriod.set((event.target as HTMLSelectElement).value as ChangePeriod);
  }
}
