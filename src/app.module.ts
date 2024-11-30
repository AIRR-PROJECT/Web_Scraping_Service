import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebScrapingModule } from './modules/web_scraping/web_scraping.module';
import { CronJobModule } from './modules/cron_job/cron_job.module';

@Module({
  imports: [WebScrapingModule, CronJobModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
