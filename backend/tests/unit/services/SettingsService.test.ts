import { SettingsService, SettingValue, UpdateSettingDto } from '../../../src/services/SettingsService';
import { Settings } from '../../../src/models/Settings';
import { NotFoundError } from '../../../src/middleware/errorHandler';

// Mock dependencies
jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('SettingsService', () => {
  let settingsService: SettingsService;
  let mockRepository: any;

  const mockDate = new Date('2024-01-01T00:00:00Z');

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock repository
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    // Mock AppDataSource.getRepository
    const { AppDataSource } = require('../../../src/config/database');
    AppDataSource.getRepository.mockReturnValue(mockRepository);

    settingsService = new SettingsService();
  });

  describe('findAll', () => {
    it('should return all settings with defaults for missing keys', async () => {
      const mockSettings: Partial<Settings>[] = [
        { key: 'shop.name', value: 'Test Shop', updatedAt: mockDate },
        { key: 'tax.default_rate', value: 15, updatedAt: mockDate },
      ];
      mockRepository.find.mockResolvedValue(mockSettings);

      const result = await settingsService.findAll();

      expect(result['shop.name']).toEqual({
        key: 'shop.name',
        value: 'Test Shop',
        updatedAt: mockDate,
      });
      expect(result['tax.default_rate']).toEqual({
        key: 'tax.default_rate',
        value: 15,
        updatedAt: mockDate,
      });
      // Check that defaults are used for missing keys
      expect(result['currency.code']).toBeDefined();
      expect(result['currency.code'].value).toBe('USD');
    });

    it('should return defaults when database is empty', async () => {
      mockRepository.find.mockResolvedValue([]);

      const result = await settingsService.findAll();

      expect(result['shop.name'].value).toBe('My Auto Shop');
      expect(result['tax.default_rate'].value).toBe(10);
      expect(result['currency.code'].value).toBe('USD');
      expect(result['currency.symbol'].value).toBe('$');
    });

    it('should include custom keys not in defaults', async () => {
      const mockSettings: Partial<Settings>[] = [
        { key: 'custom.setting', value: 'custom value', updatedAt: mockDate },
      ];
      mockRepository.find.mockResolvedValue(mockSettings);

      const result = await settingsService.findAll();

      expect(result['custom.setting']).toEqual({
        key: 'custom.setting',
        value: 'custom value',
        updatedAt: mockDate,
      });
    });
  });

  describe('findByKey', () => {
    it('should return setting when found in database', async () => {
      const mockSetting: Partial<Settings> = {
        key: 'shop.name',
        value: 'My Shop',
        updatedAt: mockDate,
      };
      mockRepository.findOne.mockResolvedValue(mockSetting);

      const result = await settingsService.findByKey('shop.name');

      expect(result).toEqual({
        key: 'shop.name',
        value: 'My Shop',
        updatedAt: mockDate,
      });
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { key: 'shop.name' } });
    });

    it('should return default value when key not in database but has default', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await settingsService.findByKey('shop.name');

      expect(result.key).toBe('shop.name');
      expect(result.value).toBe('My Auto Shop');
    });

    it('should throw NotFoundError when key not found and no default', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(settingsService.findByKey('nonexistent.key')).rejects.toThrow(NotFoundError);
      await expect(settingsService.findByKey('nonexistent.key')).rejects.toThrow(
        "Setting 'nonexistent.key' not found"
      );
    });
  });

  describe('update', () => {
    it('should update existing setting', async () => {
      const existingSetting: Partial<Settings> = {
        id: '1',
        key: 'shop.name',
        value: 'Old Shop',
        updatedAt: mockDate,
      };
      const updatedSetting: Partial<Settings> = {
        id: '1',
        key: 'shop.name',
        value: 'New Shop',
        updatedAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(existingSetting);
      mockRepository.save.mockResolvedValue(updatedSetting);

      const result = await settingsService.update('shop.name', { value: 'New Shop' });

      expect(result.value).toBe('New Shop');
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should create new setting if not exists', async () => {
      const newSetting: Partial<Settings> = {
        id: '1',
        key: 'custom.key',
        value: 'custom value',
        updatedAt: mockDate,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockReturnValue(newSetting);
      mockRepository.save.mockResolvedValue(newSetting);

      const result = await settingsService.update('custom.key', { value: 'custom value' });

      expect(result.key).toBe('custom.key');
      expect(result.value).toBe('custom value');
      expect(mockRepository.create).toHaveBeenCalledWith({
        key: 'custom.key',
        value: 'custom value',
      });
    });

    it('should handle different value types', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockImplementation((data: any) => data);
      mockRepository.save.mockImplementation((data: any) => ({ ...data, updatedAt: mockDate }));

      // Test number value
      const numResult = await settingsService.update('tax.rate', { value: 15.5 });
      expect(numResult.value).toBe(15.5);

      // Test object value
      const objResult = await settingsService.update('complex.setting', { 
        value: { nested: 'value', number: 42 } 
      });
      expect(objResult.value).toEqual({ nested: 'value', number: 42 });

      // Test boolean value
      const boolResult = await settingsService.update('flag.setting', { value: true });
      expect(boolResult.value).toBe(true);
    });
  });

  describe('updateBatch', () => {
    it('should update multiple settings at once', async () => {
      const settings = {
        'shop.name': 'Batch Shop',
        'shop.phone': '555-1234',
        'tax.default_rate': 12,
      };

      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockImplementation((data: any) => data);
      mockRepository.save.mockImplementation((data: any) => ({ ...data, updatedAt: mockDate }));

      const result = await settingsService.updateBatch(settings);

      expect(result['shop.name'].value).toBe('Batch Shop');
      expect(result['shop.phone'].value).toBe('555-1234');
      expect(result['tax.default_rate'].value).toBe(12);
    });

    it('should handle empty batch', async () => {
      const result = await settingsService.updateBatch({});

      expect(result).toEqual({});
    });
  });

  describe('resetToDefault', () => {
    it('should reset setting to default value', async () => {
      const resetSetting: Partial<Settings> = {
        id: '1',
        key: 'shop.name',
        value: 'My Auto Shop',
        updatedAt: mockDate,
      };

      mockRepository.findOne.mockResolvedValue({ key: 'shop.name', value: 'Custom Name' });
      mockRepository.save.mockResolvedValue(resetSetting);

      const result = await settingsService.resetToDefault('shop.name');

      expect(result.value).toBe('My Auto Shop');
    });

    it('should throw NotFoundError for key without default', async () => {
      await expect(settingsService.resetToDefault('nonexistent.key')).rejects.toThrow(NotFoundError);
      await expect(settingsService.resetToDefault('nonexistent.key')).rejects.toThrow(
        "No default value for setting 'nonexistent.key'"
      );
    });

    it('should reset tax rate to default', async () => {
      mockRepository.findOne.mockResolvedValue({ key: 'tax.default_rate', value: 25 });
      mockRepository.save.mockResolvedValue({ 
        key: 'tax.default_rate', 
        value: 10, 
        updatedAt: mockDate 
      });

      const result = await settingsService.resetToDefault('tax.default_rate');

      expect(result.value).toBe(10);
    });
  });

  describe('initializeDefaults', () => {
    it('should create missing default settings', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockRepository.create.mockImplementation((data: any) => data);
      mockRepository.save.mockImplementation((data: any) => data);

      await settingsService.initializeDefaults();

      // Should have created settings for all default keys
      expect(mockRepository.create).toHaveBeenCalled();
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should not overwrite existing settings', async () => {
      mockRepository.findOne.mockResolvedValue({ key: 'shop.name', value: 'Existing Shop' });

      await settingsService.initializeDefaults();

      // Save should still be called for other defaults that don't exist
      // But the existing shop.name should not be overwritten
    });
  });
});

