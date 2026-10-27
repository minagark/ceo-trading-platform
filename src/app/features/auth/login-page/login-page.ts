import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  imports: [FormsModule],
  selector: 'app-login-page',
  styleUrl: './login-page.css',
  templateUrl: './login-page.html',
})
export class LoginPage {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeView = signal<'login' | 'signup'>('login');
  email = signal('');
  password = signal('');
  firstName = signal('');
  lastName = signal('');
  confirmPassword = signal('');
  error = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  submitting = signal(false);

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl(this.authService.landingPath());
    } else {
      this.authService.restoreSession().subscribe((restored) => {
        if (restored) {
          this.router.navigateByUrl(this.authService.landingPath());
        }
      });
    }
  }

  showLogin(): void {
    this.activeView.set('login');
    this.error.set(null);
    this.successMessage.set(null);
    this.password.set('');
    this.confirmPassword.set('');
  }

  showSignup(): void {
    this.activeView.set('signup');
    this.error.set(null);
    this.successMessage.set(null);
    this.password.set('');
    this.confirmPassword.set('');
  }

  onLoginSubmit(): void {
    this.error.set(null);
    this.submitting.set(true);
    this.authService.login(this.email().trim(), this.password()).subscribe({
      next: () => {
        this.submitting.set(false);
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? this.authService.landingPath();
        this.router.navigateByUrl(returnUrl);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        this.error.set(this.authError(error, 'login'));
      },
    });
  }

  onSignupSubmit(): void {
    if (!this.firstName().trim() || !this.lastName().trim() || !this.email().trim()) {
      this.error.set('Please enter your first name, last name, and email.');
      return;
    }
    if (this.password().length < 8) {
      this.error.set('Your password must be at least 8 characters long.');
      return;
    }
    if (this.password() !== this.confirmPassword()) {
      this.error.set('The passwords do not match.');
      return;
    }

    this.error.set(null);
    this.successMessage.set(null);
    this.submitting.set(true);
    this.authService
      .signup({
        fullName: `${this.firstName().trim()} ${this.lastName().trim()}`,
        email: this.email().trim(),
        password: this.password(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.email.set(this.email().trim());
          this.password.set('');
          this.confirmPassword.set('');
          this.firstName.set('');
          this.lastName.set('');
          this.successMessage.set('Successfully signed up! Please log in with your new account.');
          this.activeView.set('login');
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          this.error.set(this.authError(error, 'signup'));
        },
      });
  }

  private authError(error: unknown, action: 'login' | 'signup'): string {
    if (!(error instanceof HttpErrorResponse)) {
      return 'Something went wrong. Please try again.';
    }

    if (error.status === 0) {
      return 'Unable to connect to the server. Check your connection and try again.';
    }
    if (action === 'login' && error.status === 401) {
      return 'Incorrect email or password. Please try again.';
    }
    if (action === 'signup' && error.status === 409) {
      return 'An account with this email already exists. Try logging in instead.';
    }

    const backendMessage = this.findBackendMessage(error.error);
    if (backendMessage) {
      const normalized = backendMessage.toLowerCase();
      if (/email.*(already|exist|taken|registered|in use)|(already|exist|taken|registered).*email/.test(normalized)) {
        return 'An account with this email already exists. Try logging in instead.';
      }
      if (action === 'login' && /invalid credential|incorrect password|wrong password|bad credential/.test(normalized)) {
        return 'Incorrect email or password. Please try again.';
      }
      return backendMessage;
    }

    if (action === 'login' && (error.status === 400 || error.status === 403)) {
      return 'Incorrect email or password. Please try again.';
    }
    if (action === 'signup' && error.status === 400) {
      return 'Please check your details. Passwords must be at least 8 characters.';
    }

    return action === 'login'
      ? 'Unable to log in right now. Please try again.'
      : 'Unable to create your account right now. Please try again.';
  }

  private findBackendMessage(value: unknown): string | null {
    if (typeof value === 'string') {
      const message = value.trim();
      return message && !/^(bad request|unauthorized|forbidden|internal server error)$/i.test(message)
        ? message
        : null;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        const message = this.findBackendMessage(item);
        if (message) return message;
      }
      return null;
    }
    if (value && typeof value === 'object') {
      const body = value as Record<string, unknown>;
      for (const key of ['message', 'detail', 'title', 'errors', 'error']) {
        const message = this.findBackendMessage(body[key]);
        if (message) return message;
      }
    }
    return null;
  }
}
