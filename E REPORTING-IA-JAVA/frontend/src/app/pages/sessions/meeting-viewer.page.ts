import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

declare global {
	interface Window { JitsiMeetExternalAPI?: any }
}

@Component({
	selector: 'app-meeting-viewer',
	standalone: true,
	imports: [CommonModule, RouterModule],
	template: `
		<div style="padding:8px"><a routerLink="/sessions">← Retour aux sessions</a></div>
		<div id="jitsi-container" style="width:100%; height: calc(100vh - 60px);"></div>
	`
})
export class MeetingViewerPage implements OnInit, OnDestroy {
	private api: any;
	constructor(private route: ActivatedRoute) {}

	async ngOnInit(){
		const room = this.route.snapshot.paramMap.get('room') as string;
		await this.ensureScript();
		this.api = new window.JitsiMeetExternalAPI('meet.jit.si', {
			roomName: room,
			parentNode: document.getElementById('jitsi-container'),
			configOverwrite: {},
			interfaceConfigOverwrite: {}
		});
	}

	ngOnDestroy(){
		try { this.api && this.api.dispose && this.api.dispose(); } catch {}
	}

	private ensureScript(): Promise<void> {
		if (window.JitsiMeetExternalAPI) return Promise.resolve();
		return new Promise((resolve, reject) => {
			const script = document.createElement('script');
			script.src = 'https://meet.jit.si/external_api.js';
			script.async = true;
			script.onload = () => resolve();
			script.onerror = () => reject(new Error('Failed to load Jitsi API'));
			document.body.appendChild(script);
		});
	}
}