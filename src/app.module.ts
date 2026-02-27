import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SapModule } from './shared/sap/sap.module';
import { FabricModule } from './shared/fabric/fabric.module';
import { TestModuleV1 } from './api/v1/test/test.module';
import { TestControllerV1 } from './api/v1/test/test.controller';
import { ZRfcTrckSernumService } from './modules/Z_RFC_TRCK_SERNUM/z_rfc_trck_sernum.service';
import { ZRfcTrckSernumController } from './modules/Z_RFC_TRCK_SERNUM/z_rfc_trck_sernum.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    SapModule,
    FabricModule,
    TestModuleV1,
  ],
  providers: [ZRfcTrckSernumService],
  controllers: [ZRfcTrckSernumController],
})
export class AppModule {}
