import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

const OPERATEUR_PREFIXES: Record<string, string[]> = {
  djezzy:  ['077', '078', '079'],
  ooredoo: ['055', '056', '057'],
  mobilis: ['060', '061', '066', '067', '068', '069'],
};

export type Operateur = 'djezzy' | 'ooredoo' | 'mobilis' | 'inconnu';

export interface SendSmsPayload {
  to: string;    
  message: string;
}

export interface SmsResult {
  success: boolean;
  operateur: Operateur;
  messageId?: string;
  error?: string;
}

@Injectable()
export class SmsChannelService {
  private readonly logger = new Logger(SmsChannelService.name);

  constructor(private readonly configService: ConfigService) {}

  /** Normalise vers le format international +213XXXXXXXXX */
  normalizeAlgerianPhone(numero: string): string {
    const clean = numero.replace(/\s+/g, '').replace(/-/g, '');
    if (clean.startsWith('+213')) return clean;
    if (clean.startsWith('213'))  return `+${clean}`;
    if (clean.startsWith('0'))    return `+213${clean.slice(1)}`;
    return `+213${clean}`;
  }

  /** Détecte l'opérateur à partir du numéro */
  detectOperateur(numero: string): Operateur {
    const normalized = this.normalizeAlgerianPhone(numero);
    // +213 0XXXXXXXX → préfixe = 0 + digits 4-6
    const localPart = '0' + normalized.slice(4);   // ex: 0770123456
    const prefix3 = localPart.slice(0, 3);          // ex: 077

    for (const [op, prefixes] of Object.entries(OPERATEUR_PREFIXES)) {
      if (prefixes.includes(prefix3)) return op as Operateur;
    }
    return 'inconnu';
  }

  /**
   * Envoie un SMS via InfoBip (réseau DZ : Djezzy, Ooredoo, Mobilis)
   * Fallback automatique vers Twilio si InfoBip échoue
   */
  async send(payload: SendSmsPayload): Promise<SmsResult> {
    const numero = this.normalizeAlgerianPhone(payload.to);
    const operateur = this.detectOperateur(payload.to);

    this.logger.log(`📱 SMS → ${numero} (${operateur})`);

    // Tentative InfoBip
    try {
      const result = await this.sendViaInfoBip(numero, payload.message);
      return { success: true, operateur, messageId: result.messageId };
    } catch (err) {
      this.logger.warn(`InfoBip échoué → fallback Twilio : ${err.message}`);
    }

    // Fallback Twilio
    try {
      const result = await this.sendViaTwilio(numero, payload.message);
      return { success: true, operateur, messageId: result.messageId };
    } catch (err) {
      this.logger.error(`Twilio échoué pour ${numero} : ${err.message}`);
      return { success: false, operateur, error: err.message };
    }
  }

  private async sendViaInfoBip(to: string, message: string): Promise<{ messageId: string }> {
    const apiKey  = this.configService.get<string>('INFOBIP_API_KEY');
    const baseUrl = this.configService.get<string>('INFOBIP_BASE_URL', 'https://api.infobip.com');
    const sender  = this.configService.get<string>('INFOBIP_SENDER', 'ALMIZAN');

    if (!apiKey) throw new Error('INFOBIP_API_KEY non configurée');

    const response = await axios.post(
      `${baseUrl}/sms/2/text/advanced`,
      { messages: [{ from: sender, destinations: [{ to }], text: message }] },
      {
        headers: {
          Authorization: `App ${apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 10_000,
      },
    );

    const msgId = response.data?.messages?.[0]?.messageId ?? 'unknown';
    this.logger.log(`InfoBip OK → ${to} | msgId: ${msgId}`);
    return { messageId: msgId };
  }

  private async sendViaTwilio(to: string, message: string): Promise<{ messageId: string }> {
    const accountSid = this.configService.get<string>('TWILIO_ACCOUNT_SID');
    const authToken  = this.configService.get<string>('TWILIO_AUTH_TOKEN');
    const from       = this.configService.get<string>('TWILIO_FROM_NUMBER', '');

    if (!accountSid || !authToken) throw new Error('Twilio credentials manquants');

    const response = await axios.post(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      new URLSearchParams({ To: to, From: from, Body: message }).toString(),
      {
        auth: { username: accountSid, password: authToken },
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10_000,
      },
    );

    this.logger.log(`Twilio OK → ${to} | sid: ${response.data.sid}`);
    return { messageId: response.data.sid };
  }
}
