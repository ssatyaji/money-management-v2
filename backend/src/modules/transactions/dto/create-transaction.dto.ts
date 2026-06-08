import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from '@prisma/client';

export class CreateTransactionDto {
  @ApiProperty({ example: 150000, description: 'Amount in IDR' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiProperty({ enum: TransactionType, example: TransactionType.EXPENSE })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ example: 'Belanja bulanan di supermarket' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Beli susu, roti, telur' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({ example: '2024-01-15T10:30:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsString()
  @IsNotEmpty()
  categoryId: string;
}
