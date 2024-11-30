import { Injectable } from '@nestjs/common';
import { Cron, CronExpression, SchedulerRegistry } from '@nestjs/schedule';
import { WebScrapingService } from '../web_scraping/web_scraping.service';

@Injectable()
export class CronJobService {
    
    constructor(private scheduleRegistry: SchedulerRegistry, private readonly webScrapingService: WebScrapingService) {
        console.log("CronJobService initialized");
    }

    @Cron('*/2 * * * *', { name: 'cron-job' })
    async cronJob() {
        console.log("Cron Job Running At: ", new Date().toLocaleString());
        this.webScrapingService.scrapeByKeyWord("NestJS");
    }

    stopCronJob() {
        const job = this.scheduleRegistry.getCronJob('cron-job');
        job.stop();
        console.log("Cron Job Stopped");
    }
}
