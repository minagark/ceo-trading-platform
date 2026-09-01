import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PreviewPage } from './preview-page';
import { TradeRequest } from '../trade-screen/trade-screen';
import { Account } from '../accounts-list/accounts-list';

describe('PreviewPage', () => {
  let component: PreviewPage;
  let fixture: ComponentFixture<PreviewPage>;

  const draft: TradeRequest = {
    type: 'buy',
    account: 'acc-1',
    cashAvailable: 1000,
    stock: {
      abbrName: 'AAPL',
      fullName: 'Apple Inc.',
      price: 227.52,
      increaseValue: 1.32,
      increasePCT: 0.0058,
      volume: 48213000,
      ask: 227.55,
      bid: 227.49,
    },
    amountType: 'shares',
    amount: 10,
    orderType: 'market',
    timeInForce: 'day',
  };

  const account: Account = {
    id: 'acc-1',
    name: 'Individual',
    type: 'Individual',
    balance: 1000,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PreviewPage],
    }).compileComponents();

    fixture = TestBed.createComponent(PreviewPage);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('draft', draft);
    fixture.componentRef.setInput('account', account);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
