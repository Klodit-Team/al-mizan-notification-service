/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Notification Service (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const ADMIN_ID   = '550e8400-e29b-41d4-a716-446655440001';
  const USER_ID    = '550e8400-e29b-41d4-a716-446655440002';
  const ADMIN_ROLES = JSON.stringify(['ADMIN']);
  const USER_ROLES  = JSON.stringify(['OPERATEUR_ECONOMIQUE']);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.setGlobalPrefix('notification-service/v1');

    prisma = moduleFixture.get<PrismaService>(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('POST /notification-service/v1/notifications', () => {
    it('201 – crée une notification PLATEFORME', async () => {
      const res = await request(app.getHttpServer())
        .post('/notification-service/v1/notifications')
        .set('x-user-id', ADMIN_ID)
        .set('x-user-roles', ADMIN_ROLES)
        .send({
          userId: USER_ID,
          titre: 'Test notification',
          contenu: 'Contenu de test suffisamment long',
          type: 'PLATEFORME',
          categorie: 'SYSTEME',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.userId).toBe(USER_ID);
    });

    it('400 – rejette un titre vide', async () => {
      await request(app.getHttpServer())
        .post('/notification-service/v1/notifications')
        .set('x-user-id', ADMIN_ID)
        .set('x-user-roles', ADMIN_ROLES)
        .send({ userId: USER_ID, titre: '', contenu: 'Test', type: 'PLATEFORME', categorie: 'SYSTEME' })
        .expect(400);
    });

    it('403 – refus pour un rôle insuffisant', async () => {
      await request(app.getHttpServer())
        .post('/notification-service/v1/notifications')
        .set('x-user-id', USER_ID)
        .set('x-user-roles', USER_ROLES)
        .send({ userId: USER_ID, titre: 'Test', contenu: 'Contenu test ok', type: 'PLATEFORME', categorie: 'SYSTEME' })
        .expect(403);
    });
  });

  describe('GET /notification-service/v1/notifications/mes-notifications', () => {
    it('200 – retourne la liste paginée', async () => {
      const res = await request(app.getHttpServer())
        .get('/notification-service/v1/notifications/mes-notifications')
        .set('x-user-id', USER_ID)
        .set('x-user-roles', USER_ROLES)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('total');
    });
  });

  describe('GET /notification-service/v1/notifications/non-lues/count', () => {
    it('200 – retourne un compteur', async () => {
      const res = await request(app.getHttpServer())
        .get('/notification-service/v1/notifications/non-lues/count')
        .set('x-user-id', USER_ID)
        .set('x-user-roles', USER_ROLES)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('count');
    });
  });

  describe('GET /notification-service/v1/device-tokens', () => {
    it('200 – liste les tokens de l\'utilisateur', async () => {
      const res = await request(app.getHttpServer())
        .get('/notification-service/v1/device-tokens')
        .set('x-user-id', USER_ID)
        .set('x-user-roles', USER_ROLES)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('POST /notification-service/v1/device-tokens', () => {
    it('201 – enregistre un token FCM', async () => {
      const res = await request(app.getHttpServer())
        .post('/notification-service/v1/device-tokens')
        .set('x-user-id', USER_ID)
        .set('x-user-roles', USER_ROLES)
        .send({ token: 'fcm_test_token_e2e_xyz789', deviceId: 'test-device-e2e' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBe('fcm_test_token_e2e_xyz789');
    });
  });

  describe('GET /notification-service/v1/preferences', () => {
    it('200 – récupère ou crée les préférences', async () => {
      const res = await request(app.getHttpServer())
        .get('/notification-service/v1/preferences')
        .set('x-user-id', USER_ID)
        .set('x-user-roles', USER_ROLES)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('emailActif');
    });
  });

  describe('POST /notification-service/v1/alertes-ia', () => {
    it('201 – crée une alerte IA', async () => {
      const res = await request(app.getHttpServer())
        .post('/notification-service/v1/alertes-ia')
        .set('x-user-id', ADMIN_ID)
        .set('x-user-roles', ADMIN_ROLES)
        .send({
          titre: 'Divergence IA test',
          message: 'Message de test suffisamment long pour passer la validation.',
          typeAlerte: 'DIVERGENCE_EVALUATION',
          niveauUrgence: 'WARNING',
          utilisateursCibles: [ADMIN_ID],
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.statut).toBe('EMISE');
    });
  });
});
