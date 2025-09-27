import { computed } from 'vue';

export type FiatUnit = 'IRT' | 'IRM' | 'USD';
export type Kind = 'expense' | 'income';

export interface LedgerMoneySummary {
  plannedIRT: number;
  paidIRT: number;
  pendingIRT: number;
}

const IRT_MULT = 1;
const IRM_MULT = 1_000_000;
const USD_SCALE = 4; // keep 4 decimal places when parsing USD amounts

const DIGIT_MAP: Record<string, string> = {
  '۰': '0',
  '۱': '1',
  '۲': '2',
  '۳': '3',
  '۴': '4',
  '۵': '5',
  '۶': '6',
  '۷': '7',
  '۸': '8',
  '۹': '9',
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9'
};

const TEN = BigInt(10);

function pow10(exp: number): bigint {
  let result = BigInt(1);
  for (let i = 0; i < exp; i += 1) {
    result *= TEN;
  }
  return result;
}

function normalizeDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (digit) => DIGIT_MAP[digit] ?? digit);
}

function sanitizeNumeric(value: string | number): string {
  const raw = typeof value === 'number' ? value.toString() : value;
  return normalizeDigits(raw).trim().replace(/[\s,]/g, '');
}

function parseDecimal(value: string | number, decimals: number): bigint {
  const sanitized = sanitizeNumeric(value);
  if (sanitized === '' || sanitized === '.') {
    return BigInt(0);
  }

  if (sanitized.startsWith('-')) {
    throw new Error('negative-not-allowed');
  }

  if (!/^\d*(\.\d*)?$/.test(sanitized)) {
    throw new Error('invalid-number');
  }

  const [intPartRaw, fractionRaw = ''] = sanitized.split('.');
  const intPart = intPartRaw === '' ? '0' : intPartRaw;
  const fraction = fractionRaw.replace(/[^\d]/g, '');
  const truncated = fraction.slice(0, decimals);
  const remainderDigit = fraction.slice(decimals, decimals + 1);
  const padded = truncated.padEnd(decimals, '0');

  let result = BigInt(intPart) * pow10(decimals) + BigInt(padded === '' ? '0' : padded);
  if (remainderDigit && Number(remainderDigit[0]) >= 5) {
    result += BigInt(1);
  }

  return result;
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

function normalizeUnit(unit: string): FiatUnit {
  if (unit === 'IRMT') {
    return 'IRM';
  }
  if (unit === 'IRT' || unit === 'IRM' || unit === 'USD') {
    return unit;
  }
  return 'IRT';
}

export function parseMoney(value: string | number, unit: FiatUnit | 'IRMT', rate: number): number {
  const normalizedUnit = normalizeUnit(unit);
  try {
    if (normalizedUnit === 'IRT') {
      return Number(parseDecimal(value, 0));
    }

    if (normalizedUnit === 'IRM') {
      return Number(parseDecimal(value, 6));
    }

    const rateInt = Math.round(clampNonNegative(rate));
    if (rateInt === 0) {
      return 0;
    }

    const scaledValue = parseDecimal(value, USD_SCALE);
    const scale = pow10(USD_SCALE);
    const product = scaledValue * BigInt(rateInt);
    const quotient = product / scale;
    const remainder = product % scale;
    const rounded = remainder * BigInt(2) >= scale ? quotient + BigInt(1) : quotient;
    return Number(rounded);
  } catch (error) {
    return 0;
  }
}

export function convertFromIrt(irt: number, unit: FiatUnit, rate: number): number {
  if (!Number.isFinite(irt)) {
    return 0;
  }
  if (unit === 'IRT') {
    return irt;
  }
  if (unit === 'IRM') {
    return irt / IRM_MULT;
  }
  const safeRate = clampNonNegative(rate) || 1;
  return irt / safeRate;
}

export function formatIRT(irt: number, locale: string, unitLabel?: string): string {
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const label = unitLabel ?? (locale === 'fa' ? 'تومان' : 'IRT');
  return `${formatter.format(Math.round(irt))} ${label}`.trim();
}

export function formatIRM(irt: number, locale: string, unitLabel?: string): string {
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3
  });
  const label =
    unitLabel ??
    (locale === 'fa' ? 'IRMT (میلیون تومان ایران)' : 'IRMT (Iran Million Toman)');
  return `${formatter.format(irt / IRM_MULT)} ${label}`.trim();
}

export function formatUSD(irt: number, rate: number, locale: string, unitLabel?: string): string {
  const safeRate = clampNonNegative(rate) || 1;
  const value = irt / safeRate;
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  const label = unitLabel ?? (locale === 'fa' ? 'دلار' : 'USD');
  return `${formatter.format(value)} ${label}`.trim();
}

export function formatByUnit(irt: number, unit: FiatUnit, locale: string, rate: number): string {
  switch (unit) {
    case 'IRT':
      return formatIRT(irt, locale);
    case 'IRM':
      return formatIRM(irt, locale);
    case 'USD':
      return formatUSD(irt, rate, locale);
    default:
      return formatIRT(irt, locale);
  }
}

export function calcPending(plannedIRT: number, paidIRT?: number): number {
  return Math.max(plannedIRT - (paidIRT ?? 0), 0);
}

export function sumRows(rows: { plannedIRT: number; paidIRT?: number }[]): LedgerMoneySummary {
  return rows.reduce<LedgerMoneySummary>(
    (acc, row) => {
      const planned = clampNonNegative(row.plannedIRT);
      const paid = clampNonNegative(row.paidIRT ?? 0);
      const pending = calcPending(planned, paid);
      acc.plannedIRT += planned;
      acc.paidIRT += paid;
      acc.pendingIRT += pending;
      return acc;
    },
    { plannedIRT: 0, paidIRT: 0, pendingIRT: 0 }
  );
}

export const moneyUnitOptions = computed(() => [
  { label: 'IRT', value: 'IRT' },
  { label: 'IRMT', value: 'IRM' },
  { label: 'USD', value: 'USD' }
]);

export const MONEY_CONSTANTS = {
  IRT_MULT,
  IRM_MULT,
  USD_SCALE
} as const;

