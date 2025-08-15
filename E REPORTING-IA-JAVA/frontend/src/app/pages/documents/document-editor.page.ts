import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-document-editor',
	standalone: true,
	imports: [CommonModule, FormsModule, RouterModule],
	template: `
		<div style="padding:16px">
			<a (click)="back()">← Retour</a>
			<h2>Édition de document</h2>
			<div *ngIf="doc">
				<label>Titre</label>
				<input [(ngModel)]="doc.title"/>
				<label>Contenu</label>
				<textarea [(ngModel)]="doc.content" rows="12" style="width:100%"></textarea>
				<div style="margin-top:8px">
					<button (click)="save()">Enregistrer</button>
				</div>
			</div>
		</div>
	`
})
export class DocumentEditorPage implements OnInit {
	doc: any;
	constructor(private route: ActivatedRoute, private router: Router) {}
	async ngOnInit(){
		const id = this.route.snapshot.paramMap.get('id') as string;
		const list = await fetch('/api/documents').then(r=>r.json());
		this.doc = list.find((d: any)=>d.id===id);
	}
	async save(){
		await fetch(`/api/documents/${this.doc.id}`,{method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(this.doc)});
		this.back();
	}
	back(){ this.router.navigate(['/documents']); }
}