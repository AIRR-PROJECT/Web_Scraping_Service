import { Module } from '@nestjs/common';
import { WebScrapingController } from './web_scraping.controller';
import { WebScrapingService } from './web_scraping.service';

@Module({
  controllers: [WebScrapingController],
  providers: [WebScrapingService],
  exports: [WebScrapingService]
})
export class WebScrapingModule {}
