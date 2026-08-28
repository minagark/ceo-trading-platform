import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockDisplay } from './stock-display';

describe('Stock Display', () => {
  let component: StockDisplay;
  let fixture: ComponentFixture<StockDisplay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StockDisplay],
    }).compileComponents();

    fixture = TestBed.createComponent(StockDisplay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});