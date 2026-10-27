import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  AuthUserResponse,
  ChangePasswordRequest,
  CreateUserRequest,
  LoginResponse,
} from './auth.models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http: HttpClient;
  private refreshRequest$: Observable<LoginResponse> | null = null;

  readonly isAuthenticated = signal(false);
  readonly currentUserId = signal<string | null>(null);
  readonly currentUserFullName = signal<string | null>(null);
  readonly currentUserFirstName = signal<string | null>(null);
  readonly accessToken = signal<string | null>(null);
  readonly currentUserRole = signal<string | null>(null);

  isAdmin(): boolean {
    return this.hasRole('ADMIN');
  }

  isAnalyst(): boolean {
    return this.hasRole('ANALYST');
  }

  isClient(): boolean {
    return !this.isAdmin() && !this.isAnalyst();
  }

  landingPath(): string {
    if (this.isAdmin()) return '/admin';
    if (this.isAnalyst()) return '/analysis';
    return '/home';
  }

  constructor(backend: HttpBackend) {
    // Bypass the auth interceptor for auth endpoints to avoid refresh recursion.
    this.http = new HttpClient(backend);
  }

  signup(request: CreateUserRequest): Observable<AuthUserResponse> {
    return this.http.post<AuthUserResponse>(`${environment.apiBaseUrl}/users`, request, {
      withCredentials: true,
    });
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(
        `${environment.apiBaseUrl}/auth/login`,
        { email, password },
        { withCredentials: true },
      )
      .pipe(tap((response) => this.setSession(response)));
  }

  refreshAccessToken(): Observable<LoginResponse> {
    if (!this.refreshRequest$) {
      this.refreshRequest$ = this.http
        .post<LoginResponse>(`${environment.apiBaseUrl}/auth/refresh`, {}, { withCredentials: true })
        .pipe(
          tap((response) => this.setSession(response)),
          finalize(() => (this.refreshRequest$ = null)),
          shareReplay({ bufferSize: 1, refCount: false }),
        );
    }
    return this.refreshRequest$;
  }

  restoreSession(): Observable<boolean> {
    if (this.accessToken()) {
      return of(true);
    }
    return this.refreshAccessToken().pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
    );
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${environment.apiBaseUrl}/auth/logout`, {}, { withCredentials: true })
      .pipe(finalize(() => this.clearSession()));
  }

  changePassword(request: ChangePasswordRequest): Observable<unknown> {
    const token = this.accessToken();
    return this.http.post(`${environment.apiBaseUrl}/auth/change-password`, request, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      withCredentials: true,
    });
  }

  updateCurrentUser(user: AuthUserResponse): void {
    this.currentUserId.set(user.userId);
    const firstName = user.fullName.trim().split(/\s+/)[0] ?? '';
    this.currentUserFullName.set(user.fullName.trim() || null);
    this.currentUserFirstName.set(
      firstName ? firstName.charAt(0).toLocaleUpperCase() + firstName.slice(1) : null,
    );
  }

  clearSession(): void {
    this.isAuthenticated.set(false);
    this.currentUserId.set(null);
    this.currentUserFullName.set(null);
    this.currentUserFirstName.set(null);
    this.accessToken.set(null);
    this.currentUserRole.set(null);
  }

  private setSession(response: LoginResponse): void {
    this.accessToken.set(response.accessToken);
    this.currentUserId.set(response.userId);
    this.currentUserRole.set(response.role);
    this.isAuthenticated.set(true);
    this.http
      .get<AuthUserResponse>(`${environment.apiBaseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${response.accessToken}` },
      })
      .pipe(catchError(() => of(null)))
      .subscribe((user) => {
        if (user?.fullName) {
          this.updateCurrentUser(user);
        }
      });
  }

  private hasRole(role: string): boolean {
    const currentRole = (this.currentUserRole() ?? '').toUpperCase();
    return currentRole === role || currentRole === `ROLE_${role}`;
  }
}
