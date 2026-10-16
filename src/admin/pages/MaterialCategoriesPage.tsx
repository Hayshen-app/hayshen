import { useMemo, useState, type FormEvent } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useMaterialCategories, useSaveMaterialCategory } from '@/admin/api/materials';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import Modal from '@/admin/components/Modal';
import StatusBadge from '@/admin/components/StatusBadge';
import { apiErrorMessage } from '@/admin/utils/errors';
import type { MaterialCategoryResponse } from '@/admin/materialsTypes';
import '@/admin/pages/materialsPages.scss';

interface CategoryNode {
  category: MaterialCategoryResponse;
  depth: number;
  path: string;
}

/** Depth-first walk so every subcategory sits directly under its parent, at any nesting depth. */
function flattenTree(categories: MaterialCategoryResponse[]): CategoryNode[] {
  const ids = new Set(categories.map((c) => c.id));
  const childrenOf = new Map<number | null, MaterialCategoryResponse[]>();
  for (const c of categories) {
    // Orphans (parent missing from the list) are shown at the top level rather than dropped.
    const key = c.parentId != null && ids.has(c.parentId) ? c.parentId : null;
    childrenOf.set(key, [...(childrenOf.get(key) ?? []), c]);
  }
  const result: CategoryNode[] = [];
  const visit = (parentId: number | null, depth: number, prefix: string) => {
    const children = [...(childrenOf.get(parentId) ?? [])].sort(
      (a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name),
    );
    for (const c of children) {
      const path = prefix ? `${prefix} › ${c.name}` : c.name;
      result.push({ category: c, depth, path });
      visit(c.id, depth + 1, path);
    }
  };
  visit(null, 0, '');
  return result;
}

/** Ids of the category and everything nested under it. */
function subtreeIds(categories: MaterialCategoryResponse[], rootId: number): Set<number> {
  const ids = new Set([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (c.parentId != null && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return ids;
}

function MaterialCategoriesPage() {
  const { data: categories, isLoading, isError, error } = useMaterialCategories();
  const [editing, setEditing] = useState<MaterialCategoryResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createParentId, setCreateParentId] = useState<number | null>(null);

  const tree = useMemo(() => flattenTree(categories ?? []), [categories]);
  const pathById = useMemo(() => new Map(tree.map((node) => [node.category.id, node.path])), [tree]);

  const openCreate = (parentId: number | null) => {
    setCreateParentId(parentId);
    setShowCreate(true);
  };

  const columns: DataTableColumn<CategoryNode>[] = [
    {
      key: 'name',
      header: 'Name',
      render: ({ category, depth }) => (
        <div style={{ paddingLeft: depth * 20 }}>
          <div>
            {depth > 0 && <span className="materials__muted">└ </span>}
            {category.name}
          </div>
          {category.description && <div className="materials__muted">{category.description}</div>}
        </div>
      ),
    },
    { key: 'nameHy', header: 'Armenian name', render: ({ category }) => category.nameHy || '—' },
    {
      key: 'parentId',
      header: 'Parent',
      render: ({ category }) =>
        category.parentId ? pathById.get(category.parentId) ?? `#${category.parentId}` : '—',
    },
    {
      key: 'active',
      header: 'Status',
      render: ({ category }) => (
        <StatusBadge status={category.active ? 'ACTIVE' : 'INACTIVE'} tone={category.active ? 'success' : 'neutral'} />
      ),
    },
    { key: 'displayOrder', header: 'Order', render: ({ category }) => category.displayOrder },
    {
      key: 'actions',
      header: '',
      render: ({ category }) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => openCreate(category.id)}>
            <Plus size={14} />
            Subcategory
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setEditing(category)}>
            <Pencil size={14} />
            Edit
          </button>
        </div>
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
        <button type="button" className="btn btn--primary" onClick={() => openCreate(null)}>
          <Plus size={16} />
          New category
        </button>
      </div>

      <DataTable
        columns={columns}
        rows={tree}
        rowKey={(row) => row.category.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message || 'Failed to load categories.'}
        emptyMessage="No material categories yet."
      />

      {showCreate && (
        <MaterialCategoryFormModal
          defaultParentId={createParentId}
          categories={categories ?? []}
          onClose={() => setShowCreate(false)}
        />
      )}
      {editing && (
        <MaterialCategoryFormModal category={editing} categories={categories ?? []} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

interface FormModalProps {
  category?: MaterialCategoryResponse;
  defaultParentId?: number | null;
  categories: MaterialCategoryResponse[];
  onClose: () => void;
}

function MaterialCategoryFormModal({ category, defaultParentId, categories, onClose }: FormModalProps) {
  const [form, setForm] = useState({
    name: category?.name || '',
    nameHy: category?.nameHy || '',
    description: category?.description || '',
    parentId: category?.parentId ? String(category.parentId) : defaultParentId ? String(defaultParentId) : '',
    displayOrder: category?.displayOrder ?? 0,
    active: category?.active ?? true,
  });
  const [error, setError] = useState('');
  const mutation = useSaveMaterialCategory();
  // A category can't be moved under itself or any of its own subcategories.
  const parentOptions = useMemo(() => {
    const excluded = category ? subtreeIds(categories, category.id) : new Set<number>();
    return flattenTree(categories).filter((node) => !excluded.has(node.category.id));
  }, [categories, category]);

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

  const title = category
    ? `Edit ${category.name}`
    : defaultParentId
      ? 'New subcategory'
      : 'New material category';

  return (
    <Modal title={title} onClose={onClose}>
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
            {parentOptions.map(({ category: option, depth }) => (
              <option key={option.id} value={option.id}>
                {'\u00A0\u00A0'.repeat(depth)}
                {depth > 0 ? '└ ' : ''}
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
