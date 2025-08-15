import { Routes } from '@angular/router';
import { TemplatesPage } from './pages/templates/templates.page';
import { TemplateViewerPage } from './pages/templates/template-viewer.page';

export const routes: Routes = [
  { path: '', redirectTo: 'templates', pathMatch: 'full' },
  { path: 'templates', component: TemplatesPage },
  { path: 'templates/:id', component: TemplateViewerPage },
];
