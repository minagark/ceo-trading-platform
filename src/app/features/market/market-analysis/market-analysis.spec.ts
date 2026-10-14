import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MarketAnalysis } from './market-analysis';

describe('MarketAnalysis', () => {
  let component: MarketAnalysis;
  let fixture: ComponentFixture<MarketAnalysis>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketAnalysis],
    }).compileComponents();

    fixture = TestBed.createComponent(MarketAnalysis);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
