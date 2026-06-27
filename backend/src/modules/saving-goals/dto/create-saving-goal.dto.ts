import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsEnum,
  IsOptional,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalType } from '@prisma/client';

export class CreateSavingGoalDto {
  @ApiProperty({ example: 'DP Rumah', description: 'Goal name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: GoalType, example: 'SAVE_UP' })
  @IsEnum(GoalType)
  goalType: GoalType;

  @ApiProperty({ example: 200000000, description: 'Target amount in IDR' })
  @IsNumber()
  @Min(1)
  targetAmount: number;

  @ApiPropertyOptional({ example: 'Kumpulkan DP rumah di BSD' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '🏠' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '#6366f1' })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({ example: '2027-12-31' })
  @IsOptional()
  @IsString()
  deadline?: string;

  @ApiPropertyOptional({ example: 5000000, description: 'Monthly saving target' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  monthlyTarget?: number;
}
