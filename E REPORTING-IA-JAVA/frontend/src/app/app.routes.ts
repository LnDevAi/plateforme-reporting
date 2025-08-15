import { Routes } from '@angular/router';
import { TemplatesPage } from './pages/templates/templates.page';
import { TemplateViewerPage } from './pages/templates/template-viewer.page';
import { DashboardPage } from './pages/dashboard/dashboard.page';
import { MinistriesPage } from './pages/ministries/ministries.page';
import { EntitiesPage } from './pages/entities/entities.page';
import { LoginPage } from './pages/login/login.page';
import { ELearningPage } from './pages/elearning/elearning.page';
import { AIPage } from './pages/ai/ai.page';
import { ProjectsPage } from './pages/projects/projects.page';
import { SessionsPage } from './pages/sessions/sessions.page';
import { DocumentsPage } from './pages/documents/documents.page';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
	{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
	{ path: 'login', component: LoginPage },
	{ path: 'dashboard', component: DashboardPage, canActivate: [authGuard] },
	{ path: 'templates', component: TemplatesPage, canActivate: [authGuard] },
	{ path: 'templates/:id', component: TemplateViewerPage, canActivate: [authGuard] },
	{ path: 'ministries', component: MinistriesPage, canActivate: [authGuard] },
	{ path: 'entities', component: EntitiesPage, canActivate: [authGuard] },
	{ path: 'projects', component: ProjectsPage, canActivate: [authGuard] },
	{ path: 'sessions', component: SessionsPage, canActivate: [authGuard] },
	{ path: 'documents', component: DocumentsPage, canActivate: [authGuard] },
	{ path: 'elearning', component: ELearningPage, canActivate: [authGuard] },
	{ path: 'ai', component: AIPage, canActivate: [authGuard] },
];