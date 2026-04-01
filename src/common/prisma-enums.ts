export enum TypeNotification {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  PLATEFORME = 'PLATEFORME',
}
export { TypeNotification as NotificationType };

export enum CategorieNotification {
  PUBLICATION = 'PUBLICATION',
  DEPOT = 'DEPOT',
  OUVERTURE = 'OUVERTURE',
  EVALUATION = 'EVALUATION',
  ATTRIBUTION = 'ATTRIBUTION',
  RECOURS = 'RECOURS',
  SYSTEME = 'SYSTEME',
  IA_DIVERGENCE = 'IA_DIVERGENCE',
  IA_ERREUR = 'IA_ERREUR',
}
export { CategorieNotification as NotificationCategory };

export enum StatutNotification {
  EN_ATTENTE = 'EN_ATTENTE',
  ENVOYE = 'ENVOYE',
  ECHEC = 'ECHEC',
  LU = 'LU',
}
export { StatutNotification as NotificationStatut };

export enum NiveauUrgenceAlerte {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}
export { NiveauUrgenceAlerte as NiveauUrgence };

export enum TypeAlerteIA {
  DIVERGENCE_GRE_A_GRE = 'DIVERGENCE_GRE_A_GRE',
  DIVERGENCE_EVALUATION = 'DIVERGENCE_EVALUATION',
  CONFIANCE_FAIBLE = 'CONFIANCE_FAIBLE',
  ERREUR_MODELE = 'ERREUR_MODELE',
  ANOMALIE_OFFRES = 'ANOMALIE_OFFRES',
}
export { TypeAlerteIA as AlerteIAType };

export enum StatutAlerte {
  EMISE = 'EMISE',
  ACQUITTEE = 'ACQUITTEE',
  RESOLUE = 'RESOLUE',
}
export { StatutAlerte as AlerteStatut };

export enum TypeRapportIA {
  QUOTIDIEN = 'QUOTIDIEN',
  HEBDOMADAIRE = 'HEBDOMADAIRE',
  MENSUEL = 'MENSUEL',
  INCIDENT = 'INCIDENT',
}
export { TypeRapportIA as TypeRapport };

export enum StatutRapport {
  GENERE = 'GENERE',
  ENVOYE = 'ENVOYE',
}
export { StatutRapport as RapportStatut };
