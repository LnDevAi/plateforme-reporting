<?php

namespace App\Http\Controllers;

use App\Services\DocumentTemplateService;
use App\Models\StateEntity;
use App\Models\Report;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Exception;

class DocumentTemplateController extends Controller
{
    protected $templateService;

    public function __construct(DocumentTemplateService $templateService)
    {
        $this->templateService = $templateService;
    }

    /**
     * Obtenir la liste des templates disponibles
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $entityType = $request->get('entity_type');
            $category = $request->get('category');

            if ($category) {
                $templates = $this->templateService->getTemplatesByCategory();
                $filteredTemplates = $templates[$category] ?? [];
            } else {
                $filteredTemplates = $this->templateService->getAvailableTemplates($entityType);
            }

            return response()->json([
                'success' => true,
                'data' => $filteredTemplates,
                'categories' => $this->templateService->getTemplatesByCategory(),
                'message' => 'Templates récupérés avec succès'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les détails d'un template spécifique
     */
    public function show(string $templateKey): JsonResponse
    {
        try {
            $templates = $this->templateService->getAvailableTemplates();
            $template = $templates[$templateKey] ?? null;

            if (!$template) {
                return response()->json([
                    'success' => false,
                    'message' => 'Template non trouvé'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $template,
                'message' => 'Détails du template récupérés avec succès'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération du template',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer un document à partir d'un template
     */
    public function generate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_key' => 'required|string',
                'format' => 'required|in:pdf,docx,excel,html',
                'entity_id' => 'nullable|exists:state_entities,id',
                'exercice' => 'nullable|integer|min:2020|max:2030',
                'data' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $templateKey = $request->input('template_key');
            $format = $request->input('format');
            $data = $request->input('data', []);

            // Ajouter les données contextuelles
            if ($request->filled('entity_id')) {
                $data['entity_id'] = $request->input('entity_id');
            }

            if ($request->filled('exercice')) {
                $data['exercice'] = $request->input('exercice');
            }

            // Valider les données du template
            $validation = $this->templateService->validateTemplateData($templateKey, $data);
            if (!$validation['valid']) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données insuffisantes pour générer le document',
                    'errors' => $validation['errors']
                ], 422);
            }

            // Générer le document
            $filePath = $this->templateService->generateDocument($templateKey, $data, $format);

            return response()->json([
                'success' => true,
                'data' => [
                    'file_path' => $filePath,
                    'download_url' => route('documents.download', ['path' => $filePath]),
                    'template' => $validation['template'],
                    'format' => $format,
                ],
                'message' => 'Document généré avec succès'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Télécharger un document généré
     */
    public function download(Request $request): mixed
    {
        try {
            $path = $request->input('path');
            
            if (!$path || !Storage::exists($path)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier non trouvé'
                ], 404);
            }

            $filename = basename($path);
            $mimeType = $this->getMimeType($path);

            return Storage::download($path, $filename, [
                'Content-Type' => $mimeType,
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du téléchargement',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer un aperçu du document (HTML)
     */
    public function preview(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_key' => 'required|string',
                'entity_id' => 'nullable|exists:state_entities,id',
                'exercice' => 'nullable|integer|min:2020|max:2030',
                'data' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $templateKey = $request->input('template_key');
            $data = $request->input('data', []);

            // Ajouter les données contextuelles
            if ($request->filled('entity_id')) {
                $data['entity_id'] = $request->input('entity_id');
            }

            if ($request->filled('exercice')) {
                $data['exercice'] = $request->input('exercice');
            }

            // Générer l'aperçu HTML
            $htmlPath = $this->templateService->generateDocument($templateKey, $data, 'html');
            $htmlContent = Storage::get($htmlPath);

            return response()->json([
                'success' => true,
                'data' => [
                    'html_content' => $htmlContent,
                    'template_key' => $templateKey,
                ],
                'message' => 'Aperçu généré avec succès'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération de l\'aperçu',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les templates par catégorie
     */
    public function categories(): JsonResponse
    {
        try {
            $categories = $this->templateService->getTemplatesByCategory();

            return response()->json([
                'success' => true,
                'data' => $categories,
                'message' => 'Catégories récupérées avec succès'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des catégories',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les templates compatibles avec une entité
     */
    public function forEntity(StateEntity $entity): JsonResponse
    {
        try {
            $templates = $this->templateService->getAvailableTemplates($entity->type);

            // Enrichir avec les informations de l'entité
            $entityInfo = [
                'id' => $entity->id,
                'name' => $entity->name,
                'code' => $entity->code,
                'type' => $entity->type,
                'type_label' => $entity->getTypeLabel(),
                'sector' => $entity->sector,
                'requirements' => $entity->getStructureSpecificRequirements(),
                'required_sessions' => $entity->getRequiredSessionTypes(),
            ];

            return response()->json([
                'success' => true,
                'data' => [
                    'entity' => $entityInfo,
                    'templates' => $templates,
                    'categories' => $this->templateService->getTemplatesByCategory(),
                ],
                'message' => 'Templates pour l\'entité récupérés avec succès'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des templates',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer un document personnalisé avec contenu libre
     */
    public function generateCustom(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'content' => 'required|string',
                'format' => 'required|in:pdf,docx,html',
                'entity_id' => 'nullable|exists:state_entities,id',
                'exercice' => 'nullable|integer|min:2020|max:2030',
                'category' => 'nullable|string',
                'compliance' => 'nullable|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Préparer les données pour le template générique
            $data = [
                'content' => $request->input('content'),
            ];

            if ($request->filled('entity_id')) {
                $data['entity_id'] = $request->input('entity_id');
            }

            if ($request->filled('exercice')) {
                $data['exercice'] = $request->input('exercice');
            }

            // Configuration du template personnalisé
            $customTemplate = [
                'name' => $request->input('title'),
                'category' => $request->input('category', 'Document personnalisé'),
                'type' => 'all',
                'format' => [$request->input('format')],
                'template' => 'generic-epe-template',
                'compliance' => $request->input('compliance', ['SYSCOHADA', 'UEMOA']),
            ];

            $data['template_config'] = $customTemplate;

            // Utiliser le template générique
            $filePath = $this->templateService->generateDocument('generic', $data, $request->input('format'));

            return response()->json([
                'success' => true,
                'data' => [
                    'file_path' => $filePath,
                    'download_url' => route('documents.download', ['path' => $filePath]),
                    'template' => $customTemplate,
                    'format' => $request->input('format'),
                ],
                'message' => 'Document personnalisé généré avec succès'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du document personnalisé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir les statistiques d'utilisation des templates
     */
    public function statistics(): JsonResponse
    {
        try {
            // Simuler des statistiques (à implémenter avec une vraie base de données)
            $stats = [
                'total_templates' => count($this->templateService->getAvailableTemplates()),
                'categories_count' => count($this->templateService->getTemplatesByCategory()),
                'most_used' => [
                    'budget_annuel_societe_etat',
                    'etats_financiers_syscohada',
                    'plan_passation_marches',
                ],
                'usage_by_category' => [
                    'Sessions Budgétaires' => 45,
                    'Arrêt des Comptes' => 38,
                    'Assemblées Générales' => 22,
                    'Conformité UEMOA' => 15,
                    'Comptabilité des Matières' => 12,
                    'Audit et Contrôle' => 8,
                ],
                'formats_usage' => [
                    'pdf' => 65,
                    'excel' => 25,
                    'docx' => 8,
                    'html' => 2,
                ],
            ];

            return response()->json([
                'success' => true,
                'data' => $stats,
                'message' => 'Statistiques récupérées avec succès'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Valider les données pour un template
     */
    public function validate(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'template_key' => 'required|string',
                'data' => 'required|array',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Paramètres invalides',
                    'errors' => $validator->errors()
                ], 422);
            }

            $templateKey = $request->input('template_key');
            $data = $request->input('data');

            $validation = $this->templateService->validateTemplateData($templateKey, $data);

            return response()->json([
                'success' => true,
                'data' => $validation,
                'message' => $validation['valid'] ? 'Données valides' : 'Données incomplètes'
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtenir le type MIME d'un fichier
     */
    private function getMimeType(string $path): string
    {
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        
        $mimeTypes = [
            'pdf' => 'application/pdf',
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'html' => 'text/html',
        ];

        return $mimeTypes[$extension] ?? 'application/octet-stream';
    }
}