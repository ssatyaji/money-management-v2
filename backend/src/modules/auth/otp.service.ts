import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from './mail.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async generateAndSendOtp(email: string, purpose: 'REGISTER' | 'FORGOT_PASSWORD'): Promise<void> {
    // Generate random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Clean up any existing OTPs for this email and purpose
    await this.prisma.otpVerification.deleteMany({
      where: { email, purpose },
    });

    // Save code to database
    await this.prisma.otpVerification.create({
      data: {
        email,
        code,
        purpose,
        expiresAt,
      },
    });

    this.logger.log(`Generated OTP code ${code} for ${email} (${purpose})`);

    // Send email
    const subject = purpose === 'REGISTER'
      ? 'Zayn Finance - Kode Verifikasi Pendaftaran'
      : 'Zayn Finance - Kode Reset Password';

    const purposeText = purpose === 'REGISTER' 
      ? 'verifikasi pendaftaran akun Anda' 
      : 'mengatur ulang kata sandi Anda';
    
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #6366f1; text-align: center;">Zayn Finance</h2>
        <p>Halo,</p>
        <p>Kami menerima permintaan untuk ${purposeText}. Gunakan kode OTP berikut untuk melanjutkan proses:</p>
        <div style="text-align: center; margin: 30px 0;">
          <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #10b981; background: #f0fdf4; padding: 10px 20px; border-radius: 8px; border: 1px dashed #10b981; display: inline-block;">
            ${code}
          </span>
        </div>
        <p style="color: #64748b; font-size: 14px;">Kode OTP ini berlaku selama 10 menit. Jika Anda tidak merasa melakukan tindakan ini, abaikan email ini.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #94a3b8; font-size: 12px; text-align: center;">&copy; ${new Date().getFullYear()} Zayn Finance. Semua hak cipta dilindungi.</p>
      </div>
    `;

    await this.mailService.sendMail(email, subject, html);
  }

  async verifyOtp(email: string, code: string, purpose: 'REGISTER' | 'FORGOT_PASSWORD'): Promise<boolean> {
    const otp = await this.prisma.otpVerification.findFirst({
      where: {
        email,
        code,
        purpose,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!otp) {
      this.logger.warn(`OTP verification failed for ${email} with code ${code} (${purpose})`);
      return false;
    }

    // OTP matches, delete all OTPs for this email and purpose to prevent reuse
    await this.prisma.otpVerification.deleteMany({
      where: { email, purpose },
    });

    this.logger.log(`OTP verification succeeded for ${email} (${purpose})`);
    return true;
  }
}
