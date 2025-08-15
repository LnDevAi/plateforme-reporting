import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'app-login',
	template: `
		<div style="padding:16px">
			<h2>Connexion</h2>
			<form (submit)="login($event)">
				<input name="email" placeholder="Email" [(ngModel)]="email"/>
				<input name="password" placeholder="Mot de passe" type="password" [(ngModel)]="password"/>
				<button type="submit">Se connecter</button>
			</form>
		</div>
	`,
	standalone: true,
	imports: [FormsModule]
})
export class LoginPage {
	email = ''; password = '';
	constructor(private router: Router, private auth: AuthService) {}
	async login(e: Event){
		e.preventDefault();
		await this.auth.login(this.email, this.password);
		this.router.navigate(['/dashboard']);
	}
}