import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PortfolioPrompt } from './portfolio-prompt';

describe('PortfolioPrompt', () => {
  let component: PortfolioPrompt;
  let fixture: ComponentFixture<PortfolioPrompt>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortfolioPrompt],
    }).compileComponents();

    fixture = TestBed.createComponent(PortfolioPrompt);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
