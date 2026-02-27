import { Controller, Post } from '@nestjs/common';
import { ZRfcTrckSernumService } from './z_rfc_trck_sernum.service';

@Controller('v1/rfc/z_rfc_trck_sernum')
export class ZRfcTrckSernumController {
  constructor(private readonly svc: ZRfcTrckSernumService) {}

  @Post('run')
  run() {
    return this.svc.runAll();
  }
}
