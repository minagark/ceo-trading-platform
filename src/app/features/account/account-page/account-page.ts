import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserResponse } from '../../../core/user.models';
import { Portfolio } from '../../../core/trading.models';
import { UserApiService } from '../data-access/user-api.service';
import { AccountsList } from '../accounts-list/accounts-list';
import { AuthService } from '../../auth/auth/auth.service';

@Component({
  selector: 'app-account-page',
  imports: [DatePipe, AccountsList],
  templateUrl: './account-page.html',
  styleUrl: './account-page.css',
})
export class AccountPage {
  private readonly route = inject(ActivatedRoute);
  private readonly userApi = inject(UserApiService);
  private readonly authService = inject(AuthService);

  readonly user = signal<UserResponse | null>(null);
  readonly portfolios = signal<Portfolio[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly userId = signal<string | null>(null);

  constructor() {
    const userId =
      this.route.snapshot.paramMap.get('userId') ?? this.authService.currentUserId();
    this.userId.set(userId);
    if (userId) {
      this.loadAccount(userId);
    }
  }

  private loadAccount(userId: string): void {
    this.loading.set(true);
    this.userApi.getUser(userId).subscribe({
      next: (user) => this.user.set(user),
      error: () => this.error.set('Unable to load account details.'),
    });

    this.userApi.getPortfolios(userId).subscribe({
      next: (portfolios) => this.portfolios.set(portfolios),
      error: () => this.error.set('Unable to load portfolios.'),
      complete: () => this.loading.set(false),
    });
  }
}
