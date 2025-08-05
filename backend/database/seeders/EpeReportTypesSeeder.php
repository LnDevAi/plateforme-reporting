<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class EpeReportTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Catégories de rapports EPE
        $categories = [
            'sessions_budgetaires' => 'Sessions Budgétaires',
            'arret_comptes' => 'Arrêt des Comptes',
            'assemblees_generales' => 'Assemblées Générales',
            'conformite_uemoa' => 'Conformité UEMOA',
            'comptabilite_matieres' => 'Comptabilité des Matières',
            'audit_controle' => 'Audit et Contrôle',
        ];

        // Types de rapports par catégorie
        $reportTypes = [
            // Sessions Budgétaires
            [
                'name' => 'Projet de Budget Annuel',
                'category' => 'sessions_budgetaires',
                'description' => 'Prévisions de recettes et dépenses pour l\'exercice budgétaire',
                'template_sql' => $this->getBudgetProjectTemplate(),
                'required_params' => ['exercice', 'entite_epe'],
                'output_format' => 'excel',
                'is_regulatory' => true,
            ],
            [
                'name' => 'Plan de Passation des Marchés',
                'category' => 'sessions_budgetaires', 
                'description' => 'Plan obligatoire de passation des marchés selon la réglementation',
                'template_sql' => $this->getMarketPlanTemplate(),
                'required_params' => ['exercice', 'entite_epe', 'seuil_marche'],
                'output_format' => 'pdf',
                'is_regulatory' => true,
            ],
            [
                'name' => 'Nomenclature Budgétaire UEMOA',
                'category' => 'sessions_budgetaires',
                'description' => 'Nomenclature conforme aux directives UEMOA',
                'template_sql' => $this->getNomenclatureTemplate(),
                'required_params' => ['exercice', 'niveau_detail'],
                'output_format' => 'excel',
                'is_regulatory' => true,
            ],
            [
                'name' => 'Programme d\'Activités',
                'category' => 'sessions_budgetaires',
                'description' => 'Programmes alignés sur les missions d\'intérêt général',
                'template_sql' => $this->getActivityProgramTemplate(),
                'required_params' => ['exercice', 'secteur_activite'],
                'output_format' => 'pdf',
                'is_regulatory' => false,
            ],

            // Arrêt des Comptes
            [
                'name' => 'États Financiers Annuels',
                'category' => 'arret_comptes',
                'description' => 'Bilan, compte de résultat et annexes',
                'template_sql' => $this->getFinancialStatementsTemplate(),
                'required_params' => ['exercice', 'entite_epe'],
                'output_format' => 'pdf',
                'is_regulatory' => true,
            ],
            [
                'name' => 'Rapport d\'Activités Détaillé',
                'category' => 'arret_comptes',
                'description' => 'Exécution détaillée des missions de l\'EPE',
                'template_sql' => $this->getActivityReportTemplate(),
                'required_params' => ['exercice', 'entite_epe'],
                'output_format' => 'pdf',
                'is_regulatory' => true,
            ],
            [
                'name' => 'Compte de Gestion Agent Comptable',
                'category' => 'arret_comptes',
                'description' => 'Rapport de gestion de l\'agent comptable',
                'template_sql' => $this->getAccountingManagementTemplate(),
                'required_params' => ['exercice', 'agent_comptable'],
                'output_format' => 'excel',
                'is_regulatory' => true,
            ],
            [
                'name' => 'Inventaire Physique et Patrimoine',
                'category' => 'arret_comptes',
                'description' => 'États du patrimoine et inventaires physiques',
                'template_sql' => $this->getInventoryTemplate(),
                'required_params' => ['exercice', 'date_inventaire'],
                'output_format' => 'excel',
                'is_regulatory' => true,
            ],

            // Assemblées Générales
            [
                'name' => 'Rapport de Gestion CA (EPE)',
                'category' => 'assemblees_generales',
                'description' => 'Rapport du conseil d\'administration pour EPE',
                'template_sql' => $this->getBoardReportEpeTemplate(),
                'required_params' => ['exercice', 'entite_epe'],
                'output_format' => 'pdf',
                'is_regulatory' => true,
            ],
            [
                'name' => 'États Financiers Certifiés',
                'category' => 'assemblees_generales',
                'description' => 'États financiers certifiés par les commissaires aux comptes',
                'template_sql' => $this->getCertifiedFinancialTemplate(),
                'required_params' => ['exercice', 'commissaire_comptes'],
                'output_format' => 'pdf',
                'is_regulatory' => true,
            ],
            [
                'name' => 'Bilan Social et RH',
                'category' => 'assemblees_generales',
                'description' => 'Rapport sur les ressources humaines et bilan social',
                'template_sql' => $this->getSocialReportTemplate(),
                'required_params' => ['exercice', 'effectif_moyen'],
                'output_format' => 'excel',
                'is_regulatory' => false,
            ],
            [
                'name' => 'Comptes Sociaux (Sociétés d\'État)',
                'category' => 'assemblees_generales',
                'description' => 'Comptes sociaux annuels pour les sociétés d\'État',
                'template_sql' => $this->getSocialAccountsTemplate(),
                'required_params' => ['exercice', 'forme_juridique'],
                'output_format' => 'pdf',
                'is_regulatory' => true,
            ],

            // Conformité UEMOA Post-Réforme
            [
                'name' => 'Livre-Journal des Matières',
                'category' => 'comptabilite_matieres',
                'description' => 'Livre-journal coté et paraphé des matières',
                'template_sql' => $this->getMaterialJournalTemplate(),
                'required_params' => ['periode_debut', 'periode_fin'],
                'output_format' => 'excel',
                'is_regulatory' => true,
            ],
            [
                'name' => 'Grand Livre par Nature de Matières',
                'category' => 'comptabilite_matieres',
                'description' => 'Grand livre tenu par nature de matières',
                'template_sql' => $this->getMaterialLedgerTemplate(),
                'required_params' => ['exercice', 'nature_matiere'],
                'output_format' => 'excel',
                'is_regulatory' => true,
            ],
            [
                'name' => 'États d\'Inventaire Périodiques',
                'category' => 'comptabilite_matieres',
                'description' => 'États d\'inventaire périodiques des matières',
                'template_sql' => $this->getPeriodicInventoryTemplate(),
                'required_params' => ['periode_debut', 'periode_fin', 'type_inventaire'],
                'output_format' => 'excel',
                'is_regulatory' => true,
            ],
            [
                'name' => 'Rapport Comptable des Matières',
                'category' => 'comptabilite_matieres',
                'description' => 'Rapport du comptable des matières',
                'template_sql' => $this->getMaterialAccountantReportTemplate(),
                'required_params' => ['exercice', 'comptable_matieres'],
                'output_format' => 'pdf',
                'is_regulatory' => true,
            ],
            [
                'name' => 'États de Réforme et Mise au Rebut',
                'category' => 'comptabilite_matieres',
                'description' => 'États de réforme et mise au rebut des biens',
                'template_sql' => $this->getReformStatesTemplate(),
                'required_params' => ['exercice', 'commission_reforme'],
                'output_format' => 'pdf',
                'is_regulatory' => true,
            ],
        ];

        // Insérer les données
        foreach ($reportTypes as $type) {
            DB::table('report_types')->insert([
                'name' => $type['name'],
                'category' => $type['category'],
                'description' => $type['description'],
                'template_sql' => $type['template_sql'],
                'required_params' => json_encode($type['required_params']),
                'output_format' => $type['output_format'],
                'is_regulatory' => $type['is_regulatory'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Insérer les catégories
        foreach ($categories as $code => $label) {
            DB::table('report_categories')->insert([
                'code' => $code,
                'label' => $label,
                'description' => "Catégorie de rapports pour {$label}",
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    private function getBudgetProjectTemplate(): string
    {
        return "-- Projet de Budget Annuel EPE
        SELECT 
            bp.exercice,
            bp.entite_epe,
            bp.chapitre_budgetaire,
            bp.article_budgetaire,
            bp.libelle_article,
            bp.montant_previsionnel_recettes,
            bp.montant_previsionnel_depenses,
            bp.ecart_budgetaire,
            bp.justification_ecart,
            bp.date_creation,
            bp.statut_validation
        FROM budget_previsionnel bp 
        WHERE bp.exercice = :exercice 
        AND bp.entite_epe = :entite_epe
        ORDER BY bp.chapitre_budgetaire, bp.article_budgetaire";
    }

    private function getMarketPlanTemplate(): string
    {
        return "-- Plan de Passation des Marchés
        SELECT 
            ppm.exercice,
            ppm.entite_epe,
            ppm.type_marche,
            ppm.objet_marche,
            ppm.montant_estime,
            ppm.mode_passation,
            ppm.date_prevue_lancement,
            ppm.date_prevue_attribution,
            ppm.source_financement,
            ppm.statut_execution
        FROM plan_passation_marches ppm
        WHERE ppm.exercice = :exercice 
        AND ppm.entite_epe = :entite_epe
        AND ppm.montant_estime >= :seuil_marche
        ORDER BY ppm.date_prevue_lancement";
    }

    private function getNomenclatureTemplate(): string
    {
        return "-- Nomenclature Budgétaire UEMOA
        SELECT 
            nb.code_uemoa,
            nb.libelle_poste,
            nb.niveau_detail,
            nb.nature_operation,
            nb.classification_economique,
            nb.classification_fonctionnelle,
            nb.is_obligatoire,
            nb.commentaire_uemoa
        FROM nomenclature_budgetaire nb
        WHERE nb.exercice = :exercice
        AND nb.niveau_detail <= :niveau_detail
        ORDER BY nb.code_uemoa";
    }

    private function getActivityProgramTemplate(): string
    {
        return "-- Programme d'Activités EPE
        SELECT 
            pa.exercice,
            pa.entite_epe,
            pa.secteur_activite,
            pa.programme_principal,
            pa.sous_programme,
            pa.objectif_strategique,
            pa.indicateur_performance,
            pa.cible_annuelle,
            pa.budget_alloue,
            pa.responsable_programme
        FROM programmes_activites pa
        WHERE pa.exercice = :exercice
        AND pa.secteur_activite = :secteur_activite
        ORDER BY pa.programme_principal";
    }

    private function getFinancialStatementsTemplate(): string
    {
        return "-- États Financiers Annuels
        SELECT 
            ef.exercice,
            ef.entite_epe,
            ef.type_etat, -- Bilan, Compte de résultat, Annexes
            ef.poste_comptable,
            ef.libelle_poste,
            ef.montant_n,
            ef.montant_n_1,
            ef.variation_absolue,
            ef.variation_relative,
            ef.note_annexe
        FROM etats_financiers ef
        WHERE ef.exercice = :exercice
        AND ef.entite_epe = :entite_epe
        ORDER BY ef.type_etat, ef.poste_comptable";
    }

    private function getActivityReportTemplate(): string
    {
        return "-- Rapport d'Activités Détaillé
        SELECT 
            ra.exercice,
            ra.entite_epe,
            ra.mission_interet_general,
            ra.activite_principale,
            ra.objectif_fixe,
            ra.resultat_obtenu,
            ra.taux_realisation,
            ra.difficultes_rencontrees,
            ra.mesures_correctives,
            ra.impact_social_economique
        FROM rapports_activites ra
        WHERE ra.exercice = :exercice
        AND ra.entite_epe = :entite_epe
        ORDER BY ra.mission_interet_general";
    }

    private function getAccountingManagementTemplate(): string
    {
        return "-- Compte de Gestion Agent Comptable
        SELECT 
            cg.exercice,
            cg.agent_comptable,
            cg.type_operation,
            cg.numero_operation,
            cg.date_operation,
            cg.montant_debit,
            cg.montant_credit,
            cg.solde_cumule,
            cg.piece_justificative,
            cg.observation
        FROM comptes_gestion cg
        WHERE cg.exercice = :exercice
        AND cg.agent_comptable = :agent_comptable
        ORDER BY cg.date_operation";
    }

    private function getInventoryTemplate(): string
    {
        return "-- Inventaire Physique et Patrimoine
        SELECT 
            ip.exercice,
            ip.date_inventaire,
            ip.type_bien,
            ip.code_bien,
            ip.designation_bien,
            ip.quantite_comptable,
            ip.quantite_physique,
            ip.ecart_inventaire,
            ip.valeur_unitaire,
            ip.valeur_totale,
            ip.etat_conservation,
            ip.localisation
        FROM inventaire_patrimoine ip
        WHERE ip.exercice = :exercice
        AND ip.date_inventaire = :date_inventaire
        ORDER BY ip.type_bien, ip.code_bien";
    }

    private function getBoardReportEpeTemplate(): string
    {
        return "-- Rapport de Gestion CA (EPE)
        SELECT 
            rg.exercice,
            rg.entite_epe,
            rg.periode_gestion,
            rg.activite_realisee,
            rg.resultat_financier,
            rg.investissement_realise,
            rg.personnel_evolution,
            rg.difficulte_majeure,
            rg.recommandation_ca,
            rg.perspective_exercice_suivant
        FROM rapports_gestion_ca rg
        WHERE rg.exercice = :exercice
        AND rg.entite_epe = :entite_epe
        ORDER BY rg.periode_gestion";
    }

    private function getCertifiedFinancialTemplate(): string
    {
        return "-- États Financiers Certifiés
        SELECT 
            efc.exercice,
            efc.entite_epe,
            efc.commissaire_comptes,
            efc.type_certification,
            efc.opinion_commissaire,
            efc.reserve_emise,
            efc.recommandation,
            efc.date_certification,
            efc.numero_rapport_cac
        FROM etats_financiers_certifies efc
        WHERE efc.exercice = :exercice
        AND efc.commissaire_comptes = :commissaire_comptes
        ORDER BY efc.date_certification";
    }

    private function getSocialReportTemplate(): string
    {
        return "-- Bilan Social et RH
        SELECT 
            bs.exercice,
            bs.effectif_total,
            bs.effectif_par_categorie,
            bs.masse_salariale,
            bs.formation_dispensee,
            bs.accidents_travail,
            bs.absenteisme_taux,
            bs.turnover_taux,
            bs.promotion_interne,
            bs.recrutement_externe
        FROM bilan_social bs
        WHERE bs.exercice = :exercice
        AND bs.effectif_moyen >= :effectif_moyen
        ORDER BY bs.effectif_total DESC";
    }

    private function getSocialAccountsTemplate(): string
    {
        return "-- Comptes Sociaux (Sociétés d'État)
        SELECT 
            cs.exercice,
            cs.forme_juridique,
            cs.capital_social,
            cs.chiffre_affaires,
            cs.resultat_exploitation,
            cs.resultat_financier,
            cs.resultat_net,
            cs.dividendes_distribues,
            cs.reserves_constituees,
            cs.dette_financiere
        FROM comptes_sociaux cs
        WHERE cs.exercice = :exercice
        AND cs.forme_juridique = :forme_juridique
        ORDER BY cs.chiffre_affaires DESC";
    }

    private function getMaterialJournalTemplate(): string
    {
        return "-- Livre-Journal des Matières
        SELECT 
            ljm.numero_ordre,
            ljm.date_operation,
            ljm.nature_operation,
            ljm.code_matiere,
            ljm.designation_matiere,
            ljm.quantite_entree,
            ljm.quantite_sortie,
            ljm.prix_unitaire,
            ljm.valeur_operation,
            ljm.fournisseur_beneficiaire,
            ljm.piece_justificative
        FROM livre_journal_matieres ljm
        WHERE ljm.date_operation BETWEEN :periode_debut AND :periode_fin
        ORDER BY ljm.numero_ordre";
    }

    private function getMaterialLedgerTemplate(): string
    {
        return "-- Grand Livre par Nature de Matières
        SELECT 
            glm.exercice,
            glm.nature_matiere,
            glm.code_matiere,
            glm.designation_matiere,
            glm.stock_initial,
            glm.entrees_exercice,
            glm.sorties_exercice,
            glm.stock_final,
            glm.valeur_stock_moyen,
            glm.rotation_stock
        FROM grand_livre_matieres glm
        WHERE glm.exercice = :exercice
        AND glm.nature_matiere = :nature_matiere
        ORDER BY glm.valeur_stock_moyen DESC";
    }

    private function getPeriodicInventoryTemplate(): string
    {
        return "-- États d'Inventaire Périodiques
        SELECT 
            eip.periode_inventaire,
            eip.type_inventaire,
            eip.code_matiere,
            eip.designation_matiere,
            eip.stock_theorique,
            eip.stock_reel,
            eip.ecart_quantite,
            eip.ecart_valeur,
            eip.cause_ecart,
            eip.mesure_corrective
        FROM etats_inventaire_periodiques eip
        WHERE eip.periode_inventaire BETWEEN :periode_debut AND :periode_fin
        AND eip.type_inventaire = :type_inventaire
        ORDER BY ABS(eip.ecart_valeur) DESC";
    }

    private function getMaterialAccountantReportTemplate(): string
    {
        return "-- Rapport Comptable des Matières
        SELECT 
            rcm.exercice,
            rcm.comptable_matieres,
            rcm.nature_matiere,
            rcm.valeur_stock_debut,
            rcm.valeur_acquisitions,
            rcm.valeur_consommations,
            rcm.valeur_reformes,
            rcm.valeur_stock_fin,
            rcm.taux_rotation,
            rcm.observation_comptable
        FROM rapports_comptable_matieres rcm
        WHERE rcm.exercice = :exercice
        AND rcm.comptable_matieres = :comptable_matieres
        ORDER BY rcm.valeur_stock_fin DESC";
    }

    private function getReformStatesTemplate(): string
    {
        return "-- États de Réforme et Mise au Rebut
        SELECT 
            er.exercice,
            er.commission_reforme,
            er.numero_decision,
            er.date_decision,
            er.code_bien,
            er.designation_bien,
            er.valeur_acquisition,
            er.valeur_comptable_nette,
            er.motif_reforme,
            er.mode_elimination,
            er.produit_cession
        FROM etats_reforme er
        WHERE er.exercice = :exercice
        AND er.commission_reforme = :commission_reforme
        ORDER BY er.date_decision DESC";
    }
}