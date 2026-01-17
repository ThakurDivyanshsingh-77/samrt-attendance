import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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

interface AttendanceRecord {
  rollNumber: string;
  studentName: string;
  markedAt: string;
}

interface SessionData {
  id: string;              // ✅ NORMALIZED ID (IMPORTANT)
  sessionCode: string;
  subject?: { name: string; code: string };
  expiryTime: string;
  year: number;
  semester: number;
}

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
  error = '';

  session: SessionData | null = null;
  attendanceList: AttendanceRecord[] = [];
  displayedColumns = ['rollNumber', 'studentName', 'markedAt'];

  timeRemaining = 600;

  private timerSub?: Subscription;
  private socketSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private attendanceService: AttendanceService,
    private socketService: SocketService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

  // =============================
  // INIT
  // =============================
  ngOnInit(): void {
    const subjectId = this.route.snapshot.queryParamMap.get('subjectId');
    const year = Number(this.route.snapshot.queryParamMap.get('year'));
    const semester = Number(this.route.snapshot.queryParamMap.get('semester'));

    if (!subjectId || !year || !semester) {
      this.error = 'Missing session parameters';
      this.loading = false;
      return;
    }

    this.startSession(subjectId, year, semester);
  }

  ngOnDestroy(): void {
    this.timerSub?.unsubscribe();
    this.socketSub?.unsubscribe();
    if (this.session?.id) {
      this.socketService.leaveSession(this.session.id);
    }
  }

  // =============================
  // START / RESUME SESSION
  // =============================
  startSession(subjectId: string, year: number, semester: number): void {
    this.loading = true;

    this.attendanceService.startSession(subjectId, year, semester).subscribe({
      next: (res: any) => {
        console.log('START SESSION RESPONSE 👉', res);

        if (!res || res.success === false) {
          this.error = res?.message || 'Failed to start session';
          this.loading = false;
          return;
        }

        // 🔥 NORMALIZE SESSION ID (KEY FIX)
        const sessionId = res.sessionId || res.session?._id || res.session?.id;
        const sessionCode = res.sessionCode || res.session?.sessionCode;

        if (!sessionId || !sessionCode) {
          this.error = 'Invalid session data';
          this.loading = false;
          return;
        }

        this.session = {
          id: sessionId,
          sessionCode,
          subject: res.session?.subject,
          expiryTime: res.expiryTime || res.session?.expiryTime,
          year,
          semester
        };

        this.setupTimer();
        this.setupSocket();

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.error = 'Failed to start session';
        this.loading = false;
      }
    });
  }

  // =============================
  // SOCKET
  // =============================
  setupSocket(): void {
    if (!this.session) return;

    this.socketService.connect();
    this.socketService.joinSession(this.session.id);

    this.socketSub = this.socketService
      .onAttendanceMarked()
      .subscribe((data: AttendanceRecord) => {
        this.attendanceList.unshift(data);
        this.snackBar.open(
          `${data.studentName} marked present`,
          'Close',
          { duration: 2000 }
        );
      });
  }

  // =============================
  // TIMER
  // =============================
  setupTimer(): void {
    if (!this.session?.expiryTime) return;

    const expiry = new Date(this.session.expiryTime).getTime();

    this.timerSub = interval(1000).subscribe(() => {
      const now = Date.now();
      this.timeRemaining = Math.max(
        Math.floor((expiry - now) / 1000),
        0
      );

      if (this.timeRemaining <= 0) {
        this.endSession(true);
      }
    });
  }

  // =============================
  // END SESSION (FIXED)
  // =============================
  endSession(auto = false): void {
    if (!this.session?.id) {
      this.snackBar.open('Session ID missing', 'Close', { duration: 3000 });
      return;
    }

    if (!auto && !confirm('End this session?')) return;

    this.attendanceService.endSession(this.session.id).subscribe({
      next: () => {
        this.snackBar.open('Session ended', 'Close', { duration: 3000 });
        this.goBack();
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open(
          err.error?.message || 'Failed to end session',
          'Close',
          { duration: 3000 }
        );
      }
    });
  }

  // =============================
  // HELPERS
  // =============================
  formatTime(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  formatDateTime(d: string): string {
    return new Date(d).toLocaleTimeString();
  }

  goBack(): void {
    this.router.navigate(['/teacher/dashboard']);
  }
}
