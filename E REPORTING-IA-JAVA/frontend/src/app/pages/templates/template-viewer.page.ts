import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TemplatesService } from '../../services/templates.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
	selector: 'app-template-viewer',
	template: `
		<div style="padding:16px">
			<button (click)="back()">Retour</button>
			<h3>{{tpl?.name||'Modèle'}}</h3>
			<pre style="white-space: pre-wrap">{{tpl?.content}}</pre>
		</div>
	`,
	standalone: true,
	imports: [CommonModule, RouterModule]
})
export class TemplateViewerPage implements OnInit {
	tpl: any;
	constructor(private route: ActivatedRoute, private svc: TemplatesService, private router: Router) {}
	async ngOnInit(){
		const id = this.route.snapshot.paramMap.get('id') as string;
		this.tpl = await this.svc.getById(id);
	}
	back(){ this.router.navigate(['/templates']); }
}