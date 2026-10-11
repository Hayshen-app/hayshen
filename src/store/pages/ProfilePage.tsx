import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ImagePlus, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { useStoreApi } from '@/store/api/storeApi';
import { useMyStore } from '@/store/context/MyStoreContext';
import { Badge, Banner, Button, Card, ConfirmDialog, Field, FormError, InfoRow, Modal, PageHeader, toast } from '@/store/components/ui';
import RegionPicker from '@/store/components/RegionPicker';
import { imageFileError, useRegions } from '@/store/hooks/useLookups';
import { storeErrorMessage } from '@/store/utils/errors';
import { EMAIL_RE, formatDateTime, trimOrNull } from '@/store/utils/format';
import { MEMBER_ROLE_LABEL, VERIFICATION_BADGE } from '@/store/utils/labels';
import type { LocationResponse, StoreResponse, UpdateStoreRequest } from '@/store/types';

function toForm(s: StoreResponse) {
  return {
    name: s.name ?? '',
    legalName: s.legalName ?? '',
    registrationNumber: s.registrationNumber ?? '',
    taxId: s.taxId ?? '',
    contactPerson: s.contactPerson ?? '',
    phone: s.phone ?? '',
    email: s.email ?? '',
    description: s.description ?? '',
  };
}

type ProfileForm = ReturnType<typeof toForm>;

function LocationModal({ location, onClose, onDone }: { location: LocationResponse | null; onClose: () => void; onDone: () => void }) {
  const api = useStoreApi();
  const regions = useRegions();
  const [name, setName] = useState(location?.name ?? '');
  const [addressLine, setAddressLine] = useState(location?.addressLine ?? '');
  const [city, setCity] = useState(location?.city ?? '');
  const [regionId, setRegionId] = useState(location?.regionId ? String(location.regionId) : '');
  const [phone, setPhone] = useState(location?.phone ?? '');
  const [primary, setPrimary] = useState(location?.primary ?? false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim() || !addressLine.trim() || !city.trim()) return setError('Լրացրեք անվանումը, հասցեն և քաղաքը');
    const body = {
      name: name.trim(),
      addressLine: addressLine.trim(),
      city: city.trim(),
      regionId: regionId ? Number(regionId) : null,
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      phone: trimOrNull(phone),
      primary,
    };
    setBusy(true);
    setError(null);
    try {
      if (location) await api.updateLocation(location.id, body);
      else await api.addLocation(body);
      toast('Հասցեն պահպանված է');
      onDone();
    } catch (err) {
      setError(storeErrorMessage(err, 'Չհաջողվեց պահպանել հասցեն'));
      setBusy(false);
    }
  };

  return (
    <Modal
      title={location ? 'Խմբագրել հասցեն' : 'Նոր հասցե'}
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Չեղարկել
          </Button>
          <Button onClick={submit} loading={busy}>
            Պահպանել
          </Button>
        </>
      }
    >
      <Field label="Անվանում" required>
        <input value={name} onChange={(e) => setName(e.target.value)} disabled={busy} maxLength={150} placeholder="օր.՝ Կենտրոնական պահեստ" />
      </Field>
      <div className="st-grid st-grid--2">
        <Field label="Մարզ">
          <select value={regionId} onChange={(e) => setRegionId(e.target.value)} disabled={busy}>
            <option value="">— Ընտրեք —</option>
            {(regions.data ?? []).map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Քաղաք" required>
          <input value={city} onChange={(e) => setCity(e.target.value)} disabled={busy} maxLength={100} />
        </Field>
      </div>
      <Field label="Հասցե" required>
        <input value={addressLine} onChange={(e) => setAddressLine(e.target.value)} disabled={busy} maxLength={255} />
      </Field>
      <Field label="Հեռախոս">
        <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} maxLength={30} />
      </Field>
      <label className="st-check">
        <input type="checkbox" checked={primary} onChange={(e) => setPrimary(e.target.checked)} disabled={busy || location?.primary} />
        Հիմնական հասցե
      </label>
      <FormError message={error} />
    </Modal>
  );
}

function ProfilePage() {
  const api = useStoreApi();
  const queryClient = useQueryClient();
  const { store, can, refresh } = useMyStore();
  const regions = useRegions();
  const [form, setForm] = useState<ProfileForm>(() => toForm(store));
  const [regionIds, setRegionIds] = useState<number[]>(() => store.deliveryRegions.map((r) => r.id));
  const [logoUrl, setLogoUrl] = useState<string | null>(store.logoUrl);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmReverify, setConfirmReverify] = useState<UpdateStoreRequest | null>(null);
  const [editingLocation, setEditingLocation] = useState<LocationResponse | null | 'new'>(null);
  const [removingLocation, setRemovingLocation] = useState<LocationResponse | null>(null);
  const readOnly = !can.manage;

  const set = (key: keyof ProfileForm) => (e: { target: { value: string } }) => {
    setForm((p) => ({ ...p, [key]: e.target.value }));
    setFormError(null);
  };

  const afterSave = async () => {
    await refresh();
    queryClient.invalidateQueries({ queryKey: ['store', 'dashboard'] });
  };

  const doSave = async (body: UpdateStoreRequest) => {
    setSaving(true);
    setFormError(null);
    try {
      const updated = await api.updateProfile(body);
      queryClient.setQueryData(['store', 'profile'], updated);
      setForm(toForm(updated));
      toast(
        updated.verificationStatus === 'PENDING' && store.verificationStatus !== 'PENDING'
          ? 'Տվյալները պահպանված են։ Խանութը կրկին ուղարկվել է ստուգման'
          : 'Տվյալները պահպանված են'
      );
      await afterSave();
    } catch (err) {
      setFormError(storeErrorMessage(err, 'Չհաջողվեց պահպանել տվյալները'));
    } finally {
      setSaving(false);
    }
  };

  const save = () => {
    if (!form.name.trim() || !form.registrationNumber.trim() || !form.taxId.trim() || !form.phone.trim()) {
      return setFormError('Լրացրեք պարտադիր դաշտերը (անվանում, գրանցման համար, ՀՎՀՀ, հեռախոս)');
    }
    if (form.email.trim() && !EMAIL_RE.test(form.email.trim())) return setFormError('Սխալ էլ. հասցե');
    const body: UpdateStoreRequest = {
      name: form.name.trim(),
      legalName: trimOrNull(form.legalName),
      registrationNumber: form.registrationNumber.trim(),
      taxId: form.taxId.trim(),
      contactPerson: trimOrNull(form.contactPerson),
      phone: form.phone.trim(),
      email: trimOrNull(form.email),
      description: trimOrNull(form.description),
      logoUrl,
      deliveryRegionIds: regionIds,
    };
    const identityChanged = body.registrationNumber !== store.registrationNumber || body.taxId !== store.taxId;
    if (identityChanged && store.verificationStatus === 'VERIFIED') setConfirmReverify(body);
    else doSave(body);
  };

  const onLogo = async (file: File | undefined) => {
    if (!file) return;
    const msg = imageFileError(file);
    if (msg) return setFormError(msg);
    setUploading(true);
    setFormError(null);
    try {
      setLogoUrl(await api.upload('store-logos', file));
      toast('Լոգոն վերբեռնված է։ Սեղմեք «Պահպանել»');
    } catch (err) {
      setFormError(storeErrorMessage(err, 'Չհաջողվեց վերբեռնել լոգոն'));
    } finally {
      setUploading(false);
    }
  };

  const input = (key: keyof ProfileForm, type = 'text') => (
    <input type={type} value={form[key]} onChange={set(key)} disabled={readOnly || saving} />
  );

  return (
    <>
      <PageHeader title="Խանութի տվյալներ" subtitle={readOnly ? 'Միայն դիտում․ փոփոխությունները կատարում են սեփականատերը կամ ադմինիստրատորը' : undefined} />

      <div className="st-grid st-grid--side">
        <div>
          <Card title="Հիմնական տվյալներ">
            <div className="st-logo-row">
              {logoUrl ? (
                <img src={logoUrl} alt="Լոգո" className="st-logo" />
              ) : (
                <span className="st-logo st-logo--placeholder">{store.name.charAt(0).toUpperCase()}</span>
              )}
              {!readOnly && (
                <label className={`st-btn st-btn--secondary st-btn--sm${uploading || saving ? ' st-btn--disabled' : ''}`}>
                  <ImagePlus size={16} />
                  {uploading ? 'Վերբեռնվում է…' : 'Փոխել լոգոն'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={uploading || saving}
                    onChange={(e) => {
                      onLogo(e.target.files?.[0]);
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>
            <div className="st-grid st-grid--2">
              <Field label="Խանութի անվանում" required>
                {input('name')}
              </Field>
              <Field label="Իրավաբանական անվանում">{input('legalName')}</Field>
              <Field label="Պետական գրանցման համար" required>
                {input('registrationNumber')}
              </Field>
              <Field label="ՀՎՀՀ" required>
                {input('taxId')}
              </Field>
              <Field label="Կոնտակտային անձ">{input('contactPerson')}</Field>
              <Field label="Հեռախոս" required>
                {input('phone', 'tel')}
              </Field>
              <Field label="Էլ. հասցե">{input('email', 'email')}</Field>
            </div>
            <Field label="Նկարագրություն">
              <textarea rows={3} value={form.description} onChange={set('description')} disabled={readOnly || saving} maxLength={2000} />
            </Field>
            {!readOnly && store.verificationStatus === 'VERIFIED' && (
              <p className="st-muted-text">Ուշադրություն․ գրանցման համարի կամ ՀՎՀՀ-ի փոփոխությունից հետո խանութը կվերադառնա ստուգման։</p>
            )}

            <h3 className="st-section-title">Առաքման մարզեր</h3>
            <RegionPicker regions={regions.data ?? []} value={regionIds} onChange={setRegionIds} disabled={readOnly || saving} />

            <FormError message={formError} />
            {!readOnly && (
              <div className="st-row st-row--end">
                <Button
                  variant="ghost"
                  disabled={saving}
                  onClick={() => {
                    setForm(toForm(store));
                    setRegionIds(store.deliveryRegions.map((r) => r.id));
                    setLogoUrl(store.logoUrl);
                    setFormError(null);
                  }}
                >
                  Վերականգնել
                </Button>
                <Button onClick={save} loading={saving} disabled={uploading}>
                  Պահպանել
                </Button>
              </div>
            )}
          </Card>

          <Card
            title={`Հասցեներ / պահեստներ (${store.locations.length})`}
            actions={
              !readOnly ? (
                <Button size="sm" variant="secondary" onClick={() => setEditingLocation('new')}>
                  <Plus size={16} /> Ավելացնել
                </Button>
              ) : null
            }
          >
            <ul className="st-locations">
              {store.locations.map((l) => (
                <li key={l.id}>
                  <MapPin size={18} />
                  <div className="st-locations__body">
                    <strong>
                      {l.name} {l.primary && <Badge tone="success" label="Հիմնական" />}
                    </strong>
                    <span>{[l.addressLine, l.city, l.regionName].filter(Boolean).join(', ')}</span>
                    {l.phone && <span className="st-muted-text">{l.phone}</span>}
                  </div>
                  {!readOnly && (
                    <div className="st-row">
                      <button type="button" className="st-icon-btn" onClick={() => setEditingLocation(l)} aria-label="Խմբագրել">
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="st-icon-btn st-icon-btn--danger"
                        onClick={() => setRemovingLocation(l)}
                        aria-label="Հեռացնել"
                        disabled={store.locations.length <= 1}
                        title={store.locations.length <= 1 ? 'Խանութը պետք է ունենա առնվազն մեկ հասցե' : undefined}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div>
          <Card title="Կարգավիճակ">
            <InfoRow label="Ստուգում" value={<Badge def={VERIFICATION_BADGE[store.verificationStatus]} />} />
            {store.verificationNote && <InfoRow label="Նշում" value={store.verificationNote} />}
            {store.verifiedAt && <InfoRow label="Հաստատված" value={formatDateTime(store.verifiedAt)} />}
            <InfoRow
              label="Գործունեություն"
              value={<Badge tone={store.status === 'ACTIVE' ? 'success' : 'danger'} label={store.status === 'ACTIVE' ? 'Ակտիվ' : 'Կասեցված'} />}
            />
            <InfoRow label="Վարկանիշ" value={store.rating != null ? `${Number(store.rating).toFixed(1)} (${store.ratingCount})` : '—'} />
            <InfoRow label="Իմ դերը" value={store.myRole ? MEMBER_ROLE_LABEL[store.myRole] : '—'} />
            <InfoRow label="Գրանցված" value={formatDateTime(store.createdAt)} />
          </Card>
          {store.verificationStatus !== 'VERIFIED' && (
            <Banner tone="info">Հաստատումից հետո խանութը կտեսնի գնորդների հարցումները ընտրված առաքման մարզերից։</Banner>
          )}
        </div>
      </div>

      {confirmReverify && (
        <ConfirmDialog
          title="Խանութը կրկին կստուգվի"
          message="Գրանցման համարի կամ ՀՎՀՀ-ի փոփոխությունից հետո խանութը կվերադառնա ստուգման։ Մինչ HayShen-ի հաստատումը չեք տեսնի հարցումները և չեք կարող ուղարկել առաջարկներ։"
          confirmLabel="Պահպանել"
          onClose={() => setConfirmReverify(null)}
          onConfirm={() => doSave(confirmReverify)}
        />
      )}
      {editingLocation && (
        <LocationModal
          location={editingLocation === 'new' ? null : editingLocation}
          onClose={() => setEditingLocation(null)}
          onDone={() => {
            setEditingLocation(null);
            refresh();
          }}
        />
      )}
      {removingLocation && (
        <ConfirmDialog
          title="Հեռացնե՞լ հասցեն"
          message={`${removingLocation.name} — ${removingLocation.addressLine}, ${removingLocation.city}`}
          confirmLabel="Հեռացնել"
          danger
          onClose={() => setRemovingLocation(null)}
          onConfirm={async () => {
            try {
              await api.removeLocation(removingLocation.id);
            } catch (err) {
              throw new Error(storeErrorMessage(err, 'Չհաջողվեց հեռացնել հասցեն'));
            }
            toast('Հասցեն հեռացված է');
            await refresh();
          }}
        />
      )}
    </>
  );
}

export default ProfilePage;
