import { Injectable, Logger } from '@nestjs/common';
import { SapService } from '../../shared/sap/sap.service';
import { OneLakeService } from '../../shared/fabric/onelake.service';
import { normalizeTData, cleanString } from './z_fm_rec_vendor.mapper';

const RFC_NAME = 'Z_FM_REC_VENDOR';

// daftar MATKL dari gambar (yang terlihat jelas)
const MATKL_LIST: string[] = [
  'RGLU03',
  'RHA001',
  'RHA002',
  'RHA003',
  'RHA004',
  'RHA005',
  'RHA006',
  'RHA007',
  'RHA008',
  'RHA009',
  'RHA010',
  'RHA011',
  'RHA012',
  'RHA013',
  'RHA014',
  'RHA015',
  'RHA016',
  'RHA017',
  'RHG001',
  'RHG002',
  'RHS001',
  'RHS002',
];

@Injectable()
export class ZFmRecVendorService {
  private readonly logger = new Logger(ZFmRecVendorService.name);

  constructor(
    private readonly sap: SapService,
    private readonly oneLake: OneLakeService,
  ) {}

  async runAll(query?: { p_matnr?: string; p_werks?: string }) {
    const results: any[] = [];

    const pMatnr = cleanString(query?.p_matnr) ?? '';
    const pWerks = cleanString(query?.p_werks) ?? '';

    for (const matkl of MATKL_LIST) {
      const payload = {
        P_MATKL: matkl,
        P_MATNR: pMatnr,
        P_WERKS: pWerks,
      };

      this.logger.log(
        `[${RFC_NAME}] START | MATKL=${matkl} | P_MATNR=${pMatnr || '-'} | P_WERKS=${pWerks || '-'}`,
      );

      try {
        const sapResult = await this.sap.call<any>(RFC_NAME, payload);
        const rows = normalizeTData(sapResult?.T_DATA);

        const jsonPayload = {
          rfc: RFC_NAME,
          matkl,
          params: payload,
          extracted_at: new Date().toISOString(),
          row_count: rows.length,
          rows,
        };

        const fixedFileName = `${RFC_NAME}_${matkl}.json`.toLowerCase();

        const upload = await this.oneLake.uploadJson(RFC_NAME, jsonPayload, {
          subfolder: matkl.toLowerCase(),
          fileName: fixedFileName,
          useDateFolders: false,
        });

        this.logger.log(
          `[${RFC_NAME}] SUCCESS | MATKL=${matkl} rows=${rows.length} -> ${upload.path}`,
        );

        results.push({
          matkl,
          ok: true,
          row_count: rows.length,
          upload,
        });
      } catch (err: any) {
        const msg = err?.message ?? String(err);

        this.logger.error(
          `[${RFC_NAME}] FAIL | MATKL=${matkl} MSG=${msg}`,
          err?.stack,
        );

        results.push({
          matkl,
          ok: false,
          row_count: 0,
          message: msg,
        });
      }
    }

    const totalRows = results.reduce(
      (sum, item) => sum + (item.row_count || 0),
      0,
    );

    return {
      ok: results.every((r) => r.ok),
      rfc: RFC_NAME,
      run_count: results.length,
      total_rows: totalRows,
      params: {
        p_matnr: pMatnr || null,
        p_werks: pWerks || null,
      },
      results,
    };
  }
}
