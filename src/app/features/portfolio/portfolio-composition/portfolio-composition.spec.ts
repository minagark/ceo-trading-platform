import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioComposition } from './portfolio-composition';
import { NO_ERRORS_SCHEMA, signal } from '@angular/core';
import { AgCharts } from 'ag-charts-angular';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { AccountSelectionService } from '../../account/accounts-list/account-selection.service';
import { HoldingsService } from '../holdings/holdings.service';

describe('PortfolioComposition', () => {
  let component: PortfolioComposition;
  let fixture: ComponentFixture<PortfolioComposition>;
  const accountsLoading = signal(false);
  const holdingsLoading = signal(false);
  const error = signal<string | null>(null);

  beforeEach(async () => {
    accountsLoading.set(false);
    holdingsLoading.set(false);
    error.set(null);
    await TestBed.configureTestingModule({
      imports: [PortfolioComposition],
      providers: [
        { provide: AccountsService, useValue: { loading: accountsLoading, error: signal(null) } },
        { provide: AccountSelectionService, useValue: { selectedAccount: signal(null) } },
        {
          provide: HoldingsService,
          useValue: { holdings: signal([]), loading: holdingsLoading, error },
        },
      ],
    })
      .overrideComponent(PortfolioComposition, {
        remove: { imports: [AgCharts] },
        add: { schemas: [NO_ERRORS_SCHEMA] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(PortfolioComposition);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows loading through both portfolio and holdings requests', () => {
    accountsLoading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    holdingsLoading.set(true);
    accountsLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('ag-charts')).toBeNull();
    holdingsLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('ag-charts')).not.toBeNull();
  });

  it('replaces loading with an error if holdings fail', () => {
    holdingsLoading.set(true);
    fixture.detectChanges();
    error.set('Unable to load holdings.');
    holdingsLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(error());
  });
});
