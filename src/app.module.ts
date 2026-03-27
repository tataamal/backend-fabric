import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { SapModule } from './shared/sap/sap.module';
import { FabricModule } from './shared/fabric/fabric.module';
import { TestModuleV1 } from './api/v1/test/test.module';
import { ZRfcTrckSernumService } from './modules/Z_RFC_TRCK_SERNUM/z_rfc_trck_sernum.service';
import { ZRfcTrckSernumController } from './modules/Z_RFC_TRCK_SERNUM/z_rfc_trck_sernum.controller';
import { ZRfcTrckSernumScheduler } from './modules/Z_RFC_TRCK_SERNUM/z_rfc_trck_sernum.scheduler';
import { ZFmRecVendorService } from './modules/Z_FM_REC_VENDOR/z_fm_rec_vendor.service';
import { ZFmRecVendorController } from './modules/Z_FM_REC_VENDOR/z_fm_rec_vendor.controller';
import { ZFmRecVendorScheduler } from './modules/Z_FM_REC_VENDOR/z_fm_rec_vendor.scheduler';
import { ZFmYppr009Service } from './modules/Z_FM_YPPR009/z_fm_yppr009.service';
import { ZFmYppr009Controller } from './modules/Z_FM_YPPR009/z_fm_yppr009.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SapModule,
    FabricModule,
    TestModuleV1,
  ],
  providers: [
    ZRfcTrckSernumService,
    ZRfcTrckSernumScheduler,
    ZFmRecVendorService,
    ZFmRecVendorScheduler,
    ZFmYppr009Service,
  ],
  controllers: [ZRfcTrckSernumController, ZFmRecVendorController, ZFmYppr009Controller],
})
export class AppModule {}
