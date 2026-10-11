import type { MaterialUnit } from '@/store/types';
import { UNIT_LABEL } from '@/store/utils/labels';

const amdFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function safeFormatter(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  try {
    return new Intl.DateTimeFormat('hy-AM', options);
  } catch {
    return new Intl.DateTimeFormat('en-GB', options);
  }
}

const dateFormatter = safeFormatter({ day: '2-digit', month: '2-digit', year: 'numeric' });
const dateTimeFormatter = safeFormatter({ day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** 12,345.5 ֏ */
export function formatAmd(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  const n = Number(value);
  return Number.isFinite(n) ? `${amdFormatter.format(n)} ֏` : '—';
}

/** Accepts ISO timestamps and 'YYYY-MM-DD' local dates. */
export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : dateFormatter.format(d);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : dateTimeFormatter.format(d);
}

/** Quantities are decimals with up to 3 places: 12, 12.5, 0.125. */
export function formatQty(value: number | null | undefined): string {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return String(Math.round(Number(value) * 1000) / 1000);
}

export const qtyWithUnit = (value: number | null | undefined, unit: MaterialUnit) =>
  `${formatQty(value)} ${UNIT_LABEL[unit] ?? unit}`;

/** Parses a user-typed number ("12,5" / "12 500"), NaN when empty/invalid. */
export function parseNumber(text: string): number {
  const cleaned = text.replace(/\s/g, '').replace(',', '.');
  if (!cleaned) return NaN;
  return Number(cleaned);
}

export const roundQty = (value: number) => Math.round(value * 1000) / 1000;
export const roundMoney = (value: number) => Math.round(value * 100) / 100;

const pad = (n: number) => String(n).padStart(2, '0');

/** Local YYYY-MM-DD for today + days. */
export function localDatePlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local date (+ time) -> ISO-8601 instant, null when invalid. */
export function localToIso(date: string, time = '00:00'): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m || !t) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(t[1]), Number(t[2]), 0);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** ISO timestamp -> local YYYY-MM-DD. */
export function isoToLocalDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const trimOrNull = (value: string | null | undefined) => {
  const t = (value ?? '').trim();
  return t ? t : null;
};
