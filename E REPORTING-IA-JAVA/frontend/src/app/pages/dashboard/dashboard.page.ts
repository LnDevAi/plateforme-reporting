import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as XLSX from 'xlsx';

@Component({
	selector: 'app-dashboard',
	template: `
		<div class="dashboard-container">
			<header class="dashboard-header">
				<h1>🏛️ Plateforme de Reporting - EPE Burkina Faso</h1>
				<p>Tableau de bord des Entreprises Publiques d'État</p>
			</header>
			
			<div class="stats-grid">
				<div class="stat-card primary">
					<div class="stat-icon">🏛️</div>
					<div class="stat-info">
						<h3>12</h3>
						<p>Ministères</p>
					</div>
				</div>
				<div class="stat-card success">
					<div class="stat-icon">🏢</div>
					<div class="stat-info">
						<h3>45</h3>
						<p>EPE</p>
					</div>
				</div>
				<div class="stat-card warning">
					<div class="stat-icon">📊</div>
					<div class="stat-info">
						<h3>{{stats?.reportsCompleted || 128}}</h3>
						<p>Rapports</p>
					</div>
				</div>
				<div class="stat-card info">
					<div class="stat-icon">✅</div>
					<div class="stat-info">
						<h3>89%</h3>
						<p>Conformité</p>
					</div>
				</div>
			</div>
			
			<div class="actions-section">
				<h3>Actions Rapides</h3>
				<div class="action-buttons">
					<button class="btn-action primary" (click)="load()">🔄 Recharger</button>
					<button class="btn-action secondary" (click)="exportCsv()">📊 Export CSV</button>
					<button class="btn-action tertiary" (click)="exportXlsx()">📈 Export Excel</button>
					<button class="btn-action quaternary">📝 Nouveau Rapport</button>
				</div>
			</div>
			
			<div class="kpis-section" *ngIf="kpis.length > 0">
				<h3>Indicateurs de Performance</h3>
				<div class="kpis-grid">
					<div class="kpi-card" *ngFor="let k of kpis">
						<h4>{{k.area}}</h4>
						<div class="kpi-details">{{k | json}}</div>
					</div>
				</div>
			</div>
		</div>
	`,
	styles: [`
		.dashboard-container {
			padding: 2rem;
			background: #f8f9fa;
			min-height: 100vh;
			font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
		}
		.dashboard-header {
			text-align: center;
			margin-bottom: 3rem;
		}
		.dashboard-header h1 {
			color: #2c3e50;
			margin-bottom: 0.5rem;
			font-size: 2.5rem;
		}
		.dashboard-header p {
			color: #6c757d;
			font-size: 1.2rem;
		}
		.stats-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
			gap: 2rem;
			margin-bottom: 3rem;
		}
		.stat-card {
			background: white;
			padding: 2rem;
			border-radius: 15px;
			display: flex;
			align-items: center;
			gap: 1.5rem;
			box-shadow: 0 5px 15px rgba(0,0,0,0.08);
			transition: transform 0.3s;
		}
		.stat-card:hover {
			transform: translateY(-5px);
		}
		.stat-card.primary { border-left: 5px solid #3498db; }
		.stat-card.success { border-left: 5px solid #27ae60; }
		.stat-card.warning { border-left: 5px solid #f39c12; }
		.stat-card.info { border-left: 5px solid #9b59b6; }
		.stat-icon {
			font-size: 3rem;
		}
		.stat-card h3 {
			font-size: 2.5rem;
			margin: 0;
			font-weight: 700;
			color: #2c3e50;
		}
		.stat-card p {
			margin: 0;
			color: #6c757d;
			font-weight: 500;
		}
		.actions-section {
			margin-bottom: 3rem;
		}
		.actions-section h3 {
			color: #2c3e50;
			margin-bottom: 1.5rem;
			font-size: 1.5rem;
		}
		.action-buttons {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 1rem;
		}
		.btn-action {
			padding: 1rem 1.5rem;
			border: none;
			border-radius: 10px;
			cursor: pointer;
			font-weight: 600;
			font-size: 1rem;
			transition: all 0.3s;
		}
		.btn-action.primary { background: #3498db; color: white; }
		.btn-action.secondary { background: #27ae60; color: white; }
		.btn-action.tertiary { background: #f39c12; color: white; }
		.btn-action.quaternary { background: #9b59b6; color: white; }
		.btn-action:hover {
			transform: translateY(-2px);
			box-shadow: 0 5px 15px rgba(0,0,0,0.2);
		}
		.kpis-section h3 {
			color: #2c3e50;
			margin-bottom: 1.5rem;
		}
		.kpis-grid {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
			gap: 1rem;
		}
		.kpi-card {
			background: white;
			padding: 1.5rem;
			border-radius: 10px;
			box-shadow: 0 3px 10px rgba(0,0,0,0.05);
		}
		.kpi-card h4 {
			color: #2c3e50;
			margin-bottom: 1rem;
		}
		.kpi-details {
			font-size: 0.9rem;
			color: #6c757d;
		}
	`],
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
	exportXlsx(){
		const ws = XLSX.utils.json_to_sheet(this.kpis);
		const wb = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(wb, ws, 'KPIs');
		XLSX.writeFile(wb, 'dashboard_kpis.xlsx');
	}
}