import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiClient } from '../../../core/api-client.service';
import { UserResponse } from '../../../core/user.models';

@Injectable({ providedIn: 'root' })
export class UserApiService {
  private readonly api = inject(ApiClient);

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
