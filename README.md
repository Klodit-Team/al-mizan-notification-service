# al-mizan-notification-service

> **Service de Notifications** — Envoi d'emails transactionnels, notifications push Android (Firebase) et alertes IA pour la plateforme Al-Mizan.

---

## Table des matières

1. [Aperçu](#aperçu)
2. [Technologies](#technologies)
3. [Architecture & Réseau](#architecture--réseau)
4. [Variables d'environnement](#variables-denvironnement)
5. [API REST](#api-rest)
6. [Messagerie RabbitMQ](#messagerie-rabbitmq)
7. [Commandes utiles](#commandes-utiles)
8. [Docker](#docker)

---

## Aperçu

`al-mizan-notification-service` est le service transversal de notifications de la plateforme Al-Mizan. Il consomme des événements RabbitMQ provenant de tous les autres microservices et envoie des notifications via différents canaux :

- **Email** (Nodemailer/SMTP) avec templates Handlebars (bilingue FR/AR).
- **Push Android** (Firebase Admin SDK / FCM).
- **Alertes IA** : réception et stockage des alertes issues de l'analyse IA (gré-à-gré, conformité).
- **Préférences** : respect des préférences de notification par utilisateur.
- **Device Tokens** : gestion des tokens FCM des appareils mobiles.
- **Rate Limiting** via @nestjs/throttler.
- **Logging structuré** via Pino (nestjs-pino).

Les queues dédiées par domaine permettent une isolation fine des événements (auth, AO, soumission, évaluation, attribution, recours, IA).

---

## Technologies

| Technologie        | Version  | Rôle                                              |
|--------------------|----------|---------------------------------------------------|
| Node.js            | 20 LTS   | Runtime                                           |
| TypeScript         | ^5.7     | Langage                                           |
| NestJS             | ^10.4    | Framework (modules, DI, microservices)            |
| Prisma ORM         | 7.1.0    | ORM MySQL (via @prisma/adapter-mariadb)           |
| MySQL              | 8.x      | Base de données (`notif_db`)                      |
| Redis (ioredis)    | ^5.4     | Cache sessions / déduplication                    |
| Nodemailer         | ^6.9     | Envoi d'emails (SMTP)                             |
| Handlebars         | ^4.7     | Templates HTML des emails (FR/AR)                 |
| Firebase Admin SDK | ^13.4    | Notifications push Android (FCM)                  |
| amqplib            | ^0.10    | Client RabbitMQ                                   |
| amqp-connection-manager | ^4.1 | Reconnexion automatique RabbitMQ              |
| nestjs-pino        | ^4.4     | Logging structuré JSON (Pino)                     |
| @nestjs/throttler  | ^6.4     | Rate Limiting                                     |
| @nestjs/swagger    | ^8.1     | Documentation OpenAPI                             |
| Jest               | ^29.7    | Tests unitaires & e2e                             |

---

## Architecture & Réseau

```
[Tous les microservices] ──[events]──► RabbitMQ ──► notification-service (:8010)
                                                              │
                                                  ├── MySQL   (mysql:3306 → notif_db)
                                                  ├── Redis   (redis:6379)
                                                  ├── SMTP    (email)
                                                  └── Firebase FCM (push Android)
```

- **Port exposé** : `8010`
- **Réseau Docker** : `al-mizan-network`
- **Nom du conteneur** : `notification-service`
- **Swagger UI** : `http://localhost:8010/notification-service/v1/docs`

---

## Variables d'environnement

```env
NODE_ENV=development
PORT=8010
API_PREFIX=notification-service/v1

# MySQL
DATABASE_URL=mysql://root@localhost:3306/notif_db

# Redis
REDIS_HOST=localhost
REDIS_PORT=6382
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672
RABBITMQ_EXCHANGE=al_mizan_events

# Queues dédiées par domaine
RABBITMQ_NOTIF_QUEUE=notification_queue
RABBITMQ_NOTIF_AO_QUEUE=notification_ao_queue
RABBITMQ_NOTIF_SOUMISSION_QUEUE=notification_soumission_queue
RABBITMQ_NOTIF_EVALUATION_QUEUE=notification_evaluation_queue
RABBITMQ_NOTIF_ATTRIBUTION_QUEUE=notification_attribution_queue
RABBITMQ_NOTIF_RECOURS_QUEUE=notification_recours_queue
RABBITMQ_NOTIF_IA_QUEUE=notification_ia_queue
RABBITMQ_NOTIF_AUTH_QUEUE=notification_auth_queue

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# SMTP
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_NAME=Al-Mizan
SMTP_FROM_EMAIL=notifications@almizan.dz

# Mode dégradé (ne pas bloquer si SMTP en échec)
EMAIL_FAIL_OPEN=true
```

> ⚠️ En production, remplacer `localhost` par les noms de conteneurs. Configurer les credentials Firebase dans le conteneur.

---

## API REST

Base URL (via Gateway) : `http://localhost:3000/notifications`  
Base URL (directe) : `http://localhost:8010/notification-service/v1`  
Swagger : `http://localhost:8010/notification-service/v1/docs`

### Préférences

| Méthode  | Endpoint                              | Auth | Description                                   |
|----------|---------------------------------------|------|-----------------------------------------------|
| `GET`    | `/preferences/:userId`                | Oui  | Récupérer les préférences de notifications    |
| `PATCH`  | `/preferences/:userId`                | Oui  | Mettre à jour les préférences                 |

### Device Tokens (Push Android)

| Méthode  | Endpoint                              | Auth | Description                                   |
|----------|---------------------------------------|------|-----------------------------------------------|
| `POST`   | `/device-tokens`                      | Oui  | Enregistrer un token FCM                      |
| `DELETE` | `/device-tokens/:token`               | Oui  | Supprimer un token FCM                        |

### Notifications

| Méthode  | Endpoint                              | Auth | Description                                   |
|----------|---------------------------------------|------|-----------------------------------------------|
| `GET`    | `/notifications/:userId`              | Oui  | Historique des notifications d'un utilisateur |
| `PATCH`  | `/notifications/:id/lire`             | Oui  | Marquer une notification comme lue            |

---

## Messagerie RabbitMQ

**Exchange** : `al_mizan_events` (type: `topic`, durable: `true`)

### Événements consommés (par queue dédiée)

| Queue                             | Routing Keys consommées                                                            |
|-----------------------------------|------------------------------------------------------------------------------------|
| `notification_auth_queue`         | `notifications.user` (USER_REGISTERED)                                             |
| `notification_ao_queue`           | `ao.published`, `ao.annule`, `ao.attribution.provisoire`, `ao.attribution.definitive` |
| `notification_soumission_queue`   | `soumission.deposee`, `soumission.retiree`                                          |
| `notification_evaluation_queue`   | `evaluation.cloturee`                                                              |
| `notification_attribution_queue`  | Attribution events                                                                  |
| `notification_recours_queue`      | `recours.depose`, `recours.accepte`, `recours.rejete`                              |
| `notification_ia_queue`           | Alertes IA (gré-à-gré, conformité)                                                 |
| `notification_queue`              | Fallback général                                                                    |

### Événements de notification par action métier

| Événement source                  | Destinataires                        | Canal(aux)            |
|-----------------------------------|--------------------------------------|-----------------------|
| `notifications.user` (inscription)| Utilisateur inscrit                  | Email                 |
| `ao.published`                    | Tous les OE enregistrés              | Email + Push          |
| `ao.attribution.provisoire`       | Tous les soumissionnaires de l'AO    | Email + Push          |
| `ao.attribution.definitive`       | OE attributaire                      | Email + Push          |
| `ao.annule`                       | Soumissionnaires + SC                | Email + Push          |
| `soumission.deposee`              | OE (confirmation de dépôt)           | Email                 |
| `recours.depose`                  | SC concerné                          | Email                 |
| `recours.accepte`/`rejete`        | OE recoursant                        | Email + Push          |

---

## Commandes utiles

### Développement local

```bash
yarn install
yarn start:dev      # Hot-reload NestJS
yarn build          # Compilation TypeScript
yarn start:prod     # Production
```

### Base de données

```bash
yarn prisma:generate          # Générer le client Prisma
yarn prisma:migrate:dev       # Créer une migration
yarn prisma:migrate:deploy    # Déployer les migrations
yarn prisma:seed              # Seeder les données initiales
yarn prisma:studio            # Prisma Studio
```

### Tests

```bash
yarn test
yarn test:e2e
yarn test:cov
```

---

## Docker

### Build de l'image

```bash
docker build -t al-mizan-notification-service .
```

### Notes importantes sur le Dockerfile

- Image de base : `node:20-alpine`
- Utilise `prisma migrate deploy` (migrations versionnées).
- Firebase credentials à injecter via variable d'environnement ou volume monté.

### Déploiement via docker-compose

```bash
docker-compose up -d notification-service
docker-compose logs -f notification-service
```

---

*Maintenu par l'équipe Al-Mizan — voir `al-mizan-deployments` pour la configuration de déploiement complète.*
