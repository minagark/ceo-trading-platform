import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/api-client.service';
import { UserResponse } from '../../../core/user.models';
import { Portfolio } from '../../../core/trading.models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly api = inject(ApiClient);

  getUser(userId: string): Observable<UserResponse> {
    return this.api.get<UserResponse>(`users/${encodeURIComponent(userId)}`);
  }

  getPortfolios(userId: string): Observable<Portfolio[]> {
    return this.api.get<Portfolio[]>(
      `users/${encodeURIComponent(userId)}/portfolios`,
    );
  }

  createUser(request: CreateUserRequest): Observable<UserResponse> {
    return this.api.post<UserResponse, CreateUserRequest>('users', request);
  }

  changePassword(
    userId: string,
    request: ChangePasswordRequest,
  ): Observable<void> {
    return this.api.post<void, ChangePasswordRequest>(
      `users/${encodeURIComponent(userId)}/change-password`,
      request,
    );
  }
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}
