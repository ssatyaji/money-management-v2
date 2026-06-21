import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly configService: ConfigService) {
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
      });
      this.logger.log('SMTP Mail transporter configured successfully.');
    } else {
      this.logger.warn('SMTP credentials are missing. OTP emails will be logged to console instead of sent.');
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<boolean> {
    if (!this.transporter) {
      this.logger.error(`[MAIL-ERROR] SMTP transporter NOT configured! MAIL_USER/MAIL_PASS env vars are missing. Email to ${to} was NOT sent.`);
      this.logger.debug(`[Mail-Fallback] Subject: ${subject}`);
      return false;
    }

    try {
      const from = this.configService.get<string>('MAIL_FROM') || '"Zayn Finance" <noreply@zaynfinance.com>';
      await this.transporter.sendMail({
        from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent successfully to ${to}`);
      return true;
    } catch (error: any) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`, error.stack);
      return false;
    }
  }
}
