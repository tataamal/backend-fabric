import { Body, Controller, Post } from '@nestjs/common';
import { ZFmYppr009Service } from './z_fm_yppr009.service';

@Controller('v1/z-fm-yppr009')
export class ZFmYppr009Controller {
  constructor(private readonly svc: ZFmYppr009Service) {}

  @Post()
  run(
    @Body()
    body: {
      budat: string;
      dispo?: string | string[];
      werks?: string;
    },
  ) {
    return this.svc.run({
      budat: body?.budat,
      dispo: body?.dispo,
      werks: body?.werks,
    });
  }
}
