type SapRow = Record<string, any>;

const OMIT_FIELDS = new Set([
  'MANDT',
  'OBKNR',
  'MATNR',
  'WERKS',
  'LGORT',
  'DISPO',
  'ASSY',
  'PAINT',
  'PACKG',
]);

const RENAME_MAP: Record<string, string> = {
  // serial
  SERNR: 'serial_number',

  // Material per proses
  MATNR1: 'material_assy',
  MATNR2: 'material_painting',
  MATNR3: 'material_packing',

  // Batch per proses
  CHARG1: 'batch_assy',
  CHARG2: 'batch_painting',
  CHARG3: 'batch_packing',

  // Storage location per proses
  LGORT1: 'storage_assy',
  LGORT2: 'storage_painting',
  LGORT3: 'storage_packing',

  // Order per proses
  AUFNR1: 'pro_assy',
  AUFNR2: 'pro_painting',
  AUFNR3: 'pro_packing',

  // Planner per proses
  DISPO1: 'mrp_assy',
  DISPO2: 'mrp_painting',
  DISPO3: 'mrp_packing',

  // Material document per proses
  MBLNR1: 'material_doc_assy',
  MBLNR2: 'material_doc_painting',
  MBLNR3: 'material_doc_packing',

  // Posting date per proses
  BUDAT1: 'posting_date_assy',
  BUDAT2: 'posting_date_painting',
  BUDAT3: 'posting_date_packing',

  // Personel
  PERNR1: 'nik_assy',
  PERNR2: 'nik_painting',
  PERNR3: 'nik_packing',
};

function toIsoDateIfSapDate(v: any): any {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (!/^\d{8}$/.test(s)) return v;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function stripLeadingZeros(v: any): string {
  const s = String(v ?? '').trim();
  // kalau empty, return empty
  if (!s) return '';
  // hilangkan leading zero, tapi kalau semuanya zero -> jadi "0"
  const stripped = s.replace(/^0+/, '');
  return stripped === '' ? '0' : stripped;
}

export function normalizeTData1(rows: SapRow[] | undefined | null): SapRow[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const out: SapRow = {};

    let kdauf: any = null;
    let kdpos: any = null;

    for (const [key, value] of Object.entries(row)) {
      const sapKey = key.toUpperCase();

      if (sapKey === 'KDAUF') {
        kdauf = value;
        continue;
      }
      if (sapKey === 'KDPOS') {
        kdpos = value;
        continue;
      }

      if (OMIT_FIELDS.has(sapKey)) continue;

      const newKey = RENAME_MAP[sapKey] ?? sapKey.toLowerCase();
      const newValue = sapKey.startsWith('BUDAT')
        ? toIsoDateIfSapDate(value)
        : value;

      out[newKey] = newValue;
    }

    // gabungkan jadi so_item: "<KDAUF> - <KDPOS tanpa leading zero>"
    const so = String(kdauf ?? '').trim();
    const item = stripLeadingZeros(kdpos);
    if (so && item) out['so_item'] = `${so} - ${item}`;
    else if (so)
      out['so_item'] = so; // fallback kalau item kosong
    else if (item) out['so_item'] = item;

    return out;
  });
}
