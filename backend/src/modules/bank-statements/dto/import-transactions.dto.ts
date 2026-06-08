import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImportTransactionsDto {
  @ApiProperty({
    description: 'Array of temp IDs of transactions to import',
    example: ['txn-1234-0', 'txn-1234-1'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  transactionIds: string[];

  @ApiPropertyOptional({
    description: 'Mapping of tempId to categoryId for each transaction',
    example: {
      'txn-1234-0': 'category-uuid-1',
      'txn-1234-1': 'category-uuid-2',
    },
  })
  @IsOptional()
  @IsObject()
  categoryMap?: Record<string, string>;
}
