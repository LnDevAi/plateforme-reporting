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

export const routes: Routes = [
	{ path: '', redirectTo: 'dashboard', pathMatch: 'full' },
	{ path: 'login', component: LoginPage },
	{ path: 'dashboard', component: DashboardPage },
	{ path: 'templates', component: TemplatesPage },
	{ path: 'templates/:id', component: TemplateViewerPage },
	{ path: 'ministries', component: MinistriesPage },
	{ path: 'entities', component: EntitiesPage },
	{ path: 'projects', component: ProjectsPage },
	{ path: 'sessions', component: SessionsPage },
	{ path: 'documents', component: DocumentsPage },
	{ path: 'elearning', component: ELearningPage },
	{ path: 'ai', component: AIPage },
];