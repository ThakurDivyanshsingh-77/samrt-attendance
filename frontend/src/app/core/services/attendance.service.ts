
// ===== 3. ATTENDANCE SERVICE (src/app/core/services/attendance.service.ts) =====
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  constructor(private http: HttpClient) {}

  // Teacher APIs
  startSession(subjectId: string, year: number, semester: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/attendance/session/start`, {
      subjectId,
      year,
      semester
    });
  }

  getActiveSession(subjectId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/attendance/session/active/${subjectId}`);
  }

  endSession(sessionId: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/attendance/session/end/${sessionId}`, {});
  }

  getLiveAttendance(sessionId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/attendance/session/${sessionId}/live`);
  }

  getTeacherHistory(filters?: any): Observable<any> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) params = params.set(key, filters[key]);
      });
    }
    return this.http.get(`${environment.apiUrl}/attendance/history/teacher`, { params });
  }

  getSubjectStats(subjectId: string): Observable<any> {
    return this.http.get(`${environment.apiUrl}/attendance/stats/subject/${subjectId}`);
  }

  // Student APIs
  getActiveSessions(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/attendance/sessions/active`);
  }

  markAttendance(sessionCode: string): Observable<any> {
    return this.http.post(`${environment.apiUrl}/attendance/mark`, { sessionCode });
  }

  getStudentHistory(subjectId?: string): Observable<any> {
    let params = new HttpParams();
    if (subjectId) params = params.set('subjectId', subjectId);
    return this.http.get(`${environment.apiUrl}/attendance/history/student`, { params });
  }

  getStudentStats(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/attendance/stats/student`);
  }
}
