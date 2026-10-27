import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HoldingsList } from './holdings-list';
import { HoldingsService } from './holdings.service';
import { HoldingSummaryResponse } from '../../../core/portfolio-holdings.models';
import { AccountSelectionService } from '../../account/accounts-list/account-selection.service';
import { AccountsService } from '../../account/accounts-list/accounts.service';
import { PortfolioApiService } from '../data-access/portfolio-api.service';

function holding(overrides: Partial<HoldingSummaryResponse> = {}): HoldingSummaryResponse {
  return {
    holdingId: 'h-1',
    portfolioId: '1',
    symbol: 'GOOGL',
    instrumentName: 'Alphabet Inc.',
    instrumentType: 'EQUITY',
    quantity: 10,
    dateCreated: '2026-10-21T10:00:00Z',
    avgCost: 100,
    currentPrice: 200,
    dayChangeValue: 2,
    percentChange: { '1D': 0.01, '5D': null, '1M': 0.02, '6M': 0.08, '1Y': 0.3 },
    weekLow52: 100,
    weekHigh52: 300,
    ...overrides,
  };
}

describe('HoldingsList', () => {
  let component: HoldingsList;
  let fixture: ComponentFixture<HoldingsList>;
  let element: HTMLElement;
  let selectionService: AccountSelectionService;
  let holdings: ReturnType<typeof signal<HoldingSummaryResponse[]>>;
  const accounts = [
    { id: '1', name: 'Brokerage portfolio', type: 'BROKERAGE' as const, balance: 0 },
    { id: '2', name: 'Retirement portfolio', type: 'RETIREMENT' as const, balance: 0 },
  ];

  beforeEach(async () => {
    holdings = signal([
      holding(),
      holding({ holdingId: 'h-2', quantity: 20, avgCost: 150 }),
      holding({ holdingId: 'h-3', portfolioId: '2', quantity: 5, avgCost: 120 }),
    ]);
    await TestBed.configureTestingModule({
      imports: [HoldingsList],
      providers: [
        { provide: HoldingsService, useValue: { holdings } },
        { provide: AccountsService, useValue: { accounts: signal(accounts) } },
        { provide: PortfolioApiService, useValue: { getTotalValue: () => of(3500) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HoldingsList);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    selectionService = TestBed.inject(AccountSelectionService);
    await fixture.whenStable();
  });

  it('combines matching holdings across portfolios without discarding trades', () => {
    const [row] = component.rows();
    expect(component.rows()).toHaveLength(1);
    expect(row.trades.map((trade) => trade.holdingId)).toEqual(['h-1', 'h-2', 'h-3']);
    expect(row.quantity).toBe(35);
    expect(row.marketValue).toBe(7000);
    expect(row.dayChangeTotal).toBe(70);
    expect(row.avgCost).toBeCloseTo(4600 / 35);
    expect(row.totalGainPct).toBeCloseTo(2400 / 4600);
    expect(element.querySelectorAll('.holdings-list__toggle')).toHaveLength(1);
    expect(element.querySelector('.holdings-list__subtitle')?.textContent).toContain('1 position');
    expect(element.querySelector('.holdings-list__subtitle')?.textContent).toContain('3 trades');
    expect(element.querySelector('img')).toBeNull();
  });

  it('filters by selected portfolio before grouping and resets expansion', async () => {
    component.toggleGroup(component.rows()[0].groupKey);
    selectionService.onAccountSelected(accounts[1]);
    await fixture.whenStable();

    expect(component.rows()).toHaveLength(1);
    expect(component.rows()[0].quantity).toBe(5);
    expect(component.rows()[0].trades.map((trade) => trade.holdingId)).toEqual(['h-3']);
    expect(component.totalMarketValue()).toBe(3500);
    expect(component.expandedGroups().size).toBe(0);
    expect(element.querySelectorAll('.holdings-list__trade')).toHaveLength(0);
  });

  it('keeps different symbols and instrument types separate', () => {
    holdings.set([
      holding(),
      holding({ holdingId: 'h-2', instrumentType: 'ETF' }),
      holding({ holdingId: 'h-3', symbol: 'AAPL' }),
    ]);
    fixture.detectChanges();

    expect(component.rows()).toHaveLength(3);
    expect(new Set(component.rows().map((row) => row.groupKey)).size).toBe(3);
    expect(element.querySelectorAll('.holdings-list__toggle')).toHaveLength(3);
  });

  it('expands and collapses all original trades with trade details', () => {
    const button = element.querySelector<HTMLButtonElement>('.holdings-list__toggle')!;
    expect(button.type).toBe('button');
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelectorAll('.holdings-list__trade')).toHaveLength(0);

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    const details = element.querySelectorAll('.holdings-list__trade');
    expect(details).toHaveLength(3);
    expect(element.querySelectorAll('.holdings-list__trade-header span')).toHaveLength(7);
    expect(element.querySelector('.holdings-list__trade-header')?.textContent).toContain('Price');
    expect(element.querySelector('.holdings-list__trade-header')?.textContent).toContain(
      'Quantity',
    );
    expect(element.querySelector('.holdings-list__trade-header')?.textContent).toContain('Value');
    expect(element.querySelector('.holdings-list__trade-header')?.textContent).toContain('Date');
    expect(details[0].textContent).toContain('Brokerage portfolio');
    expect(details[0].textContent).toContain('h-1');
    expect(details[0].textContent).toContain('Avg cost $100.00');
    expect(details[0].querySelector('.holdings-list__trade-price')?.textContent).toContain(
      '$95.00',
    );
    expect(details[0].querySelector('.holdings-list__quantity')?.textContent).toContain('10');
    expect(details[0].querySelector('.holdings-list__value')?.textContent).toContain('$950.00');
    expect(details[0].querySelector('.holdings-list__trade-date')?.textContent).toContain(
      'Oct 21, 2026',
    );
    expect(details[1].textContent).toContain('Avg cost $150.00');
    expect(details[2].textContent).toContain('Retirement portfolio');
    expect(component.totalDayChange()).toBe(70);
    expect(component.totalDayChangePct()).toBeCloseTo(70 / 6930);
    expect(component.totalMarketValue()).toBe(7000);

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelectorAll('.holdings-list__trade')).toHaveLength(0);
  });

  it('shows placeholders when purchase price or date are missing', () => {
    holdings.set([holding({ avgCost: undefined, dateCreated: undefined })]);
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.holdings-list__toggle')!.click();
    fixture.detectChanges();

    const detail = element.querySelector('.holdings-list__trade')!;
    expect(detail.querySelector('.holdings-list__trade-price')?.textContent?.trim()).toBe('\u2014');
    expect(detail.querySelector('.holdings-list__value')?.textContent?.trim()).toBe('\u2014');
    expect(detail.querySelector('.holdings-list__trade-date')?.textContent?.trim()).toBe('\u2014');
  });

  it('allows multiple groups to expand independently', () => {
    holdings.update((rows) => [...rows, holding({ holdingId: 'h-4', symbol: 'AAPL' })]);
    fixture.detectChanges();
    const buttons = element.querySelectorAll<HTMLButtonElement>('.holdings-list__toggle');
    buttons[0].click();
    buttons[1].click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.holdings-list__trade')).toHaveLength(4);
    buttons[0].click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.holdings-list__trade')).toHaveLength(1);
    expect(buttons[1].getAttribute('aria-expanded')).toBe('true');
  });

  it('limits the compact list to five groups, not five trades', () => {
    holdings.update((rows) => [
      ...rows,
      ...Array.from({ length: 6 }, (_, index) =>
        holding({ holdingId: `extra-${index}`, symbol: `SYM${index}` }),
      ),
    ]);
    fixture.componentRef.setInput('showLess', true);
    fixture.detectChanges();
    expect(component.rows()).toHaveLength(7);
    expect(element.querySelectorAll('.holdings-list__toggle')).toHaveLength(5);
    element.querySelector<HTMLButtonElement>('.holdings-list__toggle')!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.holdings-list__trade')).toHaveLength(3);
    expect(component.tradeCount()).toBe(9);
    fixture.componentRef.setInput('showLess', false);
    fixture.detectChanges();
    expect(element.querySelectorAll('.holdings-list__toggle')).toHaveLength(7);
  });

  it('updates period change and preserves expansion, including missing history', () => {
    element.querySelector<HTMLButtonElement>('.holdings-list__toggle')!.click();
    fixture.detectChanges();
    const select = element.querySelector<HTMLSelectElement>('select')!;
    select.value = '1M';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.rows()[0].selectedPeriodChangePct).toBe(0.02);
    expect(element.querySelector('.holdings-list__period-change')?.textContent).toContain('+2.00%');
    expect(element.querySelectorAll('.holdings-list__trade')).toHaveLength(3);

    select.value = '5D';
    select.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(component.rows()[0].selectedPeriodChangePct).toBeNull();
    expect(element.querySelector('.holdings-list__period-change')?.textContent?.trim()).toBe(
      '\u2014',
    );
  });

  it('uses the first instrument quote but sums actual values for differing snapshots', () => {
    holdings.set([
      holding(),
      holding({
        holdingId: 'h-2',
        quantity: 20,
        currentPrice: 210,
        dayChangeValue: 3,
        weekLow52: 90,
        weekHigh52: 310,
      }),
    ]);
    const [row] = component.rows();
    expect(row.currentPrice).toBe(200);
    expect(row.dayChangeValue).toBe(2);
    expect(row.weekLow52).toBe(100);
    expect(row.weekHigh52).toBe(300);
    expect(row.marketValue).toBe(6200);
    expect(row.dayChangeTotal).toBe(80);
    expect(row.totalGainPct).toBeCloseTo(3200 / 3000);
  });

  it('preserves cash valuation and daily change rules', () => {
    holdings.set([
      holding({ instrumentType: 'CASH', symbol: 'USD', quantity: 100, currentPrice: 1 }),
      holding({
        holdingId: 'h-2',
        instrumentType: 'CASH',
        symbol: 'USD',
        quantity: 50,
        currentPrice: 1,
      }),
    ]);
    fixture.detectChanges();
    const [row] = component.rows();
    expect(row.quantity).toBe(150);
    expect(row.marketValue).toBe(150);
    expect(row.dayChangeTotal).toBe(4);
    expect(row.totalGainPct).toBe(0);
    expect(row.selectedPeriodChangePct).toBe(0);
    expect(row.weekRangePosition).toBe(50);
    expect(element.querySelector('.holdings-list__price')?.textContent).toContain('Cash');
  });

  it('shows a dash instead of an invalid return when cost basis is zero', () => {
    holdings.set([holding({ avgCost: 0 })]);
    fixture.detectChanges();
    expect(component.rows()[0].totalGainPct).toBeNull();
    expect(element.querySelector('.holdings-list__total-change')?.textContent?.trim()).toBe(
      '\u2014',
    );
    expect(component.rows()[0].trades[0].totalGainPct).toBeNull();
  });

  it('handles zero quantities without dividing by zero', () => {
    holdings.set([holding({ quantity: 0 })]);
    expect(component.rows()[0].quantity).toBe(0);
    expect(component.rows()[0].avgCost).toBe(0);
    expect(component.rows()[0].totalGainPct).toBeNull();
  });

  it('reacts to new holdings while a group is expanded', () => {
    element.querySelector<HTMLButtonElement>('.holdings-list__toggle')!.click();
    holdings.update((rows) => [...rows, holding({ holdingId: 'h-4' })]);
    fixture.detectChanges();
    expect(component.rows()[0].quantity).toBe(45);
    expect(element.querySelectorAll('.holdings-list__trade')).toHaveLength(4);
  });

  it('shows the empty state when the selected portfolio has no holdings', async () => {
    holdings.set([]);
    await fixture.whenStable();
    expect(element.querySelector('.holdings-list__empty')?.textContent).toContain(
      'No holdings in this portfolio yet.',
    );
    expect(element.querySelectorAll('.holdings-list__toggle')).toHaveLength(0);
    expect(component.totalDayChange()).toBe(0);
  });
});
