import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core'; // Added ChangeDetectorRef
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

// Interfaces...
interface AttendanceRecord { rollNumber: string; studentName: string; markedAt: string; }
interface SessionData { id: string; sessionCode: string; subject?: { name: string; code: string; }; startTime: string; expiryTime: string; year: number; semester: number; }

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
  error = '';
  attendanceList: AttendanceRecord[] = [];
  displayedColumns: string[] = ['rollNumber', 'studentName', 'markedAt'];
  
  timeRemaining = 600;
  private timerSubscription?: Subscription;
  private socketSubscription?: Subscription;
  private expiredSubscription?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private socketService: SocketService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef // Inject ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const subjectId = this.route.snapshot.queryParamMap.get('subjectId');
    const year = Number(this.route.snapshot.queryParamMap.get('year'));
    const semester = Number(this.route.snapshot.queryParamMap.get('semester'));

    if (subjectId && year && semester) {
      this.startSession(subjectId, year, semester);
    } else {
      this.error = 'Missing parameters';
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private cleanup(): void {
    this.timerSubscription?.unsubscribe();
    this.socketSubscription?.unsubscribe();
    this.expiredSubscription?.unsubscribe();
    if (this.session?.id) this.socketService.leaveSession(this.session.id);
  }

  startSession(subjectId: string, year: number, semester: number): void {
    this.loading = true;
    this.attendanceService.startSession(subjectId, year, semester).subscribe({
      next: (response: any) => {
        // Handle different response structures
        let sessionData = response.session || response.data?.session || response;

        if (sessionData && sessionData.sessionCode) {
          this.session = sessionData;
          this.loading = false;

          // Timer setup
          try {
            const expiry = new Date(this.session!.expiryTime).getTime();
            const now = new Date().getTime();
            this.timeRemaining = Math.floor((expiry - now) / 1000);
            if (this.timeRemaining < 0) this.timeRemaining = 600;
          } catch (e) { this.timeRemaining = 600; }

          this.startTimer();
          this.initializeSocket();
          this.cdr.detectChanges(); // <--- FIX FOR NG0100 ERROR
        } else {
          this.error = 'Invalid session data';
          this.loading = false;
          this.cdr.detectChanges(); // <--- FIX FOR NG0100 ERROR
        }
      },
      error: (err: any) => {
        console.error('API Error:', err);
        this.loading = false;
        this.error = err.error?.message || 'Failed to start session';
        this.cdr.detectChanges(); // <--- FIX FOR NG0100 ERROR
      }
    });
  }

  private initializeSocket(): void {
    if (!this.session) return;
    this.socketService.connect();
    this.socketService.joinSession(this.session.id);

    this.socketSubscription = this.socketService.onAttendanceMarked().subscribe((data: any) => {
      this.attendanceList.unshift(data);
      this.snackBar.open(`${data.studentName} marked present`, 'Close', { duration: 2000 });
    });

    this.expiredSubscription = this.socketService.onSessionExpired().subscribe(() => {
      this.handleSessionExpiry();
    });
  }

  startTimer(): void {
    this.timerSubscription = interval(1000).subscribe(() => {
      this.timeRemaining--;
      if (this.timeRemaining <= 0) this.handleSessionExpiry();
    });
  }

  private handleSessionExpiry(): void {
    this.timerSubscription?.unsubscribe();
    this.snackBar.open('Session expired', 'Close', { duration: 3000 });
    setTimeout(() => this.goBack(), 2000);
  }

  endSession(): void {
    if (!this.session) return;
    if (confirm('End this session?')) {
      this.attendanceService.endSession(this.session.id).subscribe({
        next: () => {
          this.snackBar.open('Session ended', 'Close', { duration: 3000 });
          this.goBack();
        },
        error: () => this.snackBar.open('Failed to end session', 'Close', { duration: 3000 })
      });
    }
  }

  formatTime(seconds: number): string {
    if (seconds <= 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatDateTime(date: string): string {
    return new Date(date).toLocaleTimeString();
  }

  goBack(): void {
    this.cleanup();
    this.router.navigate(['/teacher/dashboard']);
  }
}