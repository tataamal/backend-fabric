import { Body, Controller, Post } from '@nestjs/common';
import { ZFmRecVendorService } from './z_fm_rec_vendor.service';

@Controller('v1/rfc/z_fm_rec_vendor')
export class ZFmRecVendorController {
  constructor(private readonly svc: ZFmRecVendorService) {}

  @Post('run')
  run(
    @Body()
    body?: {
      p_matnr?: string;
      p_werks?: string;
    },
  ) {
    return this.svc.runAll({
      p_matnr: body?.p_matnr,
      p_werks: body?.p_werks,
    });
  }
}
