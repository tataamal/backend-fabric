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

export function normalizeTData(rows: any[] | undefined | null) {
  if (!Array.isArray(rows)) return [];

  return rows.map((row) => ({
    pr: cleanString(row?.BANFN),
    pr_item: cleanString(row?.BNFPO),
    po: cleanString(row?.EBELN),
    po_item: cleanString(row?.EBELP),
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
