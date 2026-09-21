import type { ReactNode } from 'react';

export interface DataTableColumn<Row> {
  key: string;
  header: ReactNode;
  render?: (row: Row) => ReactNode;
}

interface DataTableProps<Row> {
  columns: DataTableColumn<Row>[];
  rows?: Row[];
  rowKey: (row: Row) => string | number;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  emptyMessage?: string;
  page?: number;
  totalPages?: number;
  totalElements?: number;
  onPageChange?: (page: number) => void;
}

/**
 * Generic table for a PageResponse-shaped admin list: { items, page, size,
 * totalElements, totalPages, last }. Callers pass column defs and row key.
 */
function DataTable<Row>({
  columns,
  rows,
  rowKey,
  isLoading,
  isError,
  errorMessage,
  emptyMessage = 'Nothing to show yet.',
  page = 0,
  totalPages = 1,
  totalElements = 0,
  onPageChange,
}: DataTableProps<Row>) {
  let body: ReactNode;
  if (isLoading) {
    body = (
      <tr>
        <td className="table-state" colSpan={columns.length}>
          Loading…
        </td>
      </tr>
    );
  } else if (isError) {
    body = (
      <tr>
        <td className="table-state table-state--error" colSpan={columns.length}>
          {errorMessage || 'Something went wrong.'}
        </td>
      </tr>
    );
  } else if (!rows || rows.length === 0) {
    body = (
      <tr>
        <td className="table-state" colSpan={columns.length}>
          {emptyMessage}
        </td>
      </tr>
    );
  } else {
    body = rows.map((row) => (
      <tr key={rowKey(row)}>
        {columns.map((column) => (
          <td key={column.key}>
            {/* Columns without a render fn fall back to a same-named field on the row. */}
            {column.render ? column.render(row) : (row as unknown as Record<string, ReactNode>)[column.key]}
          </td>
        ))}
      </tr>
    ));
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>{body}</tbody>
      </table>
      {onPageChange && (
        <div className="pagination">
          <span>
            Page {totalElements === 0 ? 0 : page + 1} of {Math.max(totalPages, 1)} · {totalElements} total
          </span>
          <button type="button" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
            Previous
          </button>
          <button type="button" disabled={page + 1 >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next
          </button>
        </div>
      )}
    </div>
  );
}

export default DataTable;
