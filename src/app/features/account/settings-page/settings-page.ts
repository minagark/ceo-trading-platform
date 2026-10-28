import { MatIconModule } from '@angular/material/icon';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../auth/auth/auth.service';
import { UserApiService } from '../data-access/user-api.service';

@Component({
  selector: 'app-settings-page',
  imports: [FormsModule, MatIconModule],
  templateUrl: './settings-page.html',
  styleUrl: './settings-page.css',
})
export class SettingsPage {
  private readonly authService = inject(AuthService);
  private readonly userApi = inject(UserApiService);

  readonly loading = signal(true);
  readonly profileSaving = signal(false);
  readonly passwordSaving = signal(false);
  readonly profileError = signal<string | null>(null);
  readonly profileSuccess = signal<string | null>(null);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal<string | null>(null);
  readonly fullName = signal('');
  readonly email = signal('');
  readonly currentPassword = signal('');
  readonly newPassword = signal('');
  readonly confirmNewPassword = signal('');

  constructor() {
    const userId = this.authService.currentUserId();
    if (!userId) {
      this.loading.set(false);
      this.profileError.set('Your session could not be verified. Please log in again.');
      return;
    }

    this.userApi.getUser(userId).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (user) => {
        this.fullName.set(user.fullName);
        this.email.set(user.email);
        this.authService.updateCurrentUser(user);
      },
      error: () => this.profileError.set('Unable to load your profile. Please try again.'),
    });
  }

  saveProfile(): void {
    const userId = this.authService.currentUserId();
    const fullName = this.fullName().trim();
    const email = this.email().trim();
    if (!userId) {
      this.profileError.set('Your session has expired. Please log in again.');
      return;
    }
    if (!fullName || !email) {
      this.profileError.set('Please enter your name and email.');
      return;
    }

    this.profileError.set(null);
    this.profileSuccess.set(null);
    this.profileSaving.set(true);
    this.userApi
      .updateUser(userId, { newName: fullName, newEmail: email })
      .pipe(finalize(() => this.profileSaving.set(false)))
      .subscribe({
      next: (user) => {
        this.fullName.set(user.fullName);
        this.email.set(user.email);
        this.authService.updateCurrentUser(user);
        this.profileSuccess.set('Your profile was updated.');
      },
        error: (error: unknown) => this.profileError.set(this.messageFor(error, 'profile')),
      });
  }

  savePassword(): void {
    if (this.newPassword().length < 8) {
      this.passwordError.set('Your new password must be at least 8 characters.');
      return;
    }
    if (this.newPassword() !== this.confirmNewPassword()) {
      this.passwordError.set('The new passwords do not match.');
      return;
    }

    this.passwordError.set(null);
    this.passwordSuccess.set(null);
    this.passwordSaving.set(true);
    this.authService
      .changePassword({
        currentPassword: this.currentPassword(),
        newPassword: this.newPassword(),
        confirmNewPassword: this.confirmNewPassword(),
      })
      .pipe(finalize(() => this.passwordSaving.set(false)))
      .subscribe({
        next: () => {
          this.currentPassword.set('');
          this.newPassword.set('');
          this.confirmNewPassword.set('');
          this.passwordSuccess.set('Your password was changed.');
        },
        error: (error: unknown) => this.passwordError.set(this.messageFor(error, 'password')),
      });
  }

  private messageFor(error: unknown, action: 'profile' | 'password'): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Unable to connect to the server. Check your connection and try again.';
      }
      if (error.status === 409) {
        return 'That email is already associated with another account.';
      }
      if (action === 'password' && [400, 401, 403].includes(error.status)) {
        return 'The current password is incorrect, or the new password was rejected.';
      }
      const body = error.error as { message?: unknown; detail?: unknown; title?: unknown } | null;
      for (const candidate of [body?.message, body?.detail, body?.title]) {
        if (typeof candidate === 'string' && candidate.trim()) return candidate;
      }
    }
    return action === 'profile'
      ? 'Unable to update your profile. Please try again.'
      : 'Unable to change your password. Please try again.';
  }
}
