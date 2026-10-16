import { Children, useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus } from 'lucide-react';
import {
  useCategories,
  useCreateCategory,
  useCreateServiceItem,
  useDeactivateCategory,
  useServiceItems,
  useUpdateCategory,
  useUpdateServiceItem,
} from '@/admin/api/categories';
import Modal from '@/admin/components/Modal';
import { ApiError } from '@/api/client';
import type { CategoryResponse, ServiceItemResponse } from '@/admin/types';
import '@/admin/pages/categoriesPage.scss';

const byDisplayOrder = (a: CategoryResponse, b: CategoryResponse) =>
  a.displayOrder - b.displayOrder || a.name.localeCompare(b.name);

/** "Parent › Subcategory" for subcategories, plain name for top-level categories. */
function categoryLabel(category: CategoryResponse) {
  return category.parentName ? `${category.parentName} › ${category.name}` : category.name;
}

function CategoriesPage() {
  const { data: categories, isLoading, isError, error } = useCategories();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [creatingServiceFor, setCreatingServiceFor] = useState<CategoryResponse | null>(null);
  const [editingService, setEditingService] = useState<ServiceItemResponse | null>(null);
  const [createParentId, setCreateParentId] = useState<number | null | undefined>(undefined);

  const { topLevel, childrenOf } = useMemo(() => {
    const all = categories ?? [];
    const ids = new Set(all.map((c) => c.id));
    const children = new Map<number, CategoryResponse[]>();
    const roots: CategoryResponse[] = [];
    for (const c of all) {
      // Orphans (parent missing from the list) are shown at the top level rather than dropped.
      if (c.parentId != null && ids.has(c.parentId)) {
        children.set(c.parentId, [...(children.get(c.parentId) ?? []), c]);
      } else {
        roots.push(c);
      }
    }
    children.forEach((list) => list.sort(byDisplayOrder));
    return { topLevel: roots.sort(byDisplayOrder), childrenOf: children };
  }, [categories]);

  const renderCard = (category: CategoryResponse, nested = false) => (
    <CategoryCard
      key={category.id}
      category={category}
      nested={nested}
      expanded={expandedId === category.id}
      onToggle={() => setExpandedId(expandedId === category.id ? null : category.id)}
      onEdit={() => setEditing(category)}
      onAddSubcategory={nested ? undefined : () => setCreateParentId(category.id)}
      onAddService={() => setCreatingServiceFor(category)}
      onEditService={setEditingService}
    >
      {!nested && (childrenOf.get(category.id) ?? []).map((child) => renderCard(child, true))}
    </CategoryCard>
  );

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Categories, subcategories and service items shown on the Customer App.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setCreateParentId(null)}>
          <Plus size={16} />
          New category
        </button>
      </div>

      {isLoading && <div className="empty-state">Loading categories…</div>}
      {isError && <div className="empty-state">{error?.message || 'Failed to load categories.'}</div>}
      {categories && categories.length === 0 && <div className="empty-state">No categories yet.</div>}

      <div className="category-list">{topLevel.map((category) => renderCard(category))}</div>

      {createParentId !== undefined && (
        <CategoryFormModal
          defaultParentId={createParentId}
          topLevel={topLevel}
          hasSubcategories={false}
          onClose={() => setCreateParentId(undefined)}
        />
      )}
      {editing && (
        <CategoryFormModal
          category={editing}
          topLevel={topLevel}
          hasSubcategories={childrenOf.has(editing.id)}
          onClose={() => setEditing(null)}
        />
      )}
      {creatingServiceFor && (
        <ServiceItemFormModal
          categoryId={creatingServiceFor.id}
          categories={categories ?? []}
          onClose={() => setCreatingServiceFor(null)}
        />
      )}
      {editingService && (
        <ServiceItemFormModal
          service={editingService}
          categoryId={editingService.categoryId}
          categories={categories ?? []}
          onClose={() => setEditingService(null)}
        />
      )}
    </div>
  );
}

interface CategoryCardProps {
  category: CategoryResponse;
  nested: boolean;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  /** Only top-level categories can take subcategories. */
  onAddSubcategory?: () => void;
  onAddService: () => void;
  onEditService: (service: ServiceItemResponse) => void;
  children?: ReactNode;
}

function CategoryCard({
  category,
  nested,
  expanded,
  onToggle,
  onEdit,
  onAddSubcategory,
  onAddService,
  onEditService,
  children,
}: CategoryCardProps) {
  const deactivate = useDeactivateCategory();
  const { data: services, isLoading } = useServiceItems(category.id, { enabled: expanded });
  const hasSubcategories = Children.count(children) > 0;

  return (
    <div className={nested ? 'category-card category-card--nested' : 'card category-card'}>
      <div className="category-card__header">
        <button type="button" className="category-card__toggle" onClick={onToggle}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="category-card__name">{category.name}</span>
          {!category.active && <span className="badge badge--neutral">Inactive</span>}
        </button>
        <div className="category-card__actions">
          {onAddSubcategory && (
            <button type="button" className="btn btn--secondary btn--sm" onClick={onAddSubcategory}>
              <Plus size={14} />
              Subcategory
            </button>
          )}
          <button type="button" className="btn btn--secondary btn--sm" onClick={onAddService}>
            <Plus size={14} />
            Service
          </button>
          <button type="button" className="btn btn--secondary btn--sm" onClick={onEdit}>
            <Pencil size={14} />
            Edit
          </button>
          <button
            type="button"
            className="btn btn--danger btn--sm"
            disabled={deactivate.isPending || !category.active}
            onClick={() => deactivate.mutate(category.id)}
          >
            {category.active ? 'Deactivate' : 'Deactivated'}
          </button>
        </div>
      </div>

      {category.description && <p className="category-card__description">{category.description}</p>}

      {expanded && (
        <div className="category-card__services">
          {isLoading && <div className="empty-state">Loading services…</div>}
          {services && services.length === 0 && <div className="empty-state">No service items yet.</div>}
          {services && services.length > 0 && (
            <ul>
              {services.map((service) => (
                <li key={service.id}>
                  <span>{service.name}</span>
                  {!service.active && <span className="badge badge--neutral">Inactive</span>}
                  <button
                    type="button"
                    className="btn btn--secondary btn--sm category-card__service-edit"
                    onClick={() => onEditService(service)}
                  >
                    <Pencil size={14} />
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {hasSubcategories && <div className="category-card__subcategories">{children}</div>}
    </div>
  );
}

interface CategoryFormModalProps {
  category?: CategoryResponse;
  /** Preselected parent when adding a subcategory from a category card; null for a new top-level category. */
  defaultParentId?: number | null;
  topLevel: CategoryResponse[];
  /** A category that already has subcategories must stay top-level (subcategories are one level deep). */
  hasSubcategories: boolean;
  onClose: () => void;
}

function CategoryFormModal({ category, defaultParentId, topLevel, hasSubcategories, onClose }: CategoryFormModalProps) {
  const isEditing = Boolean(category);
  const [form, setForm] = useState({
    name: category?.name || '',
    parentId: category?.parentId ? String(category.parentId) : defaultParentId ? String(defaultParentId) : '',
    description: category?.description || '',
    iconUrl: category?.iconUrl || '',
    displayOrder: category?.displayOrder ?? 0,
    active: category?.active ?? true,
  });
  const [error, setError] = useState('');
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const mutation = isEditing ? updateCategory : createCategory;

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = event.target instanceof HTMLInputElement && event.target.type === 'checkbox'
      ? event.target.checked
      : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      iconUrl: form.iconUrl.trim() || undefined,
      parentId: form.parentId ? Number(form.parentId) : null,
      displayOrder: Number(form.displayOrder) || 0,
      active: form.active,
    };
    try {
      if (isEditing && category) {
        await updateCategory.mutateAsync({ id: category.id, ...payload });
      } else {
        await createCategory.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save category.');
    }
  };

  const parentOptions = topLevel.filter((option) => option.id !== category?.id);
  const title = isEditing && category
    ? `Edit ${category.name}`
    : defaultParentId
      ? 'New subcategory'
      : 'New category';

  return (
    <Modal title={title} onClose={onClose}>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="category-name">Name</label>
          <input id="category-name" required maxLength={120} value={form.name} onChange={handleChange('name')} />
        </div>
        <div className="field">
          <label htmlFor="category-parent">Parent category</label>
          <select
            id="category-parent"
            value={form.parentId}
            disabled={hasSubcategories}
            onChange={(event) => setForm((prev) => ({ ...prev, parentId: event.target.value }))}
          >
            <option value="">None (top level)</option>
            {parentOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
                {option.active ? '' : ' (inactive)'}
              </option>
            ))}
          </select>
          {hasSubcategories && (
            <small className="category-form__hint">This category has subcategories, so it stays at the top level.</small>
          )}
        </div>
        <div className="field">
          <label htmlFor="category-description">Description</label>
          <textarea id="category-description" maxLength={1000} value={form.description} onChange={handleChange('description')} />
        </div>
        <div className="field">
          <label htmlFor="category-icon">Icon URL</label>
          <input id="category-icon" maxLength={500} value={form.iconUrl} onChange={handleChange('iconUrl')} />
        </div>
        <div className="field">
          <label htmlFor="category-order">Display order</label>
          <input
            id="category-order"
            type="number"
            value={form.displayOrder}
            onChange={(event) => setForm((prev) => ({ ...prev, displayOrder: Number(event.target.value) }))}
          />
        </div>
        <div className="field field--checkbox">
          <input
            id="category-active"
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
          />
          <label htmlFor="category-active">Active</label>
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

interface ServiceItemFormModalProps {
  service?: ServiceItemResponse;
  categoryId: number;
  categories: CategoryResponse[];
  onClose: () => void;
}

function ServiceItemFormModal({ service, categoryId, categories, onClose }: ServiceItemFormModalProps) {
  const [form, setForm] = useState({
    categoryId,
    name: service?.name || '',
    description: service?.description || '',
    active: service?.active ?? true,
  });
  const [error, setError] = useState('');
  const createServiceItem = useCreateServiceItem();
  const updateServiceItem = useUpdateServiceItem();
  const mutation = service ? updateServiceItem : createServiceItem;
  const owner = categories.find((c) => c.id === categoryId);
  const categoryName = owner ? categoryLabel(owner) : undefined;
  const categoryOptions = useMemo(
    () => [...categories].sort((a, b) => categoryLabel(a).localeCompare(categoryLabel(b))),
    [categories],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const payload = {
      categoryId: form.categoryId,
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      active: form.active,
    };
    try {
      if (service) {
        await updateServiceItem.mutateAsync({ id: service.id, ...payload });
      } else {
        await createServiceItem.mutateAsync(payload);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save service item.');
    }
  };

  return (
    <Modal title={service ? `Edit ${service.name}` : `New service — ${categoryName ?? ''}`} onClose={onClose}>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        {service && (
          <div className="field">
            <label htmlFor="service-category">Category</label>
            <select
              id="service-category"
              value={form.categoryId}
              onChange={(event) => setForm((prev) => ({ ...prev, categoryId: Number(event.target.value) }))}
            >
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {categoryLabel(option)}
                  {option.active ? '' : ' (inactive)'}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="field">
          <label htmlFor="service-name">Name</label>
          <input
            id="service-name"
            required
            maxLength={150}
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
          />
        </div>
        <div className="field">
          <label htmlFor="service-description">Description</label>
          <textarea
            id="service-description"
            maxLength={1000}
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
          />
        </div>
        <div className="field field--checkbox">
          <input
            id="service-active"
            type="checkbox"
            checked={form.active}
            onChange={(event) => setForm((prev) => ({ ...prev, active: event.target.checked }))}
          />
          <label htmlFor="service-active">Active</label>
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

export default CategoriesPage;
