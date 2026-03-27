import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ZFmYppr009Service } from './z_fm_yppr009.service';

@Injectable()
export class ZFmYppr009Scheduler {
  private readonly logger = new Logger(ZFmYppr009Scheduler.name);

  constructor(private readonly svc: ZFmYppr009Service) {}

  // Run at 23:00 everyday
  @Cron('0 23 * * *', {
    timeZone: 'Asia/Jakarta', // Assuming Jakarta timezone, change if necessary
  })
  async handleCron() {
    this.logger.log('Starting daily scheduled ZFmYppr009 job');
    const date = new Date();
    // format to YYYY-MM-DD
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const budat = `${yyyy}-${mm}-${dd}`;

    try {
      // Missing werks parameter means it will run for both 3000 and 2000
      const result = await this.svc.run({ budat });
      this.logger.log(`Scheduled job completed for ${budat}: ${JSON.stringify({ ok: result.ok, total_rows: result.total_rows })}`);
    } catch (err) {
      this.logger.error(`Scheduled job failed for ${budat}`, err);
    }
  }
}
