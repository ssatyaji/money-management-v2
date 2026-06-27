import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteGoalDto {
  @ApiProperty({ enum: ['WITHDRAW', 'SPEND'], example: 'WITHDRAW' })
  @IsEnum(['WITHDRAW', 'SPEND'])
  action: 'WITHDRAW' | 'SPEND';

  @ApiProperty({ example: 'uuid-wallet-or-category' })
  @IsString()
  @IsNotEmpty()
  targetId: string;
}
