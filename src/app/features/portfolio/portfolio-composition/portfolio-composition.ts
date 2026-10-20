import { Component, effect, inject, signal } from '@angular/core';
import { PortfolioApiService } from '../../portfolio/data-access/portfolio-api.service';
import { AgCharts } from 'ag-charts-angular';
import {
  AgChartOptions,
  LegendModule,
  ModuleRegistry,
  PieSeriesModule,
} from "ag-charts-community";
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { forkJoin } from 'rxjs';
import { AccountSelectionService } from '../../account/accounts-list/account-selection.service';

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
  readonly accountService = inject(AccountsService);
  readonly portfolioApi = inject(PortfolioApiService);
  readonly accountSelectionService = inject(AccountSelectionService);
  readonly loading = signal(false);


  readonly portfolios = this.accountService.accounts();
  readonly selectedPortfolio = this.accountSelectionService.selectedAccount();
  readonly items = signal<ChartItem[]>([]);

  public options = signal<AgChartOptions>({
      data: [],
      title: {
        text: "Portfolio Composition",
        color: "var(--mat-sys-on-surface)"
      },
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
        item: {
          label: {
            color: "var(--mat-sys-on-surface)"
          }
        }
      }
  });

  constructor() {

    effect(() => {
      const selectedAccount = this.accountSelectionService.selectedAccount();
      const accounts = this.accountService.accounts();
      const accountsLoaded = this.accountService.loaded();

      if (!accountsLoaded) {
        return;
      }

      const chartedAccount = selectedAccount ? accounts.filter((account) => account.id === selectedAccount.id) : accounts;
      
      if (chartedAccount.length === 0) {
        this.updateChart([]);
        return; // dont set anything
      }

      this.loading.set(true);

      // forkJoin(
      //   chartedAccount.map((account) => this.portfolioApi.getHoldings(account.id))
      // ).subscribe({
      //   next: (holdingsByAccount) => {
      //     const totals = new Map<string, number>();
      //     for (const holdings of holdingsByAccount) {
      //       for (const holding of holdings) {
      //         const currentAmount = totals.get(holding.instrumentId) ?? 0;
      //         totals.set(holding.instrumentId, currentAmount + holding.quantity);
      //       }
      //     }
      //     this.updateChart(Array.from(totals.entries()).map(([name, quantity]) => ({ name, quantity })));
      //     this.loading.set(false);
      //   }
      // })
      forkJoin(
        chartedAccount.map((account) =>
          this.portfolioApi.getHoldings(account.id)
        )
      ).subscribe({
        next: (holdingsByAccount) => {

          const totals = new Map<string, number>();

          for (const holdings of holdingsByAccount) {
            for (const holding of holdings) {

              if (holding.instrumentType !== 'CASH') {
                const currentQuantity = totals.get(holding.instrumentSymbol) ?? 0;
                totals.set(
                  holding.instrumentSymbol,
                  currentQuantity + Number(holding.quantity)
                );
              }
            }
          }

          const data = Array.from(totals.entries())
            .filter(([, quantity]) => Number.isFinite(quantity) && quantity > 0)
            .map(([name, quantity]) => ({ name, quantity }));

          this.updateChart(data);
          this.loading.set(false);
        },

        error: (error) => {
          console.error('Unable to load holdings:', error);
          this.updateChart([]);
          this.loading.set(false);
        },
      });
    
    })

  }

  private updateChart(data: ChartItem[]): void {
    this.items.set(data);
      this.options.update((options) => ({
    ...options,
    data: [...data],
  }));
  }

}
