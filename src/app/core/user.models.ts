export type UserRole = 'CLIENT' | 'ANALYST' | 'ADMIN';

export interface UserResponse {
  userId: string;
  fullName: string;
  email: string;
  joinDate: string;
  role: UserRole;
}
