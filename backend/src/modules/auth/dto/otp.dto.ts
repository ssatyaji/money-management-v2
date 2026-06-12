import { IsEmail, IsNotEmpty, IsString, IsEnum, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: ['REGISTER', 'FORGOT_PASSWORD'], example: 'REGISTER' })
  @IsEnum(['REGISTER', 'FORGOT_PASSWORD'])
  @IsNotEmpty()
  purpose: 'REGISTER' | 'FORGOT_PASSWORD';
}

export class ResendOtpDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ enum: ['REGISTER', 'FORGOT_PASSWORD'], example: 'REGISTER' })
  @IsEnum(['REGISTER', 'FORGOT_PASSWORD'])
  @IsNotEmpty()
  purpose: 'REGISTER' | 'FORGOT_PASSWORD';
}

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Password@123',
    description: 'Min 8 chars, must contain uppercase, lowercase, number, and special character',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character',
  })
  password: string;
}
