/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
import * as dotenv from 'dotenv';
dotenv.config();

const { PrismaClient } = require('@prisma/client');
const { PrismaMariaDb } = require('@prisma/adapter-mariadb');

import {
  TypeNotification,
  CategorieNotification,
} from '../src/common/prisma-enums';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL must be defined');
}

const adapter = new PrismaMariaDb(connectionString);
const prisma  = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding notification-service database...');

  // Préférences par défaut
  await prisma.preferenceNotification.upsert({
    where:  { userId: '550e8400-e29b-41d4-a716-446655440001' },
    update: {},
    create: {
      userId:           '550e8400-e29b-41d4-a716-446655440001',
      emailActif:       true,
      smsActif:         true,
      pushActif:        true,
      plateformeActif:  true,
      optoutCategories: [],
    },
  });

  // Token FCM de test
  await prisma.tokenFCM.upsert({
    where: {
      userId_token: {
        userId: '550e8400-e29b-41d4-a716-446655440001',
        token:  'fcm_test_token_abcdef123456',
      },
    },
    update: {},
    create: {
      userId:   '550e8400-e29b-41d4-a716-446655440001',
      token:    'fcm_test_token_abcdef123456',
      deviceId: 'test-device-001',
      isActive: true,
    },
  });

  // Notification de test
  await prisma.notification.create({
    data: {
      userId:    '550e8400-e29b-41d4-a716-446655440001',
      titre:     'Bienvenue sur Al-Mizan',
      contenu:   'Votre compte a été activé avec succès sur la plateforme Al-Mizan.',
      type:      TypeNotification.PLATEFORME,
      categorie: CategorieNotification.SYSTEME,
      isLue:     false,
    },
  });

  console.log('Seed terminé avec succès.');
}

main()
  .catch((e) => {
    console.error('Erreur pendant le seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });