import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DebtType } from '@prisma/client';

export class CreateDebtDto {
  @ApiProperty({ example: 'Budi', description: 'Person name' })
  @IsString()
  @IsNotEmpty()
  personName: string;

  @ApiProperty({ enum: DebtType, example: 'RECEIVABLE' })
  @IsEnum(DebtType)
  type: DebtType;

  @ApiProperty({ example: 5000000, description: 'Total debt amount' })
  @IsNumber()
  @Min(1)
  totalAmount: number;

  @ApiPropertyOptional({ example: 'Pinjaman untuk renovasi' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '08123456789' })
  @IsOptional()
  @IsString()
  personContact?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsString()
  borrowDate?: string;
}
