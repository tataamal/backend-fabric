import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ZFmYppr074zService } from './z_fm_yppr074z.service';

@Injectable()
export class ZFmYppr074zScheduler {
  private readonly logger = new Logger(ZFmYppr074zScheduler.name);

  constructor(private readonly svc: ZFmYppr074zService) {}

  @Cron('0 0 1 * * *', {
    name: 'z_fm_yppr074z_daily_1am',
    timeZone: 'Asia/Jakarta',
    waitForCompletion: true,
  })
  async handleCron() {
    this.logger.log('Cron Z_FM_YPPR074Z started');

    try {
      const result = await this.svc.runAll();

      this.logger.log(
        `Cron Z_FM_YPPR074Z finished | ${JSON.stringify(result)}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Cron Z_FM_YPPR074Z failed: ${error?.message ?? String(error)}`,
        error?.stack,
      );
    }
  }
}
