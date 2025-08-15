import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export function roleGuard(required: string[]): CanActivateFn {
	return () => {
		const auth = inject(AuthService);
		const router = inject(Router);
		if (!auth.isAuthenticated || !auth.hasAnyRole(required)){
			router.navigate(['/dashboard']);
			return false;
		}
		return true;
	};
}