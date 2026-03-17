import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8010', 10),
  apiPrefix: process.env.API_PREFIX || 'notification-service/v1',

  database: {
    url: process.env.DATABASE_URL,
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    ttl: parseInt(process.env.REDIS_TTL || '300', 10),
  },

  rabbitmq: {
    url: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
    exchange: process.env.RABBITMQ_EXCHANGE || 'al_mizan_events',
    queues: {
      notif: process.env.RABBITMQ_NOTIF_QUEUE || 'notification_queue',
      ao: process.env.RABBITMQ_NOTIF_AO_QUEUE || 'notification_ao_queue',
      soumission: process.env.RABBITMQ_NOTIF_SOUMISSION_QUEUE || 'notification_soumission_queue',
      evaluation: process.env.RABBITMQ_NOTIF_EVALUATION_QUEUE || 'notification_evaluation_queue',
      attribution: process.env.RABBITMQ_NOTIF_ATTRIBUTION_QUEUE || 'notification_attribution_queue',
      recours: process.env.RABBITMQ_NOTIF_RECOURS_QUEUE || 'notification_recours_queue',
      ia: process.env.RABBITMQ_NOTIF_IA_QUEUE || 'notification_ia_queue',
      auth: process.env.RABBITMQ_NOTIF_AUTH_QUEUE || 'notification_auth_queue',
    },
  },

  email: {
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    fromName: process.env.SMTP_FROM_NAME || 'Al-Mizan',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'notifications@almizan.dz',
  },

  sms: {
    providerUrl: process.env.SMS_PROVIDER_URL,
    apiKey: process.env.SMS_API_KEY,
    senderId: process.env.SMS_SENDER_ID || 'AL-MIZAN',
    prefixes: {
      djezzy: process.env.SMS_DJEZZY_PREFIXES || '07',
      ooredoo: process.env.SMS_OOREDOO_PREFIXES || '05',
      mobilis: process.env.SMS_MOBILIS_PREFIXES || '06',
    },
  },

  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH,
  },

  swagger: {
    title: process.env.SWAGGER_TITLE || 'Al-Mizan – Service Notifications',
    description: process.env.SWAGGER_DESCRIPTION || 'Microservice notifications',
    version: process.env.SWAGGER_VERSION || '1.0',
  },

  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || '60', 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
  },
}));
