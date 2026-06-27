import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddPaymentDto {
  @ApiProperty({ example: 1000000, description: 'Payment amount' })
  @IsNumber()
  @Min(1)
  amount: number;

  @ApiPropertyOptional({ example: 'Cicilan bulan ini' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ example: '2024-06-15' })
  @IsOptional()
  @IsString()
  date?: string;
}
