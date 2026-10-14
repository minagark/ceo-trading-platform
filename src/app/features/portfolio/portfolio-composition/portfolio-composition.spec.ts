import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioComposition } from './portfolio-composition';

describe('PortfolioComposition', () => {
  let component: PortfolioComposition;
  let fixture: ComponentFixture<PortfolioComposition>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioComposition],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioComposition);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
