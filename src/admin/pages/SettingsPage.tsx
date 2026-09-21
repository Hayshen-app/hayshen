import { useState, type ChangeEvent, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { useSettings, useUpsertSetting } from '@/admin/api/settings';
import { formatDateTime } from '@/admin/utils/format';
import { ApiError } from '@/api/client';
import type { SettingResponse } from '@/admin/types';

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
      </div>
    </div>
  );
}

function SettingRow({ setting }: { setting: SettingResponse }) {
  const [value, setValue] = useState(setting.value);
  const [description, setDescription] = useState(setting.description || '');
  const [error, setError] = useState('');
  const mutation = useUpsertSetting();

  const dirty = value !== setting.value || description !== (setting.description || '');

  const handleSave = async () => {
    setError('');
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
          <div style={{ fontWeight: 700, fontSize: 13 }}>{setting.key}</div>
          <div style={{ fontSize: 12, color: '#888' }}>Updated {formatDateTime(setting.updatedAt)}</div>
        </div>
      </div>
      {error && <div className="form-error" style={{ marginTop: 12 }}>{error}</div>}
      <div className="field" style={{ marginTop: 12 }}>
        <label htmlFor={`value-${setting.key}`}>Value</label>
        <input id={`value-${setting.key}`} value={value} onChange={(event) => setValue(event.target.value)} />
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
