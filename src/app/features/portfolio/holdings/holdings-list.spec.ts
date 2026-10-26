import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HoldingsList } from './holdings-list';
import { AccountSelectionService } from '../../account/accounts-list/account-selection.service';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { PortfolioApiService } from '../data-access/portfolio-api.service';

describe('HoldingsList', () => {
  let component: HoldingsList;
  let fixture: ComponentFixture<HoldingsList>;
  let selectionService: AccountSelectionService;
  let accountsService: AccountsService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HoldingsList],
      providers: [
        {
          provide: PortfolioApiService,
          useValue: {
            getTotalValue: () => of(0),
            getHoldings: (portfolioId: string) =>
              of(
                portfolioId === '2'
                  ? [
                      {
                        holdingId: 'h-1',
                        portfolioId: '2',
                        symbol: 'GOOGL',
                        instrumentName: 'Alphabet Inc.',
                        quantity: 60,
                        avgCost: 98.75,
                        currentPrice: 165.94,
                        dayChangeValue: -0.62,
                        percentChange: { '1D': -0.0037, '5D': -0.009, '1M': 0.022, '6M': 0.081, '1Y': 0.298 },
                        weekLow52: 127.9,
                        weekHigh52: 207.05,
                      },
                    ]
                  : [],
              ),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HoldingsList);
    component = fixture.componentInstance;
    selectionService = TestBed.inject(AccountSelectionService);
    accountsService = TestBed.inject(AccountsService);
    accountsService.accounts.set([
      { id: '1', name: 'Brokerage portfolio', type: 'BROKERAGE', balance: 0 },
      { id: '2', name: 'Retirement portfolio', type: 'RETIREMENT', balance: 0 },
    ]);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show only holdings for the selected portfolio', () => {
    selectionService.onAccountSelected({ id: '2', name: 'Retirement', type: 'RETIREMENT', balance: 0 });
    fixture.detectChanges();

    const rows = fixture.nativeElement.querySelectorAll('.holdings-list__row');
    expect(rows.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('GOOGL');
    expect(fixture.nativeElement.textContent).not.toContain('AAPL');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });
});
