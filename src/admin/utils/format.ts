const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' });

export function formatDateTime(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateTimeFormatter.format(date);
}

export function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormatter.format(date);
}

export function formatCurrency(value?: number | string | null): string {
  if (value === null || value === undefined) return '—';
  const amount = Number(value);
  return Number.isNaN(amount)
    ? '—'
    : `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} AMD`;
}

export function formatNumber(value?: number | string | null): string {
  if (value === null || value === undefined) return '—';
  return Number(value).toLocaleString('en-US');
}
