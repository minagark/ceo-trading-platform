import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../auth/auth/auth.service';
import { AgCharts } from 'ag-charts-angular';
import { AgChartOptions, AllCommunityModule, ModuleRegistry } from 'ag-charts-community';
import { catchError, forkJoin, of } from 'rxjs';
import {
  AnalyticsApiService,
  Candle,
  ClientActivityTrend,
  TopMarketMover,
  TopInstrumentAnalytics,
  VolumeAnalytics,
} from '../data-access/analytics-api.service';

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  imports: [AgCharts, CurrencyPipe, DecimalPipe, FormsModule],
  selector: 'app-market-analysis',
  styleUrl: './market-analysis.css',
  templateUrl: './market-analysis.html',
})
export class MarketAnalysis {
  private readonly analyticsApi = inject(AnalyticsApiService);
  readonly authService = inject(AuthService);

  readonly volume = signal<VolumeAnalytics | null>(null);
  readonly topInstruments = signal<TopInstrumentAnalytics[]>([]);
  readonly activityTrends = signal<ClientActivityTrend[]>([]);
  readonly topGainers = signal<TopMarketMover[]>([]);
  readonly topDecliners = signal<TopMarketMover[]>([]);
  readonly topMoversLoading = signal(true);
  readonly topMoversError = signal<string | null>(null);
  readonly candles = signal<Candle[]>([]);
  readonly candleError = signal<string | null>(null);
  readonly topInstrumentsOptions = signal<AgChartOptions | null>(null);
  readonly activityOptions = signal<AgChartOptions | null>(null);
  readonly candleOptions = signal<AgChartOptions | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly topLimitOptions = [5, 10, 20];
  topLimit = 5;
  startDate = '2026-01-01';
  endDate = new Date().toISOString().slice(0, 10);
  symbolFilter = 'ALL';
  clientSegment = 'ALL';
  candleSymbol = 'AAPL';

  ngOnInit(): void { this.refresh(); }

  refresh(): void {
    this.refreshTopMovers();
    this.loading.set(true);
    this.error.set(null);
    this.candleError.set(null);
    const query = {
      from: this.startDate,
      to: this.endDate,
      symbol: this.symbolFilter.trim().toUpperCase() || 'ALL',
      clientSegment: this.clientSegment,
    };
    forkJoin({
      volume: this.analyticsApi.getVolume(query),
      topInstruments: this.analyticsApi.getTopInstruments(this.topLimit, query),
      activityTrends: this.analyticsApi.getClientActivityTrends(query),
      candles: this.analyticsApi.getCandles(this.candleSymbol.trim().toUpperCase()).pipe(catchError(() => {
        this.candleError.set('Market price history is temporarily unavailable because the market data provider quota has been reached.');
        return of([]);
      })),
    }).subscribe({
      next: (data) => {
        const sortedInstruments = [...data.topInstruments].sort((left, right) => right.totalNotional - left.totalNotional);
        this.volume.set(data.volume);
        this.topInstruments.set(sortedInstruments);
        this.activityTrends.set(data.activityTrends);
        this.candles.set(data.candles);
        this.topInstrumentsOptions.set(this.buildTopInstrumentsOptions(sortedInstruments));
        this.activityOptions.set(this.buildActivityOptions(data.activityTrends));
        this.candleOptions.set(this.buildCandleOptions(data.candles));
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Analytics data could not be loaded. Check that the backend is running and try again.');
        this.loading.set(false);
      },
    });
  }

  refreshTopMovers(): void {
    this.topMoversLoading.set(true);
    this.topMoversError.set(null);
    this.analyticsApi.getTopMovers(5).subscribe({
      next: (movers) => {
        const validMovers = movers.filter((mover) => Number.isFinite(mover.percentageChange));
        this.topGainers.set(validMovers
          .filter((mover) => mover.percentageChange > 0)
          .sort((left, right) => right.percentageChange - left.percentageChange)
          .slice(0, 5));
        this.topDecliners.set(validMovers
          .filter((mover) => mover.percentageChange < 0)
          .sort((left, right) => left.percentageChange - right.percentageChange)
          .slice(0, 5));
        this.topMoversLoading.set(false);
      },
      error: () => {
        this.topMoversError.set('Market movers could not be loaded. Check that the backend is running and try again.');
        this.topMoversLoading.set(false);
      },
    });
  }

  formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  }

  private buildTopInstrumentsOptions(items: TopInstrumentAnalytics[]): AgChartOptions | null {
    if (!items.length) return null;
    return {
      data: items,
      background: { fill: 'transparent' },
      series: [{ type: 'bar', xKey: 'symbol', yKey: 'totalNotional', yName: 'Total notional', fill: '#e3b53c', tooltip: { renderer: ({ datum }: { datum: TopInstrumentAnalytics }) => ({ title: datum.symbol, data: [{ label: 'Notional', value: this.currency(datum.totalNotional) }, { label: 'Quantity', value: datum.totalQuantity.toLocaleString() }, { label: 'Fulfilled trades', value: datum.executedTrades.toLocaleString() }] }) } }],
      axes: { x: { type: 'category', label: { color: '#a9a398' } }, y: { type: 'number', label: { color: '#a9a398', formatter: ({ value }: { value: number }) => this.currency(value) }, gridLine: { enabled: true, style: [{ stroke: '#322d24', lineDash: [3, 3] }] } } } as any,
    };
  }

  private buildActivityOptions(items: ClientActivityTrend[]): AgChartOptions | null {
    if (!items.length) return null;
    const segmentTotals = new Map<string, number>();
    for (const item of items) {
      segmentTotals.set(item.clientSegment, (segmentTotals.get(item.clientSegment) ?? 0) + item.totalNotional);
    }
    const data = [...segmentTotals.entries()]
      .map(([clientSegment, totalNotional]) => ({ clientSegment, totalNotional }))
      .sort((left, right) => right.totalNotional - left.totalNotional);
    return {
      data,
      background: { fill: 'transparent' },
      legend: { enabled: true, position: 'bottom' },
      series: [{
        type: 'pie',
        angleKey: 'totalNotional',
        calloutLabelKey: 'clientSegment',
        sectorLabelKey: 'totalNotional',
        sectorLabel: { color: '#1a1509', fontWeight: 'bold' },
        tooltip: { renderer: ({ datum }: { datum: { clientSegment: string; totalNotional: number } }) => ({ title: datum.clientSegment, data: [{ label: 'Trading volume', value: this.currency(datum.totalNotional) }] }) },
      }],
    } as any;
  }

  private buildCandleOptions(items: Candle[]): AgChartOptions | null {
    if (items.length < 2) return null;
    return { data: items, background: { fill: 'transparent' }, series: [{ type: 'line', xKey: 'date', yKey: 'close', yName: 'Close', stroke: '#e3b53c', strokeWidth: 3, marker: { enabled: false } }], axes: { x: { type: 'category', label: { color: '#a9a398' } }, y: { type: 'number', label: { color: '#a9a398', formatter: ({ value }: { value: number }) => this.currency(value) }, gridLine: { enabled: true, style: [{ stroke: '#322d24', lineDash: [3, 3] }] } } } as any };
  }

  private currency(value: number): string { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value); }
}
