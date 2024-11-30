import { Module } from '@nestjs/common';
import { CronJobController } from './cron_job.controller';
import { CronJobService } from './cron_job.service';
import { ScheduleModule } from '@nestjs/schedule';
import { WebScrapingService } from '../web_scraping/web_scraping.service';

@Module({
  imports: [
    ScheduleModule.forRoot()
  ],
  controllers: [CronJobController],
  providers: [CronJobService, WebScrapingService]
})
export class CronJobModule {}
