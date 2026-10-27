import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const isAdmin = () => authService.isAdmin();

  if (authService.isAuthenticated()) {
    return isAdmin() ? true : router.createUrlTree(['/home']);
  }

  return authService.restoreSession().pipe(
    map((restored) => {
      if (!restored) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }
      return isAdmin() ? true : router.createUrlTree(['/home']);
    }),
  );
};