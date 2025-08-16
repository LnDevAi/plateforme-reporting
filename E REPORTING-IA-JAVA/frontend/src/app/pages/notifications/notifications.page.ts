import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
	selector: 'app-notifications',
	standalone: true,
	imports: [CommonModule],
	template: `
		<div style="padding:16px">
			<h2>Notifications</h2>
			<ul>
				<li *ngFor="let n of list">{{n.createdAt}} - {{n.message}}</li>
			</ul>
		</div>
	`
})
export class NotificationsPage implements OnInit {
	list: any[] = [];
	async ngOnInit(){ this.list = await fetch('/api/notifications').then(r=>r.json()); }
}