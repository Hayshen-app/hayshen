import { useEffect, useState, type FormEvent } from 'react';
import { Pencil, Plus } from 'lucide-react';
import { useMaterialCatalog, useMaterialCategories, useSaveMaterial } from '@/admin/api/materials';
import DataTable, { type DataTableColumn } from '@/admin/components/DataTable';
import Modal from '@/admin/components/Modal';
import StatusBadge from '@/admin/components/StatusBadge';
import { apiErrorMessage } from '@/admin/utils/errors';
import { MATERIAL_UNITS, materialUnitLabel } from '@/admin/utils/materialsConstants';
import type { MaterialCategoryResponse, MaterialResponse, MaterialUnit } from '@/admin/materialsTypes';
import '@/admin/pages/materialsPages.scss';

function MaterialCatalogPage() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<MaterialResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Debounce typing so every keystroke doesn't hit the API.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(search.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data: categories } = useMaterialCategories();
  const { data, isLoading, isError, error } = useMaterialCatalog({
    categoryId: categoryId ? Number(categoryId) : undefined,
    q: query || undefined,
    page,
    size: 20,
  });

  const columns: DataTableColumn<MaterialResponse>[] = [
    {
      key: 'name',
      header: 'Material',
      render: (row) => (
        <div className="materials__title-row" style={{ gap: 10, flexWrap: 'nowrap' }}>
          {row.imageUrl && <img className="materials__logo" style={{ width: 36, height: 36 }} src={row.imageUrl} alt="" />}
          <div>
            <div>{row.name}</div>
            {row.description && <div className="materials__muted">{row.description}</div>}
          </div>
        </div>
      ),
    },
    { key: 'categoryName', header: 'Category' },
    { key: 'brand', header: 'Brand', render: (row) => row.brand || '—' },
    {
      key: 'specification',
      header: 'Specification',
      render: (row) => {
        const parts = [row.specification, row.grade, row.dimensions].filter(Boolean);
        return parts.length ? parts.join(' · ') : '—';
      },
    },
    { key: 'defaultUnit', header: 'Unit', render: (row) => materialUnitLabel(row.defaultUnit) },
    {
      key: 'active',
      header: 'Status',
      render: (row) => (
        <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} tone={row.active ? 'success' : 'neutral'} />
      ),
    },
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
          <h1>Materials catalog</h1>
          <p>Reference materials buyers can pick when building a request (optional - free-text lines are allowed).</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New material
        </button>
      </div>

      <div className="filter-bar">
        <input
          type="search"
          placeholder="Search by name, brand…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <select
          value={categoryId}
          onChange={(event) => {
            setCategoryId(event.target.value);
            setPage(0);
          }}
        >
          <option value="">All categories</option>
          {categories?.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
              {category.nameHy ? ` · ${category.nameHy}` : ''}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error?.message}
        emptyMessage="No materials match this filter."
        page={data?.page ?? page}
        totalPages={data?.totalPages ?? 1}
        totalElements={data?.totalElements ?? 0}
        onPageChange={setPage}
      />

      {showCreate && <MaterialFormModal categories={categories ?? []} onClose={() => setShowCreate(false)} />}
      {editing && <MaterialFormModal material={editing} categories={categories ?? []} onClose={() => setEditing(null)} />}
    </div>
  );
}

interface MaterialFormModalProps {
  material?: MaterialResponse;
  categories: MaterialCategoryResponse[];
  onClose: () => void;
}

const TEXT_FIELDS: { key: 'brand' | 'specification' | 'grade' | 'dimensions' | 'imageUrl'; label: string; max: number; hint?: string }[] = [
  { key: 'brand', label: 'Brand', max: 120 },
  { key: 'specification', label: 'Specification', max: 500, hint: 'e.g. Portland cement CEM II/A-S 42.5' },
  { key: 'grade', label: 'Grade', max: 100, hint: 'e.g. M400, A500C' },
  { key: 'dimensions', label: 'Dimensions', max: 150, hint: 'e.g. 12 mm × 11.7 m' },
  { key: 'imageUrl', label: 'Image URL', max: 500 },
];

function MaterialFormModal({ material, categories, onClose }: MaterialFormModalProps) {
  const [form, setForm] = useState({
    categoryId: material ? String(material.categoryId) : '',
    name: material?.name || '',
    description: material?.description || '',
    brand: material?.brand || '',
    specification: material?.specification || '',
    grade: material?.grade || '',
    dimensions: material?.dimensions || '',
    defaultUnit: (material?.defaultUnit || 'PIECE') as MaterialUnit,
    imageUrl: material?.imageUrl || '',
    active: material?.active ?? true,
  });
  const [error, setError] = useState('');
  const mutation = useSaveMaterial();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    if (!form.categoryId) {
      setError('Choose a category.');
      return;
    }
    try {
      await mutation.mutateAsync({
        id: material?.id,
        categoryId: Number(form.categoryId),
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        brand: form.brand.trim() || undefined,
        specification: form.specification.trim() || undefined,
        grade: form.grade.trim() || undefined,
        dimensions: form.dimensions.trim() || undefined,
        defaultUnit: form.defaultUnit,
        imageUrl: form.imageUrl.trim() || undefined,
        active: form.active,
      });
      onClose();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to save material.'));
    }
  };

  return (
    <Modal title={material ? `Edit ${material.name}` : 'New material'} onClose={onClose}>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="mat-category">Category</label>
          <select
            id="mat-category"
            required
            value={form.categoryId}
            onChange={(event) => setForm((prev) => ({ ...prev, categoryId: event.target.value }))}
          >
            <option value="">Choose…</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
                {category.nameHy ? ` · ${category.nameHy}` : ''}
                {category.active ? '' : ' (inactive)'}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="mat-name">Name</label>
          <input
            id="mat-name"
            required
            maxLength={200}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="mat-description">Description</label>
          <textarea
            id="mat-description"
            maxLength={2000}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </div>
        {TEXT_FIELDS.map(({ key, label, max, hint }) => (
          <div className="field" key={key}>
            <label htmlFor={`mat-${key}`}>{label}</label>
            <input
              id={`mat-${key}`}
              maxLength={max}
              type={key === 'imageUrl' ? 'url' : 'text'}
              placeholder={hint}
              value={form[key]}
              onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
            />
          </div>
        ))}
        <div className="field">
          <label htmlFor="mat-unit">Default unit</label>
          <select
            id="mat-unit"
            value={form.defaultUnit}
            onChange={(event) => setForm((prev) => ({ ...prev, defaultUnit: event.target.value as MaterialUnit }))}
          >
            {MATERIAL_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {materialUnitLabel(unit)}
              </option>
            ))}
          </select>
        </div>
        <div className="field field--checkbox">
          <input
            id="mat-active"
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
          />
          <label htmlFor="mat-active">Active</label>
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

export default MaterialCatalogPage;
