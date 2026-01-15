import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

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
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatFormFieldModule,
    MatSelectModule,
    MatButtonModule,
    RouterModule  
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class TeacherDashboardComponent implements OnInit {

  userName = '';

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

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.userName = user?.name || '';
  }

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

  onSemesterChange(): void {
    const year = this.yearControl.value;
    const semester = this.semesterControl.value;
    if (!year || !semester) return;

    this.subjects = [];
    this.subjectControl.setValue(null);

    this.api.get<any>('/subjects', {
      year,
      semester,
      _ts: Date.now()
    }).subscribe({
      next: (res) => {
        this.subjects = [...(res.subjects || [])];
      },
      error: () => {
        this.subjects = [];
      }
    });
  }

  startAttendance(): void {
    if (!this.subjectControl.value) return;

    this.router.navigate(['/teacher/attendance-session'], {
      queryParams: {
        subjectId: this.subjectControl.value,
        year: this.yearControl.value,
        semester: this.semesterControl.value
      }
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
