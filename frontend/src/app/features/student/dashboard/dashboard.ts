import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService, User } from '../../../core/services/auth';
import { AttendanceService } from '../../../core/services/attendance.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule
  ],
  templateUrl: './dashboard.html'
})
export class StudentDashboardComponent implements OnInit {

  user: User | null = null;
  stats: any;

  constructor(
    private auth: AuthService,
    private attendance: AttendanceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.auth.getCurrentUser();
    this.attendance.getStudentStats().subscribe({
      next: res => this.stats = res,
      error: err => console.error(err)
    });
  }

  markAttendance() {
    this.router.navigate(['/student/mark-attendance']);
  }

  viewReports() {
    this.router.navigate(['/student/reports']);
  }

  viewHistory() {
    this.router.navigate(['/student/history']);
  }

  logout() {
    this.auth.logout();
  }
}
