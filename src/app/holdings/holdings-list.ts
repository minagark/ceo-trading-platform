import { Component, computed, inject, input, signal } from '@angular/core';
import { CurrencyPipe, DecimalPipe, PercentPipe } from '@angular/common';
import { Account } from '../accounts-list/accounts-list';
import { ChangePeriod, Holding, HoldingsService } from './holdings.service';

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
  imports: [CurrencyPipe, DecimalPipe, PercentPipe],
  templateUrl: './holdings-list.html',
  styleUrl: './holdings-list.css',
})
export class HoldingsList {
  private holdingsService = inject(HoldingsService);

  // The account to show holdings for. `null` means "All Accounts", matching
  // the semantics of AccountsList's `accountSelected` output.
  account = input<Account | null>(null);

  // Period used for the "% Change" column — user-selectable via the column
  // header dropdown. The $ change next to the price is always "today".
  periods: ChangePeriod[] = ['1D', '5D', '1M', '6M', '1Y'];
  selectedPeriod = signal<ChangePeriod>('1D');

  private allHoldings = this.holdingsService.holdings;

  rows = computed<HoldingRow[]>(() => {
    const accountId = this.account()?.id ?? null;
    const holdings = accountId
      ? this.allHoldings().filter((h) => h.accountId === accountId)
      : this.allHoldings();
    const period = this.selectedPeriod();

    return holdings.map((h) => {
      const marketValue = h.shares * h.currentPrice;
      const dayChangeTotal = h.shares * h.dayChangeValue;
      const totalGainPct = (h.currentPrice - h.avgCost) / h.avgCost;
      const range = h.weekHigh52 - h.weekLow52;
      const rawPosition = range === 0 ? 50 : ((h.currentPrice - h.weekLow52) / range) * 100;
      return {
        ...h,
        marketValue,
        dayChangeTotal,
        totalGainPct,
        selectedPeriodChangePct: h.percentChange[period],
        weekRangePosition: Math.min(100, Math.max(0, rawPosition)),
      };
    });
  });

  totalMarketValue = computed(() => this.rows().reduce((sum, r) => sum + r.marketValue, 0));
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
