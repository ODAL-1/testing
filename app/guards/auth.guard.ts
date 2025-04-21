import { inject, PLATFORM_ID } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";
import { isPlatformServer } from "@angular/common";

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (isPlatformServer(platformId)) {
    return false;
  }

  if (authService.isAuthenticated()) {
    return true;
  }

  return router.createUrlTree(["/auth"], {
    queryParams: { returnUrl: state.url },
  });
};
