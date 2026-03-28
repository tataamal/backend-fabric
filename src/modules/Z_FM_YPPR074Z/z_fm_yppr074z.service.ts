import { Injectable, Logger } from '@nestjs/common';
import { SapService } from '../../shared/sap/sap.service';
import { OneLakeService } from '../../shared/fabric/onelake.service';
import { normalizeZFmYppr074z } from './z_fm_yppr074z.mapper';

const RFC_NAME = 'Z_FM_YPPR074Z';
const ALLOWED_WERKSX = ['3014', '3015', '3016', '2002', '2007', '2008'];

function getUniqueSapRows(rows: any[], uniqueFields: string[]): any[] {
  if (!Array.isArray(rows)) return [];
  const seen = new Set<string>();
  const result: any[] = [];
  
  for (const row of rows) {
    const werksx = String(row.WERKSX || '').trim();
    if (!ALLOWED_WERKSX.includes(werksx)) continue;
    
    const key = uniqueFields.map((f) => String(row[f] || '').trim()).join('|');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(row);
    }
  }
  return result;
}

@Injectable()
export class ZFmYppr074zService {
  private readonly logger = new Logger(ZFmYppr074zService.name);

  constructor(
    private readonly sap: SapService,
    private readonly oneLake: OneLakeService,
  ) {}

  async runAll() {
    this.logger.log(`[${RFC_NAME}] START pulling data`);
    try {
      // 1. Fetch data from SAP
      let combinedTData1: any[] = [];
      let combinedTData2: any[] = [];
      let combinedTData3: any[] = [];
      let combinedTData4: any[] = [];
      let allReturns: any[] = [];

      for (const werks of ALLOWED_WERKSX) {
        this.logger.log(`[${RFC_NAME}] Fetching data for P_WERKS=${werks}`);
        const sapResult = await this.sap.call<any>(RFC_NAME, {
          P_WERKS: werks,
        });

        const ret = sapResult?.RETURN || [];
        const hasError = Array.isArray(ret) && ret.some((r: any) => r?.TYPE === 'E' || r?.TYPE === 'A');
        if (hasError) {
          this.logger.error(`[${RFC_NAME}] SAP returned error for P_WERKS=${werks}`);
        }
        if (Array.isArray(ret)) allReturns.push(...ret);

        if (Array.isArray(sapResult?.T_DATA1)) combinedTData1.push(...sapResult.T_DATA1);
        if (Array.isArray(sapResult?.T_DATA2)) combinedTData2.push(...sapResult.T_DATA2);
        if (Array.isArray(sapResult?.T_DATA3)) combinedTData3.push(...sapResult.T_DATA3);
        if (Array.isArray(sapResult?.T_DATA4)) combinedTData4.push(...sapResult.T_DATA4);
      }

      // 2. Extract unique rows using defined keys
      const uniqueTData2 = getUniqueSapRows(combinedTData2, [
        'WERKSX',
        'KDAUF',
        'KDPOS',
        'KUNNR',
        'NAME1',
      ]);

      const uniqueTData3 = getUniqueSapRows(combinedTData3, [
        'WERKSX',
        'KDAUF',
        'KDPOS',
      ]);

      const uniqueTData1 = getUniqueSapRows(combinedTData1, [
        'WERKSX',
        'AUFNR',
        'VORNR',
      ]);

      const uniqueTData4 = getUniqueSapRows(combinedTData4, [
        'WERKSX',
        'AUFNR',
        'RSNUM',
        'RSPOS',
      ]);

      // 3. Map into expected format
      const mappedData = normalizeZFmYppr074z({
        RETURN: allReturns,
        T_DATA1: uniqueTData1,
        T_DATA2: uniqueTData2,
        T_DATA3: uniqueTData3,
        T_DATA4: uniqueTData4,
      });

      // 4. Upload separately to OneLake
      const currentIsoTime = new Date().toISOString();

      const uploadTasks = [
        {
          name: 'operation_item_data',
          data: mappedData.operation_item_data,
        },
        {
          name: 'buyer_so_item_data',
          data: mappedData.buyer_so_item_data,
        },
        {
          name: 'pro_data',
          data: mappedData.pro_data,
        },
        {
          name: 'component_data',
          data: mappedData.component_data,
        },
      ];

      const uploadResults: any[] = [];

      for (const task of uploadTasks) {
        const payload = {
          rfc: RFC_NAME,
          table: task.name,
          extracted_at: currentIsoTime,
          row_count: task.data.length,
          rows: task.data,
        };

        const uploadRes = await this.oneLake.uploadJson(
          RFC_NAME,
          payload,
          {
            subfolder: task.name.toLowerCase(),
            fileName: `${RFC_NAME}_${task.name}.json`.toLowerCase(),
            useDateFolders: false,
          },
        );

        uploadResults.push({
          table: task.name,
          row_count: task.data.length,
          upload: uploadRes,
        });

        this.logger.log(`[${RFC_NAME}] SUCCESS table=${task.name} rows=${task.data.length}`);
      }

      return {
        ok: true,
        rfc: RFC_NAME,
        run_count: uploadTasks.length,
        results: uploadResults,
      };
    } catch (err: any) {
      this.logger.error(
        `[${RFC_NAME}] FAIL (EXCEPTION) MSG=${err?.message ?? String(err)}`,
        err?.stack,
      );
      return {
        ok: false,
        error_source: 'EXCEPTION',
        message: err?.message ?? String(err),
      };
    }
  }
}
