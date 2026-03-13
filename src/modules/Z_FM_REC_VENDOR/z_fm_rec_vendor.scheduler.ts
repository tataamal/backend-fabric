import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ZFmRecVendorService } from './z_fm_rec_vendor.service';

@Injectable()
export class ZFmRecVendorScheduler {
  private readonly logger = new Logger(ZFmRecVendorScheduler.name);

  constructor(private readonly zFmRecVendorService: ZFmRecVendorService) {}

  @Cron('0 0 1 * * *', {
    name: 'z_fm_rec_vendor_daily',
    timeZone: 'Asia/Jakarta',
    waitForCompletion: true,
  })
  async handleCron() {
    this.logger.log('Cron Z_FM_REC_VENDOR started');

    try {
      const result = await this.zFmRecVendorService.runAll();

      this.logger.log(
        `Cron Z_FM_REC_VENDOR finished | ok=${result.ok} | run_count=${result.run_count} | total_rows=${result.total_rows}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Cron Z_FM_REC_VENDOR failed: ${error?.message ?? String(error)}`,
        error?.stack,
      );
    }
  }
}
