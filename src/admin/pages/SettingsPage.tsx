import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useSettings, useUpsertSetting } from '@/admin/api/settings';
import { formatDateTime } from '@/admin/utils/format';
import { ApiError } from '@/api/client';
import type { SettingResponse } from '@/admin/types';

interface KnownSetting {
  label: string;
  hint: string;
  defaultValue: string;
  /** Inclusive integer range the value must fall in. */
  min: number;
  max: number;
}

/** Settings the platform reads by key; shown with guidance (and offered even when not saved yet). */
const KNOWN_SETTINGS: Record<string, KnownSetting> = {
  'materials.store_hold_days': {
    label: 'Materials · store hold (days)',
    hint:
      'Calendar days (Asia/Yerevan) a material store’s earnings stay held after the buyer accepts a delivery, before they become withdrawable. 0 = no hold. Read when a hold starts, so changing it never moves existing holds. Contractor holds stay fixed at 7 days.',
    defaultValue: '3',
    min: 0,
    max: 90,
  },
  'materials.request_expiry_days': {
    label: 'Materials · request expiry (days)',
    hint:
      'Default number of days a published material request stays open for quotations when the buyer does not choose one (1–90). Requests with nothing awarded by then expire.',
    defaultValue: '14',
    min: 1,
    max: 90,
  },
};

function validateKnown(key: string, value: string): string {
  const known = KNOWN_SETTINGS[key];
  if (!known) return '';
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed) || Number(trimmed) < known.min || Number(trimmed) > known.max) {
    return `Enter a whole number between ${known.min} and ${known.max}.`;
  }
  return '';
}

function SettingsPage() {
  const { data: settings, isLoading, isError, error } = useSettings();
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Platform configuration stored as key/value pairs.</p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setShowAdd((prev) => !prev)}>
          <Plus size={16} />
          {showAdd ? 'Cancel' : 'Add setting'}
        </button>
      </div>

      {showAdd && <SettingForm onDone={() => setShowAdd(false)} />}

      {isLoading && <div className="empty-state">Loading settings…</div>}
      {isError && <div className="empty-state">{error?.message || 'Failed to load settings.'}</div>}
      {settings && settings.length === 0 && !showAdd && <div className="empty-state">No settings configured yet.</div>}

      <div className="card" style={{ padding: 0 }}>
        {settings?.map((setting) => <SettingRow key={setting.key} setting={setting} />)}
        {settings &&
          Object.entries(KNOWN_SETTINGS)
            .filter(([key]) => !settings.some((setting) => setting.key === key))
            .map(([key, known]) => (
              <SettingRow
                key={key}
                isNew
                setting={{ key, value: known.defaultValue, description: null, updatedAt: '' }}
              />
            ))}
      </div>
    </div>
  );
}

function SettingRow({ setting, isNew = false }: { setting: SettingResponse; isNew?: boolean }) {
  const known = KNOWN_SETTINGS[setting.key];
  const [value, setValue] = useState(setting.value);
  const [description, setDescription] = useState(setting.description || '');
  const [error, setError] = useState('');
  const mutation = useUpsertSetting();

  const dirty = isNew || value !== setting.value || description !== (setting.description || '');

  const handleSave = async () => {
    setError('');
    const invalid = validateKnown(setting.key, value);
    if (invalid) {
      setError(invalid);
      return;
    }
    try {
      await mutation.mutateAsync({ key: setting.key, value, description: description || undefined });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save setting.');
    }
  };

  return (
    <div style={{ padding: '16px 20px', borderBottom: '1px solid #eee' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div>
          {known && <div style={{ fontWeight: 700, fontSize: 13 }}>{known.label}</div>}
          <div style={{ fontWeight: known ? 400 : 700, fontSize: known ? 12 : 13, fontFamily: known ? 'monospace' : undefined }}>
            {setting.key}
          </div>
          <div style={{ fontSize: 12, color: '#888' }}>
            {isNew ? `Not saved yet - the default (${setting.value}) applies` : `Updated ${formatDateTime(setting.updatedAt)}`}
          </div>
        </div>
      </div>
      {known && <div className="field__hint" style={{ display: 'block', marginTop: 8 }}>{known.hint}</div>}
      {error && <div className="form-error" style={{ marginTop: 12 }}>{error}</div>}
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor={`value-${setting.key}`}>Value</label>
        <input
          id={`value-${setting.key}`}
          value={value}
          inputMode={known ? 'numeric' : undefined}
          onChange={(event) => setValue(event.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`desc-${setting.key}`}>Description</label>
        <input id={`desc-${setting.key}`} value={description} onChange={(event) => setDescription(event.target.value)} />
      </div>
      <button type="button" className="btn btn--primary btn--sm" disabled={!dirty || mutation.isPending} onClick={handleSave}>
        {mutation.isPending ? 'Saving…' : 'Save'}
      </button>
    </div>
  );
}

function SettingForm({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ key: '', value: '', description: '' });
  const [error, setError] = useState('');
  const mutation = useUpsertSetting();

  const handleChange = (field: keyof typeof form) => (event: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const invalid = validateKnown(form.key.trim(), form.value);
    if (invalid) {
      setError(invalid);
      return;
    }
    try {
      await mutation.mutateAsync({
        key: form.key.trim(),
        value: form.value,
        description: form.description.trim() || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to save setting.');
    }
  };

  return (
    <div className="card" style={{ marginBottom: 16 }}>
      {error && <div className="form-error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="new-setting-key">Key</label>
          <input id="new-setting-key" required value={form.key} onChange={handleChange('key')} />
        </div>
        <div className="field">
          <label htmlFor="new-setting-value">Value</label>
          <input id="new-setting-value" required value={form.value} onChange={handleChange('value')} />
        </div>
        <div className="field">
          <label htmlFor="new-setting-description">Description</label>
          <input id="new-setting-description" value={form.description} onChange={handleChange('description')} />
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onDone}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default SettingsPage;
