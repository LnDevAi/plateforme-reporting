import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
	// Bypass when runtime flag is enabled by Docker
	if ((window as any).ENV?.DISABLE_AUTH === 'true') {
		return true;
	}
	const auth = inject(AuthService);
	const router = inject(Router);
	if (!auth.isAuthenticated) {
		router.navigate(['/login']);
		return false;
	}
	return true;
};