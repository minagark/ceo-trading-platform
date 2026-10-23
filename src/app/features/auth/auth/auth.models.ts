export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
  accessToken: string;
  expiresIn: number;
  role: string;
}

export interface CreateUserRequest {
  fullName: string;
  email: string;
  password: string;
}

export interface AuthUserResponse {
  userId: string;
  fullName: string;
  email: string;
  joinDate: string;
  role: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}