import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store as StoreIcon } from 'lucide-react';
import { useStoreAuth } from '@/store/context/StoreAuthContext';
import { Button, Field, FormError } from '@/store/components/ui';
import RegionPicker from '@/store/components/RegionPicker';
import { useRegions } from '@/store/hooks/useLookups';
import { storeErrorMessage } from '@/store/utils/errors';
import { EMAIL_RE, trimOrNull } from '@/store/utils/format';

const EMPTY = {
  fullName: '',
  email: '',
  phone: '',
  password: '',
  passwordRepeat: '',
  name: '',
  legalName: '',
  registrationNumber: '',
  taxId: '',
  contactPerson: '',
  storePhone: '',
  storeEmail: '',
  description: '',
  locationName: 'Հիմնական պահեստ',
  addressLine: '',
  city: '',
  regionId: '',
};

type Form = typeof EMPTY;
type Errors = Partial<Record<keyof Form, string>>;

function validate(f: Form): Errors {
  const e: Errors = {};
  if (!f.fullName.trim()) e.fullName = 'Պարտադիր դաշտ';
  if (!EMAIL_RE.test(f.email.trim())) e.email = 'Մուտքագրեք ճիշտ էլ. հասցե';
  if (!f.phone.trim()) e.phone = 'Պարտադիր դաշտ';
  if (f.password.length < 8) e.password = 'Առնվազն 8 նիշ';
  if (f.password !== f.passwordRepeat) e.passwordRepeat = 'Գաղտնաբառերը չեն համընկնում';
  if (!f.name.trim()) e.name = 'Պարտադիր դաշտ';
  if (!f.registrationNumber.trim()) e.registrationNumber = 'Պարտադիր դաշտ';
  if (!f.taxId.trim()) e.taxId = 'Պարտադիր դաշտ';
  if (!f.storePhone.trim()) e.storePhone = 'Պարտադիր դաշտ';
  if (f.storeEmail.trim() && !EMAIL_RE.test(f.storeEmail.trim())) e.storeEmail = 'Սխալ էլ. հասցե';
  if (!f.locationName.trim()) e.locationName = 'Պարտադիր դաշտ';
  if (!f.addressLine.trim()) e.addressLine = 'Պարտադիր դաշտ';
  if (!f.city.trim()) e.city = 'Պարտադիր դաշտ';
  return e;
}

function RegisterPage() {
  const { registerStore } = useStoreAuth();
  const navigate = useNavigate();
  const regions = useRegions();
  const [form, setForm] = useState<Form>(EMPTY);
  const [deliveryRegionIds, setDeliveryRegionIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (key: keyof Form) => (e: { target: { value: string } }) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      setFormError('Ստուգեք նշված դաշտերը');
      return;
    }
    setFormError(null);
    setBusy(true);
    try {
      await registerStore({
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        store: {
          name: form.name.trim(),
          legalName: trimOrNull(form.legalName),
          registrationNumber: form.registrationNumber.trim(),
          taxId: form.taxId.trim(),
          contactPerson: trimOrNull(form.contactPerson) ?? form.fullName.trim(),
          phone: form.storePhone.trim(),
          email: trimOrNull(form.storeEmail),
          description: trimOrNull(form.description),
          primaryLocation: {
            name: form.locationName.trim(),
            addressLine: form.addressLine.trim(),
            city: form.city.trim(),
            regionId: form.regionId ? Number(form.regionId) : null,
            phone: form.storePhone.trim(),
          },
          deliveryRegionIds,
        },
      });
      navigate('/store', { replace: true });
    } catch (err) {
      setFormError(storeErrorMessage(err, 'Չհաջողվեց գրանցել խանութը'));
      setBusy(false);
    }
  };

  const input = (key: keyof Form, type = 'text', autoComplete?: string) => (
    <input type={type} value={form[key]} onChange={set(key)} disabled={busy} autoComplete={autoComplete} />
  );

  return (
    <div className="store-portal st-auth">
      <form className="st-auth__card st-auth__card--wide" onSubmit={submit} noValidate>
        <div className="st-auth__brand">
          <StoreIcon size={28} />
          <div>
            <h1>Խանութի գրանցում</h1>
            <p>Գրանցումից հետո HayShen-ը կստուգի խանութի տվյալները։ Հաստատումից հետո կտեսնեք գնորդների հարցումները։</p>
          </div>
        </div>

        <h2 className="st-section-title">Սեփականատեր</h2>
        <div className="st-grid st-grid--2">
          <Field label="Անուն ազգանուն" required error={errors.fullName}>
            {input('fullName', 'text', 'name')}
          </Field>
          <Field label="Հեռախոս" required error={errors.phone}>
            {input('phone', 'tel', 'tel')}
          </Field>
          <Field label="Էլ. հասցե (մուտքի համար)" required error={errors.email}>
            {input('email', 'email', 'email')}
          </Field>
          <div />
          <Field label="Գաղտնաբառ" required error={errors.password} hint="Առնվազն 8 նիշ">
            {input('password', 'password', 'new-password')}
          </Field>
          <Field label="Կրկնեք գաղտնաբառը" required error={errors.passwordRepeat}>
            {input('passwordRepeat', 'password', 'new-password')}
          </Field>
        </div>

        <h2 className="st-section-title">Խանութ</h2>
        <div className="st-grid st-grid--2">
          <Field label="Խանութի անվանում" required error={errors.name}>
            {input('name')}
          </Field>
          <Field label="Իրավաբանական անվանում" error={errors.legalName}>
            {input('legalName')}
          </Field>
          <Field label="Պետական գրանցման համար" required error={errors.registrationNumber}>
            {input('registrationNumber')}
          </Field>
          <Field label="ՀՎՀՀ" required error={errors.taxId}>
            {input('taxId')}
          </Field>
          <Field label="Կոնտակտային անձ" error={errors.contactPerson}>
            {input('contactPerson')}
          </Field>
          <Field label="Խանութի հեռախոս" required error={errors.storePhone}>
            {input('storePhone', 'tel')}
          </Field>
          <Field label="Խանութի էլ. հասցե" error={errors.storeEmail}>
            {input('storeEmail', 'email')}
          </Field>
        </div>
        <Field label="Նկարագրություն">
          <textarea rows={3} value={form.description} onChange={set('description')} disabled={busy} maxLength={2000} />
        </Field>

        <h2 className="st-section-title">Հիմնական հասցե / պահեստ</h2>
        <div className="st-grid st-grid--2">
          <Field label="Անվանում" required error={errors.locationName}>
            {input('locationName')}
          </Field>
          <Field label="Մարզ">
            <select value={form.regionId} onChange={set('regionId')} disabled={busy}>
              <option value="">— Ընտրեք —</option>
              {(regions.data ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Քաղաք / բնակավայր" required error={errors.city}>
            {input('city')}
          </Field>
          <Field label="Հասցե" required error={errors.addressLine}>
            {input('addressLine')}
          </Field>
        </div>

        <h2 className="st-section-title">Առաքման մարզեր</h2>
        <p className="st-muted-text">Նոր հարցումների ծանուցումներ կստանաք ընտրված մարզերից։</p>
        {regions.isError ? (
          <p className="st-error-text">Չհաջողվեց բեռնել մարզերը</p>
        ) : (
          <RegionPicker regions={regions.data ?? []} value={deliveryRegionIds} onChange={setDeliveryRegionIds} disabled={busy} />
        )}

        <FormError message={formError} />
        <Button type="submit" loading={busy} className="st-btn--block">
          Գրանցել խանութը
        </Button>
        <p className="st-auth__alt">
          Արդեն ունե՞ք հաշիվ։ <Link to="/store/login">Մուտք</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;
