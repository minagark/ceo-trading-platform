import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Trades } from './trades';

describe('Trades', () => {
  let component: Trades;
  let fixture: ComponentFixture<Trades>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Trades],
    }).compileComponents();

    fixture = TestBed.createComponent(Trades);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
