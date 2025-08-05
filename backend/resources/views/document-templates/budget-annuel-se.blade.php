<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Budget Annuel - {{ $entity['name'] ?? 'Société d\'État' }}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        
        .header-section {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 3px solid #1f497d;
            padding-bottom: 20px;
        }
        
        .country-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
        }
        
        .main-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f497d;
            margin: 20px 0;
            text-transform: uppercase;
        }
        
        .subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .budget-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
        }
        
        .budget-table th,
        .budget-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        
        .budget-table th {
            background-color: #1f497d;
            color: white;
            font-weight: bold;
            text-align: center;
        }
        
        .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        
        .total-row {
            font-weight: bold;
            background-color: #f0f0f0;
        }
        
        .section-header {
            font-weight: bold;
            background-color: #e6e6e6;
            text-align: center;
        }
        
        .variance-positive {
            color: #28a745;
            font-weight: bold;
        }
        
        .variance-negative {
            color: #dc3545;
            font-weight: bold;
        }
        
        .section {
            margin: 30px 0;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f497d;
            border-bottom: 2px solid #1f497d;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        
        .note-box {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-left: 4px solid #1f497d;
            padding: 15px;
            margin: 20px 0;
        }
        
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            page-break-inside: avoid;
        }
        
        .signature-block {
            text-align: center;
            width: 30%;
        }
        
        .signature-space {
            height: 80px;
            border-bottom: 1px solid #000;
            margin-top: 30px;
        }
        
        @media print {
            body { margin: 0; padding: 15px; }
            .page-break { page-break-before: always; }
        }
    </style>
</head>
<body>
    <!-- En-tête officiel -->
    <div class="country-header">
        <div style="text-align: left;">
            <div style="font-weight: bold; font-size: 16px;">BURKINA FASO</div>
            <div style="font-style: italic; margin-top: 5px;">Unité - Travail - Progrès</div>
            <div style="margin-top: 10px; font-size: 12px;">
                République du Burkina Faso<br>
                {{ $entity['financial_ministry'] ?? 'Ministère de l\'Économie et des Finances' }}
            </div>
        </div>
        
        <div style="text-align: right;">
            @if(isset($entity))
                <div style="font-weight: bold; font-size: 14px;">{{ $entity['name'] }}</div>
                <div style="font-size: 12px; margin-top: 5px;">{{ $entity['type_label'] }}</div>
                <div style="font-size: 11px; margin-top: 10px;">
                    Société d'État - Code {{ $entity['code'] }}<br>
                    Secteur : {{ $entity['sector'] }}<br>
                    Capital : {{ number_format($entity['capital_amount'] ?? 0, 0, ',', ' ') }} FCFA
                </div>
            @endif
        </div>
    </div>

    <!-- Titre principal -->
    <div class="header-section">
        <h1 class="main-title">Projet de Budget Annuel</h1>
        @if(isset($periode))
            <div class="subtitle">Exercice {{ $periode['exercice'] }}</div>
        @endif
        <div style="font-size: 14px; color: #666; margin-top: 10px;">
            Conforme au SYSCOHADA et aux Directives UEMOA
        </div>
    </div>

    <!-- I. Présentation générale -->
    <div class="section">
        <h2 class="section-title">I. PRÉSENTATION GÉNÉRALE</h2>
        
        <div class="note-box">
            <strong>📋 Contexte :</strong><br>
            Le présent budget annuel est établi conformément aux dispositions de l'acte uniforme OHADA 
            relatif au droit des sociétés commerciales et aux directives UEMOA relatives à la 
            comptabilité des entreprises publiques.
        </div>

        <h3>1. Hypothèses économiques :</h3>
        <table class="budget-table" style="width: 60%;">
            <tr>
                <th>Indicateur</th>
                <th>Valeur</th>
            </tr>
            <tr>
                <td>Taux de croissance du PIB</td>
                <td class="amount">{{ $hypotheses['croissance_pib'] ?? '5,5%' }}</td>
            </tr>
            <tr>
                <td>Taux d'inflation</td>
                <td class="amount">{{ $hypotheses['inflation'] ?? '2,0%' }}</td>
            </tr>
            <tr>
                <td>Taux de change FCFA/EUR</td>
                <td class="amount">{{ $hypotheses['taux_change'] ?? '655,957' }}</td>
            </tr>
        </table>

        <h3>2. Objectifs stratégiques :</h3>
        <ul>
            <li>Maintenir la rentabilité opérationnelle</li>
            <li>Optimiser l'efficacité énergétique</li>
            <li>Développer l'accessibilité des services</li>
            <li>Renforcer la gouvernance d'entreprise</li>
        </ul>
    </div>

    <!-- II. Budget d'exploitation -->
    <div class="section">
        <h2 class="section-title">II. BUDGET D'EXPLOITATION</h2>
        
        <table class="budget-table">
            <thead>
                <tr>
                    <th rowspan="2" style="width: 40%;">POSTES</th>
                    <th colspan="2">Exercice N-1</th>
                    <th rowspan="2">Budget N</th>
                    <th rowspan="2">Écart N/N-1</th>
                    <th rowspan="2">%</th>
                </tr>
                <tr>
                    <th>Budget</th>
                    <th>Réalisé</th>
                </tr>
            </thead>
            <tbody>
                <!-- PRODUITS D'EXPLOITATION -->
                <tr class="section-header">
                    <td colspan="6"><strong>PRODUITS D'EXPLOITATION</strong></td>
                </tr>
                <tr>
                    <td>Chiffre d'affaires</td>
                    <td class="amount">{{ number_format($budget['ca_budget_n1'] ?? 120000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['ca_realise_n1'] ?? 115000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['ca_budget_n'] ?? 130000000, 0, ',', ' ') }}</td>
                    <td class="amount variance-positive">{{ number_format(($budget['ca_budget_n'] ?? 130000000) - ($budget['ca_realise_n1'] ?? 115000000), 0, ',', ' ') }}</td>
                    <td class="amount variance-positive">+13,0%</td>
                </tr>
                <tr>
                    <td>&nbsp;&nbsp;• Ventes nationales</td>
                    <td class="amount">{{ number_format($budget['ventes_nationales_n1'] ?? 100000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['ventes_nationales_r_n1'] ?? 95000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['ventes_nationales_n'] ?? 110000000, 0, ',', ' ') }}</td>
                    <td class="amount variance-positive">{{ number_format(($budget['ventes_nationales_n'] ?? 110000000) - ($budget['ventes_nationales_r_n1'] ?? 95000000), 0, ',', ' ') }}</td>
                    <td class="amount variance-positive">+15,8%</td>
                </tr>
                <tr>
                    <td>&nbsp;&nbsp;• Ventes export</td>
                    <td class="amount">{{ number_format($budget['ventes_export_n1'] ?? 20000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['ventes_export_r_n1'] ?? 20000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['ventes_export_n'] ?? 20000000, 0, ',', ' ') }}</td>
                    <td class="amount">0</td>
                    <td class="amount">0,0%</td>
                </tr>
                <tr>
                    <td>Autres produits d'exploitation</td>
                    <td class="amount">{{ number_format($budget['autres_produits_n1'] ?? 5000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['autres_produits_r_n1'] ?? 4500000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['autres_produits_n'] ?? 5500000, 0, ',', ' ') }}</td>
                    <td class="amount variance-positive">{{ number_format(($budget['autres_produits_n'] ?? 5500000) - ($budget['autres_produits_r_n1'] ?? 4500000), 0, ',', ' ') }}</td>
                    <td class="amount variance-positive">+22,2%</td>
                </tr>
                <tr class="total-row">
                    <td><strong>TOTAL PRODUITS D'EXPLOITATION</strong></td>
                    <td class="amount"><strong>125 000 000</strong></td>
                    <td class="amount"><strong>119 500 000</strong></td>
                    <td class="amount"><strong>135 500 000</strong></td>
                    <td class="amount variance-positive"><strong>+16 000 000</strong></td>
                    <td class="amount variance-positive"><strong>+13,4%</strong></td>
                </tr>

                <!-- CHARGES D'EXPLOITATION -->
                <tr class="section-header">
                    <td colspan="6"><strong>CHARGES D'EXPLOITATION</strong></td>
                </tr>
                <tr>
                    <td>Achats</td>
                    <td class="amount">{{ number_format($budget['achats_n1'] ?? 45000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['achats_r_n1'] ?? 42000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['achats_n'] ?? 48000000, 0, ',', ' ') }}</td>
                    <td class="amount variance-negative">{{ number_format(($budget['achats_n'] ?? 48000000) - ($budget['achats_r_n1'] ?? 42000000), 0, ',', ' ') }}</td>
                    <td class="amount variance-negative">+14,3%</td>
                </tr>
                <tr>
                    <td>Services extérieurs</td>
                    <td class="amount">{{ number_format($budget['services_ext_n1'] ?? 15000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['services_ext_r_n1'] ?? 14500000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['services_ext_n'] ?? 16000000, 0, ',', ' ') }}</td>
                    <td class="amount variance-negative">+1 500 000</td>
                    <td class="amount variance-negative">+10,3%</td>
                </tr>
                <tr>
                    <td>Charges de personnel</td>
                    <td class="amount">{{ number_format($budget['charges_personnel_n1'] ?? 35000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['charges_personnel_r_n1'] ?? 36000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['charges_personnel_n'] ?? 38000000, 0, ',', ' ') }}</td>
                    <td class="amount variance-negative">+2 000 000</td>
                    <td class="amount variance-negative">+5,6%</td>
                </tr>
                <tr>
                    <td>Impôts et taxes</td>
                    <td class="amount">{{ number_format($budget['impots_taxes_n1'] ?? 3000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['impots_taxes_r_n1'] ?? 2800000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['impots_taxes_n'] ?? 3200000, 0, ',', ' ') }}</td>
                    <td class="amount variance-negative">+400 000</td>
                    <td class="amount variance-negative">+14,3%</td>
                </tr>
                <tr>
                    <td>Dotations aux amortissements</td>
                    <td class="amount">{{ number_format($budget['amortissements_n1'] ?? 12000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['amortissements_r_n1'] ?? 12000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($budget['amortissements_n'] ?? 14000000, 0, ',', ' ') }}</td>
                    <td class="amount variance-negative">+2 000 000</td>
                    <td class="amount variance-negative">+16,7%</td>
                </tr>
                <tr class="total-row">
                    <td><strong>TOTAL CHARGES D'EXPLOITATION</strong></td>
                    <td class="amount"><strong>110 000 000</strong></td>
                    <td class="amount"><strong>107 300 000</strong></td>
                    <td class="amount"><strong>119 200 000</strong></td>
                    <td class="amount variance-negative"><strong>+11 900 000</strong></td>
                    <td class="amount variance-negative"><strong>+11,1%</strong></td>
                </tr>

                <!-- RÉSULTAT D'EXPLOITATION -->
                <tr class="total-row" style="background-color: #d4edda;">
                    <td><strong>RÉSULTAT D'EXPLOITATION</strong></td>
                    <td class="amount"><strong>15 000 000</strong></td>
                    <td class="amount"><strong>12 200 000</strong></td>
                    <td class="amount"><strong>16 300 000</strong></td>
                    <td class="amount variance-positive"><strong>+4 100 000</strong></td>
                    <td class="amount variance-positive"><strong>+33,6%</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- III. Budget d'investissement -->
    <div class="section">
        <h2 class="section-title">III. BUDGET D'INVESTISSEMENT</h2>
        
        <table class="budget-table">
            <thead>
                <tr>
                    <th>PROJETS D'INVESTISSEMENT</th>
                    <th>Budget N-1</th>
                    <th>Réalisé N-1</th>
                    <th>Budget N</th>
                    <th>Financement</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Équipements de production</td>
                    <td class="amount">{{ number_format($investissements['equipements_n1'] ?? 8000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($investissements['equipements_r_n1'] ?? 7500000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($investissements['equipements_n'] ?? 12000000, 0, ',', ' ') }}</td>
                    <td>Autofinancement</td>
                </tr>
                <tr>
                    <td>Matériel roulant</td>
                    <td class="amount">{{ number_format($investissements['materiel_n1'] ?? 3000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($investissements['materiel_r_n1'] ?? 2000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($investissements['materiel_n'] ?? 4000000, 0, ',', ' ') }}</td>
                    <td>Crédit-bail</td>
                </tr>
                <tr>
                    <td>Infrastructures</td>
                    <td class="amount">{{ number_format($investissements['infrastructures_n1'] ?? 5000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($investissements['infrastructures_r_n1'] ?? 4000000, 0, ',', ' ') }}</td>
                    <td class="amount">{{ number_format($investissements['infrastructures_n'] ?? 8000000, 0, ',', ' ') }}</td>
                    <td>Emprunt bancaire</td>
                </tr>
                <tr class="total-row">
                    <td><strong>TOTAL INVESTISSEMENTS</strong></td>
                    <td class="amount"><strong>16 000 000</strong></td>
                    <td class="amount"><strong>13 500 000</strong></td>
                    <td class="amount"><strong>24 000 000</strong></td>
                    <td><strong>Mixte</strong></td>
                </tr>
            </tbody>
        </table>
    </div>

    <!-- IV. Plan de financement -->
    <div class="section">
        <h2 class="section-title">IV. PLAN DE FINANCEMENT</h2>
        
        <div class="note-box">
            <strong>💰 Sources de financement :</strong><br>
            • Autofinancement : 60% (résultats d'exploitation)<br>
            • Emprunts bancaires : 30% (BCEAO et banques commerciales)<br>
            • Subventions d'équipement : 10% (État et partenaires)
        </div>

        <h3>Échéancier prévisionnel :</h3>
        <table class="budget-table" style="width: 70%;">
            <tr>
                <th>Trimestre</th>
                <th>Recettes</th>
                <th>Dépenses</th>
                <th>Solde cumulé</th>
            </tr>
            <tr>
                <td>T1 {{ $periode['exercice'] ?? date('Y') }}</td>
                <td class="amount">32 000 000</td>
                <td class="amount">28 500 000</td>
                <td class="amount variance-positive">+3 500 000</td>
            </tr>
            <tr>
                <td>T2 {{ $periode['exercice'] ?? date('Y') }}</td>
                <td class="amount">35 500 000</td>
                <td class="amount">31 200 000</td>
                <td class="amount variance-positive">+7 800 000</td>
            </tr>
            <tr>
                <td>T3 {{ $periode['exercice'] ?? date('Y') }}</td>
                <td class="amount">34 000 000</td>
                <td class="amount">30 800 000</td>
                <td class="amount variance-positive">+11 000 000</td>
            </tr>
            <tr>
                <td>T4 {{ $periode['exercice'] ?? date('Y') }}</td>
                <td class="amount">34 000 000</td>
                <td class="amount">28 700 000</td>
                <td class="amount variance-positive">+16 300 000</td>
            </tr>
        </table>
    </div>

    <!-- V. Ratios et indicateurs -->
    <div class="section">
        <h2 class="section-title">V. RATIOS ET INDICATEURS DE PERFORMANCE</h2>
        
        <table class="budget-table" style="width: 80%;">
            <tr>
                <th>Indicateur</th>
                <th>Objectif N</th>
                <th>Réalisé N-1</th>
                <th>Commentaire</th>
            </tr>
            <tr>
                <td>Marge d'exploitation (%)</td>
                <td class="amount">12,0%</td>
                <td class="amount">10,2%</td>
                <td>Amélioration de la productivité</td>
            </tr>
            <tr>
                <td>Ratio d'endettement (%)</td>
                <td class="amount">35,0%</td>
                <td class="amount">32,0%</td>
                <td>Financement des investissements</td>
            </tr>
            <tr>
                <td>ROA (%)</td>
                <td class="amount">8,5%</td>
                <td class="amount">7,2%</td>
                <td>Optimisation des actifs</td>
            </tr>
            <tr>
                <td>Effectif (nombre)</td>
                <td class="amount">{{ $entity['employee_count'] + 50 ?? 450 }}</td>
                <td class="amount">{{ $entity['employee_count'] ?? 400 }}</td>
                <td>Recrutements programmés</td>
            </tr>
        </table>
    </div>

    <!-- Signatures -->
    <div class="signatures">
        <div class="signature-block">
            <p><strong>Le Directeur Financier</strong></p>
            <p>[Nom à compléter]</p>
            <div class="signature-space"></div>
            <p style="margin-top: 10px; font-size: 12px;">Signature et cachet</p>
        </div>
        
        @if(isset($entity['director_general']))
            <div class="signature-block">
                <p><strong>Le Directeur Général</strong></p>
                <p>{{ $entity['director_general'] }}</p>
                <div class="signature-space"></div>
                <p style="margin-top: 10px; font-size: 12px;">Signature et cachet</p>
            </div>
        @endif
        
        @if(isset($entity['board_president']))
            <div class="signature-block">
                <p><strong>Le Président du CA</strong></p>
                <p>{{ $entity['board_president'] }}</p>
                <div class="signature-space"></div>
                <p style="margin-top: 10px; font-size: 12px;">Approbation</p>
            </div>
        @endif
    </div>

    <!-- Pied de page -->
    <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666;">
        <strong>Budget conforme aux normes SYSCOHADA et directives UEMOA</strong><br>
        Document généré le {{ $generated_at->format('d/m/Y à H:i') }} par {{ $generated_by }}<br>
        {{ $entity['name'] ?? 'Société d\'État' }} - Exercice {{ $periode['exercice'] ?? date('Y') }}
    </div>
</body>
</html>