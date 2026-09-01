import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TransactionHistory } from './transaction-history';

describe('TransactionHistory', () => {
  let component: TransactionHistory;
  let fixture: ComponentFixture<TransactionHistory>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionHistory],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionHistory);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
