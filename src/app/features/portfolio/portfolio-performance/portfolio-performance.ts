import { Component, effect, inject, Input, input, model, signal } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { PortfolioApiService } from '../../portfolio/data-access/portfolio-api.service';
import { MarketApiService } from '../../market/data-access/market-api.service';
import { AgCharts } from "ag-charts-angular";
import {
  AgChartOptions,
  AllCommunityModule,
  ModuleRegistry,
} from "ag-charts-community";
import { TimeFrame } from '../../market/stock-display/stock-display';
import { AccountSelectionService } from '../../account/accounts-list/account-selection.service';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { HoldingsService } from '../holdings/holdings.service';
import { InstrumentType } from '../../../core/trading.models';
import { catchError, forkJoin, of } from 'rxjs';


// mock account data
interface Account {
  id: number;
  name: string;
  balance: number;
  holdings: { symbol: string; 
              quantity: number; 
            }[],
  history: number[];
}

interface GraphItem {
  date: Date; // is it date... lowkey could be time too depending on time frame
  balance: number;
}


ModuleRegistry.registerModules([
  AllCommunityModule,
]);

@Component({
  imports: [AgCharts, MatFormFieldModule, MatSelectModule],
  selector: 'performance-chart',
  styleUrl: './portfolio-performance.css',
  templateUrl: './portfolio-performance.html',
})
export class PortfolioPerformance {

  selectedTimeFrame = model<TimeFrame>('1M'); // model lets stock \display sitll see
  readonly instrumentSymbol = input<string | null>(null);
  readonly instrumentType = input<InstrumentType>('EQUITY');

  readonly accountSelectionService = inject(AccountSelectionService);
  readonly accountsService = inject(AccountsService);
  readonly holdingsService = inject(HoldingsService);
  readonly portfolioApi = inject(PortfolioApiService);
  readonly marketApi = inject(MarketApiService);

  readonly items = signal<GraphItem[]>([]);

  readonly TIME_FRAMES: TimeFrame[] = ['1W', '1M', '3M', '1Y', '5Y'];

  // input from parent/calling component to determine where time frame selector is
  showTimeFrame = input<boolean>(true);

  onTimeFrameChange(timeframe: TimeFrame): void {
    this.selectedTimeFrame.set(timeframe);
  }


  public options = signal<AgChartOptions>({
 // title: {
      //   text: this.accounts[0].name,
      // },
      // data: this.accounts[0].history.map((balance, index) => ({ date: index, balance })),
      data :[],
      series: [
        {
          type: 'line',
          xKey: 'date',
          yKey: 'balance',
          // title: 'Account Balance'
          marker: {
            enabled: false, // no dots
          },
          stroke: "green" //red or green
        }
      ],
      background: {
        fill: 'var(--mat-sys-surface)'
      },
      axes: {
        x: {
          type: 'time', // changes this to time once get real time stamp (or leave as category depending on parsing)
          gridLine: {
            enabled: false
          },
          label: {
            enabled: true,
            color: "var(--mat-sys-on-surface)",
            format: '%b %d',
          },
          nice: false,
        },
        y: {
          type: 'number',
          gridLine: {
            enabled: false
          },
          label: {
            enabled: true,
            color: "var(--mat-sys-on-surface)"
          }
        }
      }
  });

  public graphData = signal<GraphItem[]>([]);

  constructor() {
    effect((onCleanup) => {
      const selectedAccount = this.accountSelectionService.selectedAccount();
      const accounts = this.accountsService.accounts();
      const timeframe = this.selectedTimeFrame();
      const symbol = this.instrumentSymbol();

      if (symbol) {
        const request = this.marketApi
          .getStockInfo(symbol, this.instrumentType(), timeframe)
          .subscribe({
            next: (performance) => this.updateGraphData([performance]),
            error: () => this.updateGraphData([]),
          });

        onCleanup(() => request.unsubscribe());
        return;
      }

      const portfolioIds = selectedAccount
        ? [selectedAccount.id]
        : accounts.map((account) => account.id);

      if (portfolioIds.length === 0) {
        this.graphData.set([]);
        this.updateChart(this.graphData());
        return;
      }

      const request = forkJoin(
        portfolioIds.map((portfolioId) =>
          this.portfolioApi.getPerformance(portfolioId, timeframe).pipe(
            catchError(() => of([])),
          )
        )
      )
        .subscribe({
          next: (performanceByPortfolio) => {
            this.updateGraphData(performanceByPortfolio);
          },
          error: () => {
            this.graphData.set([]);
            this.updateChart(this.graphData());
          },
        });

      onCleanup(() => request.unsubscribe());
    });
  }

  private updateGraphData(performanceByPortfolio: Array<{ date: string; balance: number }[]>): void {
    const balancesByDate = new Map<string, number>();

    for (const performance of performanceByPortfolio) {
      for (const point of performance) {
        const date = new Date(point.date);
        const balance = Number(point.balance);

        if (Number.isNaN(date.getTime()) || !Number.isFinite(balance)) {
          continue;
        }

        const dateKey = date.toISOString();
        balancesByDate.set(dateKey, (balancesByDate.get(dateKey) ?? 0) + balance);
      }
    }

    const graphData = Array.from(balancesByDate.entries())
      .map(([date, balance]) => ({ date: new Date(date), balance }))
      .sort((left, right) => left.date.getTime() - right.date.getTime());

    this.graphData.set(graphData);
    this.updateChart(graphData);
  }

  private updateChart(data: GraphItem[]): void {
    this.items.set(data);
      this.options.update((options) => ({
        ...options,
        data: [...data],
    }));
  }


}
