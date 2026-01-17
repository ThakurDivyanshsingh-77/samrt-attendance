import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { Subscription, interval } from 'rxjs';

/* ======================
   TYPES (CLEAN)
====================== */
interface ActiveSession {
  subject: { name: string };
  teacher: { name: string };
  expiryTime: string;
}

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
  templateUrl: './mark-attendance.html'
})
export class MarkAttendanceComponent implements OnInit, OnDestroy {

  /* ======================
     FORM
  ====================== */
  codeControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^\d{4}$/)
  ]);

  /* ======================
     STATE
  ====================== */
  activeSessions: ActiveSession[] = [];
  loading = false;
  submitting = false;

  private refreshSub?: Subscription;

  constructor(
    private attendanceService: AttendanceService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  /* ======================
     LIFECYCLE
  ====================== */
  ngOnInit(): void {
    this.fetchActiveSessions();

    // Auto refresh every 30 sec
    this.refreshSub = interval(30000).subscribe(() => {
      this.fetchActiveSessions();
    });
  }

  ngOnDestroy(): void {
    this.refreshSub?.unsubscribe();
  }

  /* ======================
     API CALLS
  ====================== */
  fetchActiveSessions(): void {
    this.loading = true;

    this.attendanceService.getActiveSessions().subscribe({
      next: (res) => {
        this.activeSessions = res.sessions ?? [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.showMessage('Failed to load sessions');
      }
    });
  }

  submitCode(): void {
    if (this.codeControl.invalid) return;

    this.submitting = true;
    const code = this.codeControl.value!;

    this.attendanceService.markAttendance(code).subscribe({
      next: () => {
        this.submitting = false;
        this.showMessage('Attendance marked successfully');
        this.codeControl.reset();
        this.router.navigate(['/student/dashboard']);
      },
      error: (err) => {
        this.submitting = false;
        this.showMessage(err.error?.message || 'Invalid session code');
      }
    });
  }

  /* ======================
     HELPERS
  ====================== */
  getTimeRemaining(expiryTime: string): string {
    const diff = new Date(expiryTime).getTime() - Date.now();
    if (diff <= 0) return 'Expired';

    const min = Math.floor(diff / 60000);
    const sec = Math.floor((diff % 60000) / 1000);
    return `${min}m ${sec}s`;
  }

  refreshSessions(): void {
    this.fetchActiveSessions();
  }

  goBack(): void {
    this.router.navigate(['/student/dashboard']);
  }

  private showMessage(msg: string): void {
    this.snackBar.open(msg, 'Close', { duration: 3000 });
  }
}
