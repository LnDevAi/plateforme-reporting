import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthService } from './app/services/auth.service';

bootstrapApplication(AppComponent, {
	providers: [provideRouter(routes), AuthService]
}).then(async appRef => {
	const disableAuth = (window as any).ENV?.DISABLE_AUTH === 'true';
	if (disableAuth) {
		const auth = appRef.injector.get(AuthService);
		if (!auth.isAuthenticated) {
			try {
				await auth.login('demo@local', '');
			} catch {}
		}
	}
});