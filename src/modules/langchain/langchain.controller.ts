import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { LangChainService } from './langchain.service';
import { JobSuggestionDto } from './common/dto/langchain.dto';

@Controller('langchain')
export class LangChainController {
    constructor(private readonly LangChainService: LangChainService) {}

    @Post('job-suggestion')
    async jobSuggestions(@Body() body: JobSuggestionDto) {
        const response = await this.LangChainService.jobSuggestion(body);
        return { message: response.message, data: response.data };
    }

    @Get('blog-post-process')
    async blogSummary() {
        const response = await this.LangChainService.blogScrapePostProcess();
    }
}
