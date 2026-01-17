import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';

import { AuthService } from '../../../core/services/auth';
import { ApiService } from '../../../core/services/api';

interface Subject {
  _id: string;
  name: string;
  code: string;
  year: number;
  semester: number;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class TeacherDashboardComponent implements OnInit {

  userName = '';

  // 🎓 FORM CONTROLS
  yearControl = new FormControl<number | null>(null);
  semesterControl = new FormControl<number | null>(null);
  subjectControl = new FormControl<string | null>(null);

  semesters: number[] = [];
  subjects: Subject[] = [];

  constructor(
    private authService: AuthService,
    private api: ApiService,
    private router: Router
  ) {}

  // =============================
  // INIT
  // =============================
  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.name || '';
  }

  // =============================
  // YEAR CHANGE
  // =============================
  onYearChange(): void {
    const year = this.yearControl.value;

    this.semesters = [];
    this.subjects = [];
    this.semesterControl.setValue(null);
    this.subjectControl.setValue(null);

    if (year === 1) this.semesters = [1, 2];
    if (year === 2) this.semesters = [3, 4];
    if (year === 3) this.semesters = [5, 6];
  }

  // =============================
  // SEMESTER CHANGE → LOAD SUBJECTS
  // =============================
  onSemesterChange(): void {
    const year = this.yearControl.value;
    const semester = this.semesterControl.value;

    if (!year || !semester) return;

    this.subjects = [];
    this.subjectControl.setValue(null);

    this.api.get<any>('/subjects', {
      year,
      semester,
      _ts: Date.now() // cache bypass
    }).subscribe({
      next: (res) => {
        this.subjects = res?.subjects ?? [];
      },
      error: () => {
        this.subjects = [];
      }
    });
  }

  // =============================
  // 🚀 START ATTENDANCE (FIXED)
  // =============================
  startAttendance(): void {
    const subjectId = this.subjectControl.value;
    const year = this.yearControl.value;
    const semester = this.semesterControl.value;

    // 🔒 HARD VALIDATION (IMPORTANT FIX)
    if (!subjectId || !year || !semester) {
      return;
    }

    // ✅ SAFE NAVIGATION (no double init)
    const urlTree = this.router.createUrlTree(
      ['/teacher/attendance-session'],
      {
        queryParams: {
          subjectId,
          year,
          semester
        }
      }
    );

    this.router.navigateByUrl(urlTree);
  }

  // =============================
  // LOGOUT
  // =============================
  logout(): void {
    this.authService.logout();
  }
}
