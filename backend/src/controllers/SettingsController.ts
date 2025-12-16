import {
  Controller,
  Get,
  Put,
  Body,
  Path,
  Route,
  Tags,
  Security,
  SuccessResponse,
} from 'tsoa';
import {
  SettingsService,
  SettingValue,
  UpdateSettingDto,
} from '../services/SettingsService';

interface BatchUpdateDto {
  settings: Record<string, unknown>;
}

@Route('api/settings')
@Tags('Settings')
@Security('jwt')
export class SettingsController extends Controller {
  private settingsService = new SettingsService();

  /**
   * Get all settings
   */
  @Get('/')
  public async getAllSettings(): Promise<Record<string, SettingValue>> {
    return this.settingsService.findAll();
  }

  /**
   * Get a single setting by key
   */
  @Get('/{key}')
  public async getSetting(@Path() key: string): Promise<SettingValue> {
    return this.settingsService.findByKey(key);
  }

  /**
   * Update a single setting (Admin only)
   */
  @Put('/{key}')
  @Security('jwt', ['ADMIN'])
  public async updateSetting(
    @Path() key: string,
    @Body() body: UpdateSettingDto
  ): Promise<SettingValue> {
    return this.settingsService.update(key, body);
  }

  /**
   * Update multiple settings at once (Admin only)
   */
  @Put('/')
  @Security('jwt', ['ADMIN'])
  public async updateBatchSettings(
    @Body() body: BatchUpdateDto
  ): Promise<Record<string, SettingValue>> {
    return this.settingsService.updateBatch(body.settings);
  }

  /**
   * Reset a setting to its default value (Admin only)
   */
  @Put('/{key}/reset')
  @Security('jwt', ['ADMIN'])
  public async resetSetting(@Path() key: string): Promise<SettingValue> {
    return this.settingsService.resetToDefault(key);
  }
}

