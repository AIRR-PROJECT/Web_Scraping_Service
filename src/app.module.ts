import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { WebScrapingModule } from './modules/web_scraping/web_scraping.module';
import { CronJobModule } from './modules/cron_job/cron_job.module';
import { LangChainModule } from './modules/langchain/langchain.module';
import { DatabaseModule } from './shared/database.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true, // Tui set cái này để load env
        }),
        LangChainModule,
        WebScrapingModule,
        DatabaseModule,
        // CronJobModule
    ],
    // imports: [WebScrapingModule, CronJobModule, LangchainModule, DatabaseModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
