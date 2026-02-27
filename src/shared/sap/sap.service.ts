import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, Client } from 'node-rfc';

@Injectable()
export class SapService implements OnModuleDestroy {
  private readonly logger = new Logger(SapService.name);
  private readonly pool: Pool;

  constructor(private readonly config: ConfigService) {
    const connectionParameters = {
      user: this.must('SAP_USER'),
      passwd: this.must('SAP_PASS'),
      ashost: this.must('SAP_ASHOST'),
      sysnr: this.must('SAP_SYSNR'),
      client: this.must('SAP_CLIENT'),
      lang: this.config.get<string>('SAP_LANG') ?? 'EN',
    };

    // node-rfc: pakai poolOptions (bukan poolParameters)
    this.pool = new Pool({
      connectionParameters,
      poolOptions: { low: 0, high: 4 },
      // clientOptions: { stateless: true }, // optional
    });

    this.logger.log(
      `SAP pool ready: ASHOST=${connectionParameters.ashost} SYSNR=${connectionParameters.sysnr} CLIENT=${connectionParameters.client}`,
    );
  }

  private must(key: string): string {
    const v = this.config.get<string>(key);
    if (!v) throw new Error(`Missing env: ${key}`);
    return v;
  }

  private async acquireOne(): Promise<Client> {
    // acquire() overload bisa mengembalikan void | Client | Client[]
    const acquired = await this.pool.acquire();

    if (!acquired) {
      // ini biasanya terjadi kalau kamu pakai callback style
      throw new Error(
        'Pool.acquire() returned void. Pastikan pakai async/await tanpa callback.',
      );
    }

    return Array.isArray(acquired) ? acquired[0] : acquired;
  }

  async call<T = any>(
    rfcName: string,
    params: Record<string, any> = {},
  ): Promise<T> {
    const client = await this.acquireOne();

    try {
      const result = (await client.call(rfcName.toUpperCase(), params)) as T;
      return result;
    } catch (err: any) {
      this.logger.error(`RFC failed: ${rfcName}`, err?.stack ?? err);
      throw err;
    } finally {
      // managed client -> release balik ke pool
      await client.release();
    }
  }

  async ping() {
    return this.call('STFC_CONNECTION', { REQUTEXT: 'ping-from-nest' });
  }

  async onModuleDestroy() {
    // closeAll ada, tapi doc bilang internal—opsional dipanggil.
    try {
      // @ts-ignore
      await this.pool.closeAll?.();
    } catch {
      // ignore
    }
  }
}
