import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AttendanceService } from '../../../core/services/attendance.service';

@Component({
  selector: 'app-student-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class StudentReportsComponent implements OnInit {

  loading = true;

  overall: any = null;
  subjectStats: any[] = [];

  constructor(private attendance: AttendanceService) {}

  ngOnInit(): void {
    this.attendance.getStudentStats().subscribe({
      next: (res) => {
        this.overall = res.overall;
        this.subjectStats = res.subjectStats || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  exportCSV(): void {
    const rows = [
      ['Subject', 'Code', 'Percentage', 'Attended', 'Total']
    ];

    this.subjectStats.forEach(s => {
      rows.push([
        s.subject.name,
        s.subject.code,
        s.percentage,
        s.attended,
        s.total
      ]);
    });

    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'attendance-report.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
