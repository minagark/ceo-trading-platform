import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmPortfolio } from './confirm-portfolio';

describe('ConfirmPortfolio', () => {
  let component: ConfirmPortfolio;
  let fixture: ComponentFixture<ConfirmPortfolio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmPortfolio],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmPortfolio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
