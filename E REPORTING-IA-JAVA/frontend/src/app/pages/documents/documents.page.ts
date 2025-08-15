import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-documents',
	template: `
		<div style="padding:16px">
			<h2>Documents</h2>
			<form (submit)="create($event)">
				<input name="title" placeholder="Titre"/>
				<select name="category">
					<option value="elaboration">Élaboration</option>
					<option value="execution">Exécution</option>
					<option value="autres">Autres</option>
				</select>
				<select name="entityId">
					<option value="">(Aucune entité)</option>
					<option *ngFor="let e of entities" [value]="e.id">{{e.name}}</option>
				</select>
				<select name="sessionId">
					<option value="">(Aucune session)</option>
					<option *ngFor="let s of sessions" [value]="s.id">{{s.type}} - {{entityName(s.entityId)}}</option>
				</select>
				<button type="submit">Créer</button>
			</form>
			<ul>
				<li *ngFor="let d of list">
					{{d.title}} [{{d.category}}]
					<button (click)="sign(d)">Signer (mock)</button>
					<span *ngIf="d.signature">Signé par {{d.signature.signedBy}} le {{d.signature.signedAt}}</span>
				</li>
			</ul>
		</div>
	`,
	standalone: true,
	imports: [CommonModule]
})
export class DocumentsPage implements OnInit {
	list: any[] = []; entities: any[] = []; sessions: any[] = [];
	async ngOnInit(){ await this.refresh(); }
	async refresh(){
		this.list = await fetch('/api/documents').then(r=>r.json());
		this.entities = await fetch('/api/entities').then(r=>r.json());
		this.sessions = await fetch('/api/sessions').then(r=>r.json());
	}
	entityName(id: string){ return this.entities.find((e:any)=>e.id===id)?.name || id; }
	async create(e: Event){
		e.preventDefault();
		const form = e.target as HTMLFormElement;
		const body: any = {
			title: (form.elements.namedItem('title') as HTMLInputElement).value,
			category: (form.elements.namedItem('category') as HTMLSelectElement).value,
			entityId: (form.elements.namedItem('entityId') as HTMLSelectElement).value || null,
			sessionId: (form.elements.namedItem('sessionId') as HTMLSelectElement).value || null,
		};
		await fetch('/api/documents',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)});
		form.reset();
		await this.refresh();
	}
	async sign(d: any){
		await fetch('/api/signatures/mock',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({documentId: d.id, signedBy:'Admin Démo'})});
		await this.refresh();
	}
}