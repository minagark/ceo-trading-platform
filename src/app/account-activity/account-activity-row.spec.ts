import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccountActivityRow } from './account-activity-row';
import { Order } from './account-activity.service';

const mockOrder: Order = {
  orderId: 'order-1',
  instrumentId: 'inst-1',
  holdingId: 'hold-1',
  instrumentType: 'equity',
  action: 'buy',
  quotedPrice: 100,
  actualPrice: 100.5,
  amount: 10,
  time: '2026-09-01T00:00:00Z',
  status: 'fulfilled',
};

describe('AccountActivityRow', () => {
  let component: AccountActivityRow;
  let fixture: ComponentFixture<AccountActivityRow>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountActivityRow],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountActivityRow);
    fixture.componentRef.setInput('order', mockOrder);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
