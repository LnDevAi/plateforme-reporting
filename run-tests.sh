#!/bin/bash

# Script complet de tests pour la Plateforme EPE
# Usage: ./run-tests.sh [type] [options]

set -e

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="Plateforme EPE"
TEST_ENV_FILE="docker-compose.test.yml"
RESULTS_DIR="test-results"

# Fonction d'affichage
print_header() {
    echo -e "${BLUE}================================================================${NC}"
    echo -e "${BLUE}  🧪 $1${NC}"
    echo -e "${BLUE}================================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Fonction d'aide
show_help() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "🧪 COMMANDES DISPONIBLES:"
    echo "  all              - Exécuter tous les tests (unit + integration + e2e)"
    echo "  unit             - Tests unitaires backend (PHPUnit)"
    echo "  frontend         - Tests frontend (Jest)"
    echo "  integration      - Tests d'intégration API"
    echo "  e2e              - Tests End-to-End (Playwright)"
    echo "  performance      - Tests de performance (K6)"
    echo "  security         - Tests de sécurité (OWASP ZAP)"
    echo "  stress           - Tests de charge/stress"
    echo "  ci               - Pipeline CI complet"
    echo "  setup            - Configuration environnement de test"
    echo "  cleanup          - Nettoyage environnement de test"
    echo "  monitor          - Lancer monitoring des tests"
    echo ""
    echo "🔧 OPTIONS:"
    echo "  --verbose        - Affichage détaillé"
    echo "  --coverage       - Génération couverture de code"
    echo "  --parallel       - Exécution parallèle"
    echo "  --quick          - Tests rapides seulement"
    echo "  --report         - Génération rapport HTML"
    echo "  --no-build       - Pas de rebuild des images"
    echo ""
    echo "📊 EXEMPLES:"
    echo "  $0 all --coverage --report"
    echo "  $0 unit --verbose"
    echo "  $0 e2e --parallel"
    echo "  $0 performance --quick"
    echo ""
}

# Fonction de vérification des prérequis
check_prerequisites() {
    print_info "Vérification des prérequis..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker n'est pas installé"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose n'est pas installé"
        exit 1
    fi
    
    if [[ ! -f "$TEST_ENV_FILE" ]]; then
        print_error "Fichier de configuration test non trouvé: $TEST_ENV_FILE"
        exit 1
    fi
    
    print_success "Prérequis validés"
}

# Fonction de setup de l'environnement
setup_test_environment() {
    print_header "Configuration Environnement de Test"
    
    # Créer les répertoires de résultats
    mkdir -p $RESULTS_DIR/{backend,frontend,e2e,performance,security,coverage}
    
    # Arrêter les services existants
    docker-compose -f $TEST_ENV_FILE down --remove-orphans 2>/dev/null || true
    
    # Nettoyer les volumes si demandé
    if [[ "$CLEAN_VOLUMES" == "true" ]]; then
        print_info "Nettoyage des volumes..."
        docker-compose -f $TEST_ENV_FILE down -v 2>/dev/null || true
    fi
    
    # Construire les images si nécessaire
    if [[ "$NO_BUILD" != "true" ]]; then
        print_info "Construction des images Docker..."
        docker-compose -f $TEST_ENV_FILE build --parallel
    fi
    
    # Démarrer les services de base
    print_info "Démarrage des services de base..."
    docker-compose -f $TEST_ENV_FILE up -d postgres-test redis-test
    
    # Attendre que les services soient prêts
    print_info "Attente des services..."
    docker-compose -f $TEST_ENV_FILE exec -T postgres-test bash -c "
        while ! pg_isready -U epe_test -d epe_test; do
            echo 'Attente PostgreSQL...'
            sleep 2
        done
        echo 'PostgreSQL prêt !'
    "
    
    print_success "Environnement configuré"
}

# Tests unitaires backend
run_unit_tests() {
    print_header "Tests Unitaires Backend (PHPUnit)"
    
    local extra_args=""
    [[ "$COVERAGE" == "true" ]] && extra_args="$extra_args --coverage"
    [[ "$VERBOSE" == "true" ]] && extra_args="$extra_args --verbose"
    
    # Démarrer le service de test backend
    docker-compose -f $TEST_ENV_FILE up -d backend-test
    
    # Attendre que le backend soit prêt
    print_info "Attente du backend..."
    timeout 120 bash -c 'until docker-compose -f '"$TEST_ENV_FILE"' exec -T backend-test curl -f http://localhost:8000/api/health; do sleep 2; done'
    
    # Exécuter les tests
    print_info "Exécution des tests PHPUnit..."
    docker-compose -f $TEST_ENV_FILE --profile testing run --rm backend-phpunit
    
    # Copier les résultats
    docker cp epe-backend-phpunit:/var/www/html/coverage $RESULTS_DIR/backend/ 2>/dev/null || true
    
    print_success "Tests unitaires backend terminés"
}

# Tests frontend
run_frontend_tests() {
    print_header "Tests Frontend (Jest)"
    
    local extra_args=""
    [[ "$COVERAGE" == "true" ]] && extra_args="$extra_args --coverage"
    [[ "$VERBOSE" == "true" ]] && extra_args="$extra_args --verbose"
    
    # Exécuter les tests Jest
    print_info "Exécution des tests Jest..."
    docker-compose -f $TEST_ENV_FILE --profile testing run --rm frontend-jest
    
    # Copier les résultats
    docker cp epe-frontend-jest:/app/coverage $RESULTS_DIR/frontend/ 2>/dev/null || true
    
    print_success "Tests frontend terminés"
}

# Tests E2E
run_e2e_tests() {
    print_header "Tests End-to-End (Playwright)"
    
    # Démarrer l'environnement complet
    docker-compose -f $TEST_ENV_FILE up -d backend-test frontend-test
    
    # Attendre que les services soient prêts
    print_info "Attente des services..."
    timeout 180 bash -c 'until docker-compose -f '"$TEST_ENV_FILE"' exec -T frontend-test curl -f http://localhost:3000; do sleep 5; done'
    
    local extra_args=""
    [[ "$PARALLEL" == "true" ]] && extra_args="$extra_args --workers=4"
    [[ "$QUICK" == "true" ]] && extra_args="$extra_args --grep='@quick'"
    
    # Exécuter les tests E2E
    print_info "Exécution des tests Playwright..."
    docker-compose -f $TEST_ENV_FILE --profile e2e run --rm e2e-playwright
    
    # Copier les résultats
    docker cp epe-e2e-playwright:/app/test-results $RESULTS_DIR/e2e/ 2>/dev/null || true
    
    print_success "Tests E2E terminés"
}

# Tests d'intégration
run_integration_tests() {
    print_header "Tests d'Intégration API"
    
    # Démarrer le backend
    docker-compose -f $TEST_ENV_FILE up -d backend-test
    
    # Attendre que le backend soit prêt
    timeout 120 bash -c 'until docker-compose -f '"$TEST_ENV_FILE"' exec -T backend-test curl -f http://localhost:8000/api/health; do sleep 2; done'
    
    # Exécuter les tests d'intégration
    print_info "Exécution des tests d'intégration..."
    docker-compose -f $TEST_ENV_FILE exec -T backend-test bash -c "
        vendor/bin/phpunit --testsuite=Feature --filter=Api
    "
    
    print_success "Tests d'intégration terminés"
}

# Tests de performance
run_performance_tests() {
    print_header "Tests de Performance (K6)"
    
    # Démarrer l'environnement
    docker-compose -f $TEST_ENV_FILE up -d backend-test frontend-test
    
    # Attendre que les services soient prêts
    timeout 120 bash -c 'until docker-compose -f '"$TEST_ENV_FILE"' exec -T backend-test curl -f http://localhost:8000/api/health; do sleep 2; done'
    
    # Exécuter les tests de performance
    print_info "Exécution des tests K6..."
    docker-compose -f $TEST_ENV_FILE --profile performance run --rm performance-k6
    
    # Copier les résultats
    docker cp epe-performance-k6:/results $RESULTS_DIR/performance/ 2>/dev/null || true
    
    print_success "Tests de performance terminés"
}

# Tests de sécurité
run_security_tests() {
    print_header "Tests de Sécurité (OWASP ZAP)"
    
    # Démarrer l'environnement
    docker-compose -f $TEST_ENV_FILE up -d backend-test frontend-test
    
    # Attendre que les services soient prêts
    timeout 180 bash -c 'until docker-compose -f '"$TEST_ENV_FILE"' exec -T frontend-test curl -f http://localhost:3000; do sleep 5; done'
    
    # Exécuter les tests de sécurité
    print_info "Exécution des tests OWASP ZAP..."
    docker-compose -f $TEST_ENV_FILE --profile security run --rm security-zap
    
    # Copier les résultats
    docker cp epe-security-zap:/zap/wrk $RESULTS_DIR/security/ 2>/dev/null || true
    
    print_success "Tests de sécurité terminés"
}

# Tests de stress
run_stress_tests() {
    print_header "Tests de Stress/Charge"
    
    # Démarrer l'environnement avec base de données de stress
    docker-compose -f $TEST_ENV_FILE --profile stress up -d postgres-stress backend-test
    
    # Configuration pour charge élevée
    docker-compose -f $TEST_ENV_FILE exec -T backend-test bash -c "
        echo 'Optimisation pour tests de stress...'
        php artisan config:cache
        php artisan route:cache
        php artisan view:cache
    "
    
    # Tests de charge progressive
    print_info "Tests de charge progressive..."
    for users in 10 50 100 200; do
        print_info "Test avec $users utilisateurs simultanés..."
        docker run --rm --network epe-test-network \
            -v $(pwd)/performance-tests:/scripts \
            grafana/k6:latest run \
            -e USERS=$users \
            -e BASE_URL=http://backend-test:8000 \
            /scripts/stress-test.js
    done
    
    print_success "Tests de stress terminés"
}

# Pipeline CI complet
run_ci_pipeline() {
    print_header "Pipeline CI Complet"
    
    local start_time=$(date +%s)
    
    # Phase 1: Tests rapides
    print_info "Phase 1: Tests unitaires rapides..."
    QUICK=true run_unit_tests
    
    # Phase 2: Tests frontend
    print_info "Phase 2: Tests frontend..."
    run_frontend_tests
    
    # Phase 3: Tests d'intégration
    print_info "Phase 3: Tests d'intégration..."
    run_integration_tests
    
    # Phase 4: Tests E2E (si pas en mode quick)
    if [[ "$QUICK" != "true" ]]; then
        print_info "Phase 4: Tests E2E..."
        run_e2e_tests
    fi
    
    # Phase 5: Analyse sécurité (si demandée)
    if [[ "$SECURITY_SCAN" == "true" ]]; then
        print_info "Phase 5: Analyse sécurité..."
        run_security_tests
    fi
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    print_success "Pipeline CI terminé en ${duration}s"
    
    # Génération du rapport final
    if [[ "$REPORT" == "true" ]]; then
        generate_final_report
    fi
}

# Génération du rapport final
generate_final_report() {
    print_header "Génération Rapport Final"
    
    local report_file="$RESULTS_DIR/rapport-tests-$(date +%Y%m%d-%H%M%S).html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Rapport Tests - $PROJECT_NAME</title>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border-left: 4px solid #3498db; }
        .success { border-left-color: #27ae60; }
        .warning { border-left-color: #f39c12; }
        .error { border-left-color: #e74c3c; }
        .metric { display: inline-block; margin: 10px; padding: 10px; background: #ecf0f1; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Rapport Tests - $PROJECT_NAME</h1>
        <p>Généré le $(date)</p>
    </div>
    
    <div class="section success">
        <h2>✅ Résumé Exécution</h2>
        <div class="metric">
            <strong>Date:</strong> $(date)
        </div>
        <div class="metric">
            <strong>Environnement:</strong> Test
        </div>
        <div class="metric">
            <strong>Version:</strong> $(git rev-parse --short HEAD 2>/dev/null || echo "Local")
        </div>
    </div>
    
    <div class="section">
        <h2>📊 Métriques Tests</h2>
        <p>Voir les rapports détaillés dans les dossiers:</p>
        <ul>
            <li><strong>Backend:</strong> $RESULTS_DIR/backend/</li>
            <li><strong>Frontend:</strong> $RESULTS_DIR/frontend/</li>
            <li><strong>E2E:</strong> $RESULTS_DIR/e2e/</li>
            <li><strong>Performance:</strong> $RESULTS_DIR/performance/</li>
            <li><strong>Sécurité:</strong> $RESULTS_DIR/security/</li>
        </ul>
    </div>
    
    <div class="section">
        <h2>🎯 Recommandations</h2>
        <ul>
            <li>Maintenir couverture de code > 80%</li>
            <li>Temps de réponse API < 200ms</li>
            <li>Corriger toutes vulnérabilités High/Critical</li>
            <li>Tests E2E sur scénarios critiques EPE</li>
        </ul>
    </div>
</body>
</html>
EOF
    
    print_success "Rapport généré: $report_file"
    
    # Ouvrir le rapport si possible
    if command -v xdg-open &> /dev/null; then
        xdg-open "$report_file"
    elif command -v open &> /dev/null; then
        open "$report_file"
    fi
}

# Monitoring des tests
start_monitoring() {
    print_header "Démarrage Monitoring Tests"
    
    docker-compose -f $TEST_ENV_FILE --profile monitoring up -d test-monitor
    
    print_success "Monitoring disponible sur http://localhost:3002"
    print_info "Login: admin / admin"
}

# Nettoyage
cleanup() {
    print_header "Nettoyage Environnement"
    
    docker-compose -f $TEST_ENV_FILE down --remove-orphans
    
    if [[ "$CLEAN_VOLUMES" == "true" ]]; then
        docker-compose -f $TEST_ENV_FILE down -v
        print_success "Volumes nettoyés"
    fi
    
    print_success "Nettoyage terminé"
}

# Traitement des arguments
COMMAND=""
VERBOSE=""
COVERAGE=""
PARALLEL=""
QUICK=""
REPORT=""
NO_BUILD=""
CLEAN_VOLUMES=""
SECURITY_SCAN=""

while [[ $# -gt 0 ]]; do
    case $1 in
        all|unit|frontend|integration|e2e|performance|security|stress|ci|setup|cleanup|monitor)
            COMMAND="$1"
            shift
            ;;
        --verbose)
            VERBOSE="true"
            shift
            ;;
        --coverage)
            COVERAGE="true"
            shift
            ;;
        --parallel)
            PARALLEL="true"
            shift
            ;;
        --quick)
            QUICK="true"
            shift
            ;;
        --report)
            REPORT="true"
            shift
            ;;
        --no-build)
            NO_BUILD="true"
            shift
            ;;
        --clean-volumes)
            CLEAN_VOLUMES="true"
            shift
            ;;
        --security-scan)
            SECURITY_SCAN="true"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            print_error "Option inconnue: $1"
            show_help
            exit 1
            ;;
    esac
done

# Affichage de l'en-tête
print_header "TESTS $PROJECT_NAME"

# Si aucune commande, afficher l'aide
if [[ -z "$COMMAND" ]]; then
    show_help
    exit 1
fi

# Vérification des prérequis
check_prerequisites

# Exécution selon la commande
case "$COMMAND" in
    setup)
        setup_test_environment
        ;;
    all)
        setup_test_environment
        run_unit_tests
        run_frontend_tests
        run_integration_tests
        run_e2e_tests
        [[ "$REPORT" == "true" ]] && generate_final_report
        ;;
    unit)
        setup_test_environment
        run_unit_tests
        ;;
    frontend)
        setup_test_environment
        run_frontend_tests
        ;;
    integration)
        setup_test_environment
        run_integration_tests
        ;;
    e2e)
        setup_test_environment
        run_e2e_tests
        ;;
    performance)
        setup_test_environment
        run_performance_tests
        ;;
    security)
        setup_test_environment
        run_security_tests
        ;;
    stress)
        setup_test_environment
        run_stress_tests
        ;;
    ci)
        setup_test_environment
        run_ci_pipeline
        ;;
    monitor)
        start_monitoring
        ;;
    cleanup)
        cleanup
        ;;
    *)
        print_error "Commande inconnue: $COMMAND"
        show_help
        exit 1
        ;;
esac

print_success "Commande '$COMMAND' terminée avec succès !"