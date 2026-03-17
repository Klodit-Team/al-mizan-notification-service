export const RABBITMQ_EXCHANGE = 'al_mizan_events';

export const QUEUE_NOTIF_AO          = 'notification_ao_queue';
export const QUEUE_NOTIF_SOUMISSION  = 'notification_soumission_queue';
export const QUEUE_NOTIF_EVALUATION  = 'notification_evaluation_queue';
export const QUEUE_NOTIF_RECOURS     = 'notification_recours_queue';
export const QUEUE_NOTIF_AUTH        = 'notification_auth_queue';
export const QUEUE_NOTIF_IA          = 'notification_ia_queue';

export const ROUTING_KEY = {
  AO_PUBLIE:                  'ao.publie',
  AO_MODIFIE:                 'ao.modifie',
  AO_ANNULE:                  'ao.annule',
  AO_CLOTURE:                 'ao.cloture',
  AO_ATTRIBUTION_PROVISOIRE:  'ao.attribution.provisoire',
  AO_ATTRIBUTION_DEFINITIVE:  'ao.attribution.definitive',
  SOUMISSION_DEPOSEE:         'soumission.deposee',
  SOUMISSION_REJETEE:         'soumission.rejetee',
  SOUMISSION_EVALUEE:         'soumission.evaluee',
  EVALUATION_DEMARREE:        'evaluation.demarree',
  EVALUATION_TERMINEE:        'evaluation.terminee',
  OUVERTURE_PLIS:             'evaluation.ouverture_plis',
  RECOURS_DEPOSE:             'recours.depose',
  RECOURS_EN_EXAMEN:          'recours.en_examen',
  RECOURS_STATUE:             'recours.statue',
  IA_ALERTE:                  'ia.alerte',
  IA_DIVERGENCE:              'ia.divergence',
  IA_ERREUR:                  'ia.erreur',
  IA_RAPPORT_GENERE:          'ia.rapport.genere',
  USER_INSCRIT:               'auth.user.inscrit',
  USER_CONNEXION_SUSPECTE:    'auth.user.connexion_suspecte',
  NOTIF_ENVOYEE:              'notification.envoyee',
  NOTIF_ECHEC:                'notification.echec',
  ALERTE_IA_EMISE:            'notification.alerte_ia.emise',
  RAPPORT_IA_ENVOYE:          'notification.rapport_ia.envoye',
} as const;
