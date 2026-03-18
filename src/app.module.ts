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
  ],
  controllers: [ZRfcTrckSernumController, ZFmRecVendorController],
})
export class AppModule {}
