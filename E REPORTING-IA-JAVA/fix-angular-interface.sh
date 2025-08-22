#!/bin/bash
# Script complet pour corriger l'interface Angular sur le VPS
echo "🔧 Correction de l'interface Angular - $(date)"

cd "/opt/plateforme-reporting/E REPORTING-IA-JAVA/frontend" || exit 1
echo "📍 Dans le dossier: $(pwd)"

# 1. Créer le module de routing
echo "1️⃣ Création du module de routing..."
cat > src/app/app-routing.module.ts << 'EOF'
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'ministries', component: DashboardComponent },
  { path: 'entities', component: DashboardComponent },
  { path: 'projects', component: DashboardComponent },
  { path: 'sessions', component: DashboardComponent },
  { path: 'documents', component: DashboardComponent },
  { path: 'templates', component: DashboardComponent },
  { path: 'elearning', component: DashboardComponent },
  { path: 'ia', component: DashboardComponent },
  { path: 'users', component: DashboardComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
EOF

# 2. Créer le composant login
echo "2️⃣ Création du composant login..."
mkdir -p src/app/login
cat > src/app/login/login.component.ts << 'EOF'
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Plateforme de Reporting EPE</h2>
        <p class="subtitle">Burkina Faso</p>
        <form (ngSubmit)="onLogin()">
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required>
          </div>
          <div class="form-group">
            <label>Mot de passe</label>
            <input type="password" [(ngModel)]="password" name="password" required>
          </div>
          <button type="submit" class="btn-login">Se connecter</button>
          <div *ngIf="error" class="error">{{error}}</div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container { 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .login-card { 
      background: white; 
      padding: 3rem; 
      border-radius: 15px; 
      box-shadow: 0 15px 35px rgba(0,0,0,0.1); 
      width: 400px; 
      text-align: center;
    }
    .subtitle { 
      color: #666; 
      margin-bottom: 2rem; 
      font-style: italic;
    }
    .form-group { 
      margin-bottom: 1.5rem; 
      text-align: left;
    }
    label { 
      display: block; 
      margin-bottom: 0.5rem; 
      font-weight: 600; 
      color: #333;
    }
    input { 
      width: 100%; 
      padding: 1rem; 
      border: 2px solid #e1e5e9; 
      border-radius: 8px; 
      box-sizing: border-box; 
      font-size: 1rem;
      transition: border-color 0.3s;
    }
    input:focus {
      outline: none;
      border-color: #667eea;
    }
    .btn-login { 
      width: 100%; 
      padding: 1rem; 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white; 
      border: none; 
      border-radius: 8px; 
      cursor: pointer; 
      font-size: 1.1rem;
      font-weight: 600;
      transition: transform 0.2s;
    }
    .btn-login:hover {
      transform: translateY(-2px);
    }
    .error { 
      color: #e74c3c; 
      margin-top: 1rem; 
      padding: 0.5rem;
      background: #fdf2f2;
      border-radius: 5px;
    }
    h2 { 
      color: #2c3e50; 
      margin-bottom: 0.5rem; 
      font-size: 1.8rem;
    }
  `]
})
export class LoginComponent {
  email = 'admin@demo.local';
  password = 'admin123';
  error = '';

  constructor(private router: Router) {}

  onLogin() {
    if (this.email === 'admin@demo.local' && this.password === 'admin123') {
      this.router.navigate(['/dashboard']);
    } else {
      this.error = 'Identifiants incorrects';
    }
  }
}
EOF

# 3. Créer le composant dashboard
echo "3️⃣ Création du composant dashboard..."
mkdir -p src/app/dashboard
cat > src/app/dashboard/dashboard.component.ts << 'EOF'
import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <header class="header">
        <div class="header-content">
          <h1>🏛️ Plateforme de Reporting - EPE Burkina Faso</h1>
          <div class="user-info">
            <span>👤 Admin</span>
            <button (click)="logout()" class="btn-logout">Déconnexion</button>
          </div>
        </div>
      </header>
      
      <div class="main-content">
        <nav class="sidebar">
          <div class="nav-section">
            <h3>Navigation</h3>
            <a routerLink="/dashboard" routerLinkActive="active">🏠 Dashboard</a>
            <a routerLink="/ministries" routerLinkActive="active">🏛️ Ministères</a>
            <a routerLink="/entities" routerLinkActive="active">🏢 Entités</a>
            <a routerLink="/projects" routerLinkActive="active">📊 Projets</a>
          </div>
          <div class="nav-section">
            <h3>Gestion</h3>
            <a routerLink="/sessions" routerLinkActive="active">📅 Sessions</a>
            <a routerLink="/documents" routerLinkActive="active">📄 Documents</a>
            <a routerLink="/templates" routerLinkActive="active">📋 Modèles</a>
          </div>
          <div class="nav-section">
            <h3>Outils</h3>
            <a routerLink="/elearning" routerLinkActive="active">🎓 E-Learning</a>
            <a routerLink="/ia" routerLinkActive="active">🤖 IA</a>
            <a routerLink="/users" routerLinkActive="active">👥 Utilisateurs</a>
          </div>
        </nav>
        
        <main class="content">
          <div class="welcome-section">
            <h2>🎯 Tableau de Bord</h2>
            <p>Bienvenue sur la plateforme de reporting des Entreprises Publiques d'État du Burkina Faso</p>
            
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
                  <h3>128</h3>
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
                <button class="btn-action primary">📝 Nouveau Rapport</button>
                <button class="btn-action secondary">🤖 Analyse IA</button>
                <button class="btn-action tertiary">📤 Exporter</button>
                <button class="btn-action quaternary">📋 Modèles</button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .dashboard { 
      display: flex; 
      flex-direction: column; 
      height: 100vh; 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    .header { 
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%); 
      color: white; 
      padding: 1rem 2rem; 
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .user-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .main-content {
      display: flex;
      flex: 1;
    }
    .sidebar { 
      width: 280px; 
      background: #f8f9fa; 
      padding: 2rem 0; 
      border-right: 1px solid #e9ecef;
      overflow-y: auto;
    }
    .nav-section {
      margin-bottom: 2rem;
      padding: 0 1.5rem;
    }
    .nav-section h3 {
      color: #6c757d;
      font-size: 0.9rem;
      text-transform: uppercase;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    .sidebar a { 
      display: block; 
      color: #495057; 
      text-decoration: none; 
      padding: 0.75rem 1rem; 
      margin: 0.25rem 0;
      border-radius: 8px;
      transition: all 0.3s;
    }
    .sidebar a:hover, .sidebar a.active { 
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
      color: white;
      transform: translateX(5px);
    }
    .content { 
      flex: 1; 
      padding: 2rem; 
      background: #f8f9fa; 
      overflow-y: auto;
    }
    .welcome-section h2 { 
      color: #2c3e50; 
      margin-bottom: 0.5rem; 
      font-size: 2rem;
    }
    .welcome-section p {
      color: #6c757d;
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }
    .stats-grid { 
      display: grid; 
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); 
      gap: 1.5rem; 
      margin: 2rem 0; 
    }
    .stat-card { 
      background: white; 
      padding: 2rem; 
      border-radius: 15px; 
      display: flex;
      align-items: center;
      gap: 1rem;
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
      font-size: 2.5rem;
    }
    .stat-card h3 { 
      font-size: 2.5rem; 
      margin: 0; 
      font-weight: 700;
    }
    .stat-card p {
      margin: 0;
      color: #6c757d;
      font-weight: 500;
    }
    .actions-section {
      margin-top: 3rem;
    }
    .actions-section h3 {
      color: #2c3e50;
      margin-bottom: 1.5rem;
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
    .btn-logout { 
      background: #e74c3c; 
      color: white; 
      border: none; 
      padding: 0.5rem 1rem; 
      border-radius: 5px; 
      cursor: pointer; 
      transition: background 0.3s;
    }
    .btn-logout:hover {
      background: #c0392b;
    }
  `]
})
export class DashboardComponent {
  constructor(private router: Router) {}
  
  logout() { 
    this.router.navigate(['/login']); 
  }
}
EOF

# 4. Mettre à jour app.module.ts
echo "4️⃣ Mise à jour du module principal..."
cat > src/app/app.module.ts << 'EOF'
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    DashboardComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
EOF

# 5. Mettre à jour app.component.html
echo "5️⃣ Mise à jour du composant principal..."
cat > src/app/app.component.html << 'EOF'
<router-outlet></router-outlet>
EOF

# 6. Rebuilder et redéployer
echo "6️⃣ Build et déploiement..."
npm run build --prod

if [ $? -eq 0 ]; then
    echo "✅ Build réussi, déploiement..."
    cp -r dist/* /var/www/reporting-ia/
    systemctl restart nginx
    echo "🎉 Interface de reporting déployée avec succès!"
    echo "🌐 Accédez à: http://213.199.63.30"
    echo "👤 Login: admin@demo.local / admin123"
else
    echo "❌ Erreur lors du build"
    exit 1
fi
