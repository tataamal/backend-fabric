import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SapModule } from './shared/sap/sap.module';
import { FabricModule } from './shared/fabric/fabric.module';
import { TestModuleV1 } from './api/v1/test/test.module';
import { TestControllerV1 } from './api/v1/test/test.controller';
import { ZRfcTrckSernumService } from './modules/Z_RFC_TRCK_SERNUM/z_rfc_trck_sernum.service';
import { ZRfcTrckSernumController } from './modules/Z_RFC_TRCK_SERNUM/z_rfc_trck_sernum.controller';
import { ZFmRecVendorService } from './modules/Z_FM_REC_VENDOR/z_fm_rec_vendor.service';
import { ZFmRecVendorController } from './modules/Z_FM_REC_VENDOR/z_fm_rec_vendor.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SapModule,
    FabricModule,
    TestModuleV1,
  ],
  providers: [ZRfcTrckSernumService, ZFmRecVendorService],
  controllers: [ZRfcTrckSernumController, ZFmRecVendorController],
})
export class AppModule {}
