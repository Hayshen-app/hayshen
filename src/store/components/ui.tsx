import { useEffect, useId, useState, type MouseEvent, type ReactNode } from 'react';
import { AlertTriangle, Inbox, Loader2, X } from 'lucide-react';
import type { BadgeDef, Tone } from '@/store/utils/labels';

// ------------------------------------------------------------------ badge

export function Badge({ def, tone, label }: { def?: BadgeDef; tone?: Tone; label?: string }) {
  const t = def?.tone ?? tone ?? 'neutral';
  return <span className={`st-badge st-badge--${t}`}>{def?.label ?? label ?? '—'}</span>;
}

// ------------------------------------------------------------------ states

export function Spinner({ size = 18 }: { size?: number }) {
  return <Loader2 size={size} className="st-spin" aria-hidden />;
}

export function LoadingState({ text = 'Բեռնվում է…' }: { text?: string }) {
  return (
    <div className="st-state">
      <Spinner size={22} />
      <span>{text}</span>
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="st-state st-state--error" role="alert">
      <AlertTriangle size={22} />
      <span>{message}</span>
      {onRetry && (
        <button type="button" className="st-btn st-btn--secondary st-btn--sm" onClick={onRetry}>
          Կրկին փորձել
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, text, icon, action }: { title: string; text?: ReactNode; icon?: ReactNode; action?: ReactNode }) {
  return (
    <div className="st-empty">
      <div className="st-empty__icon">{icon ?? <Inbox size={28} />}</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}

// ------------------------------------------------------------------ layout bits

export function PageHeader({ title, subtitle, actions, back }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; back?: ReactNode }) {
  return (
    <div className="st-page-header">
      <div>
        {back}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="st-page-header__actions">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '' }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`st-card ${className}`}>
      {(title || actions) && (
        <div className="st-card__head">
          {title && <h2>{title}</h2>}
          {actions && <div className="st-card__actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function InfoRow({ label, value, strong }: { label: ReactNode; value: ReactNode; strong?: boolean }) {
  return (
    <div className={`st-info-row${strong ? ' st-info-row--strong' : ''}`}>
      <span className="st-info-row__label">{label}</span>
      <span className="st-info-row__value">{value ?? '—'}</span>
    </div>
  );
}

export function Banner({ tone, title, children }: { tone: Tone; title?: ReactNode; children?: ReactNode }) {
  return (
    <div className={`st-banner st-banner--${tone}`} role={tone === 'danger' ? 'alert' : undefined}>
      {title && <strong>{title}</strong>}
      {children && <div>{children}</div>}
    </div>
  );
}

export function StatCard({ icon, label, value, hint, to }: { icon: ReactNode; label: string; value: ReactNode; hint?: string; to?: ReactNode }) {
  return (
    <div className="st-stat">
      <div className="st-stat__icon">{icon}</div>
      <div className="st-stat__body">
        <div className="st-stat__value">{value}</div>
        <div className="st-stat__label">{label}</div>
        {hint && <div className="st-stat__hint">{hint}</div>}
        {to}
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ form

export function Field({
  label,
  required,
  error,
  hint,
  children,
  className = '',
}: {
  label: ReactNode;
  required?: boolean;
  error?: string | null;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`st-field ${error ? 'st-field--error' : ''} ${className}`}>
      <span className="st-field__label">
        {label}
        {required && <span className="st-field__req"> *</span>}
      </span>
      {children}
      {error ? <span className="st-field__error">{error}</span> : hint ? <span className="st-field__hint">{hint}</span> : null}
    </label>
  );
}

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <div className="st-form-error" role="alert">
      {message}
    </div>
  );
}

export function Button({
  children,
  variant = 'primary',
  size,
  loading,
  disabled,
  type = 'button',
  onClick,
  title,
  className = '',
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type={type}
      className={`st-btn st-btn--${variant}${size ? ` st-btn--${size}` : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      title={title}
    >
      {loading && <Spinner size={15} />}
      {children}
    </button>
  );
}

// ------------------------------------------------------------------ modal

export function Modal({
  title,
  onClose,
  children,
  footer,
  wide,
  busy,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
  /** While true the dialog can't be dismissed (request in flight). */
  busy?: boolean;
}) {
  const titleId = useId();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, busy]);

  const onOverlay = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !busy) onClose();
  };

  return (
    <div className="st-modal-overlay" onMouseDown={onOverlay}>
      <div className={`st-modal${wide ? ' st-modal--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="st-modal__header">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="st-modal__close" onClick={onClose} disabled={busy} aria-label="Փակել">
            <X size={20} />
          </button>
        </div>
        <div className="st-modal__body">{children}</div>
        {footer && <div className="st-modal__footer">{footer}</div>}
      </div>
    </div>
  );
}

/** Confirmation dialog; `onConfirm` may be async (button shows a spinner, errors are shown inline). */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Հաստատել',
  danger,
  onConfirm,
  onClose,
  children,
  confirmDisabled,
}: {
  title: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => Promise<unknown> | void;
  onClose: () => void;
  children?: ReactNode;
  confirmDisabled?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Տեղի ունեցավ սխալ');
      setBusy(false);
    }
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      busy={busy}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Չեղարկել
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={confirm} loading={busy} disabled={confirmDisabled}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="st-muted-text">{message}</p>}
      {children}
      <FormError message={error} />
    </Modal>
  );
}

// ------------------------------------------------------------------ table

export interface Column<Row> {
  key: string;
  header: ReactNode;
  render: (row: Row) => ReactNode;
  className?: string;
}

export function DataTable<Row>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyText = 'Տվյալներ չկան',
}: {
  columns: Column<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string | number;
  onRowClick?: (row: Row) => void;
  emptyText?: string;
}) {
  return (
    <div className="st-table-wrap">
      <table className="st-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={c.className}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="st-table__empty">
                {emptyText}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                className={onRowClick ? 'st-table__row--click' : undefined}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={c.className} data-label={typeof c.header === 'string' ? c.header : undefined}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  totalPages,
  totalElements,
  onChange,
  disabled,
}: {
  page: number;
  totalPages: number;
  totalElements: number;
  onChange: (page: number) => void;
  disabled?: boolean;
}) {
  if (totalPages <= 1) {
    return totalElements > 0 ? <div className="st-pagination"><span>Ընդամենը՝ {totalElements}</span></div> : null;
  }
  return (
    <div className="st-pagination">
      <span>
        Էջ {page + 1} / {totalPages} · ընդամենը՝ {totalElements}
      </span>
      <button type="button" className="st-btn st-btn--secondary st-btn--sm" disabled={disabled || page <= 0} onClick={() => onChange(page - 1)}>
        Նախորդ
      </button>
      <button
        type="button"
        className="st-btn st-btn--secondary st-btn--sm"
        disabled={disabled || page + 1 >= totalPages}
        onClick={() => onChange(page + 1)}
      >
        Հաջորդ
      </button>
    </div>
  );
}

// ------------------------------------------------------------------ toast

type ToastTone = 'success' | 'error';
let toastListener: ((text: string, tone: ToastTone) => void) | null = null;

/** Fire-and-forget notification rendered by <ToastHost/> in the layout. */
export function toast(text: string, tone: ToastTone = 'success') {
  toastListener?.(text, tone);
}

export function ToastHost() {
  const [items, setItems] = useState<{ id: number; text: string; tone: ToastTone }[]>([]);

  useEffect(() => {
    let seq = 0;
    toastListener = (text, tone) => {
      seq += 1;
      const id = seq;
      setItems((prev) => [...prev, { id, text, tone }]);
      window.setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4500);
    };
    return () => {
      toastListener = null;
    };
  }, []);

  return (
    <div className="st-toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`st-toast st-toast--${t.tone}`}>
          {t.text}
        </div>
      ))}
    </div>
  );
}
