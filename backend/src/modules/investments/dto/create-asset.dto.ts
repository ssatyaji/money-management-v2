import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssetType } from '@prisma/client';

export class CreateAssetDto {
  @ApiProperty({ example: 'BBCA', description: 'Asset name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AssetType, example: 'STOCK' })
  @IsEnum(AssetType)
  assetType: AssetType;

  @ApiProperty({ example: 100, description: 'Total units/lots/grams' })
  @IsNumber()
  @Min(0)
  totalUnits: number;

  @ApiProperty({ example: 9500, description: 'Average buy price per unit' })
  @IsNumber()
  @Min(0)
  avgBuyPrice: number;

  @ApiProperty({ example: 10200, description: 'Current price per unit' })
  @IsNumber()
  @Min(0)
  currentPrice: number;

  @ApiPropertyOptional({ example: 'BBCA.JK' })
  @IsOptional()
  @IsString()
  ticker?: string;

  @ApiPropertyOptional({ example: '📈' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#8b5cf6' })
  @IsOptional()
  @IsString()
  color?: string;
}
