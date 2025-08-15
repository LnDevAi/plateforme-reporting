import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-entities',
	template: `
		<div style="padding:16px">
			<h2>Entités</h2>
			<form (submit)="create($event)">
				<select name="type">
					<option value="EPE">EPE</option>
					<option value="SE">Société d'État</option>
				</select>
				<input placeholder="Nom" name="name" list="names"/>
				<datalist id="names">
					<option *ngFor="let n of nameOptions" [value]="n"></option>
				</datalist>
				<select name="ministryId">
					<option *ngFor="let m of ministries" [value]="m.id">{{m.sigle}} - {{m.name}}</option>
				</select>
				<button type="submit">Créer</button>
			</form>
			<ul>
				<li *ngFor="let e of list">{{e.type}} - {{e.name}}</li>
			</ul>
		</div>
	`,
	standalone: true,
	imports: [CommonModule]
})
export class EntitiesPage implements OnInit {
	list: any[] = []; ministries: any[] = []; nameOptions: string[] = []; type: string = 'EPE';
	async ngOnInit(){
		await this.refresh();
		this.ministries = await fetch('/api/ministries').then(r=>r.json());
		this.nameOptions = await fetch('/api/entities/catalog/epe').then(r=>r.json());
	}
	async refresh(){ this.list = await fetch('/api/entities').then(r=>r.json()); }
	async create(e: Event){
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const body = {
			type: (form.elements.namedItem('type') as HTMLSelectElement).value,
			name: (form.elements.namedItem('name') as HTMLInputElement).value,
			ministryId: (form.elements.namedItem('ministryId') as HTMLSelectElement).value,
		};
		await fetch('/api/entities',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
		form.reset();
		await this.refresh();
	}
}