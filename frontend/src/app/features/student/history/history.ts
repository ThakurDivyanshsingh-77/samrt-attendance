import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon'; // ✅ REQUIRED
import { AttendanceService } from '../../../core/services/attendance.service';

@Component({
  selector: 'app-student-history',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatIconModule   // ✅ ADD THIS
  ],
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class StudentHistoryComponent implements OnInit {

  records: any[] = [];
  columns = ['subject', 'date', 'status'];

  constructor(private attendance: AttendanceService) {}

  ngOnInit(): void {
    this.attendance.getStudentHistory().subscribe({
      next: (res) => {
        this.records = res.records || [];
      },
      error: (err) => {
        console.error('Failed to load history', err);
        this.records = [];
      }
    });
  }
}
