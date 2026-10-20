import { Component, computed, inject, input, signal } from '@angular/core';
import { AccountSelectionService } from '../../account/accounts-list/account-selection.service';
import { CurrencyPipe, DecimalPipe, PercentPipe, SlicePipe } from '@angular/common';
import { ChangePeriod, Holding, HoldingsService } from './holdings.service';
import { PortfolioApiService } from '../data-access/portfolio-api.service';

export interface HoldingRow extends Holding {
  marketValue: number;
  dayChangeTotal: number;
  totalGainPct: number;
  selectedPeriodChangePct: number;
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
  private accountSelectionService = inject(AccountSelectionService);
  private readonly portfolioApi = inject(PortfolioApiService);
  

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
      const marketValue = h.shares * h.currentPrice;
      const dayChangeTotal = isCash ? h.dayChangeValue : h.shares * h.dayChangeValue;
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

  totalMarketValue = computed(() => this.rows().reduce((sum, r) => sum + r.marketValue, 0));
  // if activeportfolio id is null then all accounts
  // totalMarketValue = this.portfolioApi.getTotalValue(this.activePortfolio()?.id ?? null); // if null then total of all accounts
  
  totalDayChange = computed(() => this.rows().reduce((sum, r) => sum + r.dayChangeTotal, 0));
  totalDayChangePct = computed(() => {
    const previousValue = this.totalMarketValue() - this.totalDayChange();
    return previousValue === 0 ? 0 : this.totalDayChange() / previousValue;
  });

  onPeriodChange(event: Event) {
    this.selectedPeriod.set((event.target as HTMLSelectElement).value as ChangePeriod);
  }

  // Logos that failed to load (bad domain, offline, etc.) — tracked so those
  // rows can fall back to an initials avatar instead of a broken image icon.
  private failedLogos = signal<ReadonlySet<string>>(new Set());

  logoUrl(row: HoldingRow): string {
    return `https://logo.clearbit.com/${row.logoDomain}`;
  }

  logoFailed(symbol: string): boolean {
    return this.failedLogos().has(symbol);
  }

  onLogoError(symbol: string) {
    this.failedLogos.update((failed) => new Set(failed).add(symbol));
  }

  initials(companyName: string): string {
    return companyName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  }
}
