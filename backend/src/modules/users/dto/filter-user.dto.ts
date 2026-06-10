import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterUserDto extends PaginationDto {
  @IsOptional()
  @IsString()
  search?: string;
}
