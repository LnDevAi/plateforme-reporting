<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseModule;
use App\Models\Lesson;
use App\Models\CourseEnrollment;
use App\Models\LearningProgress;
use App\Models\CourseCertificate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Http\Middleware\CheckSubscription;

class ELearningController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:sanctum');
        $this->middleware([CheckSubscription::class . ':elearning_access,access'])->except(['index']);
    }

    /**
     * Liste des cours disponibles
     */
    public function index(Request $request): JsonResponse
    {
        $user = Auth::user();
        
        $query = Course::with(['modules.lessons'])
            ->where('status', 'published')
            ->forCountry($user->country_id)
            ->forSubscriptionPlan($user->currentSubscription?->subscriptionPlan);

        // Filtres
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('level')) {
            $query->where('level', $request->level);
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('description', 'like', '%' . $request->search . '%')
                  ->orWhereJsonContains('tags', $request->search);
            });
        }

        $courses = $query->paginate(12);

        // Enrichir avec les informations d'inscription
        $courses->getCollection()->transform(function ($course) use ($user) {
            $enrollment = $course->enrollments()->where('user_id', $user->id)->first();
            
            $course->is_enrolled = $enrollment ? true : false;
            $course->enrollment_status = $enrollment?->status;
            $course->progress_percentage = $enrollment ? $enrollment->calculateProgress() : 0;
            $course->can_access = $course->canBeAccessedBy($user);
            
            return $course;
        });

        return response()->json([
            'success' => true,
            'courses' => $courses,
            'categories' => Course::CATEGORIES,
            'levels' => Course::LEVELS
        ]);
    }

    /**
     * Détails d'un cours spécifique
     */
    public function show(Course $course): JsonResponse
    {
        $user = Auth::user();

        if (!$course->canBeAccessedBy($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé à ce cours. Veuillez upgrader votre abonnement.'
            ], 403);
        }

        $course->load(['modules.lessons', 'reviews.user']);
        
        $enrollment = $course->enrollments()->where('user_id', $user->id)->first();
        
        $courseData = [
            'course' => $course,
            'is_enrolled' => $enrollment ? true : false,
            'enrollment' => $enrollment,
            'progress_percentage' => $enrollment ? $enrollment->calculateProgress() : 0,
            'certificate' => $enrollment && $enrollment->status === 'completed' 
                ? $course->certificates()->where('user_id', $user->id)->first() 
                : null,
            'can_enroll' => !$enrollment && $course->canBeAccessedBy($user),
            'recommended_courses' => $course->getRecommendedCourses($user, 3)
        ];

        return response()->json([
            'success' => true,
            'data' => $courseData
        ]);
    }

    /**
     * S'inscrire à un cours
     */
    public function enroll(Course $course): JsonResponse
    {
        $user = Auth::user();

        if (!$course->canBeAccessedBy($user)) {
            return response()->json([
                'success' => false,
                'message' => 'Votre plan d\'abonnement ne permet pas l\'accès à ce cours.'
            ], 403);
        }

        $existingEnrollment = $course->enrollments()->where('user_id', $user->id)->first();
        
        if ($existingEnrollment) {
            return response()->json([
                'success' => false,
                'message' => 'Vous êtes déjà inscrit à ce cours.'
            ], 400);
        }

        try {
            DB::beginTransaction();

            $enrollment = CourseEnrollment::create([
                'course_id' => $course->id,
                'user_id' => $user->id,
                'enrolled_at' => now(),
                'status' => 'active',
                'progress_percentage' => 0
            ]);

            $enrollment->start();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Inscription réussie ! Vous pouvez maintenant commencer le cours.',
                'enrollment' => $enrollment->load('course')
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'inscription au cours.'
            ], 500);
        }
    }

    /**
     * Démarrer ou reprendre un cours
     */
    public function startCourse(Course $course): JsonResponse
    {
        $user = Auth::user();
        
        $enrollment = $course->enrollments()->where('user_id', $user->id)->first();
        
        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'Vous devez d\'abord vous inscrire à ce cours.'
            ], 400);
        }

        // Charger le cours avec ses modules et leçons
        $course->load(['modules.lessons' => function ($query) {
            $query->orderBy('sort_order');
        }]);

        // Déterminer la prochaine leçon
        $nextLesson = $this->getNextLesson($enrollment);
        
        return response()->json([
            'success' => true,
            'course' => $course,
            'enrollment' => $enrollment,
            'next_lesson' => $nextLesson,
            'progress' => $enrollment->getProgressStatistics()
        ]);
    }

    /**
     * Obtenir une leçon spécifique
     */
    public function getLesson(Course $course, CourseModule $module, Lesson $lesson): JsonResponse
    {
        $user = Auth::user();
        
        $enrollment = $course->enrollments()->where('user_id', $user->id)->first();
        
        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'Vous devez être inscrit à ce cours pour accéder aux leçons.'
            ], 403);
        }

        // Vérifier que la leçon appartient au bon module et cours
        if ($lesson->course_module_id !== $module->id || $module->course_id !== $course->id) {
            return response()->json([
                'success' => false,
                'message' => 'Leçon non trouvée.'
            ], 404);
        }

        // Charger les informations de progression
        $progress = LearningProgress::where('course_enrollment_id', $enrollment->id)
            ->where('lesson_id', $lesson->id)
            ->first();

        $lessonData = [
            'lesson' => $lesson,
            'module' => $module,
            'course' => $course,
            'progress' => $progress,
            'is_completed' => $progress && $progress->status === 'completed',
            'time_spent' => $progress?->time_spent_minutes ?? 0,
            'score' => $progress?->score,
            'attempts' => $progress?->attempts ?? 0
        ];

        return response()->json([
            'success' => true,
            'data' => $lessonData
        ]);
    }

    /**
     * Marquer une leçon comme terminée
     */
    public function completeLesson(Request $request, Course $course, CourseModule $module, Lesson $lesson): JsonResponse
    {
        $user = Auth::user();
        
        $enrollment = $course->enrollments()->where('user_id', $user->id)->first();
        
        if (!$enrollment) {
            return response()->json([
                'success' => false,
                'message' => 'Inscription au cours requise.'
            ], 403);
        }

        $request->validate([
            'time_spent' => 'integer|min:1',
            'score' => 'nullable|numeric|min:0|max:100',
            'answers' => 'nullable|array'
        ]);

        try {
            DB::beginTransaction();

            $progress = LearningProgress::updateOrCreate(
                [
                    'course_enrollment_id' => $enrollment->id,
                    'lesson_id' => $lesson->id
                ],
                [
                    'completed_at' => now(),
                    'status' => 'completed',
                    'time_spent_minutes' => $request->time_spent ?? $lesson->duration_minutes,
                    'score' => $request->score,
                    'attempts' => DB::raw('attempts + 1'),
                    'answers' => $request->answers
                ]
            );

            // Mettre à jour la progression globale
            $enrollment->updateProgress();

            // Vérifier si le cours est terminé
            if ($enrollment->calculateProgress() >= 100) {
                $enrollment->complete();
                
                // Générer le certificat si éligible
                if ($course->canIssueCertificateFor($user)) {
                    $certificate = $enrollment->generateCertificate();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Leçon terminée avec succès !',
                'progress' => $progress,
                'enrollment_progress' => $enrollment->fresh()->calculateProgress(),
                'course_completed' => $enrollment->status === 'completed',
                'certificate' => $certificate ?? null
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation de la leçon.'
            ], 500);
        }
    }

    /**
     * Tableau de bord des formations
     */
    public function dashboard(): JsonResponse
    {
        $user = Auth::user();
        
        $enrollments = CourseEnrollment::where('user_id', $user->id)
            ->with(['course.modules.lessons'])
            ->get();

        $stats = [
            'total_enrolled' => $enrollments->count(),
            'completed' => $enrollments->where('status', 'completed')->count(),
            'in_progress' => $enrollments->where('status', 'active')->count(),
            'total_hours' => $enrollments->sum(function ($enrollment) {
                return $enrollment->course->duration_hours;
            }),
            'certificates_earned' => CourseCertificate::where('user_id', $user->id)
                ->where('status', 'valid')->count()
        ];

        $recentActivity = $enrollments->sortByDesc('updated_at')->take(5)->map(function ($enrollment) {
            return [
                'course' => $enrollment->course->title,
                'progress' => $enrollment->calculateProgress(),
                'last_activity' => $enrollment->updated_at,
                'status' => $enrollment->status
            ];
        });

        $availableCourses = Course::published()
            ->forCountry($user->country_id)
            ->forSubscriptionPlan($user->currentSubscription?->subscriptionPlan)
            ->whereNotIn('id', $enrollments->pluck('course_id'))
            ->take(4)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'recent_activity' => $recentActivity,
                'available_courses' => $availableCourses,
                'enrollments' => $enrollments
            ]
        ]);
    }

    /**
     * Obtenir les certificats de l'utilisateur
     */
    public function certificates(): JsonResponse
    {
        $user = Auth::user();
        
        $certificates = CourseCertificate::where('user_id', $user->id)
            ->with(['course', 'enrollment'])
            ->orderBy('issued_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'certificates' => $certificates
        ]);
    }

    /**
     * Télécharger un certificat
     */
    public function downloadCertificate(CourseCertificate $certificate): JsonResponse
    {
        $user = Auth::user();
        
        if ($certificate->user_id !== $user->id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès non autorisé.'
            ], 403);
        }

        if ($certificate->status !== 'valid') {
            return response()->json([
                'success' => false,
                'message' => 'Ce certificat n\'est plus valide.'
            ], 400);
        }

        try {
            $pdfPath = $certificate->generatePDF();
            
            return response()->json([
                'success' => true,
                'download_url' => $pdfPath,
                'certificate' => $certificate
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la génération du certificat.'
            ], 500);
        }
    }

    /**
     * Obtenir la prochaine leçon pour un étudiant
     */
    private function getNextLesson(CourseEnrollment $enrollment): ?Lesson
    {
        $course = $enrollment->course()->with(['modules.lessons'])->first();
        
        foreach ($course->modules as $module) {
            foreach ($module->lessons as $lesson) {
                $progress = LearningProgress::where('course_enrollment_id', $enrollment->id)
                    ->where('lesson_id', $lesson->id)
                    ->first();
                    
                if (!$progress || $progress->status !== 'completed') {
                    return $lesson;
                }
            }
        }
        
        return null; // Toutes les leçons sont terminées
    }
}