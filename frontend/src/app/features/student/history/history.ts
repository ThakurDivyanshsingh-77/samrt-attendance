import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { AttendanceService } from '../../../core/services/attendance.service';

@Component({
  selector: 'app-student-history',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatCardModule],
  templateUrl: './history.html',
  styleUrls: ['./history.css']
})
export class StudentHistoryComponent implements OnInit {

  records: any[] = [];
  columns = ['subject', 'date', 'status'];

  constructor(private attendance: AttendanceService) {}

  ngOnInit(): void {
    this.attendance.getStudentHistory().subscribe(res => {
      this.records = res.records || [];
    });
  }
}
