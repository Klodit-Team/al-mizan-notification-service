import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

export interface SendPushPayload {
  tokens: string[];
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface PushResult {
  success: boolean;
  successCount: number;
  failureCount: number;
  invalidTokens: string[];
  error?: string;
}

@Injectable()
export class PushChannelService implements OnModuleInit {
  private readonly logger = new Logger(PushChannelService.name);
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    this.initFirebase();
  }

  private initFirebase(): void {
    // Éviter la double initialisation (hot reload)
    if (admin.apps.length > 0) {
      this.initialized = true;
      this.logger.log('Firebase Admin déjà initialisé');
      return;
    }

    try {
      const b64 = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_B64');
      if (b64) {
        const serviceAccount = JSON.parse(Buffer.from(b64, 'base64').toString('utf-8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
        this.initialized = true;
        this.logger.log('Firebase Admin initialisé via variable FIREBASE_SERVICE_ACCOUNT_B64');
        return;
      }

      const filePath = this.configService.get<string>(
        'FIREBASE_SERVICE_ACCOUNT_PATH',
        './firebase-service-account.json',
      );
      const resolvedPath = path.resolve(process.cwd(), filePath);

      if (fs.existsSync(resolvedPath)) {
        const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
        });
        this.initialized = true;
        this.logger.log(`Firebase Admin initialisé via ${resolvedPath}`);
      } else {
        this.logger.warn(
          `Fichier Firebase introuvable : ${resolvedPath}. Les notifications push sont désactivées.`,
        );
        this.logger.warn(
          '   → Créez firebase-service-account.json ou définissez FIREBASE_SERVICE_ACCOUNT_B64',
        );
      }
    } catch (err) {
      this.logger.error('Erreur initialisation Firebase Admin', err.message);
    }
  }

  async send(payload: SendPushPayload): Promise<PushResult> {
    if (!this.initialized || admin.apps.length === 0) {
      this.logger.warn('Firebase non initialisé – push simulé');
      return {
        success: true,
        successCount: payload.tokens.length,
        failureCount: 0,
        invalidTokens: [],
      };
    }

    if (!payload.tokens || payload.tokens.length === 0) {
      return { success: true, successCount: 0, failureCount: 0, invalidTokens: [] };
    }

    const invalidTokens: string[] = [];
    let totalSuccess = 0;
    let totalFailure = 0;

    // FCM limite à 500 tokens par requête multicast
    const batches = this.chunkArray(payload.tokens, 500);

    for (const batch of batches) {
      try {
        const message: admin.messaging.MulticastMessage = {
          tokens: batch,
          notification: {
            title: payload.title,
            body: payload.body,
            imageUrl: payload.imageUrl,
          },
          data: payload.data ?? {},
          android: {
            priority: 'high',
            notification: {
              channelId: 'al_mizan_notifications',
              clickAction: 'FLUTTER_NOTIFICATION_CLICK',
              sound: 'default',
            },
          },
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        totalSuccess += response.successCount;
        totalFailure += response.failureCount;

        // Identifier les tokens invalides pour nettoyage
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const code = resp.error?.code;
            if (
              code === 'messaging/invalid-registration-token' ||
              code === 'messaging/registration-token-not-registered'
            ) {
              invalidTokens.push(batch[idx]);
            }
            this.logger.warn(`Token FCM invalide [${batch[idx]}] : ${resp.error?.message}`);
          }
        });

        this.logger.log(
          `Push FCM batch : ${response.successCount} succès, ${response.failureCount} échecs`,
        );
      } catch (err) {
        this.logger.error(`Erreur envoi push FCM batch : ${err.message}`);
        totalFailure += batch.length;
      }
    }

    return {
      success: totalFailure === 0,
      successCount: totalSuccess,
      failureCount: totalFailure,
      invalidTokens,
    };
  }

  /** Envoyer à un seul token */
  async sendToToken(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    const result = await this.send({ tokens: [token], title, body, data });
    return result.successCount > 0;
  }

  private chunkArray<T>(arr: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}
