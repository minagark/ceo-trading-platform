import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioPerformance } from './portfolio-performance';

describe('PortfolioPerformance', () => {
  let component: PortfolioPerformance;
  let fixture: ComponentFixture<PortfolioPerformance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioPerformance],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioPerformance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
