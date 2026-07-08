import { IsString, IsNotEmpty, IsNumber, IsOptional, IsBoolean, IsDateString, IsEnum, Min, Max, IsInt } from 'class-validator';
import { TransactionType, RecurringFrequency } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRecurringTransactionDto {
  @ApiProperty({ example: 150000, description: 'Amount of transaction' })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiProperty({ enum: TransactionType, example: 'EXPENSE' })
  @IsEnum(TransactionType)
  @IsNotEmpty()
  type: TransactionType;

  @ApiProperty({ example: 'Netflix Subscription' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'Premium 4k plan', required: false })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({ enum: RecurringFrequency, example: 'MONTHLY' })
  @IsEnum(RecurringFrequency)
  @IsNotEmpty()
  frequency: RecurringFrequency;

  @ApiProperty({ example: '2026-06-20T00:00:00.000Z', description: 'Start date of the subscription' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ example: 'some-category-uuid' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;

  @ApiProperty({ example: 'some-account-uuid' })
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    example: 1,
    required: false,
    description: 'Days before nextDueDate to send push notification. null = disabled.',
  })
  @IsInt()
  @Min(0)
  @Max(30)
  @IsOptional()
  notifyBeforeDays?: number | null;
}
