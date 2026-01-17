import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AttendanceService } from '../../../core/services/attendance.service';
import { SocketService } from '../../../core/services/socket'; // Ensure path is correct
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-attendance-session',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatTableModule, MatSnackBarModule, MatProgressSpinnerModule, MatIconModule],
  template: `
    <div class="session-container">
      <mat-card class="session-card">
        <mat-card-header> <mat-card-title>Attendance Session</mat-card-title> </mat-card-header>
        <mat-card-content>
          
          <div *ngIf="loading" class="loading-container">
            <mat-spinner diameter="50"></mat-spinner>
            <p class="loading-text">Starting session...</p>
            <button mat-button (click)="goBack()" class="cancel-btn">Cancel</button>
          </div>

          <div *ngIf="!loading && error" class="error-container">
            <mat-icon class="error-icon">error_outline</mat-icon>
            <h3>Failed to Start Session</h3>
            <p>{{error}}</p>
            <button mat-raised-button color="primary" (click)="goBack()">Back to Dashboard</button>
          </div>

          <div *ngIf="!loading && !error && session" class="session-info">
            <div class="code-display">
              <h1 class="session-code">{{session.sessionCode}}</h1>
              <p class="code-instruction">Share code with students</p>
              <p class="subject-info" *ngIf="session.subject">{{session.subject.name}} ({{session.subject.code}})</p>
            </div>
            
            <div class="timer-display" [class.expiring]="timeRemaining <= 60">
              <mat-icon>schedule</mat-icon> <span>Time Remaining: {{formatTime(timeRemaining)}}</span>
            </div>

            <div class="stats">
              <mat-card class="stat-card">
                <h3>{{attendanceList.length}}</h3> <p>Students Present</p>
              </mat-card>
            </div>

            <div class="attendance-list">
              <h3>Live Attendance</h3>
              <div *ngIf="attendanceList.length > 0" class="table-container">
                <table mat-table [dataSource]="attendanceList" class="attendance-table">
                  <ng-container matColumnDef="rollNumber">
                    <th mat-header-cell *matHeaderCellDef>Roll No</th> <td mat-cell *matCellDef="let e">{{e.rollNumber}}</td>
                  </ng-container>
                  <ng-container matColumnDef="studentName">
                    <th mat-header-cell *matHeaderCellDef>Name</th> <td mat-cell *matCellDef="let e">{{e.studentName}}</td>
                  </ng-container>
                  <ng-container matColumnDef="markedAt">
                    <th mat-header-cell *matHeaderCellDef>Time</th> <td mat-cell *matCellDef="let e">{{formatDateTime(e.markedAt)}}</td>
                  </ng-container>
                  <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                  <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
                </table>
              </div>
              <div *ngIf="attendanceList.length === 0" class="no-data"><p>Waiting for students...</p></div>
            </div>

            <div class="action-buttons">
              <button mat-raised-button color="warn" (click)="endSession()">End Session</button>
              <button mat-stroked-button (click)="goBack()">Back</button>
            </div>
          </div>

        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .session-container { padding: 20px; max-width: 800px; margin: 0 auto; }
    .loading-container, .error-container { text-align: center; padding: 40px; }
    .code-display { text-align: center; background: #673ab7; color: white; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
    .session-code { font-size: 60px; font-weight: bold; margin: 10px 0; letter-spacing: 10px; }
    .timer-display { display: flex; justify-content: center; align-items: center; gap: 10px; font-size: 24px; padding: 15px; background: #f5f5f5; border-radius: 8px; margin-bottom: 20px; }
    .timer-display.expiring { color: red; background: #ffebee; }
    .attendance-table { width: 100%; }
    .action-buttons { display: flex; gap: 10px; justify-content: center; margin-top: 20px; }
  `]
})
export class AttendanceSessionComponent implements OnInit, OnDestroy {
  session: SessionData | null = null;
  loading = true;

  // ✅ SINGLE SOURCE OF TRUTH
  sessionId!: string;
  sessionCode = '';
  expiryTime!: string;

  attendanceList: any[] = [];
  displayedColumns = ['rollNumber', 'studentName', 'markedAt'];

  timeRemaining = 600; // 10 minutes

  private timerSub?: Subscription;
  private socketSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private socketService: SocketService,
    private snackBar: MatSnackBar
  ) {}

  // ===============================
  // INIT
  // ===============================
  ngOnInit(): void {
    const subjectId = this.route.snapshot.queryParamMap.get('subjectId');
    const year = Number(this.route.snapshot.queryParamMap.get('year'));
    const semester = Number(this.route.snapshot.queryParamMap.get('semester'));

    if (!subjectId || !year || !semester) {
      this.goBack();
      return;
    }

    this.startSession(subjectId, year, semester);
  }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
    this.socketSub?.unsubscribe();

    if (this.sessionId) {
      this.socketService.leaveSession(this.sessionId);
    }
  }

  // ===============================
  // START SESSION (🔥 FIXED)
  // ===============================
  startSession(subjectId: string, year: number, semester: number): void {
    this.attendanceService.startSession(subjectId, year, semester).subscribe({
      next: (res) => {
        // ✅ CORRECT MAPPING
        const session = res.session;

        this.sessionId = session._id;
        this.sessionCode = session.sessionCode;
        this.expiryTime = session.expiryTime;

        console.log('SESSION 👉', session);
        console.log('SESSION CODE 👉', this.sessionCode);

        this.loading = false;

        // SOCKET
        this.socketService.connect();
        this.socketService.joinSession(this.sessionId);

        this.socketSub = this.socketService
          .onAttendanceMarked()
          .subscribe((data) => {
            this.attendanceList.unshift(data);
          });

        this.startTimer();
        this.loadLiveAttendance();
      },
      error: (err) => {
        this.loading = false;
        this.snackBar.open(
          err.error?.message || 'Failed to start session',
          'Close',
          { duration: 3000 }
        );
        this.goBack();
      }
    });
  }

  // ===============================
  // TIMER
  // ===============================
  startTimer(): void {
    this.timerSub = interval(1000).subscribe(() => {
      this.timeRemaining--;

      if (this.timeRemaining <= 0) {
        this.timerSub?.unsubscribe();
        this.endSession();
      }
    });
  }

  // ===============================
  // LIVE ATTENDANCE
  // ===============================
  loadLiveAttendance(): void {
    this.attendanceService.getLiveAttendance(this.sessionId).subscribe({
      next: (res) => {
        this.attendanceList = res.records || [];
      }
    });
  }

  // ===============================
  // END SESSION
  // ===============================
  endSession(): void {
    if (!confirm('End this session?')) return;

    this.attendanceService.endSession(this.sessionId).subscribe({
      next: () => {
        this.snackBar.open('Session ended', 'Close', { duration: 3000 });
        this.goBack();
      },
      error: () => {
        this.snackBar.open('Failed to end session', 'Close', { duration: 3000 });
      }
    });
  }

  // ===============================
  // HELPERS
  // ===============================
  formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatDateTime(d: string): string {
    return new Date(d).toLocaleTimeString();
  }

  goBack(): void {
    this.cleanup();
    this.router.navigate(['/teacher/dashboard']);
  }
}