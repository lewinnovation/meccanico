import { makeAutoObservable, runInAction } from 'mobx';
import type { RootStore } from './RootStore';
import { api } from '../utils/api';

export interface SettingValue {
  key: string;
  value: unknown;
  updatedAt: string;
}

export interface ShopSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  logo: string;
}

export interface TaxSettings {
  defaultRate: number;
  name: string;
}

export interface CurrencySettings {
  code: string;
  symbol: string;
}

export interface OdometerSettings {
  unit: string; // 'km', 'miles', or 'hours'
}

export interface InvoiceSettings {
  prefix: string;
  terms: string;
  footer: string;
  paymentTermsDays: number;
  preInvoiceLabel: string;
  invoiceLabel: string;
}

export class SettingsStore {
  rootStore: RootStore;
  settings: Record<string, SettingValue> = {};
  isLoading = false;
  isSaving = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    makeAutoObservable(this);
  }

  get shopSettings(): ShopSettings {
    return {
      name: (this.settings['shop.name']?.value as string) || '',
      address: (this.settings['shop.address']?.value as string) || '',
      phone: (this.settings['shop.phone']?.value as string) || '',
      email: (this.settings['shop.email']?.value as string) || '',
      logo: (this.settings['shop.logo']?.value as string) || '',
    };
  }

  get taxSettings(): TaxSettings {
    return {
      defaultRate: (this.settings['tax.default_rate']?.value as number) || 0,
      name: (this.settings['tax.name']?.value as string) || '',
    };
  }

  get currencySettings(): CurrencySettings {
    return {
      code: (this.settings['currency.code']?.value as string) || 'USD',
      symbol: (this.settings['currency.symbol']?.value as string) || '$',
    };
  }

  get invoiceSettings(): InvoiceSettings {
    return {
      prefix: (this.settings['invoice.prefix']?.value as string) || '',
      terms: (this.settings['invoice.terms']?.value as string) || '',
      footer: (this.settings['invoice.footer']?.value as string) || '',
      paymentTermsDays: (this.settings['invoice.payment_terms_days']?.value as number) || 14,
      preInvoiceLabel: (this.settings['invoice.pre_invoice_label']?.value as string) || '',
      invoiceLabel: (this.settings['invoice.invoice_label']?.value as string) || '',
    };
  }

  get odometerSettings(): OdometerSettings {
    return {
      unit: (this.settings['odometer.unit']?.value as string) || 'km',
    };
  }

  async fetchSettings(): Promise<void> {
    this.isLoading = true;
    this.error = null;

    try {
      const response = await api.get('/api/settings');
      runInAction(() => {
        this.settings = response.data;
        this.isLoading = false;
      });
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to fetch settings';
        this.isLoading = false;
      });
    }
  }

  async updateSettings(settings: Record<string, unknown>): Promise<boolean> {
    this.isSaving = true;
    this.error = null;
    this.successMessage = null;

    try {
      const response = await api.put('/api/settings', { settings });
      runInAction(() => {
        // Merge updated settings
        for (const [key, value] of Object.entries(response.data)) {
          this.settings[key] = value as SettingValue;
        }
        this.isSaving = false;
        this.successMessage = 'Settings saved successfully';
      });
      return true;
    } catch (err) {
      runInAction(() => {
        this.error = err instanceof Error ? err.message : 'Failed to save settings';
        this.isSaving = false;
      });
      return false;
    }
  }

  async updateShopSettings(shop: ShopSettings): Promise<boolean> {
    return this.updateSettings({
      'shop.name': shop.name,
      'shop.address': shop.address,
      'shop.phone': shop.phone,
      'shop.email': shop.email,
      'shop.logo': shop.logo,
    });
  }

  async updateTaxSettings(tax: TaxSettings): Promise<boolean> {
    return this.updateSettings({
      'tax.default_rate': tax.defaultRate,
      'tax.name': tax.name,
    });
  }

  async updateCurrencySettings(currency: CurrencySettings, odometer?: OdometerSettings): Promise<boolean> {
    const settings: Record<string, unknown> = {
      'currency.code': currency.code,
      'currency.symbol': currency.symbol,
    };
    if (odometer) {
      settings['odometer.unit'] = odometer.unit;
    }
    return this.updateSettings(settings);
  }

  async updateInvoiceSettings(invoice: InvoiceSettings): Promise<boolean> {
    return this.updateSettings({
      'invoice.prefix': invoice.prefix,
      'invoice.terms': invoice.terms,
      'invoice.footer': invoice.footer,
      'invoice.payment_terms_days': invoice.paymentTermsDays,
      'invoice.pre_invoice_label': invoice.preInvoiceLabel,
      'invoice.invoice_label': invoice.invoiceLabel,
    });
  }

  async updateOdometerSettings(odometer: OdometerSettings): Promise<boolean> {
    return this.updateSettings({
      'odometer.unit': odometer.unit,
    });
  }

  clearMessages(): void {
    this.error = null;
    this.successMessage = null;
  }
}

