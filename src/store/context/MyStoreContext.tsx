import { createContext, useContext, type ReactNode } from 'react';
import type { StoreResponse } from '@/store/types';
import { storeCan, type StorePermissions } from '@/store/utils/labels';

interface MyStoreValue {
  store: StoreResponse;
  can: StorePermissions;
  refresh: () => Promise<unknown>;
}

const MyStoreContext = createContext<MyStoreValue | null>(null);

export function MyStoreProvider({ store, refresh, children }: { store: StoreResponse; refresh: () => Promise<unknown>; children: ReactNode }) {
  return <MyStoreContext.Provider value={{ store, can: storeCan(store.myRole), refresh }}>{children}</MyStoreContext.Provider>;
}

/** The signed-in member's store (loaded once by the portal gate). */
export function useMyStore(): MyStoreValue {
  const ctx = useContext(MyStoreContext);
  if (!ctx) throw new Error('useMyStore must be used inside the store portal');
  return ctx;
}
