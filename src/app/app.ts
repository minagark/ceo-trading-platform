import { Component, inject, signal } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { UserProfile } from './user-profile/user-profile';

@Component({
  imports: [RouterOutlet, RouterLink, UserProfile],
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('ceoole-trading-platform');
  protected readonly authService = inject(AuthService);
}
