import { Controller, Get } from '@nestjs/common';
import { SapService } from './shared/sap/sap.service';
import { OneLakeService } from './shared/fabric/onelake.service';

@Controller()
export class AppController {
  constructor(
    private readonly sap: SapService,
    private readonly oneLake: OneLakeService,
  ) {}

  @Get('test/sap-ping')
  async sapPing() {
    return this.sap.ping();
  }

  @Get('test/sap-to-lakehouse')
  async sapToLakehouse() {
    const result = await this.sap.ping(); // nanti ganti RFC kamu
    const upload = await this.oneLake.uploadJson('STFC_CONNECTION', result);
    return { ok: true, upload };
  }
}
