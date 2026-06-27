import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddContributionDto {
  @ApiProperty({ example: 5000000, description: 'Contribution amount' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'Bonus bulan ini' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: '2024-06-15' })
  @IsOptional()
  @IsString()
  date?: string;
}
