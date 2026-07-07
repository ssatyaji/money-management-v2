import { IsOptional, IsString } from 'class-validator';
export class CreateSessionDto {
  @IsOptional()
  @IsString()
  context?: 'GENERAL' | 'DEBT' | 'GOAL' | 'INVESTMENT';

  @IsOptional()
  @IsString()
  contextId?: string;
}
