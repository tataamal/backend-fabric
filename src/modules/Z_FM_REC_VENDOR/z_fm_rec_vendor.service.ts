import { Injectable, Logger } from '@nestjs/common';
import { SapService } from '../../shared/sap/sap.service';
import { OneLakeService } from '../../shared/fabric/onelake.service';
import { normalizeTData, cleanString } from './z_fm_rec_vendor.mapper';

const RFC_NAME = 'Z_FM_REC_VENDOR';

// daftar MATKL dari gambar (yang terlihat jelas)
const MATKL_LIST: string[] = [
  'VSR001', 'VSF001', 'VPL001', 'VPF001', 'VBX005', 'VBX004', 'VBX003', 'VBX002', 'VBX001', 'UTL006',
  'UTL005', 'UTL004', 'UTL003', 'UTL002', 'UTL001', 'SVC030', 'SVC029', 'SVC028', 'SVC027', 'SVC026',
  'SVC025', 'SVC024', 'SVC023', 'SVC022', 'SVC021', 'SVC020', 'SVC019', 'SVC018', 'SVC017', 'SVC016',
  'SVC015', 'SVC014', 'SVC013', 'SVC012', 'SVC011', 'SVC010', 'SVC009', 'SVC008', 'SVC007', 'SVC006',
  'SVC005', 'SVC004', 'SVC003', 'SVC002', 'SVC001', 'RWVN46', 'RWVN45', 'RWVN44', 'RWVN43', 'RWVN42',
  'RWVN41', 'RWVN40', 'RWVN39', 'RWVN38', 'RWVN37', 'RWVN36', 'RWVN35', 'RWVN34', 'RWVN33', 'RWVN32',
  'RWVN31', 'RWVN30', 'RWVN29', 'RWVN28', 'RWVN27', 'RWVN26', 'RWVN25', 'RWVN24', 'RWVN23', 'RWVN22',
  'RWVN21', 'RWVN20', 'RWVN19', 'RWVN18', 'RWVN17', 'RWVN16', 'RWVN15', 'RWVN14', 'RWVN13', 'RWVN12',
  'RWVN11', 'RWVN10', 'RWVN09', 'RWVN08', 'RWVN07', 'RWVN06', 'RWVN05', 'RWVN04', 'RWVN03', 'RWVN02',
  'RWVN01', 'RWST32', 'RWST31', 'RWST30', 'RWST29', 'RWST28', 'RWST27', 'RWST26', 'RWST25', 'RWST24',
  'RWST23', 'RWST22', 'RWST21', 'RWST20', 'RWST19', 'RWST18', 'RWST17', 'RWST16', 'RWST15', 'RWST14',
  'RWST13', 'RWST12', 'RWST11', 'RWST10', 'RWST09', 'RWST08', 'RWST07', 'RWST06', 'RWST05', 'RWST04',
  'RWST03', 'RWST02', 'RWST01', 'RWPR01', 'RWPN11', 'RWPN10', 'RWPN09', 'RWPN08', 'RWPN07', 'RWPN06',
  'RWPN05', 'RWPN04', 'RWPN03', 'RWPN02', 'RWPN01', 'RWM013', 'RWM012', 'RWM011', 'RWM010', 'RWM009',
  'RWM008', 'RWM007', 'RWM006', 'RWM005', 'RWM004', 'RWM003', 'RWM002', 'RWM001', 'RWLG13', 'RWLG12',
  'RWLG11', 'RWLG10', 'RWLG09', 'RWLG08', 'RWLG07', 'RWLG06', 'RWLG05', 'RWLG04', 'RWLG03', 'RWLG02',
  'RWLG01', 'RTOL08', 'RTOL07', 'RTOL06', 'RTOL05', 'RTOL04', 'RTOL03', 'RTOL02', 'RTOL01', 'RPN007',
  'RPN006', 'RPN005', 'RPN004', 'RPN003', 'RPN002', 'RPN001', 'RHU007', 'RHU006', 'RHU005', 'RHU004',
  'RHU003', 'RHU002', 'RHU001', 'RHS012', 'RHS011', 'RHS010', 'RHS009', 'RHS008', 'RHS007', 'RHS006',
  'RHS005', 'RHS004', 'RHS003', 'RHS002', 'RHS001', 'RHG002', 'RHG001', 'RHA017', 'RHA016', 'RHA015',
  'RHA014', 'RHA013', 'RHA012', 'RHA011', 'RHA010', 'RHA009', 'RHA008', 'RHA007', 'RHA006', 'RHA005',
  'RHA004', 'RHA003', 'RHA002', 'RHA001', 'RGLU03', 'RGLU02', 'RGLU01', 'RCH001', 'OSS024', 'OSS023',
  'OSS022', 'OSS021', 'OSS020', 'OSS019', 'OSS018', 'OSS017', 'OSS016', 'OSS015', 'OSS014', 'OSS013',
  'OSS012', 'OSS011', 'OSS010', 'OSS009', 'OSS008', 'OSS007', 'OSS006', 'OSS005', 'OSS004', 'OSS003',
  'OSS002', 'OSS001', 'NSU009', 'NSU008', 'NSU007', 'NSU006', 'NSU005', 'NSU004', 'NSU003', 'NSU002',
  'NSU001', 'HSF072', 'HSF071', 'HSF070', 'HSF069', 'HSF068', 'HSF067', 'HSF066', 'HSF065', 'HSF064',
  'HSF063', 'HSF062', 'HSF061', 'HSF060', 'HSF059', 'HSF058', 'HSF057', 'HSF056', 'HSF055', 'HSF054',
  'HSF053', 'HSF052', 'HSF051', 'HSF050', 'HSF049', 'HSF048', 'HSF047', 'HSF046', 'HSF045', 'HSF044',
  'HSF043', 'HSF042', 'HSF041', 'HSF040', 'HSF039', 'HSF038', 'HSF037', 'HSF036', 'HSF035', 'HSF034',
  'HSF033', 'HSF032', 'HSF031', 'HSF030', 'HSF029', 'HSF028', 'HSF027', 'HSF026', 'HSF025', 'HSF024',
  'HSF023', 'HSF022', 'HSF021', 'HSF020', 'HSF019', 'HSF018', 'HSF017', 'HSF016', 'HSF015', 'HSF014',
  'HSF013', 'HSF012', 'HSF011', 'HSF010', 'HSF009', 'HSF008', 'HSF007', 'HSF006', 'HSF005', 'HSF004',
  'HSF003', 'HSF002', 'HSF001', 'FFG016', 'FFG015', 'FFG014', 'FFG013', 'FFG012', 'FFG011', 'FFG010',
  'FFG009', 'FFG008', 'FFG007', 'FFG006', 'FFG005', 'FFG004', 'FFG003', 'FFG002', 'FFG001', 'ESP050',
  'ESP049', 'ESP048', 'ESP047', 'ESP046', 'ESP045', 'ESP044', 'ESP043', 'ESP042', 'ESP041', 'ESP040',
  'ESP039', 'ESP038', 'ESP037', 'ESP036', 'ESP035', 'ESP034', 'ESP033', 'ESP032', 'ESP031', 'ESP030',
  'ESP029', 'ESP028', 'ESP027', 'ESP026', 'ESP025', 'ESP024', 'ESP023', 'ESP022', 'ESP021', 'ESP020',
  'ESP019', 'ESP018', 'ESP017', 'ESP016', 'ESP015', 'ESP014', 'ESP013', 'ESP012', 'ESP011', 'ESP010',
  'ESP009', 'ESP008', 'ESP007', 'ESP006', 'ESP005', 'ESP004', 'ESP003', 'ESP002', 'ESP001', 'DA03',
  'DA02', 'DA01', 'DA00', '02', '01'
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
