import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

export interface SendEmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailChannelService {
  private readonly logger = new Logger(EmailChannelService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST', 'localhost'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get<string>('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass:
          this.configService.get<string>('SMTP_PASSWORD') ??
          this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async send(payload: SendEmailPayload): Promise<EmailResult> {
    try {
      const fromName = this.configService.get<string>('SMTP_FROM_NAME', 'Al-Mizan');
      const fromEmail = this.configService.get<string>('SMTP_FROM_EMAIL', 'no-reply@almizan.dz');

      const info = await this.transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text ?? payload.subject,
      });

      this.logger.log(`Email envoyé → ${payload.to} | msgId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');
      const isProduction = nodeEnv === 'production';
      const failOpenRaw = this.configService.get<string>('EMAIL_FAIL_OPEN');
      const failOpen = failOpenRaw ? failOpenRaw === 'true' : !isProduction;

      if (failOpen) {
        this.logger.warn(
          `SMTP indisponible en mode fail-open (${nodeEnv}) → ${payload.to} : ${errorMessage}`,
        );
        return { success: true, messageId: 'dev-smtp-skipped' };
      }

      this.logger.error(`Email échoué → ${payload.to} : ${errorMessage}`);
      return { success: false, error: errorMessage };
    }
  }

  buildHtml(titre: string, contenu: string, ctaUrl?: string, ctaLabel?: string): string {
    const cta = ctaUrl
      ? `<div style="text-align:center;margin:32px 0;">
           <a href="${ctaUrl}" style="background:#1d4ed8;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:600;">
             ${ctaLabel ?? 'Voir sur Al-Mizan'}
           </a>
         </div>`
      : '';

    return `<!DOCTYPE html>
<html lang="fr" dir="ltr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${titre}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1d4ed8;padding:24px 32px;">
              <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;">
                Al-Mizan — Marchés Publics
              </h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <h2 style="color:#1e293b;font-size:18px;margin:0 0 16px;">${titre}</h2>
              <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">${contenu}</p>
              ${cta}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">
                Ce message est automatique — ne pas répondre.<br/>
                Plateforme Al-Mizan — Gestion des Marchés Publics d'Algérie<br/>
                Conformément à la Loi n°23-12 et Loi n°18-07
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }
}
