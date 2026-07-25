import { PartialType } from '@nestjs/swagger';
import { CreateInvestmentTxDto } from './create-investment-tx.dto';

export class UpdateInvestmentTxDto extends PartialType(CreateInvestmentTxDto) {}
