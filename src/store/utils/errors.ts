import { StoreApiError } from '@/store/api/client';

const CODE_MESSAGES: Record<string, string> = {
  NOT_A_STORE_MEMBER: 'Ձեր հաշիվը կապված չէ շինանյութի խանութի հետ',
  NOT_A_STORE_ACCOUNT: 'Այս հաշիվը շինանյութի խանութի հաշիվ չէ',
  STORE_NOT_VERIFIED:
    'Խանութը դեռ հաստատված չէ HayShen-ի կողմից կամ կասեցված է։ Հաստատումից հետո կկարողանաք տեսնել հարցումները և ուղարկել գնային առաջարկներ',
  STORE_PERMISSION_DENIED: 'Ձեր դերը խանութում թույլ չի տալիս կատարել այս գործողությունը',
  QUOTATION_INCOMPLETE: 'Պատասխանեք հարցման բոլոր տողերին (նշեք՝ կարող եք մատակարարել, թե ոչ)',
  QUOTATION_LOCKED: 'Առաջարկն արդեն ընդունված է գնորդի կողմից․ համաձայնեցված գներն այլևս չեն փոխվում',
  REQUEST_NOT_OPEN: 'Հարցումն այլևս չի ընդունում գնային առաջարկներ',
  QUOTATION_EXPIRED: 'Առաջարկի գործողության ժամկետն անցել է',
  ACTIVE_RESERVED_FUNDS: 'Դուրսբերումը հնարավոր չէ, քանի դեռ կան ամրագրված գումարներ',
  WALLET_FROZEN: 'Դրամապանակը սառեցված է։ Կապվեք աջակցման ծառայության հետ',
  NO_AVAILABLE_BALANCE: 'Հասանելի մնացորդ չկա',
  NO_VERIFIED_BANK_ACCOUNT: 'Ավելացրեք և սպասեք բանկային հաշվի հաստատմանը',
  INSUFFICIENT_FUNDS: 'Հասանելի գումարը բավարար չէ',
};

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Անուն ազգանուն',
  email: 'Էլ. հասցե',
  phone: 'Հեռախոս',
  password: 'Գաղտնաբառ',
  name: 'Անվանում',
  registrationNumber: 'Գրանցման համար',
  taxId: 'ՀՎՀՀ',
  addressLine: 'Հասցե',
  city: 'Քաղաք',
  validUntil: 'Վավերականության ժամկետ',
  deliveryFee: 'Առաքման վճար',
  amount: 'Գումար',
  holderName: 'Սեփականատիրոջ անուն',
  bankName: 'Բանկ',
  accountNumber: 'Հաշվի համար',
};

export function errorCode(err: unknown): string | null {
  return err instanceof StoreApiError ? err.code : null;
}

/** Friendly Armenian message for an API error (business code > validation > status > server text). */
export function storeErrorMessage(err: unknown, fallback = 'Տեղի ունեցավ սխալ։ Փորձեք կրկին։'): string {
  if (!(err instanceof StoreApiError)) {
    return err instanceof Error && err.message ? err.message : fallback;
  }
  if (err.code && CODE_MESSAGES[err.code]) return CODE_MESSAGES[err.code];
  if (err.fieldErrors && Object.keys(err.fieldErrors).length) {
    const parts = Object.entries(err.fieldErrors).map(([field, msg]) => {
      const key = field.split('.').pop() ?? field;
      return `${FIELD_LABELS[key] ?? field}՝ ${msg}`;
    });
    return `Ստուգեք դաշտերը. ${parts.join('; ')}`;
  }
  if (err.status === 0) return err.message;
  if (err.status === 401) return 'Սխալ էլ. հասցե կամ գաղտնաբառ, կամ նիստի ժամկետն ավարտվել է';
  if (err.status === 403) return 'Այս գործողությունը Ձեզ հասանելի չէ';
  if (err.status === 404) return 'Չի գտնվել';
  if (err.status >= 500) return 'Սերվերի սխալ։ Փորձեք մի փոքր ուշ։';
  return err.message || fallback;
}

export function messageForCode(code: string): string {
  return CODE_MESSAGES[code] ?? code;
}
