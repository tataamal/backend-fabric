import { Controller, Get } from '@nestjs/common';
import { SapService } from '../../../shared/sap/sap.service';
import { OneLakeService } from '../../../shared/fabric/onelake.service';

@Controller('v1/test')
export class TestControllerV1 {
  constructor(
    private readonly sap: SapService,
    private readonly oneLake: OneLakeService,
  ) {}

  @Get('sap-ping')
  sapPing() {
    return this.sap.ping();
  }

  @Get('sap-to-lakehouse')
  async sapToLakehouse() {
    const result = await this.sap.ping(); // nanti ganti RFC kamu
    const upload = await this.oneLake.uploadJson('STFC_CONNECTION', result);
    return { ok: true, upload };
  }
}
