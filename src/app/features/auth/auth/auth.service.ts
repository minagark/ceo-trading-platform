import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'auth.isAuthenticated';
const USER_ID_STORAGE_KEY = 'auth.userId';

// Temporary fixture until the real authentication flow provides the user ID.
export const DEV_USER_ID = '2c522b92-7151-4daa-92db-81a2253c772a';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = signal<boolean>(localStorage.getItem(STORAGE_KEY) === 'true');
  currentUserId = signal<string | null>(
    localStorage.getItem(USER_ID_STORAGE_KEY) ??
      (this.isAuthenticated() ? DEV_USER_ID : null),
  );

  login(email: string, password: string): boolean {
    if (!email || !password) {
      return false;
    }
    this.isAuthenticated.set(true);
    this.currentUserId.set(DEV_USER_ID);
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.setItem(USER_ID_STORAGE_KEY, DEV_USER_ID);
    return true;
  }

  logout(): void {
    this.isAuthenticated.set(false);
    this.currentUserId.set(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(USER_ID_STORAGE_KEY);
  }
}
