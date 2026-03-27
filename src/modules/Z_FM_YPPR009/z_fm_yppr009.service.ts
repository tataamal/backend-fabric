import { Injectable, Logger } from '@nestjs/common';
import { SapService } from '../../shared/sap/sap.service';
import { OneLakeService } from '../../shared/fabric/onelake.service';
import { normalizeTData1 } from '../Z_FM_YPPR009/z_fm_yppr009.mapper';

const RFC_NAME = 'Z_FM_YPPR009';

const DEFAULT_DISPO_LIST_3000 = [
  'G32',
  'D28',
  'G31',
  'MA4',
  'D23',
  'MA5',
  'D24',
  'D22',
  'D27',
];

const DEFAULT_DISPO_LIST_2000 = [
  'GD1',
  'GF1',
  'GF2',
];

function parseBapiReturns(ret: any): Array<{
  TYPE: string | null;
  MESSAGE: string | null;
  ID: string | null;
  NUMBER: string | null;
}> {
  if (!ret) return [];

  const arr = Array.isArray(ret) ? ret : [ret];

  return arr.map((item) => ({
    TYPE: item?.TYPE ?? item?.type ?? null,
    MESSAGE: item?.MESSAGE ?? item?.message ?? null,
    ID: item?.ID ?? item?.id ?? null,
    NUMBER: item?.NUMBER ?? item?.number ?? null,
  }));
}

function hasSapError(returns: Array<{ TYPE: string | null }>) {
  return returns.some((r) => r.TYPE === 'E' || r.TYPE === 'A');
}

function normalizeBudat(input: string): string {
  const s = String(input ?? '').trim();

  // support YYYYMMDD
  if (/^\d{8}$/.test(s)) return s;

  // support YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s.replace(/-/g, '');

  throw new Error('Format budat tidak valid. Gunakan YYYYMMDD atau YYYY-MM-DD');
}

function normalizeDispoInput(dispo?: string | string[] | null): string[] {
  if (!dispo) return [];

  if (Array.isArray(dispo)) {
    return dispo.map((x) => String(x).trim().toUpperCase()).filter(Boolean);
  }

  return String(dispo)
    .split(',')
    .map((x) => x.trim().toUpperCase())
    .filter(Boolean);
}

@Injectable()
export class ZFmYppr009Service {
  private readonly logger = new Logger(ZFmYppr009Service.name);

  constructor(
    private readonly sap: SapService,
    private readonly oneLake: OneLakeService,
  ) {}

  async run(params: {
    budat: string;
    dispo?: string | string[];
    werks?: string;
  }) {
    const budat = normalizeBudat(params.budat);
    const werks = String(params.werks ?? '')
      .trim()
      .toUpperCase();

    if (!werks) {
      this.logger.log(`[${RFC_NAME}] Run all WERKS for BUDAT=${budat}`);
      const res3000 = await this.run({ ...params, werks: '3000' });
      const res2000 = await this.run({ ...params, werks: '2000' });
      return {
        ok: res3000.ok && res2000.ok,
        rfc: RFC_NAME,
        budat,
        werks: 'ALL',
        run_count: res3000.run_count + res2000.run_count,
        total_rows: res3000.total_rows + res2000.total_rows,
        results: [...res3000.results, ...res2000.results],
      };
    }

    const requestedDispo = normalizeDispoInput(params.dispo);
    let dispoList = requestedDispo;

    if (dispoList.length === 0) {
      if (werks === '3000') {
        dispoList = DEFAULT_DISPO_LIST_3000;
      } else if (werks === '2000') {
        dispoList = DEFAULT_DISPO_LIST_2000;
      } else {
        throw new Error(`Default DISPO untuk WERKS ${werks} tidak ditemukan`);
      }
    }

    const results: any[] = [];

    for (const dispo of dispoList) {
      this.logger.log(
        `[${RFC_NAME}] START tarik data | BUDAT=${budat} DISPO=${dispo} WERKS=${werks || '-'}`,
      );

      try {
        const sapParams: Record<string, any> = {
          IV_BUDAT: budat,
        };

        if (dispo) {
          sapParams.IV_DISPO = dispo;
        }
        if (werks) {
          sapParams.IV_WERKS = werks;
        }

        const sapResult = await this.sap.call<any>(RFC_NAME, sapParams);

        const returns = parseBapiReturns(sapResult?.RETURN);

        if (hasSapError(returns)) {
          const errMsg =
            returns
              .filter((r) => r.TYPE === 'E' || r.TYPE === 'A')
              .map((r) => r.MESSAGE)
              .filter(Boolean)
              .join(' | ') || 'Unknown SAP error';

          this.logger.error(
            `[${RFC_NAME}] FAIL (SAP RETURN) | BUDAT=${budat} DISPO=${dispo} MSG=${errMsg}`,
          );

          results.push({
            budat,
            dispo,
            werks: werks || null,
            ok: false,
            error_source: 'SAP_RETURN',
            returns,
          });

          continue;
        }

        const normalizedRows = normalizeTData1(sapResult?.T_DATA1);

        const payload = {
          rfc: RFC_NAME,
          budat,
          werks: werks || null,
          dispo,
          extracted_at: new Date().toISOString(),
          return: sapResult?.RETURN ?? null,
          row_count: normalizedRows.length,
          rows: normalizedRows,
        };

        // 1 file per MRP per tanggal
        const fixedFileName =
          `${RFC_NAME}_${budat}_${dispo}${werks ? `_${werks}` : ''}.json`.toLowerCase();

        const upload = await this.oneLake.uploadJson(RFC_NAME, payload, {
          subfolder: dispo.toLowerCase(),
          fileName: fixedFileName,
          useDateFolders: false,
        });

        this.logger.log(
          `[${RFC_NAME}] SUCCESS | BUDAT=${budat} DISPO=${dispo} rows=${normalizedRows.length} -> ${upload.path}`,
        );

        results.push({
          budat,
          dispo,
          werks: werks || null,
          ok: true,
          row_count: normalizedRows.length,
          upload,
        });
      } catch (err: any) {
        const msg = err?.message ?? String(err);

        this.logger.error(
          `[${RFC_NAME}] FAIL (EXCEPTION) | BUDAT=${budat} DISPO=${dispo} MSG=${msg}`,
          err?.stack,
        );

        results.push({
          budat,
          dispo,
          werks: werks || null,
          ok: false,
          error_source: 'EXCEPTION',
          message: msg,
        });
      }
    }

    const total_rows = results.reduce(
      (sum, current) => sum + (current.row_count || 0),
      0,
    );

    return {
      ok: results.every((r) => r.ok),
      rfc: RFC_NAME,
      budat,
      werks: werks || null,
      run_count: results.length,
      total_rows,
      results,
    };
  }
}
