import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'auth.isAuthenticated';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isAuthenticated = signal<boolean>(localStorage.getItem(STORAGE_KEY) === 'true');

  login(email: string, password: string): boolean {
    if (!email || !password) {
      return false;
    }
    this.isAuthenticated.set(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    return true;
  }

  logout(): void {
    this.isAuthenticated.set(false);
    localStorage.removeItem(STORAGE_KEY);
  }
}
