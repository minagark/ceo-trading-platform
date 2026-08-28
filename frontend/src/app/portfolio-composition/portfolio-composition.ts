import { Component } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import {
  AgChartOptions,
  LegendModule,
  ModuleRegistry,
  PieSeriesModule,
} from "ag-charts-community";

ModuleRegistry.registerModules([LegendModule, PieSeriesModule]);

// mock account interface
interface Account {
  id: number;
  name: string;
  balance: number;
  holdings: { symbol: string; 
              quantity: number; 
            }[],
  history: number[];
}

@Component({
  imports: [AgCharts],
  selector: 'app-portfolio-composition',
  styleUrl: './portfolio-composition.css',
  templateUrl: './portfolio-composition.html',
})
export class PortfolioComposition {
  accounts: Account[] = [
    {id: 1, name: 'Account 1', balance: 1500, holdings: [{symbol: "AAPL", quantity: 10}, {symbol: "MSFT", quantity: 10}, {symbol: "GOOGL", quantity: 5}, {symbol: "AMZN", quantity: 2}, {symbol: "META", quantity: 3}], history: [1000, 2000, 1500, 3000, 2750, 2800, 1100, 1500]},
    {id: 2, name: 'Account 2', balance: 2000, holdings: [{symbol: "AAPL", quantity: 20}, {symbol: "MSFT", quantity: 20}], history: [1000, 2000, 1500]},
    {id: 3, name: 'Account 3', balance: 3000, holdings: [{symbol: "AAPL", quantity: 30}, {symbol: "MSFT", quantity: 30}], history: [1000, 2000, 1500]}
  ];

  public options : AgChartOptions;

  constructor() {
    this.options = {
      data: this.accounts[0].holdings.map(holding => ({ name: holding.symbol, amount: holding.quantity })),
      title: {
        text: "Portfolio Composition",
        color: "var(--color-text)"
      },
      series: [
        {
          type: 'pie',
          angleKey: 'amount',
          legendItemKey: 'name'
        }
      ],
      background: {
        fill: 'var(--color-bg)' 
      },
      legend: {
        item: {
          label: {
            color: "var(--color-text)"
          }
        }
      }
    }

  }

}
