import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleSignInDto {
  @ApiProperty({
    example: 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjE2...',
    description: 'Google OAuth ID Token received from frontend',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
