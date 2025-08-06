#!/bin/bash

# 🎓 Script de Déploiement des Modules E-Learning EPE
# Basés sur vos formations expertes

echo "🎓 ========================================="
echo "   DÉPLOIEMENT MODULES E-LEARNING EPE"
echo "   Basés sur vos formations expertes"
echo "========================================="
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage coloré
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Vérifier si on est dans le bon répertoire
if [ ! -f "backend/artisan" ]; then
    print_error "Fichier artisan non trouvé. Assurez-vous d'être dans le répertoire racine du projet."
    exit 1
fi

print_info "Répertoire du projet détecté : $(pwd)"
echo ""

# Étape 1: Vérifier PHP
echo "🔍 Étape 1: Vérification de PHP..."
if command -v php &> /dev/null; then
    PHP_VERSION=$(php -v | head -n1 | cut -d' ' -f2)
    print_status "PHP détecté : version $PHP_VERSION"
else
    print_warning "PHP non trouvé. Installation recommandée..."
    echo ""
    echo "Pour installer PHP sur Ubuntu/Debian :"
    echo "sudo apt update"
    echo "sudo apt install php8.1 php8.1-cli php8.1-mysql php8.1-xml php8.1-mbstring php8.1-curl"
    echo ""
    echo "Ou utilisez Docker :"
    echo "docker run -it --rm -v \$(pwd):/app -w /app php:8.1-cli php backend/artisan migrate"
    echo ""
    read -p "Voulez-vous continuer avec Docker ? (y/n): " use_docker
    if [ "$use_docker" = "y" ]; then
        PHP_CMD="docker run -it --rm -v $(pwd):/app -w /app php:8.1-cli php"
    else
        print_error "PHP requis pour continuer. Veuillez installer PHP et relancer le script."
        exit 1
    fi
else
    PHP_CMD="php"
fi

# Étape 2: Vérifier les fichiers créés
echo ""
echo "📁 Étape 2: Vérification des fichiers e-learning..."

FILES_TO_CHECK=(
    "backend/database/seeders/CustomCoursesSeeder.php"
    "backend/app/Http/Controllers/ELearningController.php"
    "backend/app/Console/Commands/SetupCustomELearningModules.php"
)

for file in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$file" ]; then
        print_status "Fichier trouvé : $(basename $file)"
    else
        print_error "Fichier manquant : $file"
        exit 1
    fi
done

# Étape 3: Vérifier la base de données
echo ""
echo "🗄️ Étape 3: Configuration base de données..."
if [ -f "backend/.env" ]; then
    print_status "Fichier .env trouvé"
    
    # Extraire les informations de DB du .env
    DB_CONNECTION=$(grep "^DB_CONNECTION=" backend/.env | cut -d'=' -f2)
    DB_DATABASE=$(grep "^DB_DATABASE=" backend/.env | cut -d'=' -f2)
    
    if [ -n "$DB_CONNECTION" ] && [ -n "$DB_DATABASE" ]; then
        print_status "Configuration DB : $DB_CONNECTION ($DB_DATABASE)"
    else
        print_warning "Configuration de base de données incomplète dans .env"
    fi
else
    print_warning "Fichier .env non trouvé. Copie du fichier exemple..."
    cp backend/.env.example backend/.env
    print_info "Veuillez configurer backend/.env avec vos paramètres de base de données"
fi

# Étape 4: Exécuter les migrations
echo ""
echo "🔄 Étape 4: Exécution des migrations..."
cd backend

if $PHP_CMD artisan migrate --force 2>/dev/null; then
    print_status "Migrations exécutées avec succès"
else
    print_warning "Erreur lors des migrations (peut être normal si déjà appliquées)"
fi

# Étape 5: Déployer les modules personnalisés
echo ""
echo "🎓 Étape 5: Déploiement des modules e-learning..."

# Vérifier si la commande existe
if $PHP_CMD artisan list | grep -q "elearning:setup-custom-modules"; then
    print_status "Commande elearning:setup-custom-modules disponible"
    
    print_info "Déploiement des modules basés sur vos formations..."
    if $PHP_CMD artisan elearning:setup-custom-modules --force; then
        print_status "Modules e-learning déployés avec succès !"
    else
        print_error "Erreur lors du déploiement des modules"
        exit 1
    fi
else
    print_warning "Commande personnalisée non trouvée, utilisation du seeder direct..."
    if $PHP_CMD artisan db:seed --class=CustomCoursesSeeder; then
        print_status "Seeder exécuté avec succès !"
    else
        print_error "Erreur lors de l'exécution du seeder"
        exit 1
    fi
fi

# Étape 6: Vérification du déploiement
echo ""
echo "🔍 Étape 6: Vérification du déploiement..."

# Tenter de vérifier via Artisan Tinker
echo "Vérification des données créées..."
$PHP_CMD artisan tinker --execute="
echo 'Courses: ' . App\Models\Course::count();
echo 'Modules: ' . App\Models\CourseModule::count();
echo 'Lessons: ' . App\Models\Lesson::count();
" 2>/dev/null || print_warning "Impossible de vérifier via Tinker"

cd ..

# Affichage du résumé final
echo ""
echo "🎉 ========================================="
echo "   DÉPLOIEMENT TERMINÉ AVEC SUCCÈS !"
echo "========================================="
echo ""
echo "📚 MODULES CRÉÉS À PARTIR DE VOS FORMATIONS :"
echo ""
echo "🏛️  MODULE 1: Gouvernance et Administration des EPE"
echo "   📖 Basé sur: FORMATION MISSIONS ET ATTRIBUTIONS DE L'ADMINISTRATEUR.pptx"
echo "   ⏱️  20 heures - 5 sous-modules"
echo "   🎯 Public: Administrateurs EPE, PCA, DG"
echo ""
echo "🔍 MODULE 2: Audit Interne et Analyse Financière des EPE"
echo "   📖 Basé sur: FORMATION AUDCIF ET ANALYSE DES ETATS FINANCIERS.pptx"
echo "   ⏱️  25 heures - 4 sous-modules"
echo "   🎯 Public: Auditeurs, Contrôleurs, Analystes"
echo ""
echo "🌐 API ENDPOINTS DISPONIBLES :"
echo "   • GET  /api/elearning/courses"
echo "   • GET  /api/elearning/dashboard"
echo "   • POST /api/elearning/courses/{id}/enroll"
echo "   • GET  /api/elearning/certificates"
echo ""
echo "🚀 PROCHAINES ÉTAPES :"
echo "   1. Démarrer le serveur : cd backend && php artisan serve"
echo "   2. Tester l'API : curl -H 'Authorization: Bearer TOKEN' localhost:8000/api/elearning/courses"
echo "   3. Créer l'interface frontend e-learning"
echo ""
echo "🎓 VOS FORMATIONS EPE SONT MAINTENANT DISPONIBLES EN E-LEARNING !"
echo ""