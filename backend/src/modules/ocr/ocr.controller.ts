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
import { ApiBearerAuth, ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { OcrService } from './ocr.service';
import { UploadReceiptDto } from './dto/upload-receipt.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('OCR')
@ApiBearerAuth('access-token')
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('receipt')
  @ApiOperation({ summary: 'Upload and process a receipt image via OCR' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary', description: 'Receipt image (JPG/PNG, max 10MB)' },
        description: { type: 'string', description: 'Optional description' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async uploadReceipt(
    @CurrentUser('id') userId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|jpg|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() dto: UploadReceiptDto,
  ) {
    return this.ocrService.processReceipt(userId, file, dto.description);
  }

  @Get('receipt/:id/status')
  @ApiOperation({ summary: 'Get OCR processing status' })
  async getStatus(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.ocrService.getStatus(userId, id);
  }

  @Get('receipt/:id/result')
  @ApiOperation({ summary: 'Get OCR result' })
  async getResult(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
  ) {
    return this.ocrService.getResult(userId, id);
  }
}
