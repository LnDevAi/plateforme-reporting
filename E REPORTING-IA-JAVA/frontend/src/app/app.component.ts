import { Component } from '@angular/core';

@Component({
	selector: 'app-root',
	template: `
		<nav style="display:flex; gap:12px; padding:8px; border-bottom:1px solid #ddd">
			<a routerLink="/dashboard">Dashboard</a>
			<a routerLink="/ministries">Ministères</a>
			<a routerLink="/entities">Entités</a>
			<a routerLink="/templates">Modèles</a>
		</nav>
		<router-outlet />
	`
})
export class AppComponent {}