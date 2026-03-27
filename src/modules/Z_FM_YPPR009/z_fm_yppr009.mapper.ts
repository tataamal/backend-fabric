type SapRow = Record<string, any>;

const OMIT_FIELDS = new Set([
  'MANDT',
  'MENGE',
  'MENGEX',
  'MENGE_M',
  'MENGE_M2',
  'MENGE_M3',
  'LINE',
  'CPUDT_MKPF',
  'NODAY',
  'AUFNR2',
  'MATNR2',
  'MAKTX2',
  'CSMG',
  'TXT50',
  'VALUSX',
]);

const RENAME_MAP: Record<string, string> = {
  SERIAL_NO: 'serial_number',
  WERKS: 'plant',
  NETPR: 'net_price',
  VALUS: 'net_price_total',
  WAERK: 'net_price_currency',
  STPRS: 'standard_price',
  VALUE: 'standard_price_total',
  WAERS: 'standard_price_currency',
  MATNR: 'material_number',
  MAKTX: 'material_description',
  MEINS: 'unit',
  CHARG: 'batch_number',
  LGORT: 'storage_location',
  AUFNR: 'order_number',
  DISPO: 'mrp',
  MBLNR: 'material_document',
  BUDAT_MKPF: 'posting_date',
  PSMNG: 'quantity_order',
  WEMNG: 'quantity_gr',
  PERNR: 'employee_number',
  ARBPL: 'work_center',
  KTEXT: 'work_center_description',
  NAME2: 'customer_name',
  KUNNR: 'customer_number',
};

function toIsoDateIfSapDate(v: any): any {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (s === '00000000' || s === '0000-00-00') return null;
  if (!/^\d{8}$/.test(s)) return v;
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function toDdMmYyyyFromSapDate(v: any): any {
  if (typeof v !== 'string') return v;
  const s = v.trim();
  if (s === '00000000' || s === '0000-00-00') return null;
  if (!/^\d{8}$/.test(s)) return v;
  return `${s.slice(6, 8)}-${s.slice(4, 6)}-${s.slice(0, 4)}`;
}

function cleanMatnr(v: any): any {
  if (typeof v !== 'string' && typeof v !== 'number') return v;
  const s = String(v).trim();
  if (/^\d+$/.test(s)) {
    const stripped = s.replace(/^0+/, '');
    return stripped === '' ? '0' : stripped;
  }
  return v;
}

function stripLeadingZeros(v: any): string {
  const s = String(v ?? '').trim();
  if (!s) return '';
  const stripped = s.replace(/^0+/, '');
  return stripped === '' ? '0' : stripped;
}

function removeTrailingDecimalZeros(v: any): any {
  if (v === null || v === undefined) return v;

  if (typeof v === 'number') {
    return Number.isInteger(v) ? String(v) : String(v);
  }

  if (typeof v !== 'string') return v;

  const s = v.trim();
  if (!s) return s;

  if (/^-?\d+,\d+$/.test(s)) {
    const [intPart, decPart] = s.split(',');
    if (/^0+$/.test(decPart)) return intPart;
    return `${intPart}.${decPart}`;
  }

  if (/^-?\d+\.\d+$/.test(s)) {
    const [intPart, decPart] = s.split('.');
    if (/^0+$/.test(decPart)) return intPart;
    return s;
  }

  return s;
}

function formatSingleSerialNumber(v: any): any {
  if (v === null || v === undefined) return v;

  const raw = String(v).replace(/\s+/g, '').trim();
  if (!/^\d+$/.test(raw)) return v;

  let normalized = raw;
  if (raw.length === 15) {
    normalized = `0${raw}`;
  }

  if (normalized.length !== 16) return raw;

  return `${normalized.slice(0, 4)} ${normalized.slice(4, 12)} ${normalized.slice(12, 16)}`;
}

function formatSerialNumber(v: any): any {
  if (v === null || v === undefined) return v;

  if (Array.isArray(v)) {
    return v.map((item) => formatSingleSerialNumber(item));
  }

  if (typeof v === 'string' && v.includes(',')) {
    return v
      .split(',')
      .map((item) => formatSingleSerialNumber(item))
      .join(', ');
  }

  return formatSingleSerialNumber(v);
}

export function normalizeTData1(rows: SapRow[] | undefined | null): SapRow[] {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => {
    const out: SapRow = {};

    let kdauf: any = null;
    let kdpos: any = null;

    for (const [key, value] of Object.entries(row)) {
      const sapKey = key.toUpperCase();

      if (sapKey === 'MAT_KDAUF') {
        kdauf = value;
        continue;
      }

      if (sapKey === 'MAT_KDPOS') {
        kdpos = value;
        continue;
      }

      if (OMIT_FIELDS.has(sapKey)) continue;

      const newKey = RENAME_MAP[sapKey] ?? sapKey.toLowerCase();

      let newValue = value;

      if (sapKey === 'BUDAT_MKPF') {
        newValue = toDdMmYyyyFromSapDate(value);
      } else if (sapKey.startsWith('BUDAT') || sapKey.startsWith('FTRMS')) {
        newValue = toIsoDateIfSapDate(value);
      } else if (sapKey === 'MATNR') {
        newValue = cleanMatnr(value);
      } else if (sapKey === 'PSMNG' || sapKey === 'WEMNG') {
        newValue = removeTrailingDecimalZeros(value);
      } else if (sapKey === 'SERIAL_NO') {
        newValue = formatSerialNumber(value);
      }

      out[newKey] = newValue;
    }

    const so = String(kdauf ?? '').trim();
    const item = stripLeadingZeros(kdpos);

    if (so && item) out['so_item'] = `${so} - ${item}`;
    else if (so) out['so_item'] = so;
    else if (item) out['so_item'] = item;

    return out;
  });
}
