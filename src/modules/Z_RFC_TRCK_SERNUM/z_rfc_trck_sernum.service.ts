import { Injectable, Logger } from '@nestjs/common';
import { SapService } from '../../shared/sap/sap.service';
import { OneLakeService } from '../../shared/fabric/onelake.service';
import { normalizeTData1 } from './z_rfc_trck_sernum.mapper';

const RFC_NAME = 'Z_RFC_TRCK_SERNUM';
const BAGIAN_ORDER: Array<'SMG' | 'SBY'> = ['SMG', 'SBY'];

function parseBapiReturn(ret: any) {
  // BAPIRET2 umumnya punya TYPE dan MESSAGE
  const TYPE = ret?.TYPE ?? ret?.type ?? null;
  const MESSAGE = ret?.MESSAGE ?? ret?.message ?? null;
  const ID = ret?.ID ?? ret?.id ?? null;
  const NUMBER = ret?.NUMBER ?? ret?.number ?? null;

  return { TYPE, MESSAGE, ID, NUMBER };
}

@Injectable()
export class ZRfcTrckSernumService {
  private readonly logger = new Logger(ZRfcTrckSernumService.name);

  constructor(
    private readonly sap: SapService,
    private readonly oneLake: OneLakeService,
  ) {}

  async runAll() {
    const results: any[] = [];

    for (const bagian of BAGIAN_ORDER) {
      const tipe = bagian === 'SMG' ? 'Semarang' : 'Surabaya';

      this.logger.log(
        `[${RFC_NAME}] START tarik data | BAGIAN=${bagian} (${tipe})`,
      );

      try {
        const sapResult = await this.sap.call<any>(RFC_NAME, {
          BAGIAN: bagian,
        });

        const ret = parseBapiReturn(sapResult?.RETURN);

        // kalau SAP mengembalikan error via RETURN (tanpa throw)
        if (ret.TYPE === 'E' || ret.TYPE === 'A') {
          const msg = ret.MESSAGE ?? 'Unknown SAP error';
          this.logger.error(
            `[${RFC_NAME}] FAIL (SAP RETURN) | BAGIAN=${bagian} TYPE=${ret.TYPE} MSG=${msg}`,
          );

          results.push({
            bagian,
            tipe,
            ok: false,
            error_source: 'SAP_RETURN',
            return: sapResult?.RETURN ?? null,
          });

          continue; // jangan upload kalau gagal
        }

        const normalizedRows = normalizeTData1(sapResult?.T_DATA1);

        // sisipkan kolom "tipe" setelah sales_order_item
        const rowsWithTipe = normalizedRows.map((row) => {
          const out: Record<string, any> = {};

          // pastikan so_item dulu (kalau ada)
          if ('so_item' in row) out['so_item'] = row['so_item'];

          // kolom baru
          out['tipe'] = tipe;

          // sisanya
          for (const [k, v] of Object.entries(row)) {
            if (k === 'so_item') continue;
            out[k] = v;
          }

          return out;
        });

        const payload = {
          rfc: RFC_NAME,
          bagian,
          tipe,
          extracted_at: new Date().toISOString(),
          return: sapResult?.RETURN ?? null,
          row_count: rowsWithTipe.length,
          rows: rowsWithTipe,
        };

        // ✅ Nama file dibuat tetap (latest) -> delete lama -> upload baru
        const fixedFileName = `${RFC_NAME}_${bagian}.json`.toLowerCase();

        const upload = await this.oneLake.uploadJson(RFC_NAME, payload, {
          subfolder: bagian.toLowerCase(),
          fileName: fixedFileName,
          useDateFolders: false, // <-- ini bikin path selalu sama (latest)
        });

        this.logger.log(
          `[${RFC_NAME}] SUCCESS | BAGIAN=${bagian} rows=${rowsWithTipe.length} -> ${upload.path}`,
        );

        results.push({
          bagian,
          tipe,
          ok: true,
          row_count: rowsWithTipe.length,
          upload,
        });
      } catch (err: any) {
        // kalau node-rfc throw (mis: ABAP runtime error, comm error)
        const msg = err?.message ?? String(err);
        this.logger.error(
          `[${RFC_NAME}] FAIL (EXCEPTION) | BAGIAN=${bagian} MSG=${msg}`,
          err?.stack,
        );

        results.push({
          bagian,
          tipe,
          ok: false,
          error_source: 'EXCEPTION',
          message: msg,
        });
      }
    }

    return {
      ok: results.every((r) => r.ok),
      rfc: RFC_NAME,
      run_count: results.length,
      results,
    };
  }
}
