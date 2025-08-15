import { Component, OnInit } from '@angular/core';

@Component({
	selector: 'app-elearning',
	template: `
		<div style="padding:16px">
			<h2>E-Learning</h2>
			<form (submit)="create($event)">
				<input placeholder="Titre" name="title"/>
				<select name="level">
					<option>Débutant</option>
					<option>Intermédiaire</option>
					<option>Avancé</option>
				</select>
				<button type="submit">Créer</button>
			</form>
			<ul>
				<li *ngFor="let c of list">{{c.title}} - {{c.level}}</li>
			</ul>
		</div>
	`,
	standalone: true
})
export class ELearningPage implements OnInit {
	list: any[] = [];
	async ngOnInit(){ await this.refresh(); }
	async refresh(){ this.list = await fetch('/api/elearning/courses').then(r=>r.json()); }
	async create(e: Event){
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const body = {
			title: (form.elements.namedItem('title') as HTMLInputElement).value,
			level: (form.elements.namedItem('level') as HTMLSelectElement).value,
		};
		await fetch('/api/elearning/courses',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
		form.reset();
		await this.refresh();
	}
}