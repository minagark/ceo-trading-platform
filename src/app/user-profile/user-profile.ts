import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService } from '../auth/auth.service';

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

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  //use the AuthService to logout
  onLogout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }
}
