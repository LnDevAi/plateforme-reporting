import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	selector: 'app-login',
	template: `
		<div style="padding:16px">
			<h2>Connexion</h2>
			<form (submit)="login($event)">
				<input name="email" placeholder="Email"/>
				<input name="password" placeholder="Mot de passe" type="password"/>
				<button type="submit">Se connecter</button>
			</form>
		</div>
	`,
	standalone: true
})
export class LoginPage {
	constructor(private router: Router) {}
	async login(e: Event){
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const body = {
			email: (form.elements.namedItem('email') as HTMLInputElement).value,
			password: (form.elements.namedItem('password') as HTMLInputElement).value,
		};
		await fetch('/api/auth/login',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
		this.router.navigate(['/dashboard']);
	}
}