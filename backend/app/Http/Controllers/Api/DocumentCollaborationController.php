<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DocumentVersion;
use App\Models\DocumentComment;
use App\Models\DocumentChange;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DocumentCollaborationController extends Controller
{
    /**
     * Obtenir la version actuelle d'un document
     */
    public function getCurrentVersion($reportId): JsonResponse
    {
        $version = DocumentVersion::where('report_id', $reportId)
                                 ->current()
                                 ->with(['creator', 'updater', 'approver', 'lockUser', 'collaborators'])
                                 ->first();

        if (!$version) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune version trouvée pour ce rapport',
            ], 404);
        }

        // Vérifier les permissions
        if (!$this->canViewDocument($version, Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé à ce document',
            ], 403);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'version' => $version,
                'can_edit' => $version->canEdit(Auth::id()),
                'is_locked' => $version->isLocked(),
                'lock_user' => $version->lockUser,
                'collaboration_metrics' => $version->getCollaborationMetrics(),
            ],
        ]);
    }

    /**
     * Obtenir l'historique des versions
     */
    public function getVersionHistory($reportId): JsonResponse
    {
        $versions = DocumentVersion::where('report_id', $reportId)
                                  ->with(['creator', 'approver'])
                                  ->orderBy('created_at', 'desc')
                                  ->get();

        return response()->json([
            'success' => true,
            'data' => $versions,
        ]);
    }

    /**
     * Créer une nouvelle version
     */
    public function createVersion(Request $request, $reportId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'content' => 'required|string',
            'content_type' => 'nullable|string|in:html,markdown,text',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $currentVersion = DocumentVersion::where('report_id', $reportId)
                                        ->current()
                                        ->first();

        if (!$currentVersion) {
            // Créer la première version
            $version = DocumentVersion::create([
                'report_id' => $reportId,
                'version_number' => '1.0',
                'title' => $request->title,
                'description' => $request->description,
                'content' => $request->content,
                'content_type' => $request->content_type ?? 'html',
                'status' => 'draft',
                'created_by' => Auth::id(),
                'updated_by' => Auth::id(),
                'is_current' => true,
            ]);
        } else {
            // Vérifier les permissions
            if (!$currentVersion->canEdit(Auth::id())) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vous n\'avez pas la permission de modifier ce document',
                ], 403);
            }

            $version = $currentVersion->createNewVersion($request->all(), Auth::id());
        }

        $version->load(['creator', 'collaborators']);

        return response()->json([
            'success' => true,
            'message' => 'Nouvelle version créée avec succès',
            'data' => $version,
        ], 201);
    }

    /**
     * Mettre à jour le contenu d'une version
     */
    public function updateContent(Request $request, $versionId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
            'auto_save' => 'boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $version = DocumentVersion::findOrFail($versionId);

        // Vérifier les permissions
        if (!$version->canEdit(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission de modifier ce document',
            ], 403);
        }

        // Verrouiller le document si ce n'est pas un auto-save
        if (!$request->boolean('auto_save')) {
            $version->lock(Auth::id(), 30);
        }

        $oldContent = $version->content;
        
        $version->update([
            'content' => $request->content,
            'updated_by' => Auth::id(),
        ]);

        // Enregistrer le changement
        DocumentChange::createContentChange(
            $version->id,
            Auth::id(),
            $oldContent,
            $request->content,
            $request->boolean('auto_save') ? 'Sauvegarde automatique' : 'Contenu mis à jour'
        );

        return response()->json([
            'success' => true,
            'message' => 'Contenu mis à jour avec succès',
            'data' => [
                'version' => $version->fresh(),
                'is_locked' => $version->isLocked(),
            ],
        ]);
    }

    /**
     * Verrouiller un document
     */
    public function lockDocument(Request $request, $versionId): JsonResponse
    {
        $version = DocumentVersion::findOrFail($versionId);

        if (!$version->canEdit(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission de verrouiller ce document',
            ], 403);
        }

        if ($version->isLocked() && $version->lock_user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Le document est déjà verrouillé par un autre utilisateur',
                'data' => [
                    'locked_by' => $version->lockUser->name,
                    'locked_until' => $version->lock_expires_at,
                ],
            ], 409);
        }

        $duration = $request->get('duration', 30);
        $version->lock(Auth::id(), $duration);

        // Enregistrer le changement
        DocumentChange::create([
            'document_version_id' => $version->id,
            'user_id' => Auth::id(),
            'change_type' => 'locked',
            'description' => "Document verrouillé pour {$duration} minutes",
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document verrouillé avec succès',
            'data' => [
                'locked_until' => $version->lock_expires_at,
            ],
        ]);
    }

    /**
     * Déverrouiller un document
     */
    public function unlockDocument($versionId): JsonResponse
    {
        $version = DocumentVersion::findOrFail($versionId);

        if (!$version->isLocked()) {
            return response()->json([
                'success' => false,
                'message' => 'Le document n\'est pas verrouillé',
            ], 400);
        }

        // Seul le propriétaire du verrou ou un admin peut déverrouiller
        if ($version->lock_user_id !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous ne pouvez pas déverrouiller ce document',
            ], 403);
        }

        $version->unlock();

        // Enregistrer le changement
        DocumentChange::create([
            'document_version_id' => $version->id,
            'user_id' => Auth::id(),
            'change_type' => 'unlocked',
            'description' => 'Document déverrouillé',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Document déverrouillé avec succès',
        ]);
    }

    /**
     * Ajouter un collaborateur
     */
    public function addCollaborator(Request $request, $versionId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'required|exists:users,id',
            'permission_level' => 'required|in:view,comment,edit,admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $version = DocumentVersion::findOrFail($versionId);

        // Vérifier les permissions (seul le créateur ou admin peut ajouter des collaborateurs)
        if ($version->created_by !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission d\'ajouter des collaborateurs',
            ], 403);
        }

        // Vérifier si l'utilisateur est déjà collaborateur
        $existingCollaborator = $version->collaborators()
                                      ->where('user_id', $request->user_id)
                                      ->exists();

        if ($existingCollaborator) {
            return response()->json([
                'success' => false,
                'message' => 'Cet utilisateur est déjà collaborateur',
            ], 409);
        }

        $version->collaborators()->attach($request->user_id, [
            'permission_level' => $request->permission_level,
            'invited_by' => Auth::id(),
            'invited_at' => now(),
        ]);

        $user = User::find($request->user_id);

        // Enregistrer le changement
        DocumentChange::createCollaborationChange(
            $version->id,
            Auth::id(),
            'collaborator_added',
            "Collaborateur ajouté: {$user->name} ({$request->permission_level})",
            ['user_id' => $request->user_id, 'permission_level' => $request->permission_level]
        );

        return response()->json([
            'success' => true,
            'message' => 'Collaborateur ajouté avec succès',
            'data' => [
                'collaborator' => $user,
                'permission_level' => $request->permission_level,
            ],
        ]);
    }

    /**
     * Modifier les permissions d'un collaborateur
     */
    public function updateCollaboratorPermissions(Request $request, $versionId, $userId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'permission_level' => 'required|in:view,comment,edit,admin',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $version = DocumentVersion::findOrFail($versionId);

        if ($version->created_by !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission de modifier les permissions',
            ], 403);
        }

        $collaborator = $version->collaborators()->where('user_id', $userId)->first();
        
        if (!$collaborator) {
            return response()->json([
                'success' => false,
                'message' => 'Collaborateur non trouvé',
            ], 404);
        }

        $oldPermission = $collaborator->pivot->permission_level;
        
        $version->collaborators()->updateExistingPivot($userId, [
            'permission_level' => $request->permission_level,
        ]);

        // Enregistrer le changement
        DocumentChange::createCollaborationChange(
            $version->id,
            Auth::id(),
            'permission_changed',
            "Permissions modifiées pour {$collaborator->name}: {$oldPermission} → {$request->permission_level}",
            ['user_id' => $userId, 'old_permission' => $oldPermission, 'new_permission' => $request->permission_level]
        );

        return response()->json([
            'success' => true,
            'message' => 'Permissions mises à jour avec succès',
        ]);
    }

    /**
     * Supprimer un collaborateur
     */
    public function removeCollaborator($versionId, $userId): JsonResponse
    {
        $version = DocumentVersion::findOrFail($versionId);

        if ($version->created_by !== Auth::id() && !Auth::user()->isAdmin()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission de supprimer des collaborateurs',
            ], 403);
        }

        $collaborator = $version->collaborators()->where('user_id', $userId)->first();
        
        if (!$collaborator) {
            return response()->json([
                'success' => false,
                'message' => 'Collaborateur non trouvé',
            ], 404);
        }

        $version->collaborators()->detach($userId);

        // Enregistrer le changement
        DocumentChange::createCollaborationChange(
            $version->id,
            Auth::id(),
            'collaborator_removed',
            "Collaborateur supprimé: {$collaborator->name}",
            ['user_id' => $userId]
        );

        return response()->json([
            'success' => true,
            'message' => 'Collaborateur supprimé avec succès',
        ]);
    }

    /**
     * Ajouter un commentaire
     */
    public function addComment(Request $request, $versionId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'content' => 'required|string',
            'parent_id' => 'nullable|exists:document_comments,id',
            'selection_start' => 'nullable|integer|min:0',
            'selection_end' => 'nullable|integer|min:0',
            'selection_text' => 'nullable|string',
            'comment_type' => 'nullable|in:general,suggestion,correction,question',
            'priority' => 'nullable|in:low,normal,high',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Erreurs de validation',
                'errors' => $validator->errors(),
            ], 422);
        }

        $version = DocumentVersion::findOrFail($versionId);

        // Vérifier les permissions (au moins voir)
        if (!$this->canViewDocument($version, Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission de commenter ce document',
            ], 403);
        }

        $comment = $version->comments()->create([
            'user_id' => Auth::id(),
            'parent_id' => $request->parent_id,
            'content' => $request->content,
            'selection_start' => $request->selection_start,
            'selection_end' => $request->selection_end,
            'selection_text' => $request->selection_text,
            'comment_type' => $request->comment_type ?? 'general',
            'priority' => $request->priority ?? 'normal',
        ]);

        // Enregistrer le changement
        DocumentChange::create([
            'document_version_id' => $version->id,
            'user_id' => Auth::id(),
            'change_type' => 'comment_added',
            'description' => 'Commentaire ajouté',
            'metadata' => ['comment_id' => $comment->id],
        ]);

        $comment->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Commentaire ajouté avec succès',
            'data' => $comment,
        ], 201);
    }

    /**
     * Obtenir les commentaires d'une version
     */
    public function getComments($versionId): JsonResponse
    {
        $version = DocumentVersion::findOrFail($versionId);

        if (!$this->canViewDocument($version, Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé',
            ], 403);
        }

        $comments = $version->comments()
                          ->main()
                          ->with(['user', 'replies.user', 'resolver'])
                          ->orderBy('created_at', 'desc')
                          ->get();

        return response()->json([
            'success' => true,
            'data' => $comments,
        ]);
    }

    /**
     * Résoudre un commentaire
     */
    public function resolveComment(Request $request, $commentId): JsonResponse
    {
        $comment = DocumentComment::findOrFail($commentId);
        $version = $comment->documentVersion;

        if (!$version->canEdit(Auth::id()) && $comment->user_id !== Auth::id()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission de résoudre ce commentaire',
            ], 403);
        }

        $comment->resolve(Auth::id(), $request->get('note'));

        // Enregistrer le changement
        DocumentChange::create([
            'document_version_id' => $version->id,
            'user_id' => Auth::id(),
            'change_type' => 'comment_resolved',
            'description' => 'Commentaire résolu',
            'metadata' => ['comment_id' => $comment->id],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Commentaire résolu avec succès',
        ]);
    }

    /**
     * Soumettre pour approbation
     */
    public function submitForApproval($versionId): JsonResponse
    {
        $version = DocumentVersion::findOrFail($versionId);

        if (!$version->canEdit(Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission de soumettre ce document',
            ], 403);
        }

        if ($version->status !== 'draft') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les brouillons peuvent être soumis pour approbation',
            ], 400);
        }

        $version->submitForApproval(Auth::id());

        return response()->json([
            'success' => true,
            'message' => 'Document soumis pour approbation avec succès',
        ]);
    }

    /**
     * Approuver un document
     */
    public function approveDocument(Request $request, $versionId): JsonResponse
    {
        if (!Auth::user()->isAdmin() && !Auth::user()->isManager()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission d\'approuver des documents',
            ], 403);
        }

        $version = DocumentVersion::findOrFail($versionId);

        if ($version->status !== 'pending_approval') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les documents en attente peuvent être approuvés',
            ], 400);
        }

        $version->approve(Auth::id(), $request->get('comment'));

        return response()->json([
            'success' => true,
            'message' => 'Document approuvé avec succès',
        ]);
    }

    /**
     * Rejeter un document
     */
    public function rejectDocument(Request $request, $versionId): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'reason' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'La raison du rejet est obligatoire',
                'errors' => $validator->errors(),
            ], 422);
        }

        if (!Auth::user()->isAdmin() && !Auth::user()->isManager()) {
            return response()->json([
                'success' => false,
                'message' => 'Vous n\'avez pas la permission de rejeter des documents',
            ], 403);
        }

        $version = DocumentVersion::findOrFail($versionId);

        if ($version->status !== 'pending_approval') {
            return response()->json([
                'success' => false,
                'message' => 'Seuls les documents en attente peuvent être rejetés',
            ], 400);
        }

        $version->reject(Auth::id(), $request->reason);

        return response()->json([
            'success' => true,
            'message' => 'Document rejeté avec succès',
        ]);
    }

    /**
     * Obtenir l'historique des changements
     */
    public function getChangeHistory($versionId): JsonResponse
    {
        $version = DocumentVersion::findOrFail($versionId);

        if (!$this->canViewDocument($version, Auth::id())) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé',
            ], 403);
        }

        $changes = $version->getChangeHistory();

        return response()->json([
            'success' => true,
            'data' => $changes,
        ]);
    }

    /**
     * Vérifier si l'utilisateur peut voir le document
     */
    private function canViewDocument($version, $userId)
    {
        // Le créateur peut toujours voir
        if ($version->created_by === $userId) {
            return true;
        }

        // Les admins peuvent tout voir
        if (Auth::user()->isAdmin()) {
            return true;
        }

        // Vérifier les collaborateurs
        return $version->collaborators()->where('user_id', $userId)->exists();
    }
}