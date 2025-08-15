import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-dashboard',
	template: `
		<div style="padding:16px">
			<h2>Dashboard</h2>
			<button (click)="load()">Recharger</button>
			<button (click)="exportCsv()">Exporter KPIs (CSV)</button>
			<div *ngIf="stats">
				<p>Complétés: {{stats.reportsCompleted}} - En attente: {{stats.reportsPending}}</p>
			</div>
			<h3>KPIs</h3>
			<ul>
				<li *ngFor="let k of kpis">{{k.area}}: {{k | json}}</li>
			</ul>
		</div>
	`,
	standalone: true,
	imports: [CommonModule]
})
export class DashboardPage implements OnInit {
	stats: any; kpis: any[] = [];
	async ngOnInit(){ await this.load(); }
	async load(){
		this.stats = await fetch('/api/dashboard/stats').then(r=>r.json());
		this.kpis = await fetch('/api/dashboard/kpis').then(r=>r.json());
	}
	exportCsv(){ window.open('/api/export/kpis.csv','_blank'); }
}