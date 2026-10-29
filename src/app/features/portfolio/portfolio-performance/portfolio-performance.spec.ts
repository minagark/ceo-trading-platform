import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioPerformance } from './portfolio-performance';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import { Subject } from 'rxjs';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { Account } from '../../account/accounts-list/accounts-list';
import { AccountSelectionService } from '../../account/accounts-list/account-selection.service';
import { HoldingsService } from '../holdings/holdings.service';
import { PortfolioApiService } from '../data-access/portfolio-api.service';
import { MarketApiService } from '../../market/data-access/market-api.service';
import { PerformanceResponse } from '../../../core/portfolio-performance.models';

describe('PortfolioPerformance', () => {
  let component: PortfolioPerformance;
  let fixture: ComponentFixture<PortfolioPerformance>;
  const accounts = signal<Account[]>([]);
  const accountsLoading = signal(false);
  let requests: Subject<PerformanceResponse[]>[];
  const account: Account = { id: '1', name: 'Portfolio', type: 'BROKERAGE', balance: 100 };

  beforeEach(async () => {
    accounts.set([]);
    accountsLoading.set(false);
    requests = [];
    const request = () => {
      const response = new Subject<PerformanceResponse[]>();
      requests.push(response);
      return response;
    };
    await TestBed.configureTestingModule({
      imports: [PortfolioPerformance],
      providers: [
        {
          provide: AccountsService,
          useValue: { accounts, loading: accountsLoading, error: signal(null) },
        },
        { provide: AccountSelectionService, useValue: { selectedAccount: signal(null) } },
        { provide: HoldingsService, useValue: {} },
        { provide: PortfolioApiService, useValue: { getPerformance: request } },
        { provide: MarketApiService, useValue: { getStockInfo: request } },
      ],
    })
      .overrideComponent(PortfolioPerformance, {
        remove: { imports: [AgCharts] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PortfolioPerformance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('keeps loading until accounts and performance requests finish', () => {
    accountsLoading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    accounts.set([account]);
    accountsLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ag-charts')).toBeNull();

    requests[0].next([{ date: '2026-10-29', balance: 100 }]);
    requests[0].complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    expect(component.graphData()).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('ag-charts')).not.toBeNull();
  });

  it('keeps loading for a new timeframe when the old request is cancelled', () => {
    accounts.set([account]);
    fixture.detectChanges();
    component.onTimeFrameChange('1Y');
    fixture.detectChanges();
    expect(requests).toHaveLength(2);
    expect(component.loading()).toBe(true);
    requests[0].complete();
    expect(component.loading()).toBe(true);
    requests[1].next([]);
    requests[1].complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
  });

  it('stops loading and displays an error on a failed performance request', () => {
    accounts.set([account]);
    fixture.detectChanges();
    requests[0].error(new Error('Unavailable'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('shows loading for instrument history without waiting on portfolio loading', () => {
    accountsLoading.set(true);
    fixture.componentRef.setInput('instrumentSymbol', 'AAPL');
    fixture.detectChanges();
    requests[0].next([]);
    requests[0].complete();
    fixture.detectChanges();
    expect(component.loading()).toBe(false);
  });
});
