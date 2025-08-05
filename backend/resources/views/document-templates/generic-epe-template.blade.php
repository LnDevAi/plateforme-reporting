<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $template_config['name'] ?? 'Document EPE' }}</title>
    <style>
        body {
            font-family: 'Times New Roman', serif;
            margin: 0;
            padding: 20px;
            line-height: 1.6;
            color: #333;
        }
        
        .document-header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #1f497d;
            padding-bottom: 20px;
        }
        
        .country-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 30px;
        }
        
        .country-info {
            text-align: left;
        }
        
        .entity-info {
            text-align: right;
        }
        
        .logo-space {
            width: 80px;
            height: 80px;
            border: 1px dashed #ccc;
            margin: 0 auto 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            color: #999;
        }
        
        .document-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f497d;
            margin: 20px 0;
        }
        
        .subtitle {
            font-size: 18px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .section {
            margin: 30px 0;
        }
        
        .section-title {
            font-size: 16px;
            font-weight: bold;
            color: #1f497d;
            border-bottom: 1px solid #1f497d;
            padding-bottom: 5px;
            margin-bottom: 15px;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        
        .info-table th,
        .info-table td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: left;
        }
        
        .info-table th {
            background-color: #f8f9fa;
            font-weight: bold;
            color: #1f497d;
        }
        
        .financial-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 12px;
        }
        
        .financial-table th,
        .financial-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        
        .financial-table th {
            background-color: #e6e6e6;
            font-weight: bold;
            text-align: center;
        }
        
        .amount {
            text-align: right;
            font-family: 'Courier New', monospace;
        }
        
        .total {
            font-weight: bold;
            background-color: #f0f0f0;
        }
        
        .grand-total {
            font-weight: bold;
            background-color: #d0d0d0;
        }
        
        .compliance-box {
            background-color: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
        }
        
        .compliance-title {
            font-weight: bold;
            color: #495057;
            margin-bottom: 10px;
        }
        
        .compliance-list {
            margin: 0;
            padding-left: 20px;
        }
        
        .compliance-list li {
            margin: 5px 0;
        }
        
        .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 60px;
            page-break-inside: avoid;
        }
        
        .signature-block {
            text-align: center;
            width: 45%;
        }
        
        .signature-space {
            height: 80px;
            border-bottom: 1px solid #000;
            margin-top: 30px;
        }
        
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }
        
        .metadata-box {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            font-size: 12px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 15px;
            }
            
            .page-break {
                page-break-before: always;
            }
        }
    </style>
</head>
<body>
    <!-- En-tête officiel -->
    <div class="country-header">
        <div class="country-info">
            <div style="font-weight: bold; font-size: 16px;">BURKINA FASO</div>
            <div style="font-style: italic; margin-top: 5px;">Unité - Travail - Progrès</div>
            <div style="margin-top: 10px; font-size: 12px;">
                République du Burkina Faso<br>
                Ministère de l'Économie, des Finances<br>
                et de la Prospective
            </div>
        </div>
        
        <div class="logo-space">
            [LOGO BF]
        </div>
        
        <div class="entity-info">
            @if(isset($entity))
                <div style="font-weight: bold; font-size: 14px;">{{ $entity['name'] }}</div>
                <div style="font-size: 12px; margin-top: 5px;">{{ $entity['type_label'] }}</div>
                <div style="font-size: 11px; margin-top: 10px;">
                    Code : {{ $entity['code'] }}<br>
                    Secteur : {{ $entity['sector'] }}<br>
                    @if($entity['address'])
                        {{ $entity['address'] }}
                    @endif
                </div>
            @endif
        </div>
    </div>

    <!-- Titre du document -->
    <div class="document-header">
        <h1 class="document-title">{{ $template_config['name'] ?? 'DOCUMENT EPE' }}</h1>
        
        @if(isset($periode))
            <div class="subtitle">{{ $periode['label'] }}</div>
        @endif
        
        @if(isset($template_config['category']))
            <div style="font-size: 14px; color: #666;">
                Catégorie : {{ $template_config['category'] }}
            </div>
        @endif
    </div>

    <!-- Informations générales -->
    <div class="section">
        <h2 class="section-title">I. INFORMATIONS GÉNÉRALES</h2>
        
        <table class="info-table">
            <tr>
                <th style="width: 30%;">Éléments</th>
                <th>Détails</th>
            </tr>
            @if(isset($entity))
                <tr>
                    <td><strong>Entité</strong></td>
                    <td>{{ $entity['name'] }} ({{ $entity['code'] }})</td>
                </tr>
                <tr>
                    <td><strong>Type de structure</strong></td>
                    <td>{{ $entity['type_label'] }}</td>
                </tr>
                <tr>
                    <td><strong>Secteur d'activité</strong></td>
                    <td>{{ $entity['sector'] }}</td>
                </tr>
                @if($entity['director_general'])
                    <tr>
                        <td><strong>Directeur Général</strong></td>
                        <td>{{ $entity['director_general'] }}</td>
                    </tr>
                @endif
                @if($entity['board_president'])
                    <tr>
                        <td><strong>Président du CA</strong></td>
                        <td>{{ $entity['board_president'] }}</td>
                    </tr>
                @endif
                @if($entity['technical_ministry'])
                    <tr>
                        <td><strong>Tutelle technique</strong></td>
                        <td>{{ $entity['technical_ministry'] }}</td>
                    </tr>
                @endif
                @if($entity['financial_ministry'])
                    <tr>
                        <td><strong>Tutelle financière</strong></td>
                        <td>{{ $entity['financial_ministry'] }}</td>
                    </tr>
                @endif
            @endif
            
            @if(isset($periode))
                <tr>
                    <td><strong>Période</strong></td>
                    <td>{{ $periode['label'] }} (du {{ date('d/m/Y', strtotime($periode['debut'])) }} au {{ date('d/m/Y', strtotime($periode['fin'])) }})</td>
                </tr>
            @endif
            
            <tr>
                <td><strong>Date de génération</strong></td>
                <td>{{ $generated_at->format('d/m/Y à H:i') }}</td>
            </tr>
            
            <tr>
                <td><strong>Généré par</strong></td>
                <td>{{ $generated_by }}</td>
            </tr>
        </table>
    </div>

    <!-- Cadre réglementaire -->
    <div class="compliance-box">
        <div class="compliance-title">📋 CADRE RÉGLEMENTAIRE ET CONFORMITÉ</div>
        
        @if(isset($template_config['compliance']))
            <div style="margin-bottom: 15px;">
                <strong>Références réglementaires applicables :</strong>
                <ul class="compliance-list">
                    @foreach($template_config['compliance'] as $compliance)
                        <li>{{ $compliance }}</li>
                    @endforeach
                </ul>
            </div>
        @endif
        
        @if(isset($syscohada))
            <div style="margin-bottom: 15px;">
                <strong>Système comptable :</strong> {{ $syscohada['version'] }}<br>
                <strong>Système applicable :</strong> {{ $syscohada['accounting_system']['system'] ?? 'SYSCOHADA' }}<br>
                <strong>Monnaie de référence :</strong> {{ $syscohada['currency'] }}
            </div>
        @endif
        
        @if(isset($burkina_faso))
            <div>
                <strong>Cadre national :</strong> {{ $burkina_faso['country'] }} - {{ $burkina_faso['capital'] }}<br>
                <strong>Exercice fiscal :</strong> {{ $burkina_faso['fiscal_year'] }}<br>
                <strong>Monnaie :</strong> {{ $burkina_faso['currency'] }}
            </div>
        @endif
    </div>

    <!-- Contenu principal du document -->
    <div class="section">
        <h2 class="section-title">II. CONTENU DU DOCUMENT</h2>
        
        @if(isset($content))
            {!! $content !!}
        @else
            <div class="metadata-box">
                <strong>⚠️ Contenu à personnaliser</strong><br>
                Ce template générique doit être adapté selon le type de document spécifique.<br>
                <br>
                <strong>Type de document :</strong> {{ $template_config['name'] ?? 'Non spécifié' }}<br>
                <strong>Catégorie :</strong> {{ $template_config['category'] ?? 'Non spécifiée' }}<br>
                <strong>Formats disponibles :</strong> 
                @if(isset($template_config['format']))
                    {{ implode(', ', $template_config['format']) }}
                @else
                    PDF, Word, Excel
                @endif
            </div>
            
            <p>Ce document a été généré automatiquement par la <strong>Plateforme de Reporting des EPE</strong> du Burkina Faso.</p>
            
            <p>Il respecte les standards et exigences réglementaires applicables aux entités publiques burkinabè selon :</p>
            <ul>
                <li>Le système comptable SYSCOHADA révisé</li>
                <li>Les directives UEMOA applicables</li>
                <li>La réglementation nationale en vigueur</li>
                <li>Les spécificités du type de structure ({{ $entity['type_label'] ?? 'EPE' }})</li>
            </ul>
            
            @if(isset($entity['requirements']))
                <h3>Exigences spécifiques selon le type de structure :</h3>
                
                @foreach($entity['requirements'] as $category => $requirements)
                    <h4>{{ ucfirst($category) }} :</h4>
                    <ul>
                        @foreach($requirements as $requirement)
                            <li>{{ $requirement }}</li>
                        @endforeach
                    </ul>
                @endforeach
            @endif
        @endif
    </div>

    <!-- Informations techniques -->
    @if(isset($syscohada['accounting_system']['special_requirements']))
        <div class="section">
            <h2 class="section-title">III. EXIGENCES COMPTABLES ET LÉGALES</h2>
            
            <h3>Exigences spéciales :</h3>
            <ul>
                @foreach($syscohada['accounting_system']['special_requirements'] as $requirement)
                    <li>{{ $requirement }}</li>
                @endforeach
            </ul>
            
            @if(isset($syscohada['accounting_system']['states']))
                <h3>États financiers requis :</h3>
                <ul>
                    @foreach($syscohada['accounting_system']['states'] as $state)
                        <li>{{ $state }}</li>
                    @endforeach
                </ul>
            @endif
        </div>
    @endif

    <!-- Zone de contenu personnalisable -->
    <div class="section">
        <h2 class="section-title">IV. DONNÉES ET ANALYSES</h2>
        
        <div style="min-height: 200px; border: 1px dashed #ccc; padding: 20px; text-align: center; color: #999;">
            <strong>Zone de contenu personnalisable</strong><br><br>
            Cette section doit être remplie avec les données spécifiques au document :<br>
            • Tableaux financiers<br>
            • Analyses et commentaires<br>
            • Graphiques et indicateurs<br>
            • Annexes techniques
        </div>
    </div>

    <!-- Signatures -->
    <div class="signatures">
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
                <p><strong>Le Président du Conseil d'Administration</strong></p>
                <p>{{ $entity['board_president'] }}</p>
                <div class="signature-space"></div>
                <p style="margin-top: 10px; font-size: 12px;">Signature et cachet</p>
            </div>
        @endif
    </div>

    <!-- Pied de page -->
    <div class="footer">
        <div style="margin-bottom: 10px;">
            <strong>Document conforme aux standards SYSCOHADA et UEMOA</strong>
        </div>
        <div>
            Plateforme de Reporting des EPE - République du Burkina Faso<br>
            Généré le {{ $generated_at->format('d/m/Y à H:i:s') }} par {{ $generated_by }}<br>
            @if(isset($template_config['compliance']))
                Conformité : {{ implode(' • ', $template_config['compliance']) }}
            @endif
        </div>
    </div>
</body>
</html>