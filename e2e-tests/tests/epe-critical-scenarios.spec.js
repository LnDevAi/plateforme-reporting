import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les scénarios critiques de la Plateforme EPE
 * 
 * Ces tests couvrent les workflows complets les plus importants :
 * - Authentification et onboarding EPE
 * - Création et gestion de rapports OHADA/UEMOA
 * - Sessions en ligne (CA, AG)
 * - Assistant IA pour gouvernance
 * - Collaboration documentaire
 */

test.describe('Scénarios Critiques EPE', () => {
  
  test.describe('Authentification et Onboarding EPE', () => {
    
    test('Parcours complet inscription EPE Burkina Faso', async ({ page }) => {
      await page.goto('/register');
      
      // Vérifier la page d'inscription
      await expect(page.locator('h1')).toContainText('Inscription Plateforme EPE');
      
      // Remplir le formulaire d'inscription
      await page.fill('[data-testid="user-name"]', 'Amadou OUÉDRAOGO');
      await page.fill('[data-testid="user-email"]', 'amadou@sonabel.bf');
      await page.fill('[data-testid="user-password"]', 'Password123!');
      await page.fill('[data-testid="user-password-confirmation"]', 'Password123!');
      await page.selectOption('[data-testid="user-role"]', 'admin');
      await page.fill('[data-testid="user-position"]', 'Directeur Général');
      
      // Sélectionner le pays
      await page.selectOption('[data-testid="country-select"]', 'BF');
      await expect(page.locator('[data-testid="country-info"]')).toContainText('OHADA');
      await expect(page.locator('[data-testid="country-info"]')).toContainText('UEMOA');
      
      // Créer ou sélectionner l'entité EPE
      await page.click('[data-testid="create-entity-button"]');
      await page.fill('[data-testid="entity-name"]', 'SONABEL');
      await page.selectOption('[data-testid="entity-type"]', 'SOCIETE_ETAT');
      await page.selectOption('[data-testid="entity-sector"]', 'Énergie');
      await page.selectOption('[data-testid="entity-size"]', 'large');
      await page.fill('[data-testid="entity-establishment-date"]', '1968-01-01');
      
      // Valider l'inscription
      await page.click('[data-testid="register-submit"]');
      
      // Vérifier la redirection vers le dashboard
      await expect(page).toHaveURL('/dashboard');
      await expect(page.locator('[data-testid="welcome-message"]')).toContainText('Bienvenue, Amadou OUÉDRAOGO');
      await expect(page.locator('[data-testid="entity-name"]')).toContainText('SONABEL');
      
      // Vérifier les éléments spécifiques OHADA/UEMOA
      await expect(page.locator('[data-testid="regulatory-framework"]')).toContainText('OHADA');
      await expect(page.locator('[data-testid="regulatory-framework"]')).toContainText('UEMOA');
      await expect(page.locator('[data-testid="accounting-system"]')).toContainText('SYSCOHADA');
    });

    test('Connexion et navigation dans le dashboard EPE', async ({ page }) => {
      // Setup: Créer un utilisateur test via l'API
      await page.request.post('/api/auth/register', {
        data: {
          name: 'Test User SONABEL',
          email: 'test@sonabel.bf',
          password: 'Password123!',
          password_confirmation: 'Password123!',
          role: 'admin',
          country_id: 1, // Burkina Faso
          entity_type: 'SOCIETE_ETAT'
        }
      });

      // Test de connexion
      await page.goto('/login');
      await page.fill('[data-testid="login-email"]', 'test@sonabel.bf');
      await page.fill('[data-testid="login-password"]', 'Password123!');
      await page.click('[data-testid="login-submit"]');
      
      await expect(page).toHaveURL('/dashboard');
      
      // Vérifier les widgets du dashboard
      await expect(page.locator('[data-testid="kpi-financial"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-governance"]')).toBeVisible();
      await expect(page.locator('[data-testid="kpi-compliance"]')).toBeVisible();
      
      // Vérifier les actions rapides EPE
      await expect(page.locator('[data-testid="quick-action-budget"]')).toContainText('Budget Annuel');
      await expect(page.locator('[data-testid="quick-action-ca"]')).toContainText('Conseil d\'Administration');
      await expect(page.locator('[data-testid="quick-action-ag"]')).toContainText('Assemblée Générale');
    });
  });

  test.describe('Gestion des Rapports OHADA/UEMOA', () => {
    
    test('Création complète rapport budget annuel SYSCOHADA', async ({ page }) => {
      // Connexion préalable
      await loginAsAdmin(page);
      
      // Naviguer vers la création de rapport
      await page.click('[data-testid="nav-reports"]');
      await page.click('[data-testid="create-report"]');
      
      // Sélectionner le type de rapport
      await page.selectOption('[data-testid="report-type"]', 'budget_annuel');
      await expect(page.locator('[data-testid="report-description"]')).toContainText('SYSCOHADA');
      
      // Configurer les paramètres
      await page.selectOption('[data-testid="financial-year"]', '2024');
      await page.selectOption('[data-testid="report-format"]', 'xlsx');
      await page.check('[data-testid="include-previous-year"]');
      
      // Saisir les données financières
      await page.fill('[data-testid="revenue-total"]', '15000000000');
      await page.fill('[data-testid="expenses-operational"]', '12000000000');
      await page.fill('[data-testid="expenses-investment"]', '2000000000');
      await page.fill('[data-testid="assets-total"]', '50000000000');
      await page.fill('[data-testid="liabilities-total"]', '30000000000');
      
      // Valider la conformité SYSCOHADA
      await page.click('[data-testid="validate-syscohada"]');
      await expect(page.locator('[data-testid="validation-status"]')).toContainText('Conforme SYSCOHADA');
      
      // Générer le rapport
      await page.click('[data-testid="generate-report"]');
      
      // Vérifier la génération réussie
      await expect(page.locator('[data-testid="generation-status"]')).toContainText('Rapport généré avec succès');
      await expect(page.locator('[data-testid="download-link"]')).toBeVisible();
      
      // Vérifier la conformité réglementaire
      await expect(page.locator('[data-testid="compliance-checks"]')).toContainText('OHADA: ✓');
      await expect(page.locator('[data-testid="compliance-checks"]')).toContainText('UEMOA: ✓');
    });

    test('Workflow complet rapport de gestion CA → AG', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Créer le rapport de gestion du CA
      await page.goto('/reports/create');
      await page.selectOption('[data-testid="report-type"]', 'rapport_gestion_ca');
      
      // Saisir les éléments du rapport
      await page.fill('[data-testid="ca-president"]', 'Dr. Fatimata OUEDRAOGO');
      await page.fill('[data-testid="ca-meetings-count"]', '6');
      await page.fill('[data-testid="major-decisions"]', 'Approbation budget 2024, Nomination DG adjoint, Stratégie 2025-2027');
      
      // Ajouter les recommandations
      await page.click('[data-testid="add-recommendation"]');
      await page.fill('[data-testid="recommendation-1"]', 'Renforcement du contrôle interne');
      await page.click('[data-testid="add-recommendation"]');
      await page.fill('[data-testid="recommendation-2"]', 'Amélioration de la gouvernance ESG');
      
      // Valider et soumettre
      await page.click('[data-testid="submit-for-ag"]');
      await expect(page.locator('[data-testid="submission-status"]')).toContainText('Rapport soumis pour AG');
      
      // Programmer l'AG
      await page.click('[data-testid="schedule-ag"]');
      await page.fill('[data-testid="ag-date"]', '2024-12-15');
      await page.fill('[data-testid="ag-time"]', '09:00');
      await page.selectOption('[data-testid="ag-mode"]', 'hybrid');
      
      // Vérifier la notification aux participants
      await expect(page.locator('[data-testid="notification-sent"]')).toContainText('Invitations envoyées');
    });
  });

  test.describe('Sessions en Ligne CA/AG', () => {
    
    test('Session complète Conseil d\'Administration en ligne', async ({ page, context }) => {
      // Connexion en tant que Président du CA
      await loginAsAdmin(page);
      
      // Créer une session CA
      await page.goto('/sessions/create');
      await page.selectOption('[data-testid="session-type"]', 'conseil_administration');
      await page.fill('[data-testid="session-title"]', 'CA Ordinaire Décembre 2024');
      await page.fill('[data-testid="session-date"]', '2024-12-10');
      await page.fill('[data-testid="session-time"]', '14:00');
      
      // Configurer l'ordre du jour
      await page.click('[data-testid="add-agenda-item"]');
      await page.fill('[data-testid="agenda-item-1"]', 'Approbation PV précédent');
      await page.click('[data-testid="add-agenda-item"]');
      await page.fill('[data-testid="agenda-item-2"]', 'Présentation résultats T4 2024');
      await page.click('[data-testid="add-agenda-item"]');
      await page.fill('[data-testid="agenda-item-3"]', 'Vote budget 2025');
      
      // Inviter les participants
      await page.fill('[data-testid="participant-email"]', 'administrateur1@sonabel.bf');
      await page.click('[data-testid="add-participant"]');
      await page.fill('[data-testid="participant-email"]', 'administrateur2@sonabel.bf');
      await page.click('[data-testid="add-participant"]');
      
      // Démarrer la session
      await page.click('[data-testid="start-session"]');
      await expect(page).toHaveURL(/\/sessions\/\d+\/room/);
      
      // Vérifier l'interface de session
      await expect(page.locator('[data-testid="session-title"]')).toContainText('CA Ordinaire Décembre 2024');
      await expect(page.locator('[data-testid="participant-count"]')).toContainText('1 participant(s)');
      await expect(page.locator('[data-testid="session-status"]')).toContainText('En cours');
      
      // Simuler l'arrivée d'un autre participant (nouvelle page)
      const participantPage = await context.newPage();
      await participantPage.goto(page.url());
      await loginAsUser(participantPage, 'administrateur1@sonabel.bf');
      
      // Retour à la page principale - vérifier mise à jour participants
      await expect(page.locator('[data-testid="participant-count"]')).toContainText('2 participant(s)');
      
      // Conduire un vote
      await page.click('[data-testid="agenda-item-3"]'); // Budget 2025
      await page.click('[data-testid="start-vote"]');
      await page.fill('[data-testid="vote-question"]', 'Approuvez-vous le budget 2025 ?');
      await page.click('[data-testid="create-vote"]');
      
      // Voter
      await page.click('[data-testid="vote-pour"]');
      await participantPage.click('[data-testid="vote-pour"]');
      
      // Vérifier les résultats
      await expect(page.locator('[data-testid="vote-results"]')).toContainText('Pour: 2, Contre: 0');
      await expect(page.locator('[data-testid="vote-status"]')).toContainText('Approuvé');
      
      // Clôturer la session
      await page.click('[data-testid="close-session"]');
      await expect(page.locator('[data-testid="session-status"]')).toContainText('Terminée');
      
      // Vérifier la génération du PV
      await expect(page.locator('[data-testid="pv-generated"]')).toBeVisible();
      await expect(page.locator('[data-testid="download-pv"]')).toBeVisible();
    });

    test('Assemblée Générale avec votes sécurisés', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Créer une AG
      await page.goto('/sessions/create');
      await page.selectOption('[data-testid="session-type"]', 'assemblee_generale');
      await page.fill('[data-testid="session-title"]', 'AG Ordinaire 2024');
      
      // Configurer les votes sécurisés
      await page.check('[data-testid="enable-secure-voting"]');
      await page.selectOption('[data-testid="encryption-method"]', 'AES-256');
      
      // Ajouter des résolutions à voter
      await page.click('[data-testid="add-resolution"]');
      await page.fill('[data-testid="resolution-1"]', 'Approbation des comptes 2024');
      await page.selectOption('[data-testid="resolution-1-type"]', 'majorite_simple');
      
      await page.click('[data-testid="add-resolution"]');
      await page.fill('[data-testid="resolution-2"]', 'Nomination commissaire aux comptes');
      await page.selectOption('[data-testid="resolution-2-type"]', 'majorite_qualifiee');
      
      // Démarrer l'AG
      await page.click('[data-testid="start-session"]');
      
      // Vérifier la sécurisation
      await expect(page.locator('[data-testid="encryption-status"]')).toContainText('Chiffrement activé');
      await expect(page.locator('[data-testid="vote-integrity"]')).toContainText('Intégrité vérifiée');
      
      // Lancer le premier vote
      await page.click('[data-testid="resolution-1"]');
      await page.click('[data-testid="start-vote"]');
      
      // Vérifier l'interface de vote sécurisé
      await expect(page.locator('[data-testid="secure-vote-interface"]')).toBeVisible();
      await expect(page.locator('[data-testid="vote-encryption-info"]')).toContainText('Vote chiffré');
      
      // Effectuer le vote
      await page.click('[data-testid="vote-pour"]');
      await page.fill('[data-testid="vote-justification"]', 'Comptes conformes et approuvés par le CA');
      await page.click('[data-testid="confirm-vote"]');
      
      // Vérifier l'enregistrement sécurisé
      await expect(page.locator('[data-testid="vote-confirmed"]')).toContainText('Vote enregistré et chiffré');
      
      // Clôturer et vérifier la traçabilité
      await page.click('[data-testid="close-vote"]');
      await expect(page.locator('[data-testid="audit-trail"]')).toBeVisible();
      await expect(page.locator('[data-testid="vote-hash"]')).toBeVisible();
    });
  });

  test.describe('Assistant IA Expert EPE', () => {
    
    test('Conversation complète gouvernance OHADA', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Accéder à l'assistant IA
      await page.goto('/ai-assistant');
      
      // Vérifier l'interface
      await expect(page.locator('[data-testid="ai-chat-title"]')).toContainText('Assistant IA Expert EPE');
      await expect(page.locator('[data-testid="ai-welcome"]')).toContainText('gouvernance EPE');
      
      // Vérifier les suggestions contextuelles OHADA/UEMOA
      await expect(page.locator('[data-testid="suggestion"]')).toContainText('OHADA');
      
      // Poser une question sur la gouvernance
      await page.fill('[data-testid="ai-input"]', 'Quelles sont les obligations OHADA pour mon conseil d\'administration SONABEL ?');
      await page.click('[data-testid="ai-send"]');
      
      // Vérifier la réponse contextualisée
      await expect(page.locator('[data-testid="ai-response"]')).toContainText('SONABEL');
      await expect(page.locator('[data-testid="ai-response"]')).toContainText('OHADA');
      await expect(page.locator('[data-testid="ai-response"]')).toContainText('société d\'État');
      await expect(page.locator('[data-testid="ai-response"]')).toContainText('conseil d\'administration');
      
      // Vérifier les suggestions de suivi
      await expect(page.locator('[data-testid="follow-up-suggestions"]')).toBeVisible();
      
      // Cliquer sur une suggestion
      await page.click('[data-testid="suggestion-ag-ohada"]');
      
      // Vérifier la nouvelle réponse
      await expect(page.locator('[data-testid="ai-response"]:last-child')).toContainText('assemblée générale');
      
      // Évaluer la réponse
      await page.click('[data-testid="rate-response"]');
      await page.click('[data-testid="star-5"]');
      await page.fill('[data-testid="feedback"]', 'Excellente réponse très précise pour SONABEL');
      await page.click('[data-testid="submit-rating"]');
      
      // Vérifier la confirmation
      await expect(page.locator('[data-testid="rating-confirmation"]')).toContainText('Merci pour votre évaluation');
    });

    test('Utilisation limites abonnement et upgrade', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/ai-assistant');
      
      // Simuler l'épuisement des crédits (via mock API)
      await page.route('/api/ai/chat', route => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: false,
            error: {
              code: 'subscription_limit_exceeded',
              message: 'Limite d\'utilisation IA atteinte. Upgrader votre plan.'
            }
          })
        });
      });
      
      // Tenter d'utiliser l'IA
      await page.fill('[data-testid="ai-input"]', 'Test question');
      await page.click('[data-testid="ai-send"]');
      
      // Vérifier le message de limite
      await expect(page.locator('[data-testid="limit-message"]')).toContainText('Limite d\'utilisation atteinte');
      
      // Cliquer sur le lien d'upgrade
      await page.click('[data-testid="upgrade-link"]');
      await expect(page).toHaveURL('/subscription/plans');
      
      // Vérifier l'affichage des plans
      await expect(page.locator('[data-testid="plan-professional"]')).toBeVisible();
      await expect(page.locator('[data-testid="plan-enterprise"]')).toBeVisible();
    });
  });

  test.describe('Collaboration Documentaire', () => {
    
    test('Workflow collaboration PV CA avec validation', async ({ page, context }) => {
      await loginAsAdmin(page);
      
      // Créer un nouveau document
      await page.goto('/documents/create');
      await page.selectOption('[data-testid="document-type"]', 'pv_ca');
      await page.fill('[data-testid="document-title"]', 'PV CA Décembre 2024');
      
      // Utiliser un template
      await page.selectOption('[data-testid="document-template"]', 'pv_ca_sonabel');
      await page.click('[data-testid="load-template"]');
      
      // Vérifier le chargement du template
      await expect(page.locator('[data-testid="document-editor"]')).toContainText('SONABEL');
      await expect(page.locator('[data-testid="document-editor"]')).toContainText('Conseil d\'Administration');
      
      // Saisir le contenu
      await page.fill('[data-testid="pv-date"]', '2024-12-10');
      await page.fill('[data-testid="pv-president"]', 'Dr. Fatimata OUEDRAOGO');
      await page.fill('[data-testid="pv-participants"]', 'Liste des administrateurs présents...');
      
      // Inviter des collaborateurs
      await page.click('[data-testid="invite-collaborators"]');
      await page.fill('[data-testid="collaborator-email"]', 'secretaire@sonabel.bf');
      await page.selectOption('[data-testid="collaborator-role"]', 'editor');
      await page.click('[data-testid="add-collaborator"]');
      
      // Sauvegarder en tant que brouillon
      await page.click('[data-testid="save-draft"]');
      await expect(page.locator('[data-testid="save-status"]')).toContainText('Brouillon sauvegardé');
      
      // Simuler la collaboration (nouvelle page pour le collaborateur)
      const collaboratorPage = await context.newPage();
      await collaboratorPage.goto(page.url());
      await loginAsUser(collaboratorPage, 'secretaire@sonabel.bf');
      
      // Modifier le document
      await collaboratorPage.fill('[data-testid="pv-decisions"]', 'Décisions prises lors de la séance...');
      await collaboratorPage.click('[data-testid="save-draft"]');
      
      // Retour à la page principale - vérifier les changements
      await page.reload();
      await expect(page.locator('[data-testid="version-info"]')).toContainText('Modifié par secretaire@sonabel.bf');
      
      // Ajouter un commentaire
      await page.click('[data-testid="add-comment"]');
      await page.fill('[data-testid="comment-text"]', 'Vérifier la conformité OHADA pour cette décision');
      await page.click('[data-testid="submit-comment"]');
      
      // Soumettre pour validation
      await page.click('[data-testid="submit-for-validation"]');
      await expect(page.locator('[data-testid="validation-status"]')).toContainText('En attente de validation');
      
      // Simuler la validation (Président)
      await page.click('[data-testid="validate-document"]');
      await page.fill('[data-testid="validation-notes"]', 'Document approuvé conforme aux discussions');
      await page.click('[data-testid="confirm-validation"]');
      
      // Vérifier le statut final
      await expect(page.locator('[data-testid="document-status"]')).toContainText('Validé');
      await expect(page.locator('[data-testid="final-version"]')).toBeVisible();
    });
  });

  test.describe('Performance et Stress Tests', () => {
    
    test('Charge simultanée dashboard EPE', async ({ page }) => {
      await loginAsAdmin(page);
      
      // Mesurer le temps de chargement du dashboard
      const startTime = Date.now();
      await page.goto('/dashboard');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      // Vérifier que le chargement est rapide (< 3 secondes)
      expect(loadTime).toBeLessThan(3000);
      
      // Vérifier que tous les widgets se chargent
      await expect(page.locator('[data-testid="kpi-financial"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="kpi-governance"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="recent-reports"]')).toBeVisible({ timeout: 5000 });
      
      // Tester la réactivité
      await page.click('[data-testid="refresh-kpis"]');
      await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
      await expect(page.locator('[data-testid="loading-indicator"]')).not.toBeVisible({ timeout: 10000 });
    });

    test('Stress test assistant IA', async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto('/ai-assistant');
      
      // Envoyer plusieurs questions rapidement
      const questions = [
        'Quelles sont mes obligations OHADA ?',
        'Comment organiser une AG ?',
        'Quels rapports UEMOA produire ?',
        'Comment améliorer ma gouvernance ?',
        'Que dit SYSCOHADA sur les états financiers ?'
      ];
      
      for (const question of questions) {
        await page.fill('[data-testid="ai-input"]', question);
        await page.click('[data-testid="ai-send"]');
        
        // Attendre la réponse sans bloquer
        await page.waitForSelector('[data-testid="ai-response"]:last-child', { timeout: 15000 });
      }
      
      // Vérifier que toutes les réponses sont présentes
      const responses = page.locator('[data-testid="ai-response"]');
      await expect(responses).toHaveCount(questions.length);
    });
  });
});

// Fonctions utilitaires
async function loginAsAdmin(page) {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'admin@sonabel.bf');
  await page.fill('[data-testid="login-password"]', 'Password123!');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL('/dashboard');
}

async function loginAsUser(page, email) {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', email);
  await page.fill('[data-testid="login-password"]', 'Password123!');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL('/dashboard');
}