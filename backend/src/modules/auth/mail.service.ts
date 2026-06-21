import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private resendApiKey: string = '';
  private defaultFrom: string = '';

  constructor(private readonly configService: ConfigService) {
    this.resendApiKey = this.configService.get<string>('mail.resendApiKey') || '';
    this.defaultFrom = this.configService.get<string>('mail.from') || '"Zayn Finance" <noreply@zaynfinance.com>';

    if (this.resendApiKey) {
      this.logger.log('Resend API Mail transporter configured successfully.');
    } else {
      const host = this.configService.get<string>('mail.host') || 'smtp.gmail.com';
      const port = this.configService.get<number>('mail.port') || 587;
      const user = this.configService.get<string>('mail.user') || '';
      const pass = this.configService.get<string>('mail.pass') || '';

      if (user && pass) {
        this.transporter = nodemailer.createTransport({
          host,
          port,
          secure: port === 465, // true for 465, false for 587
          auth: {
            user,
            pass,
          },
          connectionTimeout: 10000,  // 10 detik timeout untuk koneksi
          greetingTimeout: 10000,    // 10 detik timeout untuk greeting
          socketTimeout: 15000,      // 15 detik timeout untuk socket
          family: 4,                 // Force IPv4 (ponytail: fix ENETUNREACH)
        } as any);
        this.logger.log('SMTP Mail transporter configured successfully.');
      } else {
        this.logger.warn('SMTP credentials and Resend API key are missing. OTP emails will be logged to console instead of sent.');
      }
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    const from = this.defaultFrom;

    if (this.resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from,
            to: [to],
            subject,
            html,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          throw new Error(JSON.stringify(errorData));
        }

        this.logger.log(`Email sent successfully to ${to} via Resend API`);
        return true;
      } catch (error: any) {
        this.logger.error(`Failed to send email to ${to} via Resend API: ${error.message}`);
        return false;
      }
    }

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from,
          to,
          subject,
          html,
        });
        this.logger.log(`Email sent successfully to ${to} via SMTP`);
        return true;
      } catch (error: any) {
        this.logger.error(`Failed to send email to ${to} via SMTP: ${error.message}`, error.stack);
        return false;
      }
    }

    this.logger.error(`[MAIL-ERROR] No mail sender configured! Email to ${to} was NOT sent.`);
    this.logger.debug(`[Mail-Fallback] Subject: ${subject}`);
    return false;
  }
}
