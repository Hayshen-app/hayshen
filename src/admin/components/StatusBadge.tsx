import { toneClassName, humanize, type Tone } from '@/admin/utils/constants';

interface StatusBadgeProps {
  status?: string | null;
  tone?: Tone;
}

function StatusBadge({ status, tone = 'neutral' }: StatusBadgeProps) {
  if (!status) return <span className="badge badge--neutral">—</span>;
  return <span className={`badge ${toneClassName(tone)}`}>{humanize(status)}</span>;
}

export default StatusBadge;
