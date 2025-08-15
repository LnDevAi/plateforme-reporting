import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
	selector: 'app-ai',
	template: `
		<div style="padding:16px">
			<h2>Assistant IA</h2>
			<textarea [(ngModel)]="prompt" rows="5" cols="60" placeholder="Posez une question..." ></textarea>
			<br/>
			<button (click)="ask()">Demander</button>
			<pre style="white-space: pre-wrap">{{response | json}}</pre>
		</div>
	`,
	standalone: true,
	imports: [FormsModule]
})
export class AIPage {
	prompt = '';
	response: any;
	async ask(){
		this.response = await fetch('/api/ai/assist',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({prompt: this.prompt})}).then(r=>r.json());
	}
}