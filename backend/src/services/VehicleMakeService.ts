import { AppDataSource } from '../config/database';
import { VehicleMake } from '../models/VehicleMake';
import { VehicleModel } from '../models/VehicleModel';
import { NotFoundError, ConflictError } from '../middleware/errorHandler';

export interface CreateVehicleMakeDto {
  name: string;
  country?: string;
  sortOrder?: number;
}

export interface UpdateVehicleMakeDto {
  name?: string;
  country?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateVehicleModelDto {
  makeId: string;
  name: string;
  category?: string;
  yearStart?: number;
  yearEnd?: number;
}

export interface UpdateVehicleModelDto {
  name?: string;
  category?: string;
  yearStart?: number;
  yearEnd?: number;
  isActive?: boolean;
}

export class VehicleMakeService {
  private makeRepository = AppDataSource.getRepository(VehicleMake);
  private modelRepository = AppDataSource.getRepository(VehicleModel);

  // ===================== MAKES =====================

  async findAllMakes(includeInactive = false): Promise<VehicleMake[]> {
    const queryBuilder = this.makeRepository.createQueryBuilder('make');

    if (!includeInactive) {
      queryBuilder.where('make.isActive = :isActive', { isActive: true });
    }

    return queryBuilder
      .leftJoinAndSelect('make.models', 'model', includeInactive ? '1=1' : 'model.isActive = true')
      .orderBy('make.sortOrder', 'ASC')
      .addOrderBy('make.name', 'ASC')
      .getMany();
  }

  async findMakeById(id: string): Promise<VehicleMake> {
    const make = await this.makeRepository.findOne({
      where: { id },
      relations: ['models'],
    });

    if (!make) {
      throw new NotFoundError('Vehicle make not found');
    }

    return make;
  }

  async createMake(data: CreateVehicleMakeDto): Promise<VehicleMake> {
    const existing = await this.makeRepository.findOne({
      where: { name: data.name },
    });

    if (existing) {
      throw new ConflictError('Vehicle make with this name already exists');
    }

    const make = this.makeRepository.create(data);
    return this.makeRepository.save(make);
  }

  async updateMake(id: string, data: UpdateVehicleMakeDto): Promise<VehicleMake> {
    const make = await this.findMakeById(id);

    if (data.name && data.name !== make.name) {
      const existing = await this.makeRepository.findOne({
        where: { name: data.name },
      });
      if (existing) {
        throw new ConflictError('Vehicle make with this name already exists');
      }
    }

    Object.assign(make, data);
    return this.makeRepository.save(make);
  }

  async deleteMake(id: string): Promise<void> {
    const make = await this.findMakeById(id);

    // Check if make has models
    if (make.models && make.models.length > 0) {
      throw new ConflictError('Cannot delete make with associated models. Delete models first or deactivate the make.');
    }

    await this.makeRepository.remove(make);
  }

  // ===================== MODELS =====================

  async findAllModels(makeId?: string, includeInactive = false): Promise<VehicleModel[]> {
    const queryBuilder = this.modelRepository.createQueryBuilder('model');

    if (makeId) {
      queryBuilder.where('model.makeId = :makeId', { makeId });
    }

    if (!includeInactive) {
      queryBuilder.andWhere('model.isActive = :isActive', { isActive: true });
    }

    return queryBuilder
      .leftJoinAndSelect('model.make', 'make')
      .orderBy('make.name', 'ASC')
      .addOrderBy('model.name', 'ASC')
      .getMany();
  }

  async findModelById(id: string): Promise<VehicleModel> {
    const model = await this.modelRepository.findOne({
      where: { id },
      relations: ['make'],
    });

    if (!model) {
      throw new NotFoundError('Vehicle model not found');
    }

    return model;
  }

  async createModel(data: CreateVehicleModelDto): Promise<VehicleModel> {
    // Verify make exists
    await this.findMakeById(data.makeId);

    const model = this.modelRepository.create(data);
    return this.modelRepository.save(model);
  }

  async updateModel(id: string, data: UpdateVehicleModelDto): Promise<VehicleModel> {
    const model = await this.findModelById(id);
    Object.assign(model, data);
    return this.modelRepository.save(model);
  }

  async deleteModel(id: string): Promise<void> {
    const model = await this.findModelById(id);
    await this.modelRepository.remove(model);
  }

  // ===================== BULK OPERATIONS =====================

  async bulkCreateMakesWithModels(
    makes: Array<{ name: string; country?: string; models: string[] }>
  ): Promise<void> {
    for (const makeData of makes) {
      let make = await this.makeRepository.findOne({ where: { name: makeData.name } });

      if (!make) {
        make = this.makeRepository.create({
          name: makeData.name,
          country: makeData.country,
        });
        make = await this.makeRepository.save(make);
      }

      for (const modelName of makeData.models) {
        const existingModel = await this.modelRepository.findOne({
          where: { makeId: make.id, name: modelName },
        });

        if (!existingModel) {
          const model = this.modelRepository.create({
            makeId: make.id,
            name: modelName,
          });
          await this.modelRepository.save(model);
        }
      }
    }
  }
}

