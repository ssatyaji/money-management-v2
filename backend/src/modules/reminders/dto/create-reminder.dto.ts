import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReminderFrequency } from '@prisma/client';

export class CreateReminderDto {
  @ApiProperty({ example: 'Bayar Listrik', description: 'Reminder title' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @ApiPropertyOptional({ example: 'Token listrik bulanan via PLN Mobile' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 350000, description: 'Amount in IDR' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @ApiProperty({ example: '2026-06-15', description: 'Due date (ISO 8601)' })
  @IsDateString()
  @IsNotEmpty()
  dueDate: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Is this a recurring reminder?',
  })
  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @ApiPropertyOptional({
    enum: ReminderFrequency,
    example: ReminderFrequency.MONTHLY,
  })
  @IsOptional()
  @IsEnum(ReminderFrequency)
  frequency?: ReminderFrequency;

  @ApiPropertyOptional({
    example: 3,
    description: 'Notify X days before due date',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  notifyBefore?: number;
}
