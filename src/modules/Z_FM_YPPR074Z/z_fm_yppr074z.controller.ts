import { Controller, Post } from '@nestjs/common';
import { ZFmYppr074zService } from './z_fm_yppr074z.service';

@Controller('v1/rfc/z_fm_yppr074z')
export class ZFmYppr074zController {
  constructor(private readonly svc: ZFmYppr074zService) {}

  @Post('run')
  run() {
    return this.svc.runAll();
  }
}
