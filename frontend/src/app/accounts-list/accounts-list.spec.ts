import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountsList } from './accounts-list';

describe('AccountsList', () => {
  let component: AccountsList;
  let fixture: ComponentFixture<AccountsList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountsList],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountsList);
    component = fixture.componentInstance;
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
