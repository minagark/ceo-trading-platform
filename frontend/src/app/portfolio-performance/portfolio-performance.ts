import { Component } from '@angular/core';
import { AgCharts, AgFinancialCharts } from "ag-charts-angular";
import {
  AgChartOptions,
  AgFinancialChartOptions,
  CategoryAxisModule,
  LegendModule,
  LineSeriesModule,
  ModuleRegistry,
  NumberAxisModule,
  AllCommunityModule
} from "ag-charts-community";


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


ModuleRegistry.registerModules([
  CategoryAxisModule,
  LegendModule,
  LineSeriesModule,
  NumberAxisModule,
]);

@Component({
  imports: [AgCharts, AgFinancialCharts],
  selector: 'performance-chart',
  styleUrl: './portfolio-performance.css',
  templateUrl: './portfolio-performance.html',
})
export class PortfolioPerformance {
  // functional code
  /* TODO: replace with real data handling */
  accounts: Account[] = [
    {id: 1, name: 'Account 1', balance: 1500, holdings: [{symbol: "AAPL", quantity: 10}, {symbol: "MSFT", quantity: 10}], history: [1000, 2000, 1500, 3000, 2750, 2800, 1100, 1500]},
    {id: 2, name: 'Account 2', balance: 2000, holdings: [{symbol: "AAPL", quantity: 20}, {symbol: "MSFT", quantity: 20}], history: [1000, 2000, 1500]},
    {id: 3, name: 'Account 3', balance: 3000, holdings: [{symbol: "AAPL", quantity: 30}, {symbol: "MSFT", quantity: 30}], history: [1000, 2000, 1500]}
  ]

  public options: AgChartOptions;
  // public finOptions: AgFinancialChartOptions;
  // constructor() {
  //   this.finOptions = {
  //     data: [
  //       { date: new Date(2024, 0, 1), value: this.accounts[0].history[0] },
  //       { date: new Date(2024, 0, 2), value: this.accounts[0].history[1] },
  //       { date: new Date(2024, 0, 3), value: this.accounts[0].history[2] },
  //       { date: new Date(2024, 0, 4), value: this.accounts[0].history[3] },
  //       { date: new Date(2024, 0, 5), value: this.accounts[0].history[4] },
  //       { date: new Date(2024, 0, 6), value: this.accounts[0].history[5] },
  //       { date: new Date(2024, 0, 7), value: this.accounts[0].history[6] },
  //       { date: new Date(2024, 0, 8), value: this.accounts[0].history[7] }
  //     ],
  //     chartType: 'line',
  //   };
  // }

  constructor() {
    this.options = {
      // title: {
      //   text: this.accounts[0].name,
      // },
      // data: this.accounts[0].history.map((balance, index) => ({ date: index, balance })),
      data : [
       { date: "d1",
        balance: this.accounts[0].history[0]},
       { date: "d2",
        balance: this.accounts[0].history[1]},
       { date: "d3",
        balance: this.accounts[0].history[2]},
       { date: "d4",
        balance: this.accounts[0].history[3]},
       { date: "d5",
        balance: this.accounts[0].history[4]},
       { date: "d6",
        balance: this.accounts[0].history[5]},
       { date: "d7",
        balance: this.accounts[0].history[6]},
       { date: "d8",
        balance: this.accounts[0].history[7]}
      ],
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
          type: 'category', // changes this to time once get real time stamp (or leave as category depending on parsing)
          gridLine: {
            enabled: false
          },
          label: {
            enabled: true,
            color: "var(--mat-sys-on-surface)"
          },
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

    }
  }


}
