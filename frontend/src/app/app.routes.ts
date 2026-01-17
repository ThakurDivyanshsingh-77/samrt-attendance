import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';
import { roleGuard } from './core/guards/role-guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // ================= AUTH =================
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login')
        .then(m => m.LoginComponent)
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./features/auth/signup/signup')
        .then(m => m.SignupComponent)
  },

  // ================= TEACHER =================
  {
    path: 'teacher',
    canActivate: [authGuard, roleGuard(['teacher'])],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/teacher/dashboard/dashboard')
            .then(m => m.TeacherDashboardComponent)
      },
      {
        path: 'attendance-session',
        loadComponent: () =>
          import('./features/teacher/attendance-session/attendance-session')
            .then(m => m.AttendanceSessionComponent)
      },
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/teacher/reports/reports')
            .then(m => m.TeacherReportsComponent)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // ================= STUDENT =================
  {
    path: 'student',
    canActivate: [authGuard, roleGuard(['student'])],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/student/dashboard/dashboard')
            .then(m => m.StudentDashboardComponent)
      },
      {
        path: 'mark-attendance',
        loadComponent: () =>
          import('./features/student/mark-attendance/mark-attendance')
            .then(m => m.MarkAttendanceComponent)
      },

      // ✅ HISTORY
      {
        path: 'history',
        loadComponent: () =>
          import('./features/student/history/history')
            .then(m => m.StudentHistoryComponent)
      },

      // ✅ REPORTS (🔥 THIS WAS MISSING)
      {
        path: 'reports',
        loadComponent: () =>
          import('./features/student/reports/reports')
            .then(m => m.StudentReportsComponent)
      },

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // ================= FALLBACK =================
  { path: '**', redirectTo: '/login' }
];
