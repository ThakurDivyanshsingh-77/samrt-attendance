import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { TeacherDashboardComponent } from './dashboard/dashboard';
import { AttendanceSessionComponent } from './attendance-session/attendance-session';
import { TeacherReportsComponent } from './reports/reports';

import { authGuard } from '../../core/guards/auth-guard';
import { roleGuard } from '../../core/guards/role-guard';

const routes: Routes = [
  {
    path: 'dashboard',
    component: TeacherDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'teacher' }
  },
  {
    path: 'attendance-session',
    component: AttendanceSessionComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'teacher' }
  },
  {
    path: 'reports',
    component: TeacherReportsComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'teacher' }
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TeacherRoutingModule {}
