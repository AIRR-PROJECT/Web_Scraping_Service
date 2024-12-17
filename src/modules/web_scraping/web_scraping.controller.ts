import { Controller, Get, Query } from '@nestjs/common';
import { WebScrapingService } from './web_scraping.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("web-scraping")
@Controller('web-scraping')
export class WebScrapingController {
    constructor(private readonly webScrapingService: WebScrapingService) {
        console.log("WebScrapingController initialized");
    }

    @Get()
    async getWebScrapingData(@Query('keyword') keyword: string) {
        let response = await this.webScrapingService.scrapeByKeyWord(keyword);
        if (typeof response === 'string') {
            return { success: false, message: response };
        }
        return { success: true, data: response };
    }
}
