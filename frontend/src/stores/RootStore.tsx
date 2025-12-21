import React, { createContext, useContext, ReactNode } from 'react';
import { AuthStore } from './AuthStore';
import { UIStore } from './UIStore';
import { JobStore } from './JobStore';
import { CustomerStore } from './CustomerStore';
import { SettingsStore } from './SettingsStore';
import { InventoryStore } from './InventoryStore';
import { LabourStore } from './LabourStore';
import { ServiceStore } from './ServiceStore';
import { TemplateStore } from './TemplateStore';
import { VehicleStore } from './VehicleStore';
import { InvoiceStore } from './InvoiceStore';
import { AuditLogStore } from './AuditLogStore';
import { CommunicationTemplateStore } from './CommunicationTemplateStore';
import { PaymentMethodStore } from './PaymentMethodStore';
import { PaymentStore } from './PaymentStore';

class RootStore {
  authStore: AuthStore;
  uiStore: UIStore;
  jobStore: JobStore;
  customerStore: CustomerStore;
  settingsStore: SettingsStore;
  inventoryStore: InventoryStore;
  labourStore: LabourStore;
  serviceStore: ServiceStore;
  templateStore: TemplateStore;
  vehicleStore: VehicleStore;
  invoiceStore: InvoiceStore;
  auditLogStore: AuditLogStore;
  communicationTemplateStore: CommunicationTemplateStore;
  paymentMethodStore: PaymentMethodStore;
  paymentStore: PaymentStore;

  constructor() {
    this.authStore = new AuthStore(this);
    this.uiStore = new UIStore(this);
    this.jobStore = new JobStore(this);
    this.customerStore = new CustomerStore(this);
    this.settingsStore = new SettingsStore(this);
    this.inventoryStore = new InventoryStore(this);
    this.labourStore = new LabourStore(this);
    this.serviceStore = new ServiceStore(this);
    this.templateStore = new TemplateStore(this);
    this.vehicleStore = new VehicleStore(this);
    this.invoiceStore = new InvoiceStore(this);
    this.auditLogStore = new AuditLogStore(this);
    this.communicationTemplateStore = new CommunicationTemplateStore(this);
    this.paymentMethodStore = new PaymentMethodStore(this);
    this.paymentStore = new PaymentStore(this);
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

