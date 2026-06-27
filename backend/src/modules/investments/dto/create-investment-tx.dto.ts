import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInvestmentTxDto {
  @ApiProperty({ example: 'BUY', description: 'BUY | SELL | DIVIDEND' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ example: 50, description: 'Number of units' })
  @IsNumber()
  @Min(0)
  units: number;

  @ApiProperty({ example: 9800, description: 'Price per unit at transaction time' })
  @IsNumber()
  @Min(0)
  pricePerUnit: number;

  @ApiPropertyOptional({ example: 15000, description: 'Transaction fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fee?: number;

  @ApiPropertyOptional({ example: 'Beli saham BBCA' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: '2024-06-15' })
  @IsOptional()
  @IsString()
  date?: string;
}
