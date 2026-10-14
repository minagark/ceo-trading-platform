import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TradeConfirmation } from './trade-confirmation';

describe('TradeConfirmation', () => {
  let component: TradeConfirmation;
  let fixture: ComponentFixture<TradeConfirmation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TradeConfirmation],
    }).compileComponents();

    fixture = TestBed.createComponent(TradeConfirmation);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('success', true);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
