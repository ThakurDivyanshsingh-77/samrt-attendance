
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { AttendanceService } from '../../../core/services/attendance.service';
import { interval } from 'rxjs';

@Component({
  selector: 'app-mark-attendance',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatListModule,
    MatIconModule
  ],
  template: `
    <div class="container">
      <button mat-button (click)="goBack()" class="back-btn">
        <mat-icon>arrow_back</mat-icon>
        Back
      </button>

      <mat-card class="main-card">
        <mat-card-header>
          <mat-card-title>Mark Attendance</mat-card-title>
        </mat-card-header>

        <mat-card-content>
          <div class="active-sessions" *ngIf="activeSessions.length > 0">
            <h3>Active Sessions</h3>
            <mat-list>
              <mat-list-item *ngFor="let session of activeSessions">
                <mat-icon matListItemIcon>class</mat-icon>
                <div matListItemTitle>{{session.subject.name}}</div>
                <div matListItemLine>{{session.teacher.name}} - Expires in {{getTimeRemaining(session.expiryTime)}}</div>
              </mat-list-item>
            </mat-list>
          </div>

          <div class="no-sessions" *ngIf="activeSessions.length === 0 && !loading">
            <mat-icon>info</mat-icon>
            <p>No active sessions at the moment</p>
            <button mat-button color="primary" (click)="refreshSessions()">
              Refresh
            </button>
          </div>

          <div class="code-input">
            <h3>Enter Session Code</h3>
            <mat-form-field appearance="outline" class="code-field">
              <mat-label>4-Digit Code</mat-label>
              <input 
                matInput 
                [formControl]="codeControl" 
                maxlength="4"
                placeholder="1234"
                (keyup.enter)="submitCode()">
              <mat-error *ngIf="codeControl.hasError('required')">
                Code is required
              </mat-error>
              <mat-error *ngIf="codeControl.hasError('pattern')">
                Code must be 4 digits
              </mat-error>
            </mat-form-field>

            <button 
              mat-raised-button 
              color="primary" 
              (click)="submitCode()"
              [disabled]="codeControl.invalid || submitting">
              <span *ngIf="!submitting">Submit</span>
              <mat-spinner *ngIf="submitting" diameter="20"></mat-spinner>
            </button>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      max-width: 600px;
      margin: 20px auto;
      padding: 20px;
    }

    .back-btn {
      margin-bottom: 16px;
    }

    .main-card {
      padding: 20px;
    }

    .active-sessions {
      margin-bottom: 30px;
    }

    .active-sessions h3 {
      margin-bottom: 16px;
    }

    .no-sessions {
      text-align: center;
      padding: 40px 20px;
      color: #999;
    }

    .no-sessions mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
    }

    .code-input {
      text-align: center;
    }

    .code-input h3 {
      margin-bottom: 20px;
    }

    .code-field {
      width: 200px;
      margin-bottom: 20px;
    }

    .code-field input {
      text-align: center;
      font-size: 24px;
      letter-spacing: 10px;
    }

    button[type="submit"] {
      width: 200px;
      height: 48px;
    }
  `]
})
export class MarkAttendanceComponent implements OnInit {
  codeControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{4}$/)
  ]);
  
  activeSessions: any[] = [];
  loading = false;
  submitting = false;

  constructor(
    private attendanceService: AttendanceService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadActiveSessions();
    
    // Auto-refresh every 30 seconds
    interval(30000).subscribe(() => {
      this.loadActiveSessions();
    });
  }

  loadActiveSessions(): void {
    this.loading = true;
    this.attendanceService.getActiveSessions().subscribe({
      next: (response) => {
        this.activeSessions = response.sessions || [];
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading sessions:', error);
      }
    });
  }

  refreshSessions(): void {
    this.loadActiveSessions();
  }

  submitCode(): void {
    if (this.codeControl.valid) {
      this.submitting = true;
      const code = this.codeControl.value || '';

      this.attendanceService.markAttendance(code).subscribe({
        next: (response) => {
          this.submitting = false;
          this.snackBar.open('Attendance marked successfully!', 'Close', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          this.codeControl.reset();
          this.router.navigate(['/student/dashboard']);
        },
        error: (error) => {
          this.submitting = false;
          this.snackBar.open(error.error?.message || 'Failed to mark attendance', 'Close', { 
            duration: 3000 
          });
        }
      });
    }
  }

  getTimeRemaining(expiryTime: string): string {
    const now = new Date().getTime();
    const expiry = new Date(expiryTime).getTime();
    const diff = expiry - now;

    if (diff <= 0) return 'Expired';

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    return `${minutes}m ${seconds}s`;
  }

  goBack(): void {
    this.router.navigate(['/student/dashboard']);
  }
}