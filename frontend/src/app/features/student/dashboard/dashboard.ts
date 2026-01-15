
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService, User } from '../../../core/services/auth';
import { AttendanceService } from '../../../core/services/attendance.service';

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule
  ],
  template: `
    <mat-toolbar color="primary">
      <span>Student Dashboard</span>
      <span class="spacer"></span>
      <span>{{user?.name}}</span>
      <button mat-icon-button [matMenuTriggerFor]="menu">
        <mat-icon>account_circle</mat-icon>
      </button>
      <mat-menu #menu="matMenu">
        <button mat-menu-item (click)="logout()">
          <mat-icon>exit_to_app</mat-icon>
          <span>Logout</span>
        </button>
      </mat-menu>
    </mat-toolbar>

    <div class="dashboard-container">
      <div class="profile-section">
        <mat-card>
          <mat-card-content>
            <h2>Welcome, {{user?.name}}!</h2>
            <p><strong>Roll Number:</strong> {{user?.rollNumber}}</p>
            <p><strong>Year:</strong> {{user?.year}}</p>
            <p><strong>Semester:</strong> {{user?.semester}}</p>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="stats-section" *ngIf="stats">
        <mat-card>
          <mat-card-header>
            <mat-card-title>Overall Attendance</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="circular-progress">
              <h1 [class.good]="stats.overall.percentage >= 75" 
                  [class.warning]="stats.overall.percentage >= 60 && stats.overall.percentage < 75"
                  [class.danger]="stats.overall.percentage < 60">
                {{stats.overall.percentage}}%
              </h1>
              <p>{{stats.overall.attended}} / {{stats.overall.total}} classes</p>
            </div>
          </mat-card-content>
        </mat-card>
      </div>

      <div class="actions-section">
        <button mat-raised-button color="primary" class="action-btn" (click)="markAttendance()">
          <mat-icon>how_to_reg</mat-icon>
          Mark Attendance
        </button>

        <button mat-raised-button color="accent" class="action-btn" (click)="viewReports()">
          <mat-icon>assessment</mat-icon>
          View Reports
        </button>

        <button mat-raised-button class="action-btn" (click)="viewHistory()">
          <mat-icon>history</mat-icon>
          Attendance History
        </button>
      </div>

      <div class="subjects-section" *ngIf="stats">
        <h3>Subject-wise Attendance</h3>
        <div class="subject-cards">
          <mat-card *ngFor="let subject of stats.subjectStats" class="subject-card">
            <mat-card-content>
              <h4>{{subject.subject.name}}</h4>
              <p class="subject-code">{{subject.subject.code}}</p>
              <div class="progress-bar">
                <div class="progress-fill" 
                     [style.width.%]="subject.percentage"
                     [class.good]="subject.percentage >= 75"
                     [class.warning]="subject.percentage >= 60 && subject.percentage < 75"
                     [class.danger]="subject.percentage < 60">
                </div>
              </div>
              <p class="attendance-text">
                {{subject.percentage}}% ({{subject.attended}}/{{subject.total}})
              </p>
            </mat-card-content>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .spacer {
      flex: 1 1 auto;
    }

    .dashboard-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }

    .profile-section mat-card {
      margin-bottom: 20px;
    }

    .profile-section h2 {
      margin: 0 0 16px 0;
      color: #667eea;
    }

    .profile-section p {
      margin: 8px 0;
    }

    .stats-section {
      margin-bottom: 30px;
    }

    .circular-progress {
      text-align: center;
      padding: 20px;
    }

    .circular-progress h1 {
      font-size: 64px;
      margin: 0;
    }

    .circular-progress h1.good {
      color: #4caf50;
    }

    .circular-progress h1.warning {
      color: #ff9800;
    }

    .circular-progress h1.danger {
      color: #f44336;
    }

    .actions-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-bottom: 30px;
    }

    .action-btn {
      height: 80px;
      font-size: 16px;
    }

    .action-btn mat-icon {
      margin-right: 8px;
    }

    .subjects-section h3 {
      margin-bottom: 20px;
    }

    .subject-cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 16px;
    }

    .subject-card h4 {
      margin: 0 0 4px 0;
      color: #333;
    }

    .subject-code {
      color: #666;
      font-size: 14px;
      margin: 0 0 12px 0;
    }

    .progress-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .progress-fill.good {
      background: #4caf50;
    }

    .progress-fill.warning {
      background: #ff9800;
    }

    .progress-fill.danger {
      background: #f44336;
    }

    .attendance-text {
      text-align: center;
      margin: 0;
      font-weight: 500;
    }
  `]
})
export class StudentDashboardComponent implements OnInit {
  user: User | null = null;
  stats: any = null;

  constructor(
    private authService: AuthService,
    private attendanceService: AttendanceService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    this.loadStats();
  }

  loadStats(): void {
    this.attendanceService.getStudentStats().subscribe({
      next: (response) => {
        this.stats = response;
      },
      error: (error) => {
        console.error('Error loading stats:', error);
      }
    });
  }

  markAttendance(): void {
    this.router.navigate(['/student/mark-attendance']);
  }

  viewReports(): void {
    this.router.navigate(['/student/reports']);
  }

  viewHistory(): void {
    this.router.navigate(['/student/history']);
  }

  logout(): void {
    this.authService.logout();
  }
}