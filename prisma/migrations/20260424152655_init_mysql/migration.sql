-- CreateTable
CREATE TABLE `notifications` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `titre` VARCHAR(255) NOT NULL,
    `contenu` TEXT NOT NULL,
    `type` ENUM('EMAIL', 'SMS', 'PUSH', 'PLATEFORME') NOT NULL,
    `categorie` ENUM('PUBLICATION', 'DEPOT', 'OUVERTURE', 'EVALUATION', 'ATTRIBUTION', 'RECOURS', 'SYSTEME', 'IA_DIVERGENCE', 'IA_ERREUR') NOT NULL,
    `statut` ENUM('EN_ATTENTE', 'ENVOYE', 'ECHEC', 'LU') NOT NULL DEFAULT 'EN_ATTENTE',
    `is_lue` BOOLEAN NOT NULL DEFAULT false,
    `date_envoi` DATETIME(3) NULL,
    `date_lecture` DATETIME(3) NULL,
    `destinataire` VARCHAR(255) NULL,
    `message_id` VARCHAR(255) NULL,
    `tentatives` INTEGER NOT NULL DEFAULT 0,
    `erreur_details` TEXT NULL,
    `ref_entite_id` CHAR(36) NULL,
    `ref_entite_type` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `notifications_user_id_idx`(`user_id`),
    INDEX `notifications_statut_idx`(`statut`),
    INDEX `notifications_categorie_idx`(`categorie`),
    INDEX `notifications_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alertes_ia` (
    `id` CHAR(36) NOT NULL,
    `incident_id` CHAR(36) NOT NULL,
    `utilisateurs_cibles` JSON NOT NULL,
    `titre` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `niveau_urgence` ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,
    `type_alerte` ENUM('DIVERGENCE_GRE_A_GRE', 'DIVERGENCE_EVALUATION', 'CONFIANCE_FAIBLE', 'ERREUR_MODELE', 'ANOMALIE_OFFRES') NOT NULL,
    `donnees_contexte` JSON NULL,
    `statut` ENUM('EMISE', 'ACQUITTEE', 'RESOLUE') NOT NULL DEFAULT 'EMISE',
    `date_creation` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `date_acquittement` DATETIME(3) NULL,
    `acquittee_par` CHAR(36) NULL,

    INDEX `alertes_ia_incident_id_idx`(`incident_id`),
    INDEX `alertes_ia_statut_idx`(`statut`),
    INDEX `alertes_ia_niveau_urgence_idx`(`niveau_urgence`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rapports_ia` (
    `id` CHAR(36) NOT NULL,
    `type_rapport` ENUM('QUOTIDIEN', 'HEBDOMADAIRE', 'MENSUEL', 'INCIDENT') NOT NULL,
    `periode_debut` DATETIME(3) NOT NULL,
    `periode_fin` DATETIME(3) NOT NULL,
    `destinataires` JSON NOT NULL,
    `statistiques` JSON NOT NULL,
    `divergences_count` INTEGER NOT NULL DEFAULT 0,
    `erreurs_count` INTEGER NOT NULL DEFAULT 0,
    `taux_precision` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `fichier_rapport_url` VARCHAR(500) NULL,
    `statut` ENUM('GENERE', 'ENVOYE') NOT NULL DEFAULT 'GENERE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `sent_at` DATETIME(3) NULL,

    INDEX `rapports_ia_type_rapport_idx`(`type_rapport`),
    INDEX `rapports_ia_statut_idx`(`statut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preferences_notification` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `email_actif` BOOLEAN NOT NULL DEFAULT true,
    `sms_actif` BOOLEAN NOT NULL DEFAULT true,
    `push_actif` BOOLEAN NOT NULL DEFAULT true,
    `plateforme_actif` BOOLEAN NOT NULL DEFAULT true,
    `optout_categories` JSON NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `preferences_notification_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tokens_fcm` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `token` VARCHAR(512) NOT NULL,
    `device_id` VARCHAR(255) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `tokens_fcm_user_id_idx`(`user_id`),
    UNIQUE INDEX `tokens_fcm_user_id_token_key`(`user_id`, `token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
