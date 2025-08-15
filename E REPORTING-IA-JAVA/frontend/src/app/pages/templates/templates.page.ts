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
			<ul>
				<li *ngFor="let t of filtered()"><a (click)="open(t.id)">{{t.name}}</a> <small>({{t.phase||'-'}})</small></li>
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
}