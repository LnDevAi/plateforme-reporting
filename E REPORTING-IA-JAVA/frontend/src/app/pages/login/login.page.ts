import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
	selector: 'app-login',
	template: `
		<div style="padding:16px; max-width:400px; margin:50px auto; border:1px solid #ddd; border-radius:8px">
			<h2>Connexion - Plateforme de Reporting</h2>
			<p style="color:#666; margin-bottom:20px">Utilisez les identifiants par défaut :</p>
			<form (submit)="login($event)" style="display:flex; flex-direction:column; gap:12px">
				<input name="email" placeholder="Email" [(ngModel)]="email" style="padding:8px; border:1px solid #ccc; border-radius:4px"/>
				<input name="password" placeholder="Mot de passe" type="password" [(ngModel)]="password" style="padding:8px; border:1px solid #ccc; border-radius:4px"/>
				<button type="submit" style="padding:10px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer">Se connecter</button>
			</form>
			<div style="margin-top:16px; padding:12px; background:#f8f9fa; border-radius:4px; font-size:14px">
				<strong>Identifiants de test :</strong><br>
				Email: admin@demo.local<br>
				Mot de passe: admin123
			</div>
		</div>
	`,
	standalone: true,
	imports: [FormsModule]
})
export class LoginPage {
	email = 'admin@demo.local'; password = 'admin123';
	constructor(private router: Router, private auth: AuthService) {}
	async login(e: Event){
		e.preventDefault();
		try {
			await this.auth.login(this.email, this.password);
			this.router.navigate(['/dashboard']);
		} catch (error) {
			alert('Erreur de connexion: ' + error);
		}
	}
}