import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, Star } from 'lucide-react';
import StatusBadge from '@/admin/components/StatusBadge';
import { milestoneStatusLabel, milestoneStatusTone, orderStatusTone, orderTypeLabel } from '@/admin/utils/constants';
import { formatCurrency, formatDate } from '@/admin/utils/format';
import type { WorkerHistoryResponse, WorkerJob } from '@/admin/types';
import '@/admin/components/workerHistoryPanel.scss';

interface WorkerHistoryPanelProps {
  history: WorkerHistoryResponse[] | undefined;
  isLoading: boolean;
  isError: boolean;
}

/** Admin Console > Company Details: every worker, expandable to the jobs they were attached to and their ratings. */
function WorkerHistoryPanel({ history, isLoading, isError }: WorkerHistoryPanelProps) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const toggle = (id: number) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (isLoading) return <div className="empty-state">Loading workers…</div>;
  if (isError) return <div className="empty-state">Failed to load workers.</div>;
  if (!history?.length) return <div className="empty-state">No workers added by this company yet.</div>;

  return (
    <div className="worker-history">
      {history.map(({ worker, totalJobs, completedJobs, jobs }) => {
        const open = expanded.has(worker.id);
        return (
          <div key={worker.id} className="worker-history__item">
            <button type="button" className="worker-history__header" onClick={() => toggle(worker.id)}>
              {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <div className="worker-history__identity">
                <div className="worker-history__name">
                  {worker.fullName}
                  <StatusBadge status={worker.status} tone={worker.status === 'ACTIVE' ? 'success' : 'neutral'} />
                </div>
                <div className="worker-history__muted">
                  {[worker.title, worker.phone, worker.addressCity].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
              <div className="worker-history__stats">
                <span>
                  <Star size={14} className="worker-history__star" />
                  {worker.rating != null ? `${worker.rating.toFixed(1)} (${worker.ratingCount})` : 'No ratings'}
                </span>
                <span>
                  {totalJobs} job{totalJobs === 1 ? '' : 's'} · {completedJobs} completed
                </span>
              </div>
            </button>

            {open &&
              (jobs.length === 0 ? (
                <div className="worker-history__empty">Not attached to any job yet.</div>
              ) : (
                <div className="table-wrap worker-history__table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Service</th>
                        <th>Customer</th>
                        <th>Status</th>
                        <th>Role / stages</th>
                        <th>Dates</th>
                        <th>Worker rating</th>
                        <th>Order rating</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobs.map((job) => (
                        <JobRow key={job.orderId} job={job} />
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
          </div>
        );
      })}
    </div>
  );
}

function JobRow({ job }: { job: WorkerJob }) {
  return (
    <tr>
      <td>
        <Link to={`/admin/orders/${job.orderId}`}>#{job.orderId}</Link>
        <div className="worker-history__muted">{orderTypeLabel(job.orderType)}</div>
      </td>
      <td>
        <div>{job.categoryName}</div>
        {job.serviceItemName && <div className="worker-history__muted">{job.serviceItemName}</div>}
        <div className="worker-history__muted">{formatCurrency(job.finalPrice)}</div>
      </td>
      <td>
        <div>{job.customerName}</div>
        {job.addressCity && <div className="worker-history__muted">{job.addressCity}</div>}
      </td>
      <td>
        <StatusBadge status={job.orderStatus} tone={orderStatusTone(job.orderStatus)} />
      </td>
      <td>
        {job.assignedWorker && <div>Assigned worker</div>}
        {job.milestones.map((m) => (
          <div key={m.id} className="worker-history__stage">
            <span>
              {m.sequence}. {m.title}
            </span>
            <StatusBadge status={m.status} label={milestoneStatusLabel(m.status)} tone={milestoneStatusTone(m.status)} />
          </div>
        ))}
      </td>
      <td>
        <div>Created {formatDate(job.createdAt)}</div>
        {job.startedAt && <div className="worker-history__muted">Started {formatDate(job.startedAt)}</div>}
        {job.completedAt && <div className="worker-history__muted">Done {formatDate(job.completedAt)}</div>}
      </td>
      <td>
        <Rating value={job.workerRating} comment={job.workerComment} />
      </td>
      <td>
        <Rating value={job.orderRating} comment={job.orderComment} />
      </td>
    </tr>
  );
}

function Rating({ value, comment }: { value: number | null; comment: string | null }) {
  if (value == null) return <span className="worker-history__muted">—</span>;
  return (
    <div>
      <span className="worker-history__rating">
        <Star size={13} className="worker-history__star" />
        {value}/5
      </span>
      {comment && <div className="worker-history__muted">“{comment}”</div>}
    </div>
  );
}

export default WorkerHistoryPanel;
