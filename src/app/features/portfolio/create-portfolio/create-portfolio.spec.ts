import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreatePortfolio } from './create-portfolio';

describe('CreatePortfolio', () => {
  let component: CreatePortfolio;
  let fixture: ComponentFixture<CreatePortfolio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePortfolio],
    }).compileComponents();

    fixture = TestBed.createComponent(CreatePortfolio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
