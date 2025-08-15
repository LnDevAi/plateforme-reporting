import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
	selector: 'app-root',
	standalone: true,
	imports: [RouterModule],
	template: `
		<nav style="display:flex; gap:12px; padding:8px; border-bottom:1px solid #ddd">
			<a routerLink="/dashboard">Dashboard</a>
			<a routerLink="/ministries">Ministères</a>
			<a routerLink="/entities">Entités</a>
			<a routerLink="/projects">Projets</a>
			<a routerLink="/sessions">Sessions</a>
			<a routerLink="/documents">Documents</a>
			<a routerLink="/templates">Modèles</a>
			<a routerLink="/elearning">E-Learning</a>
			<a routerLink="/ai">IA</a>
			<a routerLink="/users">Utilisateurs</a>
			<a routerLink="/login" style="margin-left:auto">Connexion</a>
		</nav>
		<router-outlet />
	`
})
export class AppComponent {}