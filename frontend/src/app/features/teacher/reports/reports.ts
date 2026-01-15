import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { AttendanceService } from '../../../core/services/attendance.service';

import { BaseChartDirective } from 'ng2-charts';

import { ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-teacher-reports',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
    MatInputModule,
    BaseChartDirective
  ],
  templateUrl: './reports.html',
  styleUrls: ['./reports.css']
})
export class TeacherReportsComponent implements OnInit {

  loading = true;

  sessions: any[] = [];
  filteredSessions: any[] = [];
  subjects: any[] = [];

  subjectControl = new FormControl('');
  fromDateControl = new FormControl<Date | null>(null);
  toDateControl = new FormControl<Date | null>(null);

  displayedColumns = ['subject', 'date', 'present', 'status'];

  // 📊 MONTHLY SUMMARY
  monthlySummary: { month: string; sessions: number; present: number }[] = [];

  // 📈 CHART
  chartType: ChartType = 'bar';
  chartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Total Attendance' }
    ]
  };

  constructor(private attendanceService: AttendanceService) {}

  ngOnInit(): void {
    this.attendanceService.getTeacherHistory().subscribe({
      next: (res) => {
        this.sessions = res.sessions || [];
        this.filteredSessions = [...this.sessions];

        this.extractSubjects();
        this.generateMonthlySummary();
        this.generateAttendanceChart();

        this.loading = false;
      },
      error: () => this.loading = false
    });

    this.subjectControl.valueChanges.subscribe(() => this.applyFilters());
    this.fromDateControl.valueChanges.subscribe(() => this.applyFilters());
    this.toDateControl.valueChanges.subscribe(() => this.applyFilters());
  }

  extractSubjects(): void {
    const map = new Map();
    this.sessions.forEach(s => {
      if (s.subject?._id) map.set(s.subject._id, s.subject);
    });
    this.subjects = Array.from(map.values());
  }

  applyFilters(): void {
    const subjectId = this.subjectControl.value;
    const fromDate = this.fromDateControl.value;
    const toDate = this.toDateControl.value;

    this.filteredSessions = this.sessions.filter(s => {
      const d = new Date(s.startTime);

      const matchSubject = !subjectId || s.subject?._id === subjectId;
      const matchFrom = !fromDate || d >= fromDate;
      const matchTo =
        !toDate ||
        d <= new Date(toDate.setHours(23, 59, 59, 999));

      return matchSubject && matchFrom && matchTo;
    });
  }

  // 📊 MONTHLY SUMMARY
  generateMonthlySummary(): void {
    const map = new Map<string, { sessions: number; present: number }>();

    this.sessions.forEach(s => {
      const d = new Date(s.startTime);
      const key = d.toLocaleString('default', { month: 'long', year: 'numeric' });

      if (!map.has(key)) {
        map.set(key, { sessions: 0, present: 0 });
      }

      const data = map.get(key)!;
      data.sessions += 1;
      data.present += s.totalPresent;
    });

    this.monthlySummary = Array.from(map.entries()).map(([month, data]) => ({
      month,
      sessions: data.sessions,
      present: data.present
    }));
  }

  // 📈 GRAPH
  generateAttendanceChart(): void {
    const map = new Map<string, number>();

    this.sessions.forEach(s => {
      const name = s.subject?.name;
      if (!name) return;
      map.set(name, (map.get(name) || 0) + s.totalPresent);
    });

    this.chartData = {
      labels: Array.from(map.keys()),
      datasets: [
        { data: Array.from(map.values()), label: 'Total Attendance' }
      ]
    };
  }
}
