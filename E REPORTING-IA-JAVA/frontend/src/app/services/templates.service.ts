import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TemplatesService {
	async getAll() {
		const res = await fetch('/api/templates');
		return res.json();
	}
	async getById(id: string) {
		const res = await fetch(`/api/templates/${id}`);
		return res.json();
	}
}