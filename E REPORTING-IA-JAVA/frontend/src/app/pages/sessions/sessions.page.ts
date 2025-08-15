import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-sessions',
	template: `
		<div style="padding:16px">
			<h2>Sessions</h2>
			<form (submit)="create($event)">
				<select name="entityId">
					<option *ngFor="let e of entities" [value]="e.id">{{e.name}}</option>
				</select>
				<select name="type">
					<option value="budgetaire">Budgétaire</option>
					<option value="cloture">Arrêt des comptes</option>
					<option value="extraordinaire">Extraordinaire</option>
				</select>
				<button type="submit">Créer</button>
			</form>
			<div *ngFor="let s of list" style="margin-top:12px; padding:8px; border:1px solid #eee">
				<b>{{s.type}}</b> - Entité: {{entityName(s.entityId)}}
				<div>
					<button (click)="addDelib(s)">+ Délibération</button>
					<button (click)="addMeeting(s)">+ Réunion</button>
				</div>
				<div>
					<h4>Délibérations</h4>
					<ul><li *ngFor="let d of s.deliberations">{{d.title}} ({{d.status}})</li></ul>
				</div>
				<div>
					<h4>Réunions</h4>
					<ul><li *ngFor="let m of s.meetings">{{m.provider}}: <a [href]="jitsiUrl(m)" target="_blank">{{m.room}}</a></li></ul>
				</div>
			</div>
		</div>
	`,
	standalone: true,
	imports: [CommonModule]
})
export class SessionsPage implements OnInit {
	list: any[] = []; entities: any[] = [];
	async ngOnInit(){
		await this.refresh();
		this.entities = await fetch('/api/entities').then(r=>r.json());
	}
	entityName(id: string){ return this.entities.find((e:any)=>e.id===id)?.name || id; }
	jitsiUrl(m: any){ return `https://meet.jit.si/${encodeURIComponent(m.room)}`; }
	async refresh(){ this.list = await fetch('/api/sessions').then(r=>r.json()); }
	async create(e: Event){
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const body = {
			entityId: (form.elements.namedItem('entityId') as HTMLSelectElement).value,
			type: (form.elements.namedItem('type') as HTMLSelectElement).value,
		};
		await fetch('/api/sessions',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
		await this.refresh();
	}
	async addDelib(s: any){
		await fetch(`/api/sessions/${s.id}/deliberations`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({title: 'Délibération'})});
		await this.refresh();
	}
	async addMeeting(s: any){
		await fetch(`/api/sessions/${s.id}/meetings`,{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({provider:'jitsi'})});
		await this.refresh();
	}
}