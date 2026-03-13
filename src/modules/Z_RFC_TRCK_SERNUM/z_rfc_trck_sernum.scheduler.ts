import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ZRfcTrckSernumService } from './z_rfc_trck_sernum.service';

@Injectable()
export class ZRfcTrckSernumScheduler {
  private readonly logger = new Logger(ZRfcTrckSernumScheduler.name);

  constructor(private readonly zRfcTrckSernumService: ZRfcTrckSernumService) {}

  @Cron('0 0 4,12,18 * * *', {
    name: 'z_rfc_trck_sernum_daily_3x',
    timeZone: 'Asia/Jakarta',
    waitForCompletion: true,
  })
  async handleCron() {
    this.logger.log('Cron Z_RFC_TRCK_SERNUM started');

    try {
      const result = await this.zRfcTrckSernumService.runAll();

      this.logger.log(
        `Cron Z_RFC_TRCK_SERNUM finished | ${JSON.stringify(result)}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Cron Z_RFC_TRCK_SERNUM failed: ${error?.message ?? String(error)}`,
        error?.stack,
      );
    }
  }
}
