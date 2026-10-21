import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InstrumentSearch } from './instrument-search';

describe('InstrumentSearch', () => {
  let component: InstrumentSearch;
  let fixture: ComponentFixture<InstrumentSearch>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstrumentSearch],
    }).compileComponents();

    fixture = TestBed.createComponent(InstrumentSearch);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
