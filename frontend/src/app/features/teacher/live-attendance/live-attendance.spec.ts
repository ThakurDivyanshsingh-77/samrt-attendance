import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LiveAttendance } from './live-attendance';

describe('LiveAttendance', () => {
  let component: LiveAttendance;
  let fixture: ComponentFixture<LiveAttendance>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LiveAttendance]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LiveAttendance);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
