import { Module } from '@nestjs/common';
import { OcrController } from './ocr.controller';
import { OcrService } from './ocr.service';
import { OcrParserService } from './ocr-parser.service';

@Module({
  controllers: [OcrController],
  providers: [OcrService, OcrParserService],
  exports: [OcrService],
})
export class OcrModule {}
