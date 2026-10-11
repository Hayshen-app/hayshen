import { useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useMaterialCategories, useSaveMaterialCategory } from '@/admin/api/materials';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import Modal from '@/admin/components/Modal';
import StatusBadge from '@/admin/components/StatusBadge';
import { apiErrorMessage } from '@/admin/utils/errors';
import type { MaterialCategoryResponse } from '@/admin/materialsTypes';
import '@/admin/pages/materialsPages.scss';

function MaterialCategoriesPage() {
  const { data: categories, isLoading, isError, error } = useMaterialCategories();
  const [editing, setEditing] = useState<MaterialCategoryResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const byId = useMemo(() => new Map((categories ?? []).map((c) => [c.id, c])), [categories]);
  const sorted = useMemo(
    () =>
      [...(categories ?? [])].sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name)),
    [categories],
  );

  const columns: DataTableColumn<MaterialCategoryResponse>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <div>{row.name}</div>
          {row.description && <div className="materials__muted">{row.description}</div>}
        </div>
      ),
    },
    { key: 'nameHy', header: 'Armenian name', render: (row) => row.nameHy || '—' },
    { key: 'parentId', header: 'Parent', render: (row) => (row.parentId ? byId.get(row.parentId)?.name ?? `#${row.parentId}` : '—') },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} tone={row.active ? 'success' : 'neutral'} />
      ),
    },
    { key: 'displayOrder', header: 'Order' },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <button type="button" className="btn btn--secondary btn--sm" onClick={() => setEditing(row)}>
          <Pencil size={14} />
          Edit
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Material categories</h1>
          <p>Categories buyers pick when requesting construction materials. Inactive ones are hidden from buyers.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New category
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={sorted}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message || 'Failed to load categories.'}
        emptyMessage="No material categories yet."
      />

      {showCreate && <MaterialCategoryFormModal categories={sorted} onClose={() => setShowCreate(false)} />}
      {editing && <MaterialCategoryFormModal category={editing} categories={sorted} onClose={() => setEditing(null)} />}
    </div>
  );
}

interface FormModalProps {
  category?: MaterialCategoryResponse;
  categories: MaterialCategoryResponse[];
  onClose: () => void;
}

function MaterialCategoryFormModal({ category, categories, onClose }: FormModalProps) {
  const [form, setForm] = useState({
    name: category?.name || '',
    nameHy: category?.nameHy || '',
    description: category?.description || '',
    parentId: category?.parentId ? String(category.parentId) : '',
    displayOrder: category?.displayOrder ?? 0,
    active: category?.active ?? true,
  });
  const [error, setError] = useState('');
  const mutation = useSaveMaterialCategory();
  // A category can't be its own parent.
  const parentOptions = categories.filter((c) => c.id !== category?.id);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      await mutation.mutateAsync({
        id: category?.id,
        name: form.name.trim(),
        nameHy: form.nameHy.trim() || undefined,
        description: form.description.trim() || undefined,
        parentId: form.parentId ? Number(form.parentId) : null,
        displayOrder: Number(form.displayOrder) || 0,
        active: form.active,
      });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to save category.'));
    }
  };

  return (
    <Modal title={category ? `Edit ${category.name}` : 'New material category'} onClose={onClose}>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="mcat-name">Name</label>
          <input
            id="mcat-name"
            required
            maxLength={150}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="mcat-name-hy">Armenian name</label>
          <input
            id="mcat-name-hy"
            maxLength={150}
            lang="hy"
            value={form.nameHy}
            onChange={(event) => setForm((prev) => ({ ...prev, nameHy: event.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="mcat-description">Description</label>
          <textarea
            id="mcat-description"
            maxLength={1000}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="mcat-parent">Parent category</label>
          <select
            id="mcat-parent"
            value={form.parentId}
            onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
          >
            <option value="">None (top level)</option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
                {option.nameHy ? ` · ${option.nameHy}` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="mcat-order">Display order</label>
          <input
            id="mcat-order"
            type="number"
            value={form.displayOrder}
            onChange={(event) => setForm((prev) => ({ ...prev, displayOrder: Number(event.target.value) }))}
          />
        </div>
        <div className="field field--checkbox">
          <input
            id="mcat-active"
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
          />
          <label htmlFor="mcat-active">Active</label>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default MaterialCategoriesPage;
