import { AppDataSource } from '../config/database';
import { Settings } from '../models/Settings';
import { NotFoundError } from '../middleware/errorHandler';

export interface SettingValue {
  key: string;
  value: unknown;
  updatedAt: Date;
}

export interface UpdateSettingDto {
  value: unknown;
}

// Default settings with their initial values
const DEFAULT_SETTINGS: Record<string, unknown> = {
  'shop.name': 'My Auto Shop',
  'shop.address': '',
  'shop.phone': '',
  'shop.email': '',
  'shop.logo': '',
  'tax.default_rate': 10,
  'tax.name': 'GST',
  'currency.code': 'USD',
  'currency.symbol': '$',
  'invoice.prefix': 'INV-',
  'invoice.terms': 'Payment due within 30 days',
  'invoice.footer': 'Thank you for your business!',
};

export class SettingsService {
  private repository = AppDataSource.getRepository(Settings);

  /**
   * Get all settings as a key-value map
   */
  async findAll(): Promise<Record<string, SettingValue>> {
    const settings = await this.repository.find();
    
    // Build result with defaults for missing keys
    const result: Record<string, SettingValue> = {};
    
    // Add all default keys
    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = settings.find(s => s.key === key);
      result[key] = {
        key,
        value: existing ? existing.value : defaultValue,
        updatedAt: existing ? existing.updatedAt : new Date(),
      };
    }
    
    // Add any custom keys not in defaults
    for (const setting of settings) {
      if (!result[setting.key]) {
        result[setting.key] = {
          key: setting.key,
          value: setting.value,
          updatedAt: setting.updatedAt,
        };
      }
    }
    
    return result;
  }

  /**
   * Get a single setting by key
   */
  async findByKey(key: string): Promise<SettingValue> {
    const setting = await this.repository.findOne({ where: { key } });
    
    if (setting) {
      return {
        key: setting.key,
        value: setting.value,
        updatedAt: setting.updatedAt,
      };
    }
    
    // Return default if exists
    if (key in DEFAULT_SETTINGS) {
      return {
        key,
        value: DEFAULT_SETTINGS[key],
        updatedAt: new Date(),
      };
    }
    
    throw new NotFoundError(`Setting '${key}' not found`);
  }

  /**
   * Update or create a setting
   */
  async update(key: string, data: UpdateSettingDto): Promise<SettingValue> {
    let setting = await this.repository.findOne({ where: { key } });
    
    if (setting) {
      setting.value = data.value;
    } else {
      setting = this.repository.create({
        key,
        value: data.value,
      });
    }
    
    const saved = await this.repository.save(setting);
    
    return {
      key: saved.key,
      value: saved.value,
      updatedAt: saved.updatedAt,
    };
  }

  /**
   * Update multiple settings at once
   */
  async updateBatch(settings: Record<string, unknown>): Promise<Record<string, SettingValue>> {
    const result: Record<string, SettingValue> = {};
    
    for (const [key, value] of Object.entries(settings)) {
      result[key] = await this.update(key, { value });
    }
    
    return result;
  }

  /**
   * Reset a setting to its default value
   */
  async resetToDefault(key: string): Promise<SettingValue> {
    if (!(key in DEFAULT_SETTINGS)) {
      throw new NotFoundError(`No default value for setting '${key}'`);
    }
    
    return this.update(key, { value: DEFAULT_SETTINGS[key] });
  }

  /**
   * Initialize default settings if they don't exist
   */
  async initializeDefaults(): Promise<void> {
    for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
      const existing = await this.repository.findOne({ where: { key } });
      if (!existing) {
        const setting = this.repository.create({ key, value });
        await this.repository.save(setting);
      }
    }
  }
}

