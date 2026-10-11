import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Banknote, Clock, Hourglass, Wallet as WalletIcon } from 'lucide-react';
import { useStoreApi } from '@/store/api/storeApi';
import { newIdempotencyKey } from '@/store/api/client';
import { useMyStore } from '@/store/context/MyStoreContext';
import {
  Badge,
  Banner,
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
  Pagination,
  StatCard,
  toast,
} from '@/store/components/ui';
import { messageForCode, storeErrorMessage } from '@/store/utils/errors';
import { formatAmd, formatDateTime, parseNumber, roundMoney } from '@/store/utils/format';
import { BANK_ACCOUNT_BADGE, BUCKET_LABEL, HOLD_BADGE, TRANSACTION_LABEL, WITHDRAWAL_BADGE } from '@/store/utils/labels';
import type { BankAccountResponse, HoldInfo, WalletTransactionResponse, WithdrawalRequestResponse } from '@/store/types';

function WithdrawModal({
  available,
  accounts,
  onClose,
  onDone,
}: {
  available: number;
  accounts: BankAccountResponse[];
  onClose: () => void;
  onDone: () => void;
}) {
  const api = useStoreApi();
  const verified = accounts.filter((a) => a.status === 'VERIFIED');
  const [amount, setAmount] = useState(String(available));
  const [accountId, setAccountId] = useState<number | null>(verified[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // One key per (amount, account) attempt: reused when retrying after a failure so a request
  // that actually reached the server is never duplicated; a new key once the input changes.
  const keyRef = useRef<{ key: string; sig: string } | null>(null);

  const submit = async () => {
    const value = parseNumber(amount);
    if (!Number.isFinite(value) || value <= 0) return setError('Մուտքագրեք դուրսբերման գումարը');
    if (value > available) return setError(`Առավելագույնը՝ ${formatAmd(available)}`);
    if (accountId == null) return setError('Ընտրեք հաստատված բանկային հաշիվ');
    const rounded = roundMoney(value);
    const sig = `${rounded}|${accountId}`;
    if (!keyRef.current || keyRef.current.sig !== sig) keyRef.current = { key: newIdempotencyKey(), sig };
    setBusy(true);
    setError(null);
    try {
      await api.requestWithdrawal(rounded, accountId, keyRef.current.key);
      keyRef.current = null;
      toast('Դուրսբերման հայտն ընդունված է');
      onDone();
    } catch (err) {
      setError(storeErrorMessage(err, 'Չհաջողվեց ուղարկել հայտը'));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Դուրսբերում"
      busy={busy}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Չեղարկել
          </Button>
          <Button onClick={submit} loading={busy}>
            Ուղարկել հայտը
          </Button>
        </>
      }
    >
      <p className="st-muted-text">Հասանելի է՝ {formatAmd(available)}։ Գումարը կփոխանցվի ընտրված հաստատված բանկային հաշվին։</p>
      <Field label="Գումար, ֏" required>
        <input inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={busy} />
      </Field>
      <Field label="Բանկային հաշիվ" required>
        <select value={accountId ?? ''} onChange={(e) => setAccountId(e.target.value ? Number(e.target.value) : null)} disabled={busy}>
          {verified.length === 0 && <option value="">Հաստատված հաշիվ չկա</option>}
          {verified.map((a) => (
            <option key={a.id} value={a.id}>
              {a.bankName} · {a.maskedNumber} · {a.holderName}
            </option>
          ))}
        </select>
      </Field>
      <FormError message={error} />
    </Modal>
  );
}

function AddBankAccountModal({ defaultHolder, onClose, onDone }: { defaultHolder: string; onClose: () => void; onDone: () => void }) {
  const api = useStoreApi();
  const [holderName, setHolderName] = useState(defaultHolder);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!holderName.trim() || !bankName.trim() || !accountNumber.trim()) return setError('Լրացրեք բոլոր դաշտերը');
    setBusy(true);
    setError(null);
    try {
      await api.addBankAccount({ holderName: holderName.trim(), bankName: bankName.trim(), accountNumber: accountNumber.replace(/\s/g, '') });
      toast('Հաշիվն ավելացված է և սպասում է հաստատման');
      onDone();
    } catch (err) {
      setError(storeErrorMessage(err, 'Չհաջողվեց ավելացնել հաշիվը'));
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Նոր բանկային հաշիվ"
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
      <Field label="Հաշվի սեփականատեր" required hint="Կարող է լինել խանութի (իրավաբանական) անվանումը կամ սեփականատիրոջ անունը">
        <input value={holderName} onChange={(e) => setHolderName(e.target.value)} disabled={busy} maxLength={150} />
      </Field>
      <Field label="Բանկ" required>
        <input value={bankName} onChange={(e) => setBankName(e.target.value)} disabled={busy} maxLength={150} />
      </Field>
      <Field label="Հաշվի համար" required>
        <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} disabled={busy} maxLength={60} />
      </Field>
      <p className="st-muted-text">Հաշիվը կօգտագործվի դուրսբերումների համար HayShen-ի կողմից հաստատվելուց հետո։</p>
      <FormError message={error} />
    </Modal>
  );
}

function WalletPage() {
  const api = useStoreApi();
  const queryClient = useQueryClient();
  const { store } = useMyStore();
  const [txPage, setTxPage] = useState(0);
  const [wdPage, setWdPage] = useState(0);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [removing, setRemoving] = useState<BankAccountResponse | null>(null);

  const wallet = useQuery({ queryKey: ['store', 'wallet'], queryFn: api.wallet });
  const holds = useQuery({ queryKey: ['store', 'wallet', 'holds'], queryFn: api.holds });
  const eligibility = useQuery({ queryKey: ['store', 'wallet', 'eligibility'], queryFn: api.withdrawalEligibility });
  const accounts = useQuery({ queryKey: ['store', 'wallet', 'accounts'], queryFn: api.bankAccounts });
  const txs = useQuery({
    queryKey: ['store', 'wallet', 'transactions', txPage],
    queryFn: () => api.transactions(txPage),
    placeholderData: keepPreviousData,
  });
  const withdrawals = useQuery({
    queryKey: ['store', 'wallet', 'withdrawals', wdPage],
    queryFn: () => api.withdrawals(wdPage),
    placeholderData: keepPreviousData,
  });

  const refreshWallet = () => queryClient.invalidateQueries({ queryKey: ['store', 'wallet'] });

  const holdColumns: Column<HoldInfo>[] = [
    { key: 'amount', header: 'Գումար', render: (h) => formatAmd(h.amount - (h.reversedAmount ?? 0)), className: 'st-num' },
    { key: 'status', header: 'Կարգավիճակ', render: (h) => <Badge def={HOLD_BADGE[h.status]} /> },
    { key: 'start', header: 'Սկիզբ', render: (h) => formatDateTime(h.holdStartAt) },
    { key: 'release', header: 'Հասանելի կդառնա', render: (h) => (h.status === 'BLOCKED' ? 'Վեճի լուծումից հետո' : formatDateTime(h.releaseAt)) },
  ];

  const txColumns: Column<WalletTransactionResponse>[] = [
    { key: 'date', header: 'Ամսաթիվ', render: (t) => formatDateTime(t.createdAt) },
    {
      key: 'type',
      header: 'Տեսակ',
      render: (t) => (
        <div>
          {TRANSACTION_LABEL[t.type] ?? t.type}
          {t.description && <div className="st-muted-text">{t.description}</div>}
        </div>
      ),
    },
    { key: 'bucket', header: 'Մնացորդ', render: (t) => BUCKET_LABEL[t.bucket] ?? t.bucket },
    {
      key: 'amount',
      header: 'Գումար',
      className: 'st-num',
      render: (t) => <span className={t.amount >= 0 ? 'st-credit' : 'st-debit'}>{`${t.amount >= 0 ? '+' : ''}${formatAmd(t.amount)}`}</span>,
    },
  ];

  const wdColumns: Column<WithdrawalRequestResponse>[] = [
    { key: 'date', header: 'Ամսաթիվ', render: (w) => formatDateTime(w.requestedAt) },
    { key: 'amount', header: 'Գումար', render: (w) => formatAmd(w.amount), className: 'st-num' },
    { key: 'bank', header: 'Հաշիվ', render: (w) => [w.bankName, w.bankAccountNumber].filter(Boolean).join(' · ') || '—' },
    {
      key: 'status',
      header: 'Կարգավիճակ',
      render: (w) => (
        <div>
          <Badge def={WITHDRAWAL_BADGE[w.status]} />
          {w.failureReason && <div className="st-muted-text">{w.failureReason}</div>}
        </div>
      ),
    },
    { key: 'processed', header: 'Մշակված', render: (w) => formatDateTime(w.processedAt) },
  ];

  const accountColumns: Column<BankAccountResponse>[] = [
    { key: 'bank', header: 'Բանկ', render: (a) => a.bankName },
    { key: 'number', header: 'Հաշիվ', render: (a) => a.maskedNumber },
    { key: 'holder', header: 'Սեփականատեր', render: (a) => a.holderName },
    {
      key: 'status',
      header: 'Կարգավիճակ',
      render: (a) => (
        <div>
          <Badge def={BANK_ACCOUNT_BADGE[a.status]} />
          {a.rejectionReason && <div className="st-muted-text">{a.rejectionReason}</div>}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <Button variant="danger" size="sm" onClick={() => setRemoving(a)}>
          Հեռացնել
        </Button>
      ),
    },
  ];

  if (wallet.isPending) return <LoadingState />;
  if (wallet.isError) {
    return <ErrorState message={storeErrorMessage(wallet.error, 'Չհաջողվեց բեռնել դրամապանակը')} onRetry={() => wallet.refetch()} />;
  }

  const w = wallet.data;
  const elig = eligibility.data;
  const accountList = (accounts.data ?? []).filter((a) => a.status !== 'REMOVED');
  const canWithdraw = Boolean(elig?.eligible) && w.status !== 'FROZEN';

  return (
    <>
      <PageHeader
        title="Դրամապանակ"
        subtitle="HayShen դրամապանակ՝ խանութի վաճառքներից եկամուտ և դուրսբերումներ"
        actions={
          <Button onClick={() => setWithdrawOpen(true)} disabled={!canWithdraw || eligibility.isFetching}>
            <Banknote size={16} /> Դուրսբերել
          </Button>
        }
      />
      {w.status === 'FROZEN' && <Banner tone="danger" title="Դրամապանակը սառեցված է">Դուրսբերումները դադարեցված են։ Կապվեք աջակցման ծառայության հետ։</Banner>}
      {elig && !elig.eligible && w.status !== 'FROZEN' && (
        <Banner tone="neutral">{elig.reason ? messageForCode(elig.reason) : elig.message}</Banner>
      )}

      <div className="st-stats">
        <StatCard icon={<WalletIcon size={20} />} label="Հասանելի" value={formatAmd(w.availableBalance)} />
        <StatCard icon={<Hourglass size={20} />} label="Պահման ժամկետում" value={formatAmd(w.frozenBalance)} />
        <StatCard icon={<Clock size={20} />} label="Դուրսբերման ընթացքում" value={formatAmd(w.pendingWithdrawalBalance)} />
        <StatCard icon={<Banknote size={20} />} label="Ընդամենը" value={formatAmd(w.totalBalance)} />
      </div>

      <Banner tone="info" title="Ինչպես է աշխատում վճարումը">
        Գնորդի վճարումը պահվում է HayShen-ի մոտ, մինչև գնորդը հաստատի ապրանքների ստացումը։ Հաստատումից հետո գումարն անցնում է
        «պահման ժամկետի» մեջ, որը սահմանում է HayShen-ը (լռելյայն՝ 3 օր), և այնուհետև դառնում է հասանելի դուրսբերման համար։ Վեճի
        դեպքում պահման ժամկետը կասեցվում է մինչև որոշումը։ Դուրսբերումները կատարվում են սեփականատիրոջ դրամապանակից։
      </Banner>

      <Card title="Պահման ժամկետում գտնվող գումարներ">
        {holds.isPending ? (
          <LoadingState />
        ) : holds.isError ? (
          <ErrorState message={storeErrorMessage(holds.error)} onRetry={() => holds.refetch()} />
        ) : (
          <DataTable columns={holdColumns} rows={holds.data} rowKey={(h) => h.id} emptyText="Պահման ժամկետում գումարներ չկան" />
        )}
      </Card>

      <Card title="Բանկային հաշիվներ" actions={<Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>Ավելացնել հաշիվ</Button>}>
        {accounts.isPending ? (
          <LoadingState />
        ) : accounts.isError ? (
          <ErrorState message={storeErrorMessage(accounts.error)} onRetry={() => accounts.refetch()} />
        ) : (
          <DataTable columns={accountColumns} rows={accountList} rowKey={(a) => a.id} emptyText="Բանկային հաշիվներ չկան" />
        )}
      </Card>

      <Card title="Դուրսբերումներ">
        {withdrawals.isPending ? (
          <LoadingState />
        ) : withdrawals.isError ? (
          <ErrorState message={storeErrorMessage(withdrawals.error)} onRetry={() => withdrawals.refetch()} />
        ) : (
          <>
            <DataTable columns={wdColumns} rows={withdrawals.data.items} rowKey={(x) => x.id} emptyText="Դուրսբերումներ դեռ չկան" />
            <Pagination
              page={withdrawals.data.page}
              totalPages={withdrawals.data.totalPages}
              totalElements={withdrawals.data.totalElements}
              onChange={setWdPage}
              disabled={withdrawals.isFetching}
            />
          </>
        )}
      </Card>

      <Card title="Գործարքներ">
        {txs.isPending ? (
          <LoadingState />
        ) : txs.isError ? (
          <ErrorState message={storeErrorMessage(txs.error, 'Չհաջողվեց բեռնել գործարքները')} onRetry={() => txs.refetch()} />
        ) : (
          <>
            <DataTable columns={txColumns} rows={txs.data.items} rowKey={(t) => t.id} emptyText="Գործարքներ դեռ չկան" />
            <Pagination
              page={txs.data.page}
              totalPages={txs.data.totalPages}
              totalElements={txs.data.totalElements}
              onChange={setTxPage}
              disabled={txs.isFetching}
            />
          </>
        )}
      </Card>
      <p className="st-muted-text">
        Պատվերների վճարման մանրամասները տես <Link to="/store/orders">Պատվերներ</Link> բաժնում։
      </p>

      {withdrawOpen && (
        <WithdrawModal
          available={elig?.availableBalance ?? w.availableBalance}
          accounts={accounts.data ?? []}
          onClose={() => setWithdrawOpen(false)}
          onDone={() => {
            setWithdrawOpen(false);
            refreshWallet();
          }}
        />
      )}
      {addOpen && (
        <AddBankAccountModal
          defaultHolder={store.legalName || store.name}
          onClose={() => setAddOpen(false)}
          onDone={() => {
            setAddOpen(false);
            refreshWallet();
          }}
        />
      )}
      {removing && (
        <ConfirmDialog
          title="Հեռացնե՞լ հաշիվը"
          message={`${removing.bankName} ${removing.maskedNumber}`}
          confirmLabel="Հեռացնել"
          danger
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            try {
              await api.removeBankAccount(removing.id);
            } catch (err) {
              throw new Error(storeErrorMessage(err, 'Չհաջողվեց հեռացնել հաշիվը'));
            }
            toast('Հաշիվը հեռացված է');
            refreshWallet();
          }}
        />
      )}
    </>
  );
}

export default WalletPage;
