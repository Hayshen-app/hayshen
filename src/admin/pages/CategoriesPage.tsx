import { useState, type ChangeEvent, type FormEvent } from 'react';
import { ChevronDown, ChevronRight, Pencil, Plus } from 'lucide-react';
import {
  useCategories,
  useCreateCategory,
  useCreateServiceItem,
  useDeactivateCategory,
  useServiceItems,
  useUpdateCategory,
} from '@/admin/api/categories';
import Modal from '@/admin/components/Modal';
import { ApiError } from '@/api/client';
import type { CategoryResponse } from '@/admin/types';
import '@/admin/pages/categoriesPage.scss';

function CategoriesPage() {
  const { data: categories, isLoading, isError, error } = useCategories();
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editing, setEditing] = useState<CategoryResponse | null>(null);
  const [creatingServiceFor, setCreatingServiceFor] = useState<CategoryResponse | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Categories</h1>
          <p>Categories and service items shown on the Customer App.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          New category
        </button>
      </div>

      {isLoading && <div className="empty-state">Loading categories…</div>}
      {isError && <div className="empty-state">{error?.message || 'Failed to load categories.'}</div>}
      {categories && categories.length === 0 && <div className="empty-state">No categories yet.</div>}

      <div className="category-list">
        {categories?.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            expanded={expandedId === category.id}
            onToggle={() => setExpandedId(expandedId === category.id ? null : category.id)}
            onEdit={() => setEditing(category)}
            onAddService={() => setCreatingServiceFor(category)}
          />
        ))}
      </div>

      {showCreate && <CategoryFormModal onClose={() => setShowCreate(false)} />}
      {editing && <CategoryFormModal category={editing} onClose={() => setEditing(null)} />}
      {creatingServiceFor && (
        <ServiceItemFormModal category={creatingServiceFor} onClose={() => setCreatingServiceFor(null)} />
      )}
    </div>
  );
}

interface CategoryCardProps {
  category: CategoryResponse;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onAddService: () => void;
}

function CategoryCard({ category, expanded, onToggle, onEdit, onAddService }: CategoryCardProps) {
  const deactivate = useDeactivateCategory();
  const { data: services, isLoading } = useServiceItems(category.id, { enabled: expanded });

  return (
    <div className="card category-card">
      <div className="category-card__header">
        <button type="button" className="category-card__toggle" onClick={onToggle}>
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <span className="category-card__name">{category.name}</span>
          {!category.active && <span className="badge badge--neutral">Inactive</span>}
        </button>
        <div className="category-card__actions">
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
            disabled={deactivate.isPending}
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
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function CategoryFormModal({ category, onClose }: { category?: CategoryResponse; onClose: () => void }) {
  const isEditing = Boolean(category);
  const [form, setForm] = useState({
    name: category?.name || '',
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

  return (
    <Modal title={isEditing && category ? `Edit ${category.name}` : 'New category'} onClose={onClose}>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="category-name">Name</label>
          <input id="category-name" required maxLength={120} value={form.name} onChange={handleChange('name')} />
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

function ServiceItemFormModal({ category, onClose }: { category: CategoryResponse; onClose: () => void }) {
  const [form, setForm] = useState({ name: '', description: '', active: true });
  const [error, setError] = useState('');
  const mutation = useCreateServiceItem();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      await mutation.mutateAsync({
        categoryId: category.id,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        active: form.active,
      });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to create service item.');
    }
  };

  return (
    <Modal title={`New service — ${category.name}`} onClose={onClose}>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
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
