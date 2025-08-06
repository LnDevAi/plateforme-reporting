#!/usr/bin/env node

/**
 * Script de test pour l'Assistant IA Expert EPE
 * Teste les capacités avec des questions basées sur vos formations
 */

const readline = require('readline');
const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:8000/api';
const AI_ENDPOINT = `${API_BASE_URL}/ai/chat`;

// Questions de test basées sur vos formations
const TEST_QUESTIONS = {
  'Gouvernance générale': [
    "Quelles sont les bonnes pratiques de gouvernance spécifiques aux EPE du Burkina Faso ?",
    "Comment structurer efficacement un conseil d'administration d'EPE ?",
    "Quels sont les principes fondamentaux de transparence pour les entreprises publiques ?"
  ],
  'Administrateurs': [
    "Quelles sont mes responsabilités fiduciaires en tant qu'administrateur d'EPE ?",
    "Comment préparer efficacement une réunion de conseil d'administration ?",
    "Que faire en cas de conflit d'intérêts au sein du CA ?",
    "Quels documents dois-je examiner avant chaque réunion du CA ?"
  ],
  'Audit et Finance': [
    "Comment analyser la rentabilité d'une société d'État ?",
    "Quels ratios financiers sont cruciaux pour surveiller une EPE ?",
    "Comment détecter des anomalies dans les états financiers d'une EPE ?",
    "Quelle méthodologie d'audit appliquer spécifiquement aux EPE ?"
  ],
  'Réglementation OHADA/UEMOA': [
    "Quelles sont les obligations OHADA pour le conseil d'administration d'une société d'État ?",
    "Comment appliquer les directives UEMOA dans la gestion d'une EPE ?",
    "Quels sont les critères de convergence UEMOA pertinents pour les EPE ?",
    "Comment organiser une assemblée générale conforme aux exigences OHADA ?"
  ]
};

// Interface de ligne de commande
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Simulation d'un token d'authentification (à remplacer par un vrai token)
const AUTH_TOKEN = 'your_test_token_here';

class AIAssistantTester {
  constructor() {
    this.conversationId = null;
    this.testResults = [];
  }

  async testQuestion(question, category = 'Test') {
    console.log(`\n🤖 Testing: ${category}`);
    console.log(`❓ Question: ${question}`);
    console.log('⏳ Assistant IA réfléchit...\n');

    try {
      const response = await axios.post(AI_ENDPOINT, {
        message: question,
        conversation_id: this.conversationId
      }, {
        headers: {
          'Authorization': `Bearer ${AUTH_TOKEN}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        this.conversationId = response.data.conversation_id;
        
        console.log('✅ Réponse de l\'IA:');
        console.log('─'.repeat(60));
        console.log(response.data.message);
        console.log('─'.repeat(60));
        
        if (response.data.suggestions && response.data.suggestions.length > 0) {
          console.log('\n💡 Questions suggérées:');
          response.data.suggestions.forEach((suggestion, i) => {
            console.log(`   ${i + 1}. ${suggestion}`);
          });
        }

        this.testResults.push({
          category,
          question,
          success: true,
          response: response.data.message,
          provider: response.data.provider,
          tokens: response.data.tokens_used
        });

        return true;
      } else {
        console.log('❌ Erreur:', response.data.error?.message || 'Erreur inconnue');
        return false;
      }
    } catch (error) {
      console.log('💥 Erreur de connexion:', error.message);
      if (error.response?.status === 401) {
        console.log('🔑 Vérifiez votre token d\'authentification');
      } else if (error.response?.status === 429) {
        console.log('⏰ Limite de requêtes atteinte, attendez un moment');
      }
      return false;
    }
  }

  async runTestSuite() {
    console.log('🚀 Démarrage des tests de l\'Assistant IA Expert EPE');
    console.log('=' .repeat(70));

    for (const [category, questions] of Object.entries(TEST_QUESTIONS)) {
      console.log(`\n📚 Catégorie: ${category}`);
      console.log('═'.repeat(50));
      
      for (let i = 0; i < questions.length; i++) {
        const success = await this.testQuestion(questions[i], category);
        
        if (!success) {
          console.log('⚠️  Test interrompu pour cette catégorie');
          break;
        }
        
        if (i < questions.length - 1) {
          console.log('\n⏳ Pause de 2 secondes...');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    this.displayResults();
  }

  async runInteractiveMode() {
    console.log('🎯 Mode interactif activé - Testez l\'IA avec vos propres questions');
    console.log('💡 Tapez "quit" pour quitter, "suggestions" pour voir des exemples\n');

    const askQuestion = () => {
      rl.question('❓ Votre question: ', async (input) => {
        if (input.toLowerCase() === 'quit') {
          console.log('👋 Au revoir !');
          rl.close();
          return;
        }

        if (input.toLowerCase() === 'suggestions') {
          this.showSuggestions();
          askQuestion();
          return;
        }

        if (input.trim()) {
          await this.testQuestion(input, 'Interactive');
        }
        
        askQuestion();
      });
    };

    askQuestion();
  }

  showSuggestions() {
    console.log('\n💡 Questions suggérées par catégorie:');
    console.log('═'.repeat(50));
    
    Object.entries(TEST_QUESTIONS).forEach(([category, questions]) => {
      console.log(`\n📚 ${category}:`);
      questions.forEach((q, i) => {
        console.log(`   ${i + 1}. ${q}`);
      });
    });
    console.log('');
  }

  displayResults() {
    console.log('\n📊 RÉSULTATS DES TESTS');
    console.log('═'.repeat(70));
    
    const successCount = this.testResults.filter(r => r.success).length;
    const totalCount = this.testResults.length;
    
    console.log(`✅ Tests réussis: ${successCount}/${totalCount}`);
    console.log(`📈 Taux de réussite: ${((successCount/totalCount) * 100).toFixed(1)}%`);
    
    if (this.testResults.length > 0) {
      const providers = [...new Set(this.testResults.map(r => r.provider))];
      console.log(`🤖 Providers utilisés: ${providers.join(', ')}`);
      
      const totalTokens = this.testResults.reduce((sum, r) => sum + (r.tokens || 0), 0);
      if (totalTokens > 0) {
        console.log(`🔢 Total tokens utilisés: ${totalTokens}`);
      }
    }
  }
}

// Programme principal
async function main() {
  const tester = new AIAssistantTester();
  
  console.log('🎓 Assistant IA Expert EPE - Suite de Tests');
  console.log('═'.repeat(50));
  console.log('Basé sur vos formations:');
  console.log('📄 • Documents relatifs à la gouvernance des EPE - Burkina Faso');
  console.log('📊 • Formation Missions et Attributions de l\'Administrateur');
  console.log('📈 • Formation Audit et Analyse des États Financiers');
  console.log('═'.repeat(50));

  rl.question('\nChoisissez le mode de test (1: Suite complète, 2: Interactif): ', async (choice) => {
    if (choice === '1') {
      rl.close();
      await tester.runTestSuite();
    } else if (choice === '2') {
      await tester.runInteractiveMode();
    } else {
      console.log('❌ Choix invalide');
      rl.close();
    }
  });
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error('💥 Erreur non gérée:', error.message);
  process.exit(1);
});

// Démarrage
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { AIAssistantTester, TEST_QUESTIONS };