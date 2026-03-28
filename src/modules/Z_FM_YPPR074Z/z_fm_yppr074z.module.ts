import { Module } from '@nestjs/common';
import { ZFmYppr074zService } from './z_fm_yppr074z.service';
import { ZFmYppr074zController } from './z_fm_yppr074z.controller';
import { ZFmYppr074zScheduler } from './z_fm_yppr074z.scheduler';
import { SapService } from '../../shared/sap/sap.service';
import { OneLakeService } from '../../shared/fabric/onelake.service';

@Module({
  controllers: [ZFmYppr074zController],
  providers: [
    ZFmYppr074zService,
    SapService,
    OneLakeService,
    ZFmYppr074zScheduler,
  ],
  exports: [ZFmYppr074zService],
})
export class ZFmYppr074zModule {}
