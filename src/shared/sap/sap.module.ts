import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SapService } from './sap.service';

@Module({
  imports: [ConfigModule],
  providers: [SapService],
  exports: [SapService],
})
export class SapModule {}
