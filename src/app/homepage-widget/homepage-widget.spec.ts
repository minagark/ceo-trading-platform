import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HomepageWidget } from './homepage-widget';

describe('HomepageWidget', () => {
  let component: HomepageWidget;
  let fixture: ComponentFixture<HomepageWidget>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HomepageWidget],
    }).compileComponents();

    fixture = TestBed.createComponent(HomepageWidget);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
