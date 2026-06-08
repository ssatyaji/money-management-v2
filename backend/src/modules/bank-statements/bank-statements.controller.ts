import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { BankStatementsService } from './bank-statements.service';
import { UploadStatementDto } from './dto/upload-statement.dto';
import { ImportTransactionsDto } from './dto/import-transactions.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Bank Statements')
@ApiBearerAuth('access-token')
@Controller('bank-statements')
export class BankStatementsController {
  constructor(private readonly bankStatementsService: BankStatementsService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload and parse a bank e-statement PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'PDF e-statement (max 20MB)' },
        bankName: {
          type: 'string',
          enum: ['PERMATA', 'JAGO', 'SEABANK', 'BCA'],
          description: 'Bank name',
        },
      },
      required: ['file', 'bankName'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 20 * 1024 * 1024 }), // 20MB
          new FileTypeValidator({ fileType: /^application\/pdf$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadStatementDto,
  ) {
    return this.bankStatementsService.upload(userId, dto.bankName, file);
  }

  @Get()
  @ApiOperation({ summary: 'Get all bank statement uploads' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.bankStatementsService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get bank statement detail' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bankStatementsService.findOne(userId, id);
  }

  @Get(':id/transactions')
  @ApiOperation({ summary: 'Get parsed transactions from a bank statement' })
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.bankStatementsService.getTransactions(userId, id);
  }

  @Post(':id/import')
  @ApiOperation({ summary: 'Import selected parsed transactions' })
  async importTransactions(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: ImportTransactionsDto,
  ) {
    return this.bankStatementsService.importTransactions(userId, id, dto);
  }
}
