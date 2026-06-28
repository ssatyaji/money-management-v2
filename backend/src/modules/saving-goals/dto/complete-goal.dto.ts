import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CompleteGoalDto {
  @ApiProperty({ enum: ['WITHDRAW', 'SPEND'], example: 'WITHDRAW' })
  @IsEnum(['WITHDRAW', 'SPEND'])
  action: 'WITHDRAW' | 'SPEND';

  @ApiProperty({ example: 'uuid-wallet-or-category' })
  @IsString()
  @IsNotEmpty()
  targetId: string;

  @ApiPropertyOptional({ example: 2500000, description: 'Amount to withdraw/spend (defaults to entire goal balance if not provided)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  amount?: number;
}
