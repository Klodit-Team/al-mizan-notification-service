# Al-Mizan – Notification Service

Microservice de gestion des notifications multi-canal de la plateforme **Al-Mizan** (Marchés Publics Algérie).

- **Port** : `8010`
- **Prefix API** : `/notification-service/v1`
- **Swagger** : [http://localhost:8010/notification-service/v1/docs](http://localhost:8010/notification-service/v1/docs)

---

## Fonctionnalités

| Canal            | Implémentation                         | Détails                                              |
| ---------------- | -------------------------------------- | ---------------------------------------------------- |
| **Email**        | Nodemailer + SMTP                      | Templates HTML responsive bilingue                   |
| **SMS**          | InfoBip (primaire) + Twilio (fallback) | Djezzy / Ooredoo / Mobilis auto-détecté              |
| **Push Android** | Firebase Cloud Messaging (FCM)         | Batching 500 tokens, nettoyage auto tokens invalides |
| **Plateforme**   | Persisté en BDD                        | Lu/non-lu, compteur, marquer tout lu                 |
| **Alertes IA**   | Email + Push (CRITICAL/ERROR)          | Acquittement, résolution, notes                      |
| **Rapports IA**  | Email PDF                              | Quotidien / Hebdomadaire / Mensuel                   |

---

## Démarrage rapide

### Prérequis

- Node.js ≥ 20
- Yarn ≥ 1.22
- Docker & Docker Compose
- (Optionnel) Compte Firebase, InfoBip

### 1. Démarrer l'infrastructure

```bash
# Crée le réseau partagé Al-Mizan (une seule fois)
docker network create al_mizan_network

# Démarrer PostgreSQL + Redis + RabbitMQ
docker compose up -d postgres redis rabbitmq
```

### 2. Installer les dépendances

```bash
yarn install
```

### 3. Migrations Prisma

```bash
# Créer et appliquer la migration initiale
yarn prisma:migrate

# Générer le client Prisma
yarn prisma:generate

# (Optionnel) Seeder la base avec des données de test
yarn prisma:seed
```

## SMS Algérie – Opérateurs supportés

Le service détecte automatiquement l'opérateur à partir du numéro :

| Opérateur   | Préfixes                           |
| ----------- | ---------------------------------- |
| **Djezzy**  | 077x, 078x, 079x                   |
| **Ooredoo** | 055x, 056x, 057x                   |
| **Mobilis** | 060x, 061x, 066x, 067x, 068x, 069x |

**Fournisseur principal** : [InfoBip](https://www.infobip.com/) (agrégateur supportant tous les opérateurs DZ)  
**Fallback** : Twilio avec routing international

---

## RabbitMQ – Consumers & Producers

### Consumers (événements reçus des autres services)

| Queue                           | Routing Keys écoutées                                            | Service source     |
| ------------------------------- | ---------------------------------------------------------------- | ------------------ |
| `notification_ao_queue`         | `ao.publie`, `ao.annule`, `ao.attribution.*`                     | ao-service         |
| `notification_soumission_queue` | `soumission.deposee`, `soumission.rejetee`, `soumission.evaluee` | soumission-service |
| `notification_evaluation_queue` | `evaluation.*`, `evaluation.ouverture_plis`                      | evaluation-service |
| `notification_recours_queue`    | `recours.depose`, `recours.en_examen`, `recours.statue`          | recours-service    |
| `notification_auth_queue`       | `auth.user.inscrit`, `auth.user.connexion_suspecte`              | auth-service       |
| `notification_ia_queue`         | `ia.alerte`, `ia.divergence`, `ia.erreur`                        | ia-services        |

### Producers (événements émis par ce service)

| Routing Key                      | Consommateurs cibles |
| -------------------------------- | -------------------- |
| `notification.envoyee`           | audit-service        |
| `notification.echec`             | audit-service        |
| `notification.alerte_ia.emise`   | audit-service        |
| `notification.rapport_ia.envoye` | audit-service        |

---

## API REST – Endpoints

### Notifications

| Méthode | Endpoint                             | Rôles             | Description           |
| ------- | ------------------------------------ | ----------------- | --------------------- |
| `POST`  | `/notifications`                     | ADMIN, SYSTEME    | Créer et envoyer      |
| `GET`   | `/notifications`                     | ADMIN, CONTROLEUR | Lister toutes (admin) |
| `GET`   | `/notifications/mes-notifications`   | Tous              | Mes notifications     |
| `GET`   | `/notifications/non-lues/count`      | Tous              | Compteur non-lues     |
| `GET`   | `/notifications/:id`                 | Tous              | Détail                |
| `PATCH` | `/notifications/:id/lire`            | Tous              | Marquer comme lue     |
| `PATCH` | `/notifications/marquer-toutes-lues` | Tous              | Tout marquer lu       |

### Alertes IA

| Méthode | Endpoint                    | Rôles             | Description        |
| ------- | --------------------------- | ----------------- | ------------------ |
| `POST`  | `/alertes-ia`               | ADMIN, SYSTEME    | Émettre une alerte |
| `GET`   | `/alertes-ia`               | ADMIN, CONTROLEUR | Lister             |
| `GET`   | `/alertes-ia/:id`           | ADMIN, CONTROLEUR | Détail             |
| `PATCH` | `/alertes-ia/:id/acquitter` | ADMIN, CONTROLEUR | Acquitter          |
| `PATCH` | `/alertes-ia/:id/resoudre`  | ADMIN, CONTROLEUR | Résoudre           |

### Rapports IA

| Méthode | Endpoint           | Rôles             | Description      |
| ------- | ------------------ | ----------------- | ---------------- |
| `POST`  | `/rapports-ia`     | ADMIN, SYSTEME    | Créer et envoyer |
| `GET`   | `/rapports-ia`     | ADMIN, CONTROLEUR | Lister           |
| `GET`   | `/rapports-ia/:id` | ADMIN, CONTROLEUR | Détail           |

### Device Tokens (FCM)

| Méthode  | Endpoint             | Rôles | Description           |
| -------- | -------------------- | ----- | --------------------- |
| `POST`   | `/device-tokens`     | Tous  | Enregistrer token FCM |
| `GET`    | `/device-tokens`     | Tous  | Mes tokens            |
| `DELETE` | `/device-tokens/:id` | Tous  | Désactiver un token   |

### Préférences

| Méthode | Endpoint       | Rôles | Description     |
| ------- | -------------- | ----- | --------------- |
| `GET`   | `/preferences` | Tous  | Mes préférences |
| `PATCH` | `/preferences` | Tous  | Mettre à jour   |

---

## Tests

```bash
# Tests unitaires
yarn test

# Tests unitaires avec coverage
yarn test:cov

# Tests e2e (nécessite une BDD de test)
yarn test:e2e
```

---

## Docker Compose complet

```bash
# Tout démarrer (app + infra)
docker compose up -d

# Avec pgAdmin
docker compose --profile tools up -d

# Logs
docker compose logs -f notification-service

# Stopper
docker compose down

# Reset complet (données supprimées)
docker compose down -v
```

**Interfaces disponibles :**

- API : [http://localhost:8010/notification-service/v1/docs](http://localhost:8010/notification-service/v1/docs)
- RabbitMQ : [http://localhost:15672](http://localhost:15672) (guest/guest)
- pgAdmin : [http://localhost:5051](http://localhost:5051) (admin@almizan.dz / admin123)

---

## Kubernetes

```bash
cd k8s/
kubectl apply -f namespace.yaml
kubectl apply -f secret.yaml
kubectl apply -f configmap.yaml
kubectl apply -f postgres.yaml
kubectl apply -f migration-job.yaml
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl apply -f hpa.yaml
```

---

## Structure du projet

```
notification-service/
├── src/
│   ├── main.ts                         # Bootstrap NestJS
│   ├── app.module.ts                   # Module racine
│   ├── config/app.config.ts            # Configuration centralisée
│   ├── common/                         # Partagé (filtres, guards, décorateurs)
│   │   ├── decorators/
│   │   ├── filters/
│   │   ├── guards/
│   │   └── interceptors/
│   ├── prisma/                         # PrismaService (PostgreSQL)
│   ├── redis/                          # RedisService (cache + déduplication)
│   ├── rabbitmq/                       # Bus d'événements
│   │   ├── consumers/                  # 6 consumers (ao, soumission, eval, recours, auth, ia)
│   │   └── producers/                  # 1 producer (événements émis)
│   ├── channels/                       # Canaux d'envoi
│   │   ├── email/                      # Nodemailer + templates HTML
│   │   ├── sms/                        # InfoBip + Twilio (Djezzy/Ooredoo/Mobilis)
│   │   └── push/                       # Firebase FCM (Android)
│   ├── notifications/                  # CRUD + dispatch multi-canal
│   ├── alertes-ia/                     # Alertes IA (acquittement, résolution)
│   ├── rapports-ia/                    # Rapports périodiques (email PDF)
│   ├── device-tokens/                  # Tokens FCM Android
│   └── preferences/                   # Préférences par canal/catégorie
├── prisma/
│   ├── schema.prisma                   # Schéma PostgreSQL
│   └── seed.ts                         # Données de test
├── test/
│   ├── app.e2e-spec.ts                 # Tests e2e
│   └── jest-e2e.json
├── k8s/                                # Manifests Kubernetes
├── Dockerfile                          # Multi-stage build
├── docker-compose.yml                  # Dev local
└── README.md
```

---

## Conformité

- **Loi n°18-07** : Chiffrement AES-256 des données PII au repos, hébergement souverain algérien
- **Loi n°23-12** : Notifications légales (délai recours 10j, attribution provisoire/définitive)
- **OWASP** : Rate limiting, validation stricte (class-validator), headers sécurité
