import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import jsPDF from 'jspdf';
import { RouterModule } from '@angular/router';

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
					<a [routerLink]="['/documents', d.id, 'edit']">Modifier</a>
					<button (click)="sign(d)">Signer (mock)</button>
					<button (click)="exportPdf(d)">PDF</button>
					<span *ngIf="d.signature">Signé par {{d.signature.signedBy}} le {{d.signature.signedAt}}</span>
				</li>
			</ul>
		</div>
	`,
	standalone: true,
	imports: [CommonModule, RouterModule]
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
	exportPdf(d: any){
		const doc = new jsPDF();
		doc.setFontSize(14);
		doc.text(d.title || 'Document', 10, 10);
		doc.setFontSize(11);
		const content = (d.content || '').toString();
		const lines = doc.splitTextToSize(content, 180);
		doc.text(lines, 10, 20);
		if (d.signature){
			doc.setFontSize(10);
			doc.text(`Signé par ${d.signature.signedBy} le ${d.signature.signedAt}`, 10, 280);
		}
		doc.save(`${(d.title||'document').replace(/\s+/g,'_')}.pdf`);
	}
}