import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {

  private baseUrl = `${environment.apiUrl}/attendance`;

  constructor(private http: HttpClient) {}

  // =====================================
  // TEACHER APIs
  // =====================================

  /**
   * START ATTENDANCE SESSION (TEACHER)
   * Backend returns:
   * {
   *   success: true,
   *   session: {
   *     _id,
   *     sessionCode,
   *     expiryTime,
   *     subject
   *   }
   * }
   */
  startSession(
    subjectId: string,
    year: number,
    semester: number
  ): Observable<{
    success: boolean;
    session: {
      _id: string;
      sessionCode: string;
      expiryTime: string;
      subject: any;
      year: number;
      semester: number;
      isActive: boolean;
      isExpired: boolean;
      totalPresent: number;
    };
  }> {
    return this.http.post<any>(`${this.baseUrl}/session/start`, {
      subjectId,
      year,
      semester
    });
  }

  // Get active session for a subject (teacher)
  getActiveSession(subjectId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/session/active/${subjectId}`);
  }

  // End session (teacher)
  endSession(sessionId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/session/end/${sessionId}`, {});
  }

  // =====================================
  // LIVE ATTENDANCE (TEACHER)
  // =====================================

  getLiveAttendance(sessionId: string): Observable<{
    success: boolean;
    count: number;
    records: any[];
  }> {
    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    return this.http.get<any>(
      `${this.baseUrl}/session/${sessionId}/live`
    );
  }

  // Teacher attendance history
  getTeacherHistory(filters?: any): Observable<any> {
    let params = new HttpParams();

    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.http.get(`${this.baseUrl}/history/teacher`, { params });
  }

  // Subject statistics (teacher)
  getSubjectStats(subjectId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/stats/subject/${subjectId}`);
  }

  // =====================================
  // STUDENT APIs
  // =====================================

  // Get active sessions for student
  getActiveSessions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/sessions/active`);
  }

  // Mark attendance using session code
  markAttendance(sessionCode: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/mark`, { sessionCode });
  }

  // Student attendance history
  getStudentHistory(subjectId?: string): Observable<any> {
    let params = new HttpParams();
    if (subjectId) {
      params = params.set('subjectId', subjectId);
    }
    return this.http.get(`${this.baseUrl}/history/student`, { params });
  }

  // Student stats
  getStudentStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/stats/student`);
  }
}
