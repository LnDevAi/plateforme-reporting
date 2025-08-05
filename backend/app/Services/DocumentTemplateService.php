<?php

namespace App\Services;

use App\Models\Report;
use App\Models\StateEntity;
use App\Models\User;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use Barryvdh\DomPDF\Facade\Pdf;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use Carbon\Carbon;

class DocumentTemplateService
{
    /**
     * Templates de documents EPE conformes aux standards burkinabè
     */
    const EPE_TEMPLATES = [
        // SOCIÉTÉS D'ÉTAT - Documents SYSCOHADA
        'budget_annuel_societe_etat' => [
            'name' => 'Budget Annuel - Société d\'État',
            'category' => 'Sessions Budgétaires',
            'type' => 'societe_etat',
            'format' => ['pdf', 'docx', 'excel'],
            'template' => 'budget-annuel-se',
            'compliance' => ['SYSCOHADA', 'Code sociétés commerciales', 'UEMOA'],
        ],
        'etats_financiers_syscohada' => [
            'name' => 'États Financiers SYSCOHADA',
            'category' => 'Arrêt des Comptes',
            'type' => 'societe_etat',
            'format' => ['pdf', 'excel'],
            'template' => 'etats-financiers-syscohada',
            'compliance' => ['SYSCOHADA', 'BRVM', 'Audit externe'],
        ],
        'rapport_gestion_ca' => [
            'name' => 'Rapport de Gestion CA',
            'category' => 'Assemblées Générales',
            'type' => 'societe_etat',
            'format' => ['pdf', 'docx'],
            'template' => 'rapport-gestion-ca',
            'compliance' => ['SYSCOHADA', 'Code sociétés commerciales'],
        ],
        'pv_assemblee_generale' => [
            'name' => 'Procès-Verbal Assemblée Générale',
            'category' => 'Assemblées Générales',
            'type' => 'societe_etat',
            'format' => ['pdf', 'docx'],
            'template' => 'pv-assemblee-generale',
            'compliance' => ['OHADA', 'Code sociétés commerciales'],
        ],
        'comptes_sociaux_annuels' => [
            'name' => 'Comptes Sociaux Annuels',
            'category' => 'Arrêt des Comptes',
            'type' => 'societe_etat',
            'format' => ['pdf', 'excel'],
            'template' => 'comptes-sociaux',
            'compliance' => ['SYSCOHADA', 'RCCM'],
        ],

        // ÉTABLISSEMENTS PUBLICS - Documents spécifiques
        'compte_administratif' => [
            'name' => 'Compte Administratif Annuel',
            'category' => 'Arrêt des Comptes',
            'type' => 'etablissement_public',
            'format' => ['pdf', 'excel'],
            'template' => 'compte-administratif',
            'compliance' => ['Règlement financier public', 'UEMOA'],
        ],
        'compte_gestion_agent_comptable' => [
            'name' => 'Compte de Gestion Agent Comptable',
            'category' => 'Arrêt des Comptes',
            'type' => 'etablissement_public',
            'format' => ['pdf', 'excel'],
            'template' => 'compte-gestion-ac',
            'compliance' => ['Comptabilité publique', 'UEMOA'],
        ],
        'inventaire_patrimoine' => [
            'name' => 'Inventaire Physique et Patrimoine',
            'category' => 'Comptabilité des Matières',
            'type' => 'etablissement_public',
            'format' => ['pdf', 'excel'],
            'template' => 'inventaire-patrimoine',
            'compliance' => ['Comptabilité des matières', 'UEMOA'],
        ],
        'livre_journal_matieres' => [
            'name' => 'Livre-Journal des Matières',
            'category' => 'Comptabilité des Matières',
            'type' => 'etablissement_public',
            'format' => ['excel', 'pdf'],
            'template' => 'livre-journal-matieres',
            'compliance' => ['Comptabilité des matières', 'Contrôle État'],
        ],

        // CONFORMITÉ UEMOA - Documents spécialisés
        'plan_passation_marches' => [
            'name' => 'Plan de Passation des Marchés',
            'category' => 'Sessions Budgétaires',
            'type' => 'all',
            'format' => ['pdf', 'excel'],
            'template' => 'plan-passation-marches',
            'compliance' => ['Code marchés publics', 'UEMOA'],
        ],
        'nomenclature_budgetaire_uemoa' => [
            'name' => 'Nomenclature Budgétaire UEMOA',
            'category' => 'Conformité UEMOA',
            'type' => 'all',
            'format' => ['excel', 'pdf'],
            'template' => 'nomenclature-budgetaire',
            'compliance' => ['Directives UEMOA', 'Budget harmonisé'],
        ],
        'rapport_conformite_uemoa' => [
            'name' => 'Rapport de Conformité UEMOA',
            'category' => 'Conformité UEMOA',
            'type' => 'all',
            'format' => ['pdf', 'docx'],
            'template' => 'conformite-uemoa',
            'compliance' => ['Surveillance multilatérale', 'UEMOA'],
        ],

        // AUDIT ET CONTRÔLE
        'rapport_audit_interne' => [
            'name' => 'Rapport d\'Audit Interne',
            'category' => 'Audit et Contrôle',
            'type' => 'all',
            'format' => ['pdf', 'docx'],
            'template' => 'audit-interne',
            'compliance' => ['Normes audit', 'Gouvernance'],
        ],
        'tableau_bord_gestion' => [
            'name' => 'Tableau de Bord de Gestion',
            'category' => 'Audit et Contrôle',
            'type' => 'all',
            'format' => ['excel', 'pdf'],
            'template' => 'tableau-bord',
            'compliance' => ['Performance', 'Pilotage'],
        ],
    ];

    /**
     * Génère un document à partir d'un template
     */
    public function generateDocument(string $templateKey, array $data, string $format = 'pdf'): string
    {
        $template = self::EPE_TEMPLATES[$templateKey] ?? null;
        
        if (!$template) {
            throw new \InvalidArgumentException("Template non trouvé : {$templateKey}");
        }

        // Enrichir les données avec les informations contextuelles
        $enrichedData = $this->enrichDataWithContext($data, $template);

        switch ($format) {
            case 'pdf':
                return $this->generatePdf($template, $enrichedData);
            case 'docx':
                return $this->generateDocx($template, $enrichedData);
            case 'excel':
                return $this->generateExcel($template, $enrichedData);
            case 'html':
                return $this->generateHtml($template, $enrichedData);
            default:
                throw new \InvalidArgumentException("Format non supporté : {$format}");
        }
    }

    /**
     * Enrichit les données avec le contexte EPE/UEMOA
     */
    private function enrichDataWithContext(array $data, array $template): array
    {
        $enriched = $data;

        // Informations de base
        $enriched['generated_at'] = Carbon::now();
        $enriched['generated_by'] = auth()->user()?->name ?? 'Système';
        
        // Informations EPE si disponibles
        if (isset($data['entity_id'])) {
            $entity = StateEntity::with(['technicalMinistry', 'financialMinistry'])->find($data['entity_id']);
            if ($entity) {
                $enriched['entity'] = [
                    'name' => $entity->name,
                    'code' => $entity->code,
                    'type' => $entity->type,
                    'type_label' => $entity->getTypeLabel(),
                    'sector' => $entity->sector,
                    'address' => $entity->headquarters_address,
                    'email' => $entity->contact_email,
                    'phone' => $entity->contact_phone,
                    'website' => $entity->website,
                    'director_general' => $entity->director_general,
                    'board_president' => $entity->board_president,
                    'capital_amount' => $entity->capital_amount,
                    'employee_count' => $entity->employee_count,
                    'technical_ministry' => $entity->technicalMinistry?->name,
                    'financial_ministry' => $entity->financialMinistry?->name,
                    'establishment_date' => $entity->establishment_date,
                    'requirements' => $entity->getStructureSpecificRequirements(),
                ];
            }
        }

        // Informations SYSCOHADA/UEMOA
        $enriched['syscohada'] = [
            'version' => 'SYSCOHADA Révisé 2019',
            'currency' => 'FCFA',
            'accounting_system' => $this->getAccountingSystemForEntity($enriched['entity']['type'] ?? null),
            'compliance_framework' => $template['compliance'],
        ];

        // Période de reporting
        if (isset($data['exercice']) || isset($data['year'])) {
            $year = $data['exercice'] ?? $data['year'] ?? date('Y');
            $enriched['periode'] = [
                'exercice' => $year,
                'debut' => "{$year}-01-01",
                'fin' => "{$year}-12-31",
                'label' => "Exercice {$year}",
            ];
        }

        // Données fiscales et légales Burkina Faso
        $enriched['burkina_faso'] = [
            'country' => 'Burkina Faso',
            'capital' => 'Ouagadougou',
            'currency' => 'Franc CFA (XOF)',
            'fiscal_year' => 'Année civile (1er janvier - 31 décembre)',
            'legal_framework' => [
                'commercial_code' => 'Code de commerce burkinabè',
                'ohada' => 'Actes uniformes OHADA',
                'uemoa' => 'Directives UEMOA',
                'public_finance' => 'Règlement financier public',
            ],
        ];

        return $enriched;
    }

    /**
     * Détermine le système comptable selon le type d'entité
     */
    private function getAccountingSystemForEntity(?string $entityType): array
    {
        switch ($entityType) {
            case StateEntity::TYPE_SOCIETE_ETAT:
                return [
                    'system' => 'SYSCOHADA Complet',
                    'states' => ['Bilan', 'Compte de résultat', 'TAFIRE', 'État annexé'],
                    'special_requirements' => [
                        'Commissaires aux comptes obligatoires',
                        'Publication BRVM si cotée',
                        'Dépôt RCCM obligatoire',
                    ],
                ];
            
            case StateEntity::TYPE_ETABLISSEMENT_PUBLIC:
                return [
                    'system' => 'Comptabilité publique + SYSCOHADA',
                    'states' => ['Compte administratif', 'Compte de gestion', 'Inventaire patrimoine'],
                    'special_requirements' => [
                        'Agent comptable public',
                        'Comptabilité des matières',
                        'Contrôle financier État',
                    ],
                ];
            
            default:
                return [
                    'system' => 'SYSCOHADA Adapté',
                    'states' => ['Selon statuts particuliers'],
                    'special_requirements' => ['Conformément aux textes fondateurs'],
                ];
        }
    }

    /**
     * Génère un document PDF
     */
    private function generatePdf(array $template, array $data): string
    {
        $viewName = "document-templates.{$template['template']}";
        
        // Vérifier si la vue existe, sinon utiliser le template générique
        if (!View::exists($viewName)) {
            $viewName = 'document-templates.generic-epe-template';
            $data['template_config'] = $template;
        }

        $html = View::make($viewName, $data)->render();
        
        $pdf = Pdf::loadHTML($html);
        $pdf->setPaper('A4', 'portrait');
        
        // Configuration spécifique selon le type de document
        $pdf->setOptions([
            'isHtml5ParserEnabled' => true,
            'isPhpEnabled' => true,
            'defaultFont' => 'Arial',
            'margin_top' => 20,
            'margin_bottom' => 20,
            'margin_left' => 15,
            'margin_right' => 15,
        ]);

        $filename = $this->generateFilename($template, $data, 'pdf');
        $path = "documents/generated/{$filename}";
        
        Storage::put($path, $pdf->output());
        
        return $path;
    }

    /**
     * Génère un document Word
     */
    private function generateDocx(array $template, array $data): string
    {
        $phpWord = new PhpWord();
        
        // Configuration du document
        $section = $phpWord->addSection([
            'marginTop' => 1134,    // 2cm
            'marginBottom' => 1134,
            'marginLeft' => 1134,
            'marginRight' => 1134,
        ]);

        // En-tête officiel
        $this->addOfficialHeader($section, $data);
        
        // Contenu selon le template
        $this->addDocumentContent($section, $template, $data);
        
        // Pied de page
        $this->addOfficialFooter($section, $data);

        $filename = $this->generateFilename($template, $data, 'docx');
        $path = "documents/generated/{$filename}";
        
        $writer = IOFactory::createWriter($phpWord, 'Word2007');
        $tempPath = storage_path("app/{$path}");
        $writer->save($tempPath);
        
        return $path;
    }

    /**
     * Génère un fichier Excel
     */
    private function generateExcel(array $template, array $data): string
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        
        // Configuration de la feuille
        $sheet->setTitle($template['name']);
        
        // En-tête officiel
        $this->addExcelHeader($sheet, $data);
        
        // Contenu selon le template
        $currentRow = $this->addExcelContent($sheet, $template, $data);
        
        // Mise en forme
        $this->applyExcelFormatting($sheet, $currentRow);

        $filename = $this->generateFilename($template, $data, 'xlsx');
        $path = "documents/generated/{$filename}";
        
        $writer = new Xlsx($spreadsheet);
        $tempPath = storage_path("app/{$path}");
        $writer->save($tempPath);
        
        return $path;
    }

    /**
     * Génère un document HTML
     */
    private function generateHtml(array $template, array $data): string
    {
        $viewName = "document-templates.{$template['template']}";
        
        if (!View::exists($viewName)) {
            $viewName = 'document-templates.generic-epe-template';
            $data['template_config'] = $template;
        }

        $html = View::make($viewName, $data)->render();
        
        $filename = $this->generateFilename($template, $data, 'html');
        $path = "documents/generated/{$filename}";
        
        Storage::put($path, $html);
        
        return $path;
    }

    /**
     * Ajoute l'en-tête officiel
     */
    private function addOfficialHeader($section, array $data): void
    {
        // Logo Burkina Faso (si disponible)
        $headerTable = $section->addTable();
        $headerTable->addRow();
        
        $leftCell = $headerTable->addCell(4000);
        $leftCell->addText('BURKINA FASO', ['bold' => true, 'size' => 14]);
        $leftCell->addText('Unité - Travail - Progrès', ['italic' => true, 'size' => 10]);
        
        $rightCell = $headerTable->addCell(4000);
        if (isset($data['entity'])) {
            $rightCell->addText($data['entity']['name'], ['bold' => true, 'size' => 12]);
            $rightCell->addText($data['entity']['type_label'], ['size' => 10]);
        }
        
        $section->addTextBreak(2);
    }

    /**
     * Ajoute le contenu du document
     */
    private function addDocumentContent($section, array $template, array $data): void
    {
        // Titre du document
        $section->addText($template['name'], [
            'bold' => true, 
            'size' => 16, 
            'color' => '1F497D'
        ], ['alignment' => Alignment::HORIZONTAL_CENTER]);
        
        $section->addTextBreak();
        
        // Informations générales
        if (isset($data['periode'])) {
            $section->addText("Exercice : {$data['periode']['label']}", ['bold' => true]);
        }
        
        if (isset($data['entity'])) {
            $section->addText("Entité : {$data['entity']['name']} ({$data['entity']['code']})");
        }
        
        $section->addTextBreak();
        
        // Conformité réglementaire
        $section->addText('Cadre réglementaire :', ['bold' => true, 'underline' => true]);
        foreach ($template['compliance'] as $compliance) {
            $section->addText("• {$compliance}", ['listType' => 'bullet']);
        }
        
        $section->addTextBreak();
        
        // Contenu spécifique selon le template
        $this->addSpecificContent($section, $template, $data);
    }

    /**
     * Ajoute le contenu spécifique selon le type de document
     */
    private function addSpecificContent($section, array $template, array $data): void
    {
        switch ($template['template']) {
            case 'budget-annuel-se':
                $this->addBudgetContent($section, $data);
                break;
            case 'etats-financiers-syscohada':
                $this->addFinancialStatesContent($section, $data);
                break;
            case 'plan-passation-marches':
                $this->addProcurementPlanContent($section, $data);
                break;
            case 'inventaire-patrimoine':
                $this->addInventoryContent($section, $data);
                break;
            default:
                $this->addGenericContent($section, $data);
        }
    }

    /**
     * Contenu budget annuel
     */
    private function addBudgetContent($section, array $data): void
    {
        $section->addText('I. PRÉSENTATION GÉNÉRALE', ['bold' => true, 'size' => 14]);
        $section->addTextBreak();
        
        // Table budget
        $table = $section->addTable(['borderSize' => 6, 'borderColor' => '999999']);
        
        // En-tête
        $table->addRow();
        $table->addCell(3000)->addText('RUBRIQUE', ['bold' => true]);
        $table->addCell(2000)->addText('BUDGET N-1', ['bold' => true]);
        $table->addCell(2000)->addText('RÉALISÉ N-1', ['bold' => true]);
        $table->addCell(2000)->addText('BUDGET N', ['bold' => true]);
        
        // Données budget (exemple)
        $budgetItems = [
            'Chiffre d\'affaires' => ['120000000', '115000000', '130000000'],
            'Charges d\'exploitation' => ['90000000', '88000000', '95000000'],
            'Résultat d\'exploitation' => ['30000000', '27000000', '35000000'],
            'Investissements' => ['15000000', '12000000', '20000000'],
        ];
        
        foreach ($budgetItems as $item => $values) {
            $table->addRow();
            $table->addCell(3000)->addText($item);
            foreach ($values as $value) {
                $table->addCell(2000)->addText(number_format($value, 0, ',', ' ') . ' FCFA');
            }
        }
    }

    /**
     * Contenu états financiers SYSCOHADA
     */
    private function addFinancialStatesContent($section, array $data): void
    {
        $section->addText('ÉTATS FINANCIERS SYSCOHADA', ['bold' => true, 'size' => 14]);
        $section->addTextBreak();
        
        $section->addText('Les états financiers comprennent :', ['bold' => true]);
        $section->addText('• Bilan (Actif et Passif)');
        $section->addText('• Compte de résultat');
        $section->addText('• Tableau financier des ressources et emplois (TAFIRE)');
        $section->addText('• État annexé');
        $section->addTextBreak();
        
        $section->addText('Certification :', ['bold' => true]);
        $section->addText('Les présents états financiers ont été établis conformément au référentiel SYSCOHADA et certifiés par les commissaires aux comptes.');
    }

    /**
     * Ajoute l'en-tête Excel
     */
    private function addExcelHeader($sheet, array $data): int
    {
        $row = 1;
        
        // En-tête principal
        $sheet->setCellValue("A{$row}", 'BURKINA FASO');
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(14);
        
        $row++;
        $sheet->setCellValue("A{$row}", 'Unité - Travail - Progrès');
        $sheet->getStyle("A{$row}")->getFont()->setItalic(true);
        
        if (isset($data['entity'])) {
            $sheet->setCellValue("D{$row}", $data['entity']['name']);
            $sheet->getStyle("D{$row}")->getFont()->setBold(true);
        }
        
        return $row + 2;
    }

    /**
     * Ajoute le contenu Excel
     */
    private function addExcelContent($sheet, array $template, array $data): int
    {
        $row = 5;
        
        // Titre
        $sheet->setCellValue("A{$row}", $template['name']);
        $sheet->getStyle("A{$row}")->getFont()->setBold(true)->setSize(16);
        $sheet->mergeCells("A{$row}:F{$row}");
        
        $row += 2;
        
        // Informations de base
        if (isset($data['periode'])) {
            $sheet->setCellValue("A{$row}", 'Exercice :');
            $sheet->setCellValue("B{$row}", $data['periode']['label']);
            $row++;
        }
        
        if (isset($data['entity'])) {
            $sheet->setCellValue("A{$row}", 'Entité :');
            $sheet->setCellValue("B{$row}", $data['entity']['name']);
            $row++;
        }
        
        $row += 2;
        
        // Contenu spécifique
        return $this->addSpecificExcelContent($sheet, $template, $data, $row);
    }

    /**
     * Ajoute le contenu Excel spécifique
     */
    private function addSpecificExcelContent($sheet, array $template, array $data, int $startRow): int
    {
        $row = $startRow;
        
        switch ($template['template']) {
            case 'budget-annuel-se':
                // Table budget
                $headers = ['RUBRIQUE', 'BUDGET N-1', 'RÉALISÉ N-1', 'BUDGET N', 'ÉCART %'];
                foreach ($headers as $col => $header) {
                    $sheet->setCellValueByColumnAndRow($col + 1, $row, $header);
                    $sheet->getStyleByColumnAndRow($col + 1, $row)->getFont()->setBold(true);
                }
                $row++;
                
                // Données exemple
                $budgetData = [
                    ['Chiffre d\'affaires', 120000000, 115000000, 130000000, '8.3%'],
                    ['Charges exploitation', 90000000, 88000000, 95000000, '5.6%'],
                    ['Résultat exploitation', 30000000, 27000000, 35000000, '16.7%'],
                ];
                
                foreach ($budgetData as $rowData) {
                    foreach ($rowData as $col => $value) {
                        $sheet->setCellValueByColumnAndRow($col + 1, $row, $value);
                    }
                    $row++;
                }
                break;
                
            default:
                $sheet->setCellValue("A{$row}", 'Contenu du document selon template');
                $row++;
        }
        
        return $row;
    }

    /**
     * Applique la mise en forme Excel
     */
    private function applyExcelFormatting($sheet, int $lastRow): void
    {
        // Ajustement automatique des colonnes
        foreach (range('A', 'F') as $column) {
            $sheet->getColumnDimension($column)->setAutoSize(true);
        }
        
        // Bordures pour les tableaux
        $sheet->getStyle("A5:F{$lastRow}")->getBorders()->getAllBorders()->setBorderStyle(Border::BORDER_THIN);
        
        // Couleur d'en-tête
        $sheet->getStyle('A5:F5')->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('E7E6E6');
    }

    /**
     * Ajoute le pied de page officiel
     */
    private function addOfficialFooter($section, array $data): void
    {
        $section->addTextBreak(2);
        
        $footerTable = $section->addTable();
        $footerTable->addRow();
        
        $leftCell = $footerTable->addCell(4000);
        $leftCell->addText('Document généré le : ' . $data['generated_at']->format('d/m/Y à H:i'));
        $leftCell->addText('Par : ' . $data['generated_by']);
        
        $rightCell = $footerTable->addCell(4000);
        $rightCell->addText('Conforme au SYSCOHADA', ['italic' => true]);
        $rightCell->addText('République du Burkina Faso', ['italic' => true]);
    }

    /**
     * Génère un nom de fichier unique
     */
    private function generateFilename(array $template, array $data, string $extension): string
    {
        $entityCode = $data['entity']['code'] ?? 'EPE';
        $exercice = $data['periode']['exercice'] ?? date('Y');
        $templateSlug = str_slug($template['name']);
        $timestamp = date('Ymd_His');
        
        return "{$entityCode}_{$templateSlug}_{$exercice}_{$timestamp}.{$extension}";
    }

    /**
     * Obtient la liste des templates disponibles
     */
    public function getAvailableTemplates(?string $entityType = null): array
    {
        $templates = self::EPE_TEMPLATES;
        
        if ($entityType) {
            $templates = array_filter($templates, function ($template) use ($entityType) {
                return $template['type'] === 'all' || $template['type'] === $entityType;
            });
        }
        
        return $templates;
    }

    /**
     * Obtient les templates par catégorie
     */
    public function getTemplatesByCategory(): array
    {
        $categories = [];
        
        foreach (self::EPE_TEMPLATES as $key => $template) {
            $category = $template['category'];
            if (!isset($categories[$category])) {
                $categories[$category] = [];
            }
            $categories[$category][$key] = $template;
        }
        
        return $categories;
    }

    /**
     * Valide les données requises pour un template
     */
    public function validateTemplateData(string $templateKey, array $data): array
    {
        $template = self::EPE_TEMPLATES[$templateKey] ?? null;
        
        if (!$template) {
            return ['valid' => false, 'errors' => ['Template non trouvé']];
        }
        
        $errors = [];
        
        // Validations de base
        if ($template['type'] !== 'all' && !isset($data['entity_id'])) {
            $errors[] = 'ID entité requis pour ce type de document';
        }
        
        // Validations spécifiques selon le template
        switch ($template['template']) {
            case 'budget-annuel-se':
                if (!isset($data['exercice'])) {
                    $errors[] = 'Exercice requis pour le budget annuel';
                }
                break;
                
            case 'etats-financiers-syscohada':
                if (!isset($data['exercice']) || !isset($data['closing_date'])) {
                    $errors[] = 'Exercice et date de clôture requis';
                }
                break;
        }
        
        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'template' => $template,
        ];
    }

    /**
     * Contenu générique pour les templates non spécialisés
     */
    private function addGenericContent($section, array $data): void
    {
        $section->addText('CONTENU DU DOCUMENT', ['bold' => true, 'size' => 14]);
        $section->addTextBreak();
        
        $section->addText('Ce document a été généré automatiquement par la plateforme de reporting des EPE.');
        $section->addText('Il respecte les standards et exigences réglementaires applicables.');
        
        $section->addTextBreak();
        
        if (isset($data['content'])) {
            $section->addText($data['content']);
        } else {
            $section->addText('Contenu à personnaliser selon les besoins spécifiques du document.');
        }
    }

    /**
     * Ajoute le contenu pour le plan de passation des marchés
     */
    private function addProcurementPlanContent($section, array $data): void
    {
        $section->addText('PLAN DE PASSATION DES MARCHÉS', ['bold' => true, 'size' => 14]);
        $section->addTextBreak();
        
        $section->addText('Conforme au Code des marchés publics du Burkina Faso et aux directives UEMOA');
        $section->addTextBreak();
        
        // Table des marchés
        $table = $section->addTable(['borderSize' => 6, 'borderColor' => '999999']);
        
        // En-tête
        $table->addRow();
        $table->addCell(1000)->addText('N°', ['bold' => true]);
        $table->addCell(3000)->addText('INTITULÉ DU MARCHÉ', ['bold' => true]);
        $table->addCell(1500)->addText('MONTANT ESTIMÉ', ['bold' => true]);
        $table->addCell(1500)->addText('PÉRIODE', ['bold' => true]);
        $table->addCell(1500)->addText('MODE PASSATION', ['bold' => true]);
        
        // Données exemple
        for ($i = 1; $i <= 5; $i++) {
            $table->addRow();
            $table->addCell(1000)->addText($i);
            $table->addCell(3000)->addText("Marché type n°{$i}");
            $table->addCell(1500)->addText(number_format(rand(5000000, 50000000), 0, ',', ' ') . ' FCFA');
            $table->addCell(1500)->addText("T" . ceil($i/2) . " " . ($data['periode']['exercice'] ?? date('Y')));
            $table->addCell(1500)->addText($i % 2 == 0 ? 'Appel d\'offres' : 'Gré à gré');
        }
    }

    /**
     * Ajoute le contenu pour l'inventaire patrimoine
     */
    private function addInventoryContent($section, array $data): void
    {
        $section->addText('INVENTAIRE PHYSIQUE ET PATRIMOINE', ['bold' => true, 'size' => 14]);
        $section->addTextBreak();
        
        $section->addText('Inventaire des biens mobiliers et immobiliers selon la comptabilité des matières');
        $section->addTextBreak();
        
        // Sections principales
        $section->addText('A. BIENS IMMOBILIERS', ['bold' => true, 'size' => 12]);
        $section->addText('• Terrains et constructions');
        $section->addText('• Installations techniques');
        $section->addText('• Aménagements');
        $section->addTextBreak();
        
        $section->addText('B. BIENS MOBILIERS', ['bold' => true, 'size' => 12]);
        $section->addText('• Matériel et outillage');
        $section->addText('• Matériel de transport');
        $section->addText('• Mobilier de bureau');
        $section->addText('• Matériel informatique');
        $section->addTextBreak();
        
        $section->addText('C. RÉCAPITULATIF', ['bold' => true, 'size' => 12]);
        // Table récapitulative
        $table = $section->addTable(['borderSize' => 6, 'borderColor' => '999999']);
        
        $table->addRow();
        $table->addCell(4000)->addText('CATÉGORIE', ['bold' => true]);
        $table->addCell(2000)->addText('VALEUR BRUTE', ['bold' => true]);
        $table->addCell(2000)->addText('AMORTISSEMENTS', ['bold' => true]);
        $table->addCell(2000)->addText('VALEUR NETTE', ['bold' => true]);
        
        $categories = [
            'Terrains' => [50000000, 0, 50000000],
            'Constructions' => [200000000, 80000000, 120000000],
            'Matériel technique' => [80000000, 50000000, 30000000],
            'Mobilier et matériel' => [30000000, 20000000, 10000000],
        ];
        
        foreach ($categories as $cat => $values) {
            $table->addRow();
            $table->addCell(4000)->addText($cat);
            foreach ($values as $value) {
                $table->addCell(2000)->addText(number_format($value, 0, ',', ' ') . ' FCFA');
            }
        }
    }
}