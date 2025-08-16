import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-ministries',
	template: `
		<div style="padding:16px">
			<h2>Ministères</h2>
			<form (submit)="create($event)">
				<input placeholder="SIGLE" name="sigle"/>
				<input placeholder="Nom" name="name"/>
				<input placeholder="Ministre" name="minister"/>
				<button type="submit">Créer</button>
			</form>
			<div style="margin:8px 0">
				<button (click)="prefill()">Pré-remplir depuis le catalogue</button>
			</div>
			<ul>
				<li *ngFor="let m of list">{{m.sigle}} - {{m.name}} ({{m.minister}})</li>
			</ul>
		</div>
	`,
	standalone: true,
	imports: [CommonModule]
})
export class MinistriesPage implements OnInit {
	list: any[] = [];
	async ngOnInit(){ await this.refresh(); }
	async refresh(){ this.list = await fetch('/api/ministries').then(r=>r.json()); }
	async create(e: Event){
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const body = {
			sigle: (form.elements.namedItem('sigle') as HTMLInputElement).value,
			name: (form.elements.namedItem('name') as HTMLInputElement).value,
			minister: (form.elements.namedItem('minister') as HTMLInputElement).value,
		};
		await fetch('/api/ministries',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
		form.reset();
		await this.refresh();
	}
	async prefill(){
		const catalog = await fetch('/api/ministries/catalog').then(r=>r.json());
		for (const c of catalog){
			await fetch('/api/ministries',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(c)});
		}
		await this.refresh();
	}
}