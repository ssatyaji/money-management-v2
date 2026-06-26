/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { OtpService } from './otp.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly otpService: OtpService,
  ) {}

  async register(registerDto: RegisterDto) {
    const email = registerDto.email.toLowerCase();
    const existingUser = await this.usersService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);
    const fullName = registerDto.name || `${registerDto.firstName} ${registerDto.lastName}`.trim();

    const user = await this.usersService.create({
      email,
      password: hashedPassword,
      name: fullName,
      firstName: registerDto.firstName,
      lastName: registerDto.lastName,
      occupation: registerDto.occupation,
      phoneNumber: registerDto.phoneNumber,
      monthlyIncome: registerDto.monthlyIncome,
      startingBalance: registerDto.startingBalance,
      financialGoal: registerDto.financialGoal,
    });

    // Fire-and-forget: jangan blokir response, kirim OTP di background
    this.otpService.generateAndSendOtp(email, 'REGISTER').catch((error: any) => {
      this.logger.error(`Failed to send verification OTP to ${email}: ${error.message}`);
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User registered: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        occupation: user.occupation,
        phoneNumber: user.phoneNumber,
        monthlyIncome: user.monthlyIncome ? Number(user.monthlyIncome) : null,
        financialGoal: user.financialGoal,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        startingBalance: Number(user.startingBalance) || 0,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email.toLowerCase());
    if (!user) {
      throw new UnauthorizedException('Email atau kata sandi salah. Silakan periksa kembali.');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email atau kata sandi salah. Silakan periksa kembali.');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    this.logger.log(`User logged in: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        occupation: user.occupation,
        phoneNumber: user.phoneNumber,
        monthlyIncome: user.monthlyIncome ? Number(user.monthlyIncome) : null,
        financialGoal: user.financialGoal,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        startingBalance: Number(user.startingBalance) || 0,
      },
      ...tokens,
    };
  }

  async googleSignIn(token: string) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    if (!googleClientId) {
      throw new BadRequestException('Google Client ID is not configured on the server');
    }

    let payload: any;
    try {
      const { OAuth2Client } = await import('google-auth-library');
      const client = new OAuth2Client(googleClientId);
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: googleClientId,
      });
      payload = ticket.getPayload();
    } catch (error: any) {
      this.logger.error(`Google token verification failed: ${error.message}`);
      throw new UnauthorizedException('Token Google tidak valid');
    }

    if (!payload || !payload.email) {
      throw new BadRequestException('Email tidak ditemukan dari Google');
    }

    const email = payload.email.toLowerCase();
    let user = await this.usersService.findByEmail(email);

    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36).slice(-12), 12);
      const givenName = payload.given_name || payload.name || '';
      const familyName = payload.family_name || '';
      const fullName = payload.name || `${givenName} ${familyName}`.trim();

      user = await this.usersService.create({
        email,
        password: randomPassword,
        name: fullName,
        firstName: givenName,
        lastName: familyName,
        avatar: payload.picture || null,
        isEmailVerified: true, // Google accounts are pre-verified
      });
      this.logger.log(`User created via Google Sign-In: ${email}`);
    } else {
      if (!user.avatar && payload.picture) {
        user = await this.usersService.update(user.id, { avatar: payload.picture });
      }
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        occupation: user.occupation,
        phoneNumber: user.phoneNumber,
        monthlyIncome: user.monthlyIncome ? Number(user.monthlyIncome) : null,
        financialGoal: user.financialGoal,
        role: user.role,
        avatar: user.avatar,
        isEmailVerified: user.isEmailVerified,
        startingBalance: Number(user.startingBalance) || 0,
      },
      ...tokens,
    };
  }

  async verifyOtp(email: string, code: string, purpose: 'REGISTER' | 'FORGOT_PASSWORD') {
    const normalizedEmail = email.toLowerCase();
    const isValid = await this.otpService.verifyOtp(normalizedEmail, code, purpose);

    if (!isValid) {
      throw new BadRequestException('Kode OTP salah atau telah kedaluwarsa');
    }

    if (purpose === 'REGISTER') {
      const user = await this.usersService.findByEmail(normalizedEmail);
      if (!user) {
        throw new BadRequestException('User tidak ditemukan');
      }
      await this.usersService.update(user.id, { isEmailVerified: true });
    }

    return { success: true, message: 'OTP verified successfully' };
  }

  // Overloaded verifyOtp that takes userId to verify email
  async verifyRegistrationOtp(userId: string, code: string) {
    const user = await this.usersService.findById(userId);
    const isValid = await this.otpService.verifyOtp(user.email, code, 'REGISTER');
    
    if (!isValid) {
      throw new BadRequestException('Kode OTP salah atau telah kedaluwarsa');
    }

    await this.usersService.update(userId, { isEmailVerified: true });
    return { success: true, message: 'Email verifikasi sukses' };
  }

  async resendOtp(email: string, purpose: 'REGISTER' | 'FORGOT_PASSWORD') {
    const normalizedEmail = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('Email tidak terdaftar');
    }

    await this.otpService.generateAndSendOtp(normalizedEmail, purpose);
    return { success: true, message: 'Kode OTP baru berhasil dikirim' };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('Email tidak terdaftar');
    }

    await this.otpService.generateAndSendOtp(normalizedEmail, 'FORGOT_PASSWORD');
    return { success: true, message: 'Kode OTP reset kata sandi telah dikirim' };
  }

  async resetPassword(email: string, code: string, passwordNew: string) {
    const normalizedEmail = email.toLowerCase();
    const user = await this.usersService.findByEmail(normalizedEmail);
    if (!user) {
      throw new BadRequestException('Email tidak terdaftar');
    }

    const isValid = await this.otpService.verifyOtp(normalizedEmail, code, 'FORGOT_PASSWORD');
    if (!isValid) {
      throw new BadRequestException('Kode OTP salah atau telah kedaluwarsa');
    }

    const hashedPassword = await bcrypt.hash(passwordNew, 12);
    await this.usersService.update(user.id, {
      password: hashedPassword,
    });

    return { success: true, message: 'Kata sandi berhasil diatur ulang' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Kata sandi saat ini salah');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 12);
    await this.usersService.update(userId, {
      password: hashedPassword,
    });

    return { success: true, message: 'Kata sandi berhasil diperbarui' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);

    if (!user.refreshToken) {
      // Refresh token is null — either user already logged out or token reuse attack
      this.logger.warn(`Refresh token reuse attempt for user ${userId} — stored token is null`);
      throw new UnauthorizedException('Access denied');
    }

    const isRefreshTokenValid = await bcrypt.compare(
      refreshToken,
      user.refreshToken,
    );
    if (!isRefreshTokenValid) {
      // Token doesn't match — possible token theft (old token used after rotation)
      // Invalidate all refresh tokens as a security precaution
      this.logger.warn(`Invalid refresh token for user ${userId} — possible token theft, invalidating all sessions`);
      await this.usersService.updateRefreshToken(userId, null);
      throw new UnauthorizedException('Access denied');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.updateRefreshToken(userId, null);
    this.logger.log(`User logged out: ${userId}`);
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      occupation: user.occupation,
      phoneNumber: user.phoneNumber,
      monthlyIncome: user.monthlyIncome ? Number(user.monthlyIncome) : null,
      financialGoal: user.financialGoal,
      role: user.role,
      avatar: user.avatar,
      isEmailVerified: user.isEmailVerified,
      startingBalance: Number(user.startingBalance) || 0,
      createdAt: user.createdAt,
    };
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessSecret =
      this.configService.get<string>('jwt.accessSecret') || 'fallback';
    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') || 'fallback';
    const accessExp =
      this.configService.get<string>('jwt.accessExpiration') || '15m';
    const refreshExp =
      this.configService.get<string>('jwt.refreshExpiration') || '7d';

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExp as any,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExp as any,
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async updateRefreshToken(userId: string, refreshToken: string) {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 12);
    await this.usersService.updateRefreshToken(userId, hashedRefreshToken);
  }
}
