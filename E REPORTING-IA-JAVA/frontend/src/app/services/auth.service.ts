import { Injectable } from '@angular/core';

interface AuthUser { id: string; email: string; firstName?: string; lastName?: string; roles?: string[] }

@Injectable({ providedIn: 'root' })
export class AuthService {
	private tokenKey = 'auth_token';
	private userKey = 'auth_user';

	get token(): string | null { return localStorage.getItem(this.tokenKey); }
	get user(): AuthUser | null { const raw = localStorage.getItem(this.userKey); return raw ? JSON.parse(raw) : null; }
	get isAuthenticated(): boolean { return !!this.token; }

	hasRole(role: string){ return (this.user?.roles || []).includes(role); }
	hasAnyRole(roles: string[]){ return roles.some(r=>this.hasRole(r)); }

	async login(email: string, password: string){
		const res = await fetch('/api/auth/login',{method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password})});
		const data = await res.json();
		localStorage.setItem(this.tokenKey, data.token);
		localStorage.setItem(this.userKey, JSON.stringify(data.user));
	}

	logout(){ localStorage.removeItem(this.tokenKey); localStorage.removeItem(this.userKey); }
}