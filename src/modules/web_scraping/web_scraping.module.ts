import { Module } from '@nestjs/common';
import { WebScrapingController } from './web_scraping.controller';
import { WebScrapingService } from './web_scraping.service';
import { LangChainService } from '../langchain/langchain.service';

@Module({
    controllers: [WebScrapingController],
    providers: [WebScrapingService, LangChainService],
    exports: [WebScrapingService],
})
export class WebScrapingModule {}
