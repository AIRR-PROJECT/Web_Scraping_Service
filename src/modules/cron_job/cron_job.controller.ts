import { Controller, Get } from '@nestjs/common';
import { CronJobService } from './cron_job.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('cron-job')
@Controller('cron-job')
export class CronJobController {
    constructor(private readonly cronService: CronJobService) {}

    @Get('start')
    startCron() {
        this.cronService.cronJob();
        return 'Cron job started!';
    }

    @Get('clear')
    clearCron() {
        this.cronService.stopCronJob();
        return 'Cron job cleared!';
    }
}

