export function cleanString(value: any): string | null {
  if (value === undefined || value === null) return null;
  const result = String(value).trim();
  return result === '' ? null : result;
}

export function toInteger(value: any): number | null {
  if (value === undefined || value === null || value === '') return null;

  const num = Number(String(value).replace(/,/g, '').trim());
  return Number.isNaN(num) ? null : Math.trunc(num);
}

export function toDecimal(value: any): number | null {
  if (value === undefined || value === null || value === '') return null;

  const normalized = String(value).replace(/\s/g, '').replace(/,/g, '');

  const num = Number(normalized);
  return Number.isNaN(num) ? null : num;
}

export function toSapDate(value: any): string | null {
  const val = cleanString(value);
  if (!val) return null;

  if (/^\d{8}$/.test(val)) {
    return `${val.slice(0, 4)}-${val.slice(4, 6)}-${val.slice(6, 8)}`;
  }

  return val;
}

function stripLeadingZero(value: any): string | null {
  const val = cleanString(value);
  if (!val) return null;

  const stripped = val.replace(/^0+/, '');
  return stripped === '' ? '0' : stripped;
}

export function mergePrItem(pr: any, prItem: any): string | null {
  const prVal = cleanString(pr);
  const prItemVal = stripLeadingZero(prItem);

  if (!prVal && !prItemVal) return null;
  if (!prVal) return prItemVal;
  if (!prItemVal) return prVal;

  return `${prVal}-${prItemVal}`;
}

export function mergePoItem(po: any, poItem: any): string | null {
  const poVal = cleanString(po);
  const poItemVal = stripLeadingZero(poItem);

  if (!poVal && !poItemVal) return null;
  if (!poVal) return poItemVal;
  if (!poItemVal) return poVal;

  return `${poVal}-${poItemVal}`;
}

export function normalizeTData(rows: any[] | undefined | null) {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
    pr_item: mergePrItem(row?.BANFN, row?.BNFPO),
    po_item: mergePoItem(row?.EBELN, row?.EBELP),
    material: cleanString(row?.MATNR),
    material_desc: cleanString(row?.MAKTX),
    material_group: cleanString(row?.MATKL),
    plant: cleanString(row?.WERKS),
    vendor: cleanString(row?.LIFNR),
    vendor_name: cleanString(row?.NAME1),
    po_qty: toDecimal(row?.MENGE_PO),
    gr_qty: toDecimal(row?.COUNT_GR),
    gr_value: toDecimal(row?.VALUE_GR),
    price: toDecimal(row?.NETPR),
    currency: cleanString(row?.WAERS),
    safety_stock: toDecimal(row?.EISBE),
    batch: cleanString(row?.CHARG),
    clabs: toDecimal(row?.CLABS),
    jarak_dari_pembelian_terakhir: toInteger(row?.DAYS_DIFF),
    pembelian_terakhir: toSapDate(row?.LATEST_DATE),
  }));
}
