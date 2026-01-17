import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AuthService, AuthResponse } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatSnackBarModule
  ],
  template: `
  <div class="min-h-screen grid grid-cols-1 lg:grid-cols-2">

  <!-- LEFT BRAND (DESKTOP ONLY) -->
  <div
    class="hidden lg:flex flex-col justify-center px-16
           bg-gradient-to-br from-indigo-700 via-purple-700 to-fuchsia-700
           relative overflow-hidden">

    <div class="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>

    <h1 class="text-5xl font-extrabold text-white leading-tight">
      Smart <br /> Attendance <br /> System
    </h1>

    <p class="mt-6 text-lg text-white/80 max-w-md">
      A modern role-based attendance platform designed for colleges,
      teachers, and students with real-time tracking.
    </p>

    <div class="mt-10 text-sm text-white/60">
      © 2026 College ERP Platform
    </div>
  </div>

  <!-- RIGHT LOGIN (MOBILE FIRST) -->
  <div
    class="flex flex-col justify-end lg:justify-center
           min-h-screen bg-gradient-to-br
           from-indigo-700 via-purple-700 to-fuchsia-700
           lg:bg-gray-50 px-4 sm:px-6">

    <!-- MOBILE BRANDING -->
    <div class="lg:hidden text-center text-white mb-10 mt-10">
      <h1 class="text-4xl font-extrabold leading-tight">
        Smart Attendance
      </h1>
      <p class="mt-2 text-sm text-white/80">
        Login to continue
      </p>
    </div>

    <!-- LOGIN CARD -->
    <div
      class="w-full max-w-md mx-auto
             bg-white rounded-t-3xl lg:rounded-2xl
             shadow-[0_20px_60px_rgba(0,0,0,0.2)]
             p-8 md:p-10">

      <!-- HEADER -->
      <div class="text-center mb-8">
        <h2 class="text-3xl font-bold text-gray-900">
          Welcome Back
        </h2>
        <p class="text-sm text-gray-500 mt-2">
          Login to continue to your dashboard
        </p>
      </div>

      <!-- FORM -->
      <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-6">

        <!-- EMAIL -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            type="email"
            formControlName="email"
            placeholder="you@example.com"
            class="w-full rounded-xl px-4 py-3
                   border border-gray-300
                   focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200
                   outline-none transition" />
        </div>

        <!-- PASSWORD -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            type="password"
            formControlName="password"
            placeholder="••••••••"
            class="w-full rounded-xl px-4 py-3
                   border border-gray-300
                   focus:border-indigo-600 focus:ring-2 focus:ring-indigo-200
                   outline-none transition" />
        </div>

        <!-- BUTTON -->
        <button
          type="submit"
          [disabled]="loginForm.invalid || loading"
          class="w-full py-3 rounded-xl font-semibold text-white
                 bg-gradient-to-r from-indigo-600 to-purple-600
                 hover:from-indigo-700 hover:to-purple-700
                 shadow-lg hover:shadow-xl
                 transition-all duration-200
                 flex items-center justify-center gap-2
                 disabled:opacity-60 disabled:cursor-not-allowed">

          <span *ngIf="!loading">Login</span>

          <svg *ngIf="loading"
               class="animate-spin h-5 w-5 text-white"
               xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10"
                    stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
        </button>
      </form>

      <!-- FOOTER -->
      <div class="text-center mt-6 text-sm text-gray-600">
        Don’t have an account?
        <a routerLink="/signup"
           class="font-semibold text-indigo-600 hover:underline">
          Sign up as Student
        </a>
      </div>
    </div>
  </div>
</div>

  `,
  styles: []
})
export class LoginComponent {

  loginForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid || this.loading) return;

    this.loading = true;
    this.cdr.detectChanges();

    const { email, password } = this.loginForm.value;

    this.authService.login(email, password).subscribe({
      next: (res: AuthResponse) => {
        this.loading = false;
        this.cdr.detectChanges();

        this.snackBar.open('Login successful', 'Close', { duration: 3000 });

        if (res.user.role === 'teacher') {
          this.router.navigate(['/teacher/dashboard']);
        } else {
          this.router.navigate(['/student/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();

        const msg =
          err?.error?.message ||
          err?.message ||
          'Invalid email or password';

        this.snackBar.open(msg, 'Close', { duration: 3000 });
      }
    });
  }
}
