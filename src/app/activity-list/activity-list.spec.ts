import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivityList } from './activity-list';

describe('ActivityList', () => {
  let component: ActivityList;
  let fixture: ComponentFixture<ActivityList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActivityList],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityList);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
