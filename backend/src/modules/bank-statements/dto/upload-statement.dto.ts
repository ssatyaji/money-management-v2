import { IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { BankName } from '@prisma/client';

export class UploadStatementDto {
  @ApiProperty({
    enum: BankName,
    description: 'Bank name for the e-statement',
    example: 'BCA',
  })
  @IsNotEmpty({ message: 'Nama bank harus dipilih' })
  @IsEnum(BankName, { message: 'Nama bank tidak valid. Pilih: PERMATA, JAGO, SEABANK, atau BCA' })
  bankName: BankName;
}
