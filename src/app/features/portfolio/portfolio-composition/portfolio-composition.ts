import { Component, computed, effect, inject, signal } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import {
  AgChartOptions,
  LegendModule,
  ModuleRegistry,
  PieSeriesModule,
} from "ag-charts-community";
import { AccountSelectionService } from '../../account/accounts-list/account-selection.service';
import { HoldingsService } from '../holdings/holdings.service';

ModuleRegistry.registerModules([LegendModule, PieSeriesModule]);

// mock account interface
interface ChartItem {
  name: string;
  quantity: number;
}

@Component({
  imports: [AgCharts],
  selector: 'app-portfolio-composition',
  styleUrl: './portfolio-composition.css',
  templateUrl: './portfolio-composition.html',
})
export class PortfolioComposition {
  // accounts: Account[] = [
  //   {id: 1, name: 'Account 1', balance: 1500, holdings: [{symbol: "AAPL", quantity: 10}, {symbol: "MSFT", quantity: 10}, {symbol: "GOOGL", quantity: 5}, {symbol: "AMZN", quantity: 2}, {symbol: "META", quantity: 3}], history: [1000, 2000, 1500, 3000, 2750, 2800, 1100, 1500]},
  //   {id: 2, name: 'Account 2', balance: 2000, holdings: [{symbol: "AAPL", quantity: 20}, {symbol: "MSFT", quantity: 20}], history: [1000, 2000, 1500]},
  //   {id: 3, name: 'Account 3', balance: 3000, holdings: [{symbol: "AAPL", quantity: 30}, {symbol: "MSFT", quantity: 30}], history: [1000, 2000, 1500]}
  // ];
  readonly holdingsService = inject(HoldingsService);
  readonly accountSelectionService = inject(AccountSelectionService);
  readonly loading = signal(false);

  readonly items = signal<ChartItem[]>([]);

  public options = signal<AgChartOptions>({
      data:[],
      series: [
        {
          type: 'pie',
          angleKey: 'quantity',
          legendItemKey: 'name'
        }
      ],
      background: {
        fill: 'var(--mat-sys-surface)'
      },
      legend: {
        position: 'bottom',
        item: {
          label: {
            color: "var(--mat-sys-on-surface)"
          }
        }
      }
  });

  readonly chartData = computed<ChartItem[]>(() => {
    const selectedAccount = this.accountSelectionService.selectedAccount();
    const holdings = this.holdingsService.holdings();
    const visibleHoldings = selectedAccount
      ? holdings.filter((holding) => holding.portfolioId === selectedAccount.id)
      : holdings;
    const totals = new Map<string, number>();

    for (const holding of visibleHoldings) {
      if (holding.instrumentType === 'CASH') {
        continue;
      }

      const quantity = Number(holding.quantity);
      if (!Number.isFinite(quantity)) {
        continue;
      }

      totals.set(
        holding.symbol,
        (totals.get(holding.symbol) ?? 0) + quantity,
      );
    }

    return Array.from(totals.entries())
      .filter(([, quantity]) => quantity > 0)
      .map(([name, quantity]) => ({ name, quantity }));
  });

  constructor() {
    effect(() => {
      this.updateChart(this.chartData());
    });
  }

  private updateChart(data: ChartItem[]): void {
    this.items.set(data);
      this.options.update((options) => ({
    ...options,
    data: [...data],
  }));
  }

}
