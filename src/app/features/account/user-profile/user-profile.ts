import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../../auth/auth/auth.service';

@Component({
  selector: 'app-user-profile',
  //RouterLink for routing, MatMenMOdule for dropdown
  imports: [RouterLink, MatMenuModule],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
})
export class UserProfile {
  //hardcoded 
  initials = 'SS';
  readonly logoutError = signal<string | null>(null);

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  //use the AuthService to logout
  onLogout(): void {
    this.logoutError.set(null);
    this.authService.logout().subscribe({
      next: () => this.router.navigateByUrl('/login'),
      error: () => {
        this.logoutError.set('Could not contact the server; local session cleared.');
        this.router.navigateByUrl('/login');
      },
    });
  }
}
