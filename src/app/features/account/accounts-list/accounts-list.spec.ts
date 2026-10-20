import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountsList } from './accounts-list';
import { AccountsService } from './accounts.service';
import { AccountSelectionService } from './account-selection.service';

describe('AccountsList', () => {
  let component: AccountsList;
  let fixture: ComponentFixture<AccountsList>;
  let accountsService: AccountsService;
  let accountSelectionService: AccountSelectionService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountsList],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountsList);
    component = fixture.componentInstance;
    accountsService = TestBed.inject(AccountsService);
    accountSelectionService = TestBed.inject(AccountSelectionService);
    accountsService.accounts.set([
      { id: '1', name: 'Brokerage portfolio', type: 'BROKERAGE', balance: 1000 },
      { id: '2', name: 'Retirement portfolio', type: 'RETIREMENT', balance: 2000 },
    ]);
    accountSelectionService.onAccountSelected(null);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render one row per account plus an All Accounts row', () => {
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.accounts-list__item');
    expect(rows.length).toBe(component.accounts().length + 1);
  });

  it('should select an account on click', () => {
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.accounts-list__item');
    rows[1].click();
    fixture.detectChanges();
    expect(component.selectedAccountId()).toBe(component.accounts()[0].id);
  });

  it('should select all accounts on click', () => {
    fixture.detectChanges();
    const rows = fixture.nativeElement.querySelectorAll('.accounts-list__item');
    rows[1].click();
    fixture.detectChanges();
    rows[0].click();
    fixture.detectChanges();
    expect(component.selectedAccountId()).toBeNull();
  });
});
