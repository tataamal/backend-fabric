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
  'SERNR',
]);

const RENAME_MAP: Record<string, string> = {
  // serial
  SERIAL_NO: 'serial_number',

  // Net Price
  NETPR: 'net_price',

  // Currency
  WAERK: 'currency',

  // Material Inspection
  MATNR1: 'material_inspection_assy',
  MATNR2: 'material_inspection_painting',
  MATNR3: 'material_inspection_packing',

  // Material Number
  MATNR1X: 'material_assy',
  MATNR2X: 'material_painting',
  MATNR3X: 'material_packing',

  // Batch Number Inspection
  CHARG1: 'batch_inspection_assy',
  CHARG2: 'batch_inspection_painting',
  CHARG3: 'batch_inspection_packing',
  // Batch Number
  CHARG1X: 'batch_assy',
  CHARG2X: 'batch_painting',
  CHARG3X: 'batch_packing',

  // Storage location
  LGORT1X: 'storage_assy',
  LGORT2X: 'storage_painting',
  LGORT3X: 'storage_packing',

  // Storage location Inspection
  LGORT1: 'storage_inspection_assy',
  LGORT2: 'storage_inspection_painting',
  LGORT3: 'storage_inspection_packing',

  // Order
  AUFNR1X: 'pro_assy',
  AUFNR2X: 'pro_painting',
  AUFNR3X: 'pro_packing',

  // Order Inspection
  AUFNR1: 'pro_inspection_assy',
  AUFNR2: 'pro_inspection_painting',
  AUFNR3: 'pro_inspection_packing',

  // MRP
  DISPO1X: 'mrp_assy',
  DISPO2X: 'mrp_painting',
  DISPO3X: 'mrp_packing',

  // MRP Inspection
  DISPO1: 'mrp_inspection_assy',
  DISPO2: 'mrp_inspection_painting',
  DISPO3: 'mrp_inspection_packing',

  // Material document
  MBLNR1X: 'material_doc_assy',
  MBLNR2X: 'material_doc_painting',
  MBLNR3X: 'material_doc_packing',

  // Material document Inspection
  MBLNR1: 'material_doc_inspection_assy',
  MBLNR2: 'material_doc_inspection_painting',
  MBLNR3: 'material_doc_inspection_packing',

  // Posting date
  BUDAT1X: 'posting_date_assy',
  BUDAT2X: 'posting_date_painting',
  BUDAT3X: 'posting_date_packing',

  // Posting date Inspection
  BUDAT1: 'posting_date_inspection_assy',
  BUDAT2: 'posting_date_inspection_painting',
  BUDAT3: 'posting_date_inspection_packing',

  // Personel Number
  PERNR1X: 'person_assy',
  PERNR2X: 'person_painting',
  PERNR3X: 'person_packing',

  // Personel Instpect
  PERNR1: 'inspect_assy',
  PERNR2: 'inspect_painting',
  PERNR3: 'inspect_packing',
};

function toIsoDateIfSapDate(v: any): any {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (s === '00000000' || s === '0000-00-00') return null;
  if (!/^\d{8}$/.test(s)) return v;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function cleanMatnr(v: any): any {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (/^\d+$/.test(s)) {
    const stripped = s.replace(/^0+/, '');
    return stripped === '' ? '0' : stripped;
  }
  return v;
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
      
      let newValue = value;
      if (sapKey.startsWith('BUDAT')) {
        newValue = toIsoDateIfSapDate(value);
      } else if (/^MATNR[123]X?$/.test(sapKey)) {
        newValue = cleanMatnr(value);
      }

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
