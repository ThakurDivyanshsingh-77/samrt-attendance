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
import { SocketService } from '../../../core/services/socket';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-attendance-session',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './attendance-session.html',
  styleUrls: ['./attendance-session.css']
})
export class AttendanceSessionComponent implements OnInit, OnDestroy {

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

  formatDateTime(date: string): string {
    return new Date(date).toLocaleTimeString();
  }

  goBack(): void {
    this.router.navigate(['/teacher/dashboard']);
  }
}
