import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus } from 'lucide-react';
import { useStoreApi } from '@/store/api/storeApi';
import { useStoreAuth } from '@/store/context/StoreAuthContext';
import {
  Badge,
  Button,
  Card,
  Column,
  ConfirmDialog,
  DataTable,
  ErrorState,
  Field,
  FormError,
  LoadingState,
  Modal,
  PageHeader,
  toast,
} from '@/store/components/ui';
import { storeErrorMessage } from '@/store/utils/errors';
import { EMAIL_RE, formatDate } from '@/store/utils/format';
import { MEMBER_ROLE_DESCRIPTION, MEMBER_ROLE_LABEL } from '@/store/utils/labels';
import type { MemberResponse, StoreMemberRole } from '@/store/types';

const ASSIGNABLE: StoreMemberRole[] = ['ADMIN', 'SALES_MANAGER', 'EMPLOYEE'];

function RoleOptions({ value, onChange, disabled }: { value: StoreMemberRole; onChange: (r: StoreMemberRole) => void; disabled?: boolean }) {
  return (
    <div className="st-role-options">
      {ASSIGNABLE.map((r) => (
        <label key={r} className={`st-role-option${value === r ? ' st-role-option--on' : ''}`}>
          <input type="radio" name="memberRole" checked={value === r} onChange={() => onChange(r)} disabled={disabled} />
          <div>
            <strong>{MEMBER_ROLE_LABEL[r]}</strong>
            <span>{MEMBER_ROLE_DESCRIPTION[r]}</span>
          </div>
        </label>
      ))}
    </div>
  );
}

function AddMemberModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const api = useStoreApi();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<StoreMemberRole>('EMPLOYEE');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!fullName.trim() || !phone.trim()) return setError('Լրացրեք անունը և հեռախոսը');
    if (!EMAIL_RE.test(email.trim())) return setError('Մուտքագրեք ճիշտ էլ. հասցե');
    if (password.length < 8) return setError('Ժամանակավոր գաղտնաբառը պետք է լինի առնվազն 8 նիշ');
    setBusy(true);
    setError(null);
    try {
      await api.addMember({ fullName: fullName.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password, memberRole: role });
      toast('Աշխատակիցն ավելացված է։ Փոխանցեք նրան էլ. հասցեն և ժամանակավոր գաղտնաբառը');
      onDone();
    } catch (err) {
      setError(storeErrorMessage(err, 'Չհաջողվեց ավելացնել աշխատակցին'));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Նոր աշխատակից"
      wide
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Չեղարկել
          </Button>
          <Button onClick={submit} loading={busy}>
            Ավելացնել
          </Button>
        </>
      }
    >
      <div className="st-grid st-grid--2">
        <Field label="Անուն ազգանուն" required>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} disabled={busy} maxLength={150} />
        </Field>
        <Field label="Հեռախոս" required>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} disabled={busy} maxLength={30} />
        </Field>
        <Field label="Էլ. հասցե (մուտքի համար)" required>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={busy} maxLength={180} autoComplete="off" />
        </Field>
        <Field label="Ժամանակավոր գաղտնաբառ" required hint="Առնվազն 8 նիշ">
          <input type="text" value={password} onChange={(e) => setPassword(e.target.value)} disabled={busy} maxLength={100} autoComplete="new-password" />
        </Field>
      </div>
      <Field label="Դեր" required>
        <RoleOptions value={role} onChange={setRole} disabled={busy} />
      </Field>
      <FormError message={error} />
    </Modal>
  );
}

function TeamPage() {
  const api = useStoreApi();
  const queryClient = useQueryClient();
  const { session } = useStoreAuth();
  const members = useQuery({ queryKey: ['store', 'members'], queryFn: api.members });
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [toggling, setToggling] = useState<MemberResponse | null>(null);

  const refreshMembers = () => queryClient.invalidateQueries({ queryKey: ['store', 'members'] });

  const changeRole = async (m: MemberResponse, role: StoreMemberRole) => {
    setBusyId(m.id);
    try {
      await api.updateMember(m.id, { memberRole: role, active: m.active });
      toast('Դերը փոխված է');
      await refreshMembers();
    } catch (err) {
      toast(storeErrorMessage(err, 'Չհաջողվեց պահպանել'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<MemberResponse>[] = [
    {
      key: 'name',
      header: 'Անուն',
      render: (m) => (
        <div>
          <strong>{m.fullName}</strong>
          {m.userId === session?.userId && <span className="st-muted-text"> (Դուք)</span>}
          <div className="st-muted-text">{m.email}</div>
        </div>
      ),
    },
    { key: 'phone', header: 'Հեռախոս', render: (m) => m.phone },
    {
      key: 'role',
      header: 'Դեր',
      render: (m) => {
        const editable = m.memberRole !== 'OWNER' && m.userId !== session?.userId;
        if (!editable) return <Badge tone={m.memberRole === 'OWNER' ? 'info' : 'neutral'} label={MEMBER_ROLE_LABEL[m.memberRole]} />;
        return (
          <select
            className="st-cell-input st-cell-input--text"
            value={m.memberRole}
            disabled={busyId === m.id}
            onChange={(e) => changeRole(m, e.target.value as StoreMemberRole)}
            title={MEMBER_ROLE_DESCRIPTION[m.memberRole]}
          >
            {ASSIGNABLE.map((r) => (
              <option key={r} value={r}>
                {MEMBER_ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'status',
      header: 'Կարգավիճակ',
      render: (m) => <Badge tone={m.active ? 'success' : 'neutral'} label={m.active ? 'Ակտիվ' : 'Ապաակտիվ'} />,
    },
    { key: 'since', header: 'Ավելացված', render: (m) => formatDate(m.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (m) =>
        m.memberRole !== 'OWNER' && m.userId !== session?.userId ? (
          <Button size="sm" variant={m.active ? 'danger' : 'secondary'} disabled={busyId === m.id} onClick={() => setToggling(m)}>
            {m.active ? 'Ապաակտիվացնել' : 'Ակտիվացնել'}
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Թիմ"
        subtitle="Խանութի աշխատակիցները և նրանց դերերը"
        actions={
          <Button onClick={() => setAdding(true)}>
            <UserPlus size={16} /> Ավելացնել աշխատակից
          </Button>
        }
      />
      <Card>
        {members.isPending ? (
          <LoadingState />
        ) : members.isError ? (
          <ErrorState message={storeErrorMessage(members.error, 'Չհաջողվեց բեռնել թիմը')} onRetry={() => members.refetch()} />
        ) : (
          <DataTable columns={columns} rows={members.data} rowKey={(m) => m.id} emptyText="Աշխատակիցներ չկան" />
        )}
      </Card>
      <Card title="Դերեր և թույլտվություններ">
        <ul className="st-list">
          {(Object.keys(MEMBER_ROLE_LABEL) as StoreMemberRole[]).map((r) => (
            <li key={r}>
              <strong>{MEMBER_ROLE_LABEL[r]}</strong> — {MEMBER_ROLE_DESCRIPTION[r]}
            </li>
          ))}
        </ul>
      </Card>

      {adding && (
        <AddMemberModal
          onClose={() => setAdding(false)}
          onDone={() => {
            setAdding(false);
            refreshMembers();
          }}
        />
      )}
      {toggling && (
        <ConfirmDialog
          title={toggling.active ? 'Ապաակտիվացնե՞լ' : 'Ակտիվացնե՞լ'}
          message={
            toggling.active
              ? `${toggling.fullName} այլևս չի կարողանա մուտք գործել խանութ։`
              : `${toggling.fullName} կրկին կկարողանա մուտք գործել խանութ։`
          }
          confirmLabel={toggling.active ? 'Ապաակտիվացնել' : 'Ակտիվացնել'}
          danger={toggling.active}
          onClose={() => setToggling(null)}
          onConfirm={async () => {
            try {
              await api.updateMember(toggling.id, { memberRole: toggling.memberRole, active: !toggling.active });
            } catch (err) {
              throw new Error(storeErrorMessage(err, 'Չհաջողվեց պահպանել'));
            }
            toast('Պահպանված է');
            await refreshMembers();
          }}
        />
      )}
    </>
  );
}

export default TeamPage;
