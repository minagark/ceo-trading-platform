import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountActivity } from './account-activity';

describe('AccountActivity', () => {
  let component: AccountActivity;
  let fixture: ComponentFixture<AccountActivity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountActivity],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountActivity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
