import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OneLakeService } from './onelake.service';

@Module({
  imports: [ConfigModule],
  providers: [OneLakeService],
  exports: [OneLakeService],
})
export class FabricModule {}
