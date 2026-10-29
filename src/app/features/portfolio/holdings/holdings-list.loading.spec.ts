import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { HoldingsList } from './holdings-list';
import { HoldingsService } from './holdings.service';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { Account } from '../../account/accounts-list/accounts-list';
import { PortfolioApiService } from '../data-access/portfolio-api.service';

describe('HoldingsList loading', () => {
  let fixture: ComponentFixture<HoldingsList>;
  const accounts = signal<Account[]>([]);
  const accountsLoading = signal(false);
  const holdingsLoading = signal(false);
  const error = signal<string | null>(null);
  let totalValue: Subject<number>;

  beforeEach(async () => {
    accounts.set([]);
    accountsLoading.set(false);
    holdingsLoading.set(false);
    error.set(null);
    totalValue = new Subject<number>();
    await TestBed.configureTestingModule({
      imports: [HoldingsList],
      providers: [
        {
          provide: AccountsService,
          useValue: { accounts, loading: accountsLoading, error: signal(null) },
        },
        {
          provide: HoldingsService,
          useValue: { holdings: signal([]), loading: holdingsLoading, error },
        },
        { provide: PortfolioApiService, useValue: { getTotalValue: () => totalValue } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(HoldingsList);
    await fixture.whenStable();
  });

  it('waits for accounts, holdings and the total value before showing an empty list', () => {
    accountsLoading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.holdings-list__empty')).toBeNull();

    accounts.set([{ id: '1', name: 'Portfolio', type: 'BROKERAGE', balance: 100 }]);
    accountsLoading.set(false);
    holdingsLoading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    holdingsLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    totalValue.next(100);
    totalValue.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('.holdings-list__empty')).not.toBeNull();
  });

  it('stops loading and shows the holdings error instead of an empty list', () => {
    holdingsLoading.set(true);
    fixture.detectChanges();
    error.set('Unable to load holdings.');
    holdingsLoading.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(error());
    expect(fixture.nativeElement.querySelector('.holdings-list__empty')).toBeNull();
  });

  it('stops loading if the total value request fails', () => {
    accounts.set([{ id: '1', name: 'Portfolio', type: 'BROKERAGE', balance: 100 }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).not.toBeNull();
    totalValue.error(new Error('Unavailable'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Unable to load portfolio value.',
    );
  });
});
