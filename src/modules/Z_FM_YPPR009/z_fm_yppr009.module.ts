import { Module } from '@nestjs/common';
import { ZFmYppr009Service } from './z_fm_yppr009.service';
import { ZFmYppr009Controller } from './z_fm_yppr009.controller';
import { SapService } from '../../shared/sap/sap.service';
import { OneLakeService } from '../../shared/fabric/onelake.service';
import { ZFmYppr009Scheduler } from './z_fm_yppr009.scheduler';

@Module({
  controllers: [ZFmYppr009Controller],
  providers: [ZFmYppr009Service, SapService, OneLakeService, ZFmYppr009Scheduler],
  exports: [ZFmYppr009Service],
})
export class ZFmYppr009Module {}
