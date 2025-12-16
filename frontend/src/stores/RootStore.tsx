import React, { createContext, useContext, ReactNode } from 'react';
import { AuthStore } from './AuthStore';
import { UIStore } from './UIStore';
import { JobStore } from './JobStore';
import { CustomerStore } from './CustomerStore';

class RootStore {
  authStore: AuthStore;
  uiStore: UIStore;
  jobStore: JobStore;
  customerStore: CustomerStore;

  constructor() {
    this.authStore = new AuthStore(this);
    this.uiStore = new UIStore(this);
    this.jobStore = new JobStore(this);
    this.customerStore = new CustomerStore(this);
  }
}

const StoreContext = createContext<RootStore | null>(null);

export const RootStoreProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const store = new RootStore();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
};

export const useStore = (): RootStore => {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('useStore must be used within a RootStoreProvider');
  }
  return store;
};

export type { RootStore };

