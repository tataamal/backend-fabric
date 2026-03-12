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
    mandt: cleanString(row?.MANDT),
    banfn: cleanString(row?.BANFN),
    bnfpo: cleanString(row?.BNFPO),
    ebeln: cleanString(row?.EBELN),
    ebelp: cleanString(row?.EBELP),
    matnr: cleanString(row?.MATNR),
    maktx: cleanString(row?.MAKTX),
    matkl: cleanString(row?.MATKL),
    werks: cleanString(row?.WERKS),
    lifnr: cleanString(row?.LIFNR),
    name1: cleanString(row?.NAME1),
    count_po: toInteger(row?.COUNT_PO),
    menge_po: toDecimal(row?.MENGE_PO),
    count_gr: toDecimal(row?.COUNT_GR),
    value_gr: toDecimal(row?.VALUE_GR),
    netpr: toDecimal(row?.NETPR),
    waers: cleanString(row?.WAERS),
    eisbe: toDecimal(row?.EISBE),
    charg: cleanString(row?.CHARG),
    clabs: toDecimal(row?.CLABS),
    days_diff: toInteger(row?.DAYS_DIFF),
    latest_date: toSapDate(row?.LATEST_DATE),
  }));
}
