import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from './auth.service';

type Role = 'ADMIN' | 'ANALYST' | 'CLIENT';

export const roleGuard = (allowedRoles: readonly Role[]): CanActivateFn => (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const canAccess = () => {
    if (allowedRoles.includes('ADMIN') && authService.isAdmin()) return true;
    if (allowedRoles.includes('ANALYST') && authService.isAnalyst()) return true;
    return allowedRoles.includes('CLIENT') && authService.isClient();
  };

  if (authService.isAuthenticated()) {
    return canAccess() ? true : router.createUrlTree([authService.landingPath()]);
  }

  return authService.restoreSession().pipe(
    map((restored) => {
      if (!restored) {
        return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
      }
      return canAccess() ? true : router.createUrlTree([authService.landingPath()]);
    }),
  );
};