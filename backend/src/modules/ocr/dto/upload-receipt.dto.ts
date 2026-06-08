import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UploadReceiptDto {
  @ApiPropertyOptional({ description: 'Optional description for the receipt' })
  @IsOptional()
  @IsString()
  description?: string;
}
