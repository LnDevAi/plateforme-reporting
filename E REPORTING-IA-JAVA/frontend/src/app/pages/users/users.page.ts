import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-users',
	template: `
		<div style="padding:16px">
			<h2>Utilisateurs</h2>
			<form (submit)="create($event)">
				<input placeholder="Email" name="email"/>
				<input placeholder="Prénom" name="firstName"/>
				<input placeholder="Nom" name="lastName"/>
				<select multiple name="roles">
					<option>ADMIN</option>
					<option>EDITEUR</option>
					<option>LECTEUR</option>
					<option>VALIDATEUR</option>
				</select>
				<button type="submit">Créer</button>
			</form>
			<ul>
				<li *ngFor="let u of list">
					{{u.email}} - {{u.firstName}} {{u.lastName}} - Rôles: {{u.roles?.join(', ')}}
				</li>
			</ul>
		</div>
	`,
	standalone: true,
	imports: [CommonModule]
})
export class UsersPage implements OnInit {
	list: any[] = [];
	async ngOnInit(){ await this.refresh(); }
	async refresh(){ this.list = await fetch('/api/users').then(r=>r.json()); }
	async create(e: Event){
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const roles = Array.from((form.elements.namedItem('roles') as HTMLSelectElement).selectedOptions).map(o=>o.value);
		const body = {
			email: (form.elements.namedItem('email') as HTMLInputElement).value,
			firstName: (form.elements.namedItem('firstName') as HTMLInputElement).value,
			lastName: (form.elements.namedItem('lastName') as HTMLInputElement).value,
			roles
		};
		await fetch('/api/users',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
		form.reset();
		await this.refresh();
	}
}