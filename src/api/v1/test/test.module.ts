import { Module } from '@nestjs/common';
import { TestControllerV1 } from './test.controller';
import { SapModule } from '../../../shared/sap/sap.module';
import { FabricModule } from '../../../shared/fabric/fabric.module';

@Module({
  imports: [SapModule, FabricModule],
  controllers: [TestControllerV1],
})
export class TestModuleV1 {}
