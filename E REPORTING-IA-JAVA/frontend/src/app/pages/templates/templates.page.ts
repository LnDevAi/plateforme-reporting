import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TemplatesService } from '../../services/templates.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
	selector: 'app-templates',
	template: `
		<div style="padding:16px">
			<h2>Modèles de rapports</h2>
			<nav>
				<button (click)="active='budgetaire'">Session Budgétaire</button>
				<button (click)="active='cloture'">Session d'arrêt des comptes</button>
				<button (click)="active='generique'">Génériques</button>
			</nav>
			<div style="margin:8px 0;">
				<button (click)="open('plat-bud-elab')">Ouvrir Budget</button>
				<button (click)="open('plat-pta-elab')">Ouvrir PTA</button>
				<button (click)="open('plat-ppm-elab')">Ouvrir PPM</button>
			</div>
			<ul>
				<li *ngFor="let t of filtered()">
					<a (click)="open(t.id)">{{t.name}}</a>
					<button (click)="saveAsDoc(t.id)">Enregistrer comme document</button>
				</li>
			</ul>
		</div>
	`,
	standalone: true,
	imports: [CommonModule, RouterModule]
})
export class TemplatesPage implements OnInit {
	templates: any[] = [];
	active: string = 'budgetaire';
	constructor(private svc: TemplatesService, private router: Router) {}
	async ngOnInit(){ this.templates = await this.svc.getAll(); }
	filtered(){ return this.templates.filter(t=>t.session===this.active); }
	open(id: string){ this.router.navigate(['/templates', id]); }
	async saveAsDoc(id: string){
		const tpl = await this.svc.getById(id);
		await fetch('/api/documents',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({title: tpl.id, category:'elaboration', content: tpl.content})});
		alert('Document créé');
	}
}