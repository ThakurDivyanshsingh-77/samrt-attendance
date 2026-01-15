import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  rollNumber?: string;
  year?: number;
  semester?: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // ❌ constructor me direct localStorage nahi
    // ✅ sirf browser me hi restore
    if (this.isBrowser()) {
      this.restoreUserFromStorage();
    }
  }

  // =====================
  // 🔐 SAFE helpers
  // =====================
  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getStorage(key: string): string | null {
    return this.isBrowser() ? localStorage.getItem(key) : null;
  }

  private setStorage(key: string, value: string): void {
    if (this.isBrowser()) {
      localStorage.setItem(key, value);
    }
  }

  private removeStorage(key: string): void {
    if (this.isBrowser()) {
      localStorage.removeItem(key);
    }
  }

  // =====================
  // 👤 Session restore
  // =====================
  private restoreUserFromStorage(): void {
    const token = this.getToken();
    const user = this.getStorage('user');

    if (token && user) {
      this.currentUserSubject.next(JSON.parse(user));
    }
  }

  // =====================
  // 🔑 AUTH APIs
  // =====================
  signup(data: any): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/signup`, data)
      .pipe(
        tap(res => {
          if (res.success) {
            this.saveSession(res.token, res.user);
          }
        })
      );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(res => {
          if (res.success) {
            this.saveSession(res.token, res.user);
          }
        })
      );
  }

  private saveSession(token: string, user: User): void {
    this.setStorage('token', token);
    this.setStorage('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  logout(): void {
    this.removeStorage('token');
    this.removeStorage('user');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // =====================
  // 🛡️ Helpers for guards / interceptor
  // =====================
  getToken(): string | null {
    return this.getStorage('token');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isTeacher(): boolean {
    return this.currentUserSubject.value?.role === 'teacher';
  }

  isStudent(): boolean {
    return this.currentUserSubject.value?.role === 'student';
  }
}
