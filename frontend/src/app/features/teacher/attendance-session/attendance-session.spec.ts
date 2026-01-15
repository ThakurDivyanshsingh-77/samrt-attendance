import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AttendanceSession } from './attendance-session';

describe('AttendanceSession', () => {
  let component: AttendanceSession;
  let fixture: ComponentFixture<AttendanceSession>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AttendanceSession]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AttendanceSession);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
