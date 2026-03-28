type SapRow = Record<string, any>;
type SapRows = SapRow[];
type RfcPayload = Record<string, any>;

type FieldTransform = (value: any, row: SapRow) => any;

type TableConfig = {
  omitFields?: Set<string>;
  renameMap?: Record<string, string>;
  transforms?: Record<string, FieldTransform>;
  afterMap?: (out: SapRow, source: SapRow) => SapRow;
};

function toIsoDateIfSapDate(v: any): any {
  if (v === null || v === undefined) return v;

  const s = String(v).trim();
  if (!s) return s;
  if (s === '00000000' || s === '0000-00-00') return null;
  if (!/^\d{8}$/.test(s)) return v;

  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
}

function cleanMatnr(v: any): any {
  if (v === null || v === undefined) return v;

  const s = String(v).trim();
  if (!s) return s;

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
    return String(v);
  }

  const s = String(v).trim();
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

function buildSoItem(kdauf: any, kdpos: any): string | undefined {
  const so = String(kdauf ?? '').trim();
  const item = stripLeadingZeros(kdpos);

  if (so && item) return `${so} - ${item}`;
  if (so) return so;
  if (item) return item;
  return undefined;
}

function normalizeUnit(v: any): any {
  if (v === null || v === undefined) return v;

  const s = String(v).trim().toUpperCase();
  if (!s) return s;

  if (s === 'ST') return 'PC';

  return s;
}

function normalizeTableRows(
  rows: SapRows | undefined | null,
  config: TableConfig,
): SapRows {
  if (!Array.isArray(rows)) return [];

  const omitFields = config.omitFields ?? new Set<string>();
  const renameMap = config.renameMap ?? {};
  const transforms = config.transforms ?? {};

  return rows.map((row) => {
    const out: SapRow = {};

    for (const [key, value] of Object.entries(row)) {
      const sapKey = key.toUpperCase();

      if (omitFields.has(sapKey)) continue;

      const newKey = renameMap[sapKey] ?? sapKey.toLowerCase();
      const transform = transforms[sapKey];

      out[newKey] = transform ? transform(value, row) : value;
    }

    return config.afterMap ? config.afterMap(out, row) : out;
  });
}

const simpleReturnConfig: TableConfig = {
  omitFields: new Set([
    'ID',
    'NUMBER',
    'LOG_NO',
    'LOG_MSG_NO',
    'MESSAGE_V1',
    'MESSAGE_V2',
    'MESSAGE_V3',
    'MESSAGE_V4',
    'PARAMETER',
    'ROW',
    'FIELD',
    'SYSTEM',
  ]),
  renameMap: {
    TYPE: 'type',
    MESSAGE: 'message',
  },
};

const tData1Config: TableConfig = {
  omitFields: new Set([
    'MANDT',
    'KDAUF',
    'KDPOS',
    'NETPR',
    'NETPR2',
    'WAERK',
    'SSSLDPV1',
    'SSSLDPV2',
    'SSSLDPV3',
    'ARBPL3',
    'ARBPL2',
    'ARBPL1',
    'ARBID',
    'KAPID',
    'KAPAZ',
    'VERID',
    'PLNUM',
    'MTART',
    'AUART',
    'P1',
    'MENG2',
    'CPCTYX',
    'DTIME',
    'DDAY',
    'SSSLD',
    'SSAVD',
    'SSAVZ',
    'SSSLZ',
    'CATEGORY',
    'MENGE2',
    'STATS2',
    'NAME1',
  ]),
  renameMap: {
    ARBPL: 'work_center',
    PWWRK: 'plant',
    WERKSX: 'kode_laravel',
    KTEXT: 'work_center_description',
    AUFNR: 'order_number',
    CHARG: 'batch_number',
    STATS: 'status',
    DISPO: 'mrp',
    MATNR: 'material_number',
    MAKTX: 'material_description',
    VORNR: 'operation_number',
    STEUS: 'control_key',
    MEINS: 'unit',
    MATKL: 'material_group',
    PSMNG: 'order_quantity',
    WEMNG: 'gr_quantity',
    MGVRG2: 'remaining_quantity',
    LMNGA: 'yield_quantity',
    VGW01: 'standard_value_item',
    VGE01: 'standard_value_unit_item',
    SPLIM: 'split_limit',
    MATFG: 'material_finish_good',
    MAKFG: 'material_finish_good_description',
  },
  transforms: {
    MATNR: (v) => cleanMatnr(v),
    MATFG: (v) => cleanMatnr(v),
    MEINS: (v) => normalizeUnit(v),
    PSMNG: (v) => removeTrailingDecimalZeros(v),
    WEMNG: (v) => removeTrailingDecimalZeros(v),
    MGVRG2: (v) => removeTrailingDecimalZeros(v),
    LMNGA: (v) => removeTrailingDecimalZeros(v),
    VGW01: (v) => removeTrailingDecimalZeros(v),
  },
  afterMap: (out, row) => {
    out.so_item = buildSoItem(row.KDAUF, row.KDPOS);
    return out;
  },
};

const tData2Config: TableConfig = {
  omitFields: new Set(['MANDT', 'KDAUF', 'KDPOS']),
  renameMap: {
    BSTNK: 'po_number',
    MATFG: 'material_finish_good',
    MAKFG: 'material_finish_good_description',
    EDATU: 'delivery_date',
    WERKSX: 'kode_laravel',
    KUNNR: 'customer_number',
    NAME1: 'customer_name',
  },
  transforms: {
    MATFG: (v) => cleanMatnr(v),
    EDATU: (v) => toIsoDateIfSapDate(v),
  },
  afterMap: (out, row) => {
    out.so_item = buildSoItem(row.KDAUF, row.KDPOS);
    return out;
  },
};

const tData3Config: TableConfig = {
  omitFields: new Set([
    'MANDT',
    'KDAUF',
    'KDPOS',
    'ARBID',
    'VERID',
    'KUNNR',
    'NAME1',
    'BSTNK',
    'PLNUM',
    'ORDERX',
    'MTART',
    'AUART',
    'STEUS',
    'P1',
    'MENG2',
    'CPCTYX',
    'DTIME',
    'DDAY',
    'SSSLD',
    'SSAVD',
    'CATEGORY',
    'MENGE2',
    'STATS2',
  ]),
  renameMap: {
    ARBPL: 'work_center',
    PWWRK: 'plant',
    WERKSX: 'kode_laravel',
    KTEXT: 'work_center_description',
    AUFNR: 'order_number',
    CHARG: 'batch_number',
    STATS: 'status',
    DISPO: 'mrp',
    MATNR: 'material_number',
    MAKTX: 'material_description',
    VORNR: 'operation_number',
    MEINS: 'unit',
    MATKL: 'material_group',
    PSMNG: 'order_quantity',
    WEMNG: 'gr_quantity',
    MGVRG2: 'remaining_quantity',
    LMNGA: 'yield_quantity',
    VGW01: 'standard_value_operation',
    VGE01: 'standard_value_unit_operation',
    GLTRP: 'finish_date',
    GSTRP: 'start_date',
    GLTRI: 'actual_finish_date',
    MATFG: 'material_finish_good',
    MAKFG: 'material_finish_good_description',
    GROES: 'groes',
    FERTH: 'ferth',
    ZEINR: 'drawing_number',
  },
  transforms: {
    MATNR: (v) => cleanMatnr(v),
    MATFG: (v) => cleanMatnr(v),
    MEINS: (v) => normalizeUnit(v),
    PSMNG: (v) => removeTrailingDecimalZeros(v),
    WEMNG: (v) => removeTrailingDecimalZeros(v),
    MGVRG2: (v) => removeTrailingDecimalZeros(v),
    LMNGA: (v) => removeTrailingDecimalZeros(v),
    VGW01: (v) => removeTrailingDecimalZeros(v),
    GLTRP: (v) => toIsoDateIfSapDate(v),
    GSTRP: (v) => toIsoDateIfSapDate(v),
    GLTRI: (v) => toIsoDateIfSapDate(v),
  },
  afterMap: (out, row) => {
    out.so_item = buildSoItem(row.KDAUF, row.KDPOS);
    return out;
  },
};

const tData4Config: TableConfig = {
  omitFields: new Set(['MANDT', 'KDAUF', 'KDPOS', 'PLNUM', 'BAUGR']),
  renameMap: {
    RSNUM: 'reservation_number',
    RSPOS: 'reservation_item',
    VORNR: 'operation_number',
    AUFNR: 'order_number',
    STATS: 'status',
    DISPO: 'mrp',
    MATNR: 'material_number',
    MAKTX: 'material_description',
    MEINS: 'unit',
    LGORT: 'storage_location',
    WERKS: 'plant',
    BDMNG: 'requirement_quantity',
    OUTSREQ: 'outstanding_requirement',
    KALAB: 'unrestricted_stock',
    VMENG: 'withdrawn_quantity',
    SOBSL: 'special_procurement',
    BESKZ: 'procurement_type',
    LTEXT: 'long_text',
    WERKSX: 'kode_laravel',
    CHARGX2: 'batch_number',
    AUFNR2: 'reference_order_number',
    USRISP: 'user_remarks',
  },
  transforms: {
    RSNUM: (v) => stripLeadingZeros(v),
    RSPOS: (v) => stripLeadingZeros(v),
    MATNR: (v) => cleanMatnr(v),
    MEINS: (v) => normalizeUnit(v),
    BDMNG: (v) => removeTrailingDecimalZeros(v),
    OUTSREQ: (v) => removeTrailingDecimalZeros(v),
    KALAB: (v) => removeTrailingDecimalZeros(v),
    VMENG: (v) => removeTrailingDecimalZeros(v),
  },
  afterMap: (out, row) => {
    out.so_item = buildSoItem(row.KDAUF, row.KDPOS);
    return out;
  },
};

export function normalizeZFmYppr074z(payload: RfcPayload) {
  return {
    return: normalizeTableRows(payload?.RETURN, simpleReturnConfig),
    operation_item_data: normalizeTableRows(payload?.T_DATA1, tData1Config),
    buyer_so_item_data: normalizeTableRows(payload?.T_DATA2, tData2Config),
    pro_data: normalizeTableRows(payload?.T_DATA3, tData3Config),
    component_data: normalizeTableRows(payload?.T_DATA4, tData4Config),
  };
}
