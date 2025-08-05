<?php

namespace App\Services;

use App\Models\DocumentVersion;
use App\Models\StateEntity;
use App\Models\Report;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\View;
use PhpOffice\PhpWord\PhpWord;
use PhpOffice\PhpWord\IOFactory;
use Barryvdh\DomPDF\Facade\Pdf;
use Maatwebsite\Excel\Facades\Excel;
use Exception;

class DocumentTemplateService
{
    /**
     * Types de templates disponibles
     */
    const TEMPLATE_TYPES = [
        'budget_annuel' => 'Projet de Budget Annuel',
        'etats_financiers' => 'États Financiers Annuels',
        'rapport_activites' => 'Rapport d\'Activités Détaillé',
        'plan_marches' => 'Plan de Passation des Marchés',
        'inventaire_patrimoine' => 'Inventaire Physique et Patrimoine',
        'livre_journal_matieres' => 'Livre-Journal des Matières',
        'rapport_gestion_ca' => 'Rapport de Gestion CA',
        'bilan_social' => 'Bilan Social et RH',
    ];

    /**
     * Formats d'export supportés
     */
    const SUPPORTED_FORMATS = ['pdf', 'docx', 'excel', 'html'];

    /**
     * Générer un document selon un template
     */
    public function generateDocument($templateType, $data, $format = 'pdf')
    {
        // Valider les paramètres
        $this->validateParameters($templateType, $format);

        // Enrichir les données avec les informations contextuelles
        $enrichedData = $this->enrichDataWithContext($data);

        // Générer le contenu selon le template
        $content = $this->generateContentFromTemplate($templateType, $enrichedData);

        // Convertir au format demandé
        return $this->convertToFormat($content, $format, $templateType, $enrichedData);
    }

    /**
     * Créer un document avec template pré-rempli
     */
    public function createDocumentFromTemplate($templateType, $reportId, $entityId, $parameters = [])
    {
        $entity = StateEntity::findOrFail($entityId);
        $report = Report::findOrFail($reportId);

        // Préparer les données du template
        $templateData = $this->prepareTemplateData($entity, $report, $parameters);

        // Générer le contenu HTML
        $htmlContent = $this->generateTemplateHtml($templateType, $templateData);

        // Créer la version du document
        $documentVersion = DocumentVersion::create([
            'report_id' => $reportId,
            'version_number' => '1.0',
            'title' => $this->getTemplateTitle($templateType, $entity),
            'description' => 'Document généré automatiquement selon template ' . $templateType,
            'content' => $htmlContent,
            'content_type' => 'html',
            'status' => 'draft',
            'created_by' => auth()->id(),
            'updated_by' => auth()->id(),
            'is_current' => true,
            'metadata' => [
                'template_type' => $templateType,
                'template_version' => '1.0',
                'auto_generated' => true,
                'generation_date' => now()->toISOString(),
                'uemoa_compliant' => true,
                'entity_info' => [
                    'name' => $entity->name,
                    'type' => $entity->type,
                    'sector' => $entity->sector,
                ],
            ],
        ]);

        return $documentVersion;
    }

    /**
     * Télécharger un document dans un format spécifique
     */
    public function downloadDocument($documentVersionId, $format = 'pdf')
    {
        $document = DocumentVersion::findOrFail($documentVersionId);
        
        // Préparer les données pour l'export
        $exportData = $this->prepareExportData($document);

        // Générer le fichier selon le format
        switch ($format) {
            case 'pdf':
                return $this->generatePdfDownload($document, $exportData);
            case 'docx':
                return $this->generateDocxDownload($document, $exportData);
            case 'excel':
                return $this->generateExcelDownload($document, $exportData);
            case 'html':
                return $this->generateHtmlDownload($document, $exportData);
            default:
                throw new Exception("Format de téléchargement non supporté: {$format}");
        }
    }

    /**
     * Valider les paramètres
     */
    private function validateParameters($templateType, $format)
    {
        if (!array_key_exists($templateType, self::TEMPLATE_TYPES)) {
            throw new Exception("Type de template non supporté: {$templateType}");
        }

        if (!in_array($format, self::SUPPORTED_FORMATS)) {
            throw new Exception("Format non supporté: {$format}");
        }
    }

    /**
     * Enrichir les données avec le contexte
     */
    private function enrichDataWithContext($data)
    {
        return array_merge($data, [
            'generation_info' => [
                'generated_at' => now()->format('d/m/Y H:i:s'),
                'generated_by' => auth()->user()->name ?? 'Système',
                'platform_version' => '1.0.0',
                'uemoa_compliance' => true,
            ],
            'current_date' => now()->format('d/m/Y'),
            'current_year' => now()->year,
            'previous_year' => now()->subYear()->year,
        ]);
    }

    /**
     * Générer le contenu depuis un template
     */
    private function generateContentFromTemplate($templateType, $data)
    {
        $templatePath = "document-templates.{$templateType}";
        
        try {
            return View::make($templatePath, $data)->render();
        } catch (Exception $e) {
            // Fallback vers un template générique si le spécifique n'existe pas
            return $this->generateGenericTemplate($templateType, $data);
        }
    }

    /**
     * Convertir le contenu au format demandé
     */
    private function convertToFormat($content, $format, $templateType, $data)
    {
        switch ($format) {
            case 'pdf':
                return $this->convertToPdf($content, $templateType);
            case 'docx':
                return $this->convertToDocx($content, $templateType, $data);
            case 'excel':
                return $this->convertToExcel($data, $templateType);
            case 'html':
                return $content;
            default:
                return $content;
        }
    }

    /**
     * Préparer les données du template
     */
    private function prepareTemplateData($entity, $report, $parameters)
    {
        $baseData = [
            'entity' => [
                'name' => $entity->name,
                'code' => $entity->code,
                'type' => $entity->type,
                'sector' => $entity->sector,
                'director_general' => $entity->director_general,
                'board_president' => $entity->board_president,
                'address' => $entity->headquarters_address,
                'capital_amount' => $entity->capital_amount,
                'employee_count' => $entity->employee_count,
                'establishment_date' => $entity->establishment_date,
                'technical_ministry' => $entity->technicalMinistry?->name,
                'financial_ministry' => $entity->financialMinistry?->name,
            ],
            'report' => [
                'name' => $report->name,
                'category' => $report->category,
                'type' => $report->type,
                'description' => $report->description,
                'created_at' => $report->created_at,
            ],
            'current_period' => [
                'year' => now()->year,
                'quarter' => ceil(now()->month / 3),
                'month' => now()->month,
                'date' => now()->format('d/m/Y'),
            ],
            'uemoa_info' => [
                'compliance_required' => true,
                'submission_deadline' => $this->getSubmissionDeadline($report->category),
                'regulatory_framework' => 'Directive UEMOA n°09/2009/CM',
            ],
        ];

        return array_merge($baseData, $parameters);
    }

    /**
     * Générer le HTML du template
     */
    private function generateTemplateHtml($templateType, $data)
    {
        switch ($templateType) {
            case 'budget_annuel':
                return $this->generateBudgetAnnuelTemplate($data);
            case 'etats_financiers':
                return $this->generateEtatsFinanciersTemplate($data);
            case 'rapport_activites':
                return $this->generateRapportActivitesTemplate($data);
            case 'plan_marches':
                return $this->generatePlanMarchesTemplate($data);
            case 'inventaire_patrimoine':
                return $this->generateInventairePatrimoineTemplate($data);
            case 'livre_journal_matieres':
                return $this->generateLivreJournalMatieresTemplate($data);
            case 'rapport_gestion_ca':
                return $this->generateRapportGestionCATemplate($data);
            case 'bilan_social':
                return $this->generateBilanSocialTemplate($data);
            default:
                return $this->generateGenericTemplate($templateType, $data);
        }
    }

    /**
     * Template Projet de Budget Annuel
     */
    private function generateBudgetAnnuelTemplate($data)
    {
        return view('document-templates.budget-annuel', $data)->render();
    }

    /**
     * Template États Financiers Annuels
     */
    private function generateEtatsFinanciersTemplate($data)
    {
        return "
        <div class='document-header'>
            <h1>ÉTATS FINANCIERS ANNUELS</h1>
            <h2>{$data['entity']['name']}</h2>
            <h3>Exercice {$data['current_period']['year']}</h3>
        </div>

        <div class='section'>
            <h2>I. BILAN COMPTABLE</h2>
            <h3>Au 31 décembre {$data['current_period']['year']}</h3>
            
            <div class='subsection'>
                <h4>ACTIF</h4>
                <table class='financial-table'>
                    <thead>
                        <tr>
                            <th>POSTES</th>
                            <th>Note</th>
                            <th>Exercice N</th>
                            <th>Exercice N-1</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>ACTIF IMMOBILISE</strong></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Immobilisations incorporelles</td>
                            <td>3</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        <tr>
                            <td>Immobilisations corporelles</td>
                            <td>4</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        <tr>
                            <td>Immobilisations financières</td>
                            <td>5</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        <tr>
                            <td><strong>TOTAL ACTIF IMMOBILISE</strong></td>
                            <td></td>
                            <td class='amount total'>[À COMPLÉTER]</td>
                            <td class='amount total'>[À COMPLÉTER]</td>
                        </tr>
                        
                        <tr>
                            <td><strong>ACTIF CIRCULANT</strong></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Stocks et en-cours</td>
                            <td>6</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        <tr>
                            <td>Créances et emplois assimilés</td>
                            <td>7</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        <tr>
                            <td>Trésorerie-Actif</td>
                            <td>8</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        <tr>
                            <td><strong>TOTAL ACTIF CIRCULANT</strong></td>
                            <td></td>
                            <td class='amount total'>[À COMPLÉTER]</td>
                            <td class='amount total'>[À COMPLÉTER]</td>
                        </tr>
                        
                        <tr>
                            <td><strong>TOTAL GÉNÉRAL ACTIF</strong></td>
                            <td></td>
                            <td class='amount grand-total'>[À COMPLÉTER]</td>
                            <td class='amount grand-total'>[À COMPLÉTER]</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <div class='subsection'>
                <h4>PASSIF</h4>
                <table class='financial-table'>
                    <thead>
                        <tr>
                            <th>POSTES</th>
                            <th>Note</th>
                            <th>Exercice N</th>
                            <th>Exercice N-1</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><strong>CAPITAUX PROPRES</strong></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Capital</td>
                            <td>9</td>
                            <td class='amount'>{$data['entity']['capital_amount']}</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        <tr>
                            <td>Réserves</td>
                            <td>10</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        <tr>
                            <td>Résultat net de l'exercice</td>
                            <td>11</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        <tr>
                            <td><strong>TOTAL CAPITAUX PROPRES</strong></td>
                            <td></td>
                            <td class='amount total'>[À COMPLÉTER]</td>
                            <td class='amount total'>[À COMPLÉTER]</td>
                        </tr>
                        
                        <tr>
                            <td><strong>DETTES FINANCIÈRES</strong></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Emprunts et dettes financières diverses</td>
                            <td>12</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        
                        <tr>
                            <td><strong>PASSIF CIRCULANT</strong></td>
                            <td></td>
                            <td></td>
                            <td></td>
                        </tr>
                        <tr>
                            <td>Dettes circulantes et ressources assimilées</td>
                            <td>13</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        <tr>
                            <td>Trésorerie-Passif</td>
                            <td>14</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                            <td class='amount'>[À COMPLÉTER]</td>
                        </tr>
                        
                        <tr>
                            <td><strong>TOTAL GÉNÉRAL PASSIF</strong></td>
                            <td></td>
                            <td class='amount grand-total'>[À COMPLÉTER]</td>
                            <td class='amount grand-total'>[À COMPLÉTER]</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div class='section'>
            <h2>II. COMPTE DE RÉSULTAT</h2>
            <h3>Exercice du 1er janvier au 31 décembre {$data['current_period']['year']}</h3>
            
            <table class='financial-table'>
                <thead>
                    <tr>
                        <th>POSTES</th>
                        <th>Note</th>
                        <th>Exercice N</th>
                        <th>Exercice N-1</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>ACTIVITÉ D'EXPLOITATION</strong></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                    <tr>
                        <td>Chiffre d'affaires</td>
                        <td>15</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                    </tr>
                    <tr>
                        <td>Production stockée</td>
                        <td>16</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                    </tr>
                    <tr>
                        <td>Autres produits</td>
                        <td>17</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                    </tr>
                    <tr>
                        <td><strong>TOTAL PRODUITS D'EXPLOITATION</strong></td>
                        <td></td>
                        <td class='amount total'>[À COMPLÉTER]</td>
                        <td class='amount total'>[À COMPLÉTER]</td>
                    </tr>
                    
                    <tr>
                        <td>Achats</td>
                        <td>18</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                    </tr>
                    <tr>
                        <td>Services extérieurs</td>
                        <td>19</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                    </tr>
                    <tr>
                        <td>Charges de personnel</td>
                        <td>20</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                    </tr>
                    <tr>
                        <td>Impôts et taxes</td>
                        <td>21</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                    </tr>
                    <tr>
                        <td>Dotations aux amortissements</td>
                        <td>22</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                        <td class='amount'>[À COMPLÉTER]</td>
                    </tr>
                    <tr>
                        <td><strong>TOTAL CHARGES D'EXPLOITATION</strong></td>
                        <td></td>
                        <td class='amount total'>[À COMPLÉTER]</td>
                        <td class='amount total'>[À COMPLÉTER]</td>
                    </tr>
                    
                    <tr>
                        <td><strong>RÉSULTAT D'EXPLOITATION</strong></td>
                        <td></td>
                        <td class='amount result'>[À COMPLÉTER]</td>
                        <td class='amount result'>[À COMPLÉTER]</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class='section'>
            <h2>III. NOTES ANNEXES</h2>
            <p>Conformément aux dispositions de la Directive UEMOA n°09/2009/CM relative au droit comptable des entreprises, les notes annexes suivantes complètent et commentent l'information donnée par le bilan et le compte de résultat.</p>
            
            <h3>Note 1 : Activité de l'entreprise</h3>
            <p><strong>{$data['entity']['name']}</strong> est une {$data['entity']['type']} créée le {$data['entity']['establishment_date']} et opérant dans le secteur {$data['entity']['sector']}.</p>
            <p>L'entreprise est sous la tutelle technique du {$data['entity']['technical_ministry']} et la tutelle financière du {$data['entity']['financial_ministry']}.</p>
            
            <h3>Note 2 : Méthodes comptables</h3>
            <p>Les comptes sont établis conformément au Système Comptable Ouest Africain (SYSCOHADA) et aux directives UEMOA applicables aux entreprises publiques.</p>
            
            <!-- Notes supplémentaires à compléter selon le contexte -->
        </div>

        <div class='signatures'>
            <div class='signature-block'>
                <p><strong>Le Directeur Général</strong></p>
                <p>{$data['entity']['director_general']}</p>
                <div class='signature-space'></div>
            </div>
            
            <div class='signature-block'>
                <p><strong>Le Président du Conseil d'Administration</strong></p>
                <p>{$data['entity']['board_president']}</p>
                <div class='signature-space'></div>
            </div>
        </div>

        <style>
            .document-header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .subsection { margin-bottom: 20px; }
            .financial-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .financial-table th, .financial-table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .financial-table th { background-color: #f0f0f0; font-weight: bold; }
            .amount { text-align: right; }
            .total { font-weight: bold; background-color: #f9f9f9; }
            .grand-total { font-weight: bold; background-color: #e0e0e0; }
            .result { font-weight: bold; background-color: #d4edda; }
            .signatures { display: flex; justify-content: space-between; margin-top: 50px; }
            .signature-block { text-align: center; width: 40%; }
            .signature-space { height: 60px; border-bottom: 1px solid #000; margin-top: 20px; }
        </style>
        ";
    }

    /**
     * Générer un PDF
     */
    private function convertToPdf($content, $templateType)
    {
        $pdf = Pdf::loadHTML($content);
        $pdf->setPaper('A4', 'portrait');
        
        return $pdf->output();
    }

    /**
     * Préparer les données d'export
     */
    private function prepareExportData($document)
    {
        return [
            'document' => $document,
            'entity' => $document->report->entity ?? null,
            'ministry_technical' => $document->report->entity?->technicalMinistry ?? null,
            'ministry_financial' => $document->report->entity?->financialMinistry ?? null,
            'metadata' => $document->metadata ?? [],
            'export_timestamp' => now()->format('d/m/Y H:i:s'),
            'export_user' => auth()->user()->name ?? 'Système',
        ];
    }

    /**
     * Générer un téléchargement PDF
     */
    private function generatePdfDownload($document, $data)
    {
        $filename = $this->generateFilename($document, 'pdf');
        
        $pdf = Pdf::loadView('document-exports.pdf-template', $data);
        $pdf->setPaper('A4', 'portrait');
        
        return $pdf->download($filename);
    }

    /**
     * Obtenir le titre du template
     */
    private function getTemplateTitle($templateType, $entity)
    {
        $baseTitle = self::TEMPLATE_TYPES[$templateType] ?? 'Document';
        return "{$baseTitle} - {$entity->name} - " . now()->year;
    }

    /**
     * Obtenir la date limite de soumission
     */
    private function getSubmissionDeadline($category)
    {
        $deadlines = [
            'sessions_budgetaires' => '31 octobre',
            'arret_comptes' => '31 mars de l\'année suivante',
            'assemblees_generales' => '30 juin de l\'année suivante',
            'comptabilite_matieres' => '31 décembre',
        ];

        return $deadlines[$category] ?? '30 jours après la fin de période';
    }

    /**
     * Générer un nom de fichier
     */
    private function generateFilename($document, $extension)
    {
        $entityName = $document->report->entity?->name ?? 'Document';
        $cleanName = preg_replace('/[^A-Za-z0-9\-_]/', '_', $entityName);
        $timestamp = now()->format('Y-m-d');
        
        return "{$cleanName}_{$document->title}_{$timestamp}.{$extension}";
    }

    /**
     * Template générique en cas de template spécifique manquant
     */
    private function generateGenericTemplate($templateType, $data)
    {
        $templateName = self::TEMPLATE_TYPES[$templateType] ?? $templateType;
        
        return "
        <div class='document-header'>
            <h1>{$templateName}</h1>
            <h2>{$data['entity']['name'] ?? '[ENTITÉ]'}</h2>
            <h3>Exercice {$data['current_period']['year'] ?? '[ANNÉE]'}</h3>
        </div>

        <div class='section'>
            <h2>Document généré automatiquement</h2>
            <p>Ce template générique doit être personnalisé selon les besoins spécifiques de votre entité et les exigences réglementaires UEMOA.</p>
            
            <h3>Informations de l'entité :</h3>
            <ul>
                <li><strong>Nom :</strong> {$data['entity']['name'] ?? '[À COMPLÉTER]'}</li>
                <li><strong>Type :</strong> {$data['entity']['type'] ?? '[À COMPLÉTER]'}</li>
                <li><strong>Secteur :</strong> {$data['entity']['sector'] ?? '[À COMPLÉTER]'}</li>
                <li><strong>Directeur Général :</strong> {$data['entity']['director_general'] ?? '[À COMPLÉTER]'}</li>
            </ul>
            
            <h3>Contenu à développer :</h3>
            <p>[CONTENU SPÉCIFIQUE À {$templateName} À COMPLÉTER]</p>
        </div>

        <div class='footer'>
            <p>Document conforme aux directives UEMOA</p>
            <p>Généré le {$data['generation_info']['generated_at'] ?? now()->format('d/m/Y H:i:s')}</p>
        </div>

        <style>
            .document-header { text-align: center; margin-bottom: 30px; }
            .section { margin-bottom: 30px; }
            .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #666; }
        </style>
        ";
    }

    /**
     * Autres méthodes de génération de templates spécifiques...
     */
    private function generateRapportActivitesTemplate($data)
    {
        // Template pour rapport d'activités détaillé
        return $this->generateGenericTemplate('rapport_activites', $data);
    }

    private function generatePlanMarchesTemplate($data)
    {
        // Template pour plan de passation des marchés
        return $this->generateGenericTemplate('plan_marches', $data);
    }

    // ... Autres méthodes de templates
}