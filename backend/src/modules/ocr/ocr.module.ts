import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { OcrParserService } from './ocr-parser.service';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [AdminModule],
  controllers: [OcrController],
  providers: [OcrService, OcrParserService],
  exports: [OcrService],
})
export class OcrModule {}
