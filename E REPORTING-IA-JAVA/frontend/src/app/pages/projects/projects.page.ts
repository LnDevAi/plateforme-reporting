import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-projects',
	template: `
		<div style="padding:16px">
			<h2>Projets</h2>
			<form (submit)="create($event)">
				<input placeholder="Nom du projet" name="name"/>
				<select name="entityId">
					<option *ngFor="let e of entities" [value]="e.id">{{e.name}}</option>
				</select>
				<button type="submit">Créer</button>
			</form>
			<ul>
				<li *ngFor="let p of list">{{p.name}} - Entité: {{entityName(p.entityId)}}</li>
			</ul>
		</div>
	`,
	standalone: true,
	imports: [CommonModule]
})
export class ProjectsPage implements OnInit {
	list: any[] = []; entities: any[] = [];
	async ngOnInit(){
		await this.refresh();
		this.entities = await fetch('/api/entities').then(r=>r.json());
	}
	entityName(id: string){ return this.entities.find((e:any)=>e.id===id)?.name || id; }
	async refresh(){ this.list = await fetch('/api/projects').then(r=>r.json()); }
	async create(e: Event){
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const body = {
			name: (form.elements.namedItem('name') as HTMLInputElement).value,
			entityId: (form.elements.namedItem('entityId') as HTMLSelectElement).value,
		};
		await fetch('/api/projects',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
		form.reset();
		await this.refresh();
	}
}