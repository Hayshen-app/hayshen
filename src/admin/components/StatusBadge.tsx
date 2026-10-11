import { toneClassName, humanize, type Tone } from '@/admin/utils/constants';

interface StatusBadgeProps {
  status?: string | null;
  tone?: Tone;
  /** Display text; defaults to the humanized status. */
  label?: string;
}

function StatusBadge({ status, tone = 'neutral', label }: StatusBadgeProps) {
  if (!status) return <span className="badge badge--neutral">—</span>;
  return <span className={`badge ${toneClassName(tone)}`}>{label || humanize(status)}</span>;
}

export default StatusBadge;
