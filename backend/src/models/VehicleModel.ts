import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VehicleMake } from './VehicleMake';

@Entity('vehicle_models')
export class VehicleModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'make_id', type: 'uuid' })
  makeId: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  category: string | null; // SUV, Sedan, Truck, etc.

  @Column({ name: 'year_start', type: 'integer', nullable: true })
  yearStart: number | null;

  @Column({ name: 'year_end', type: 'integer', nullable: true })
  yearEnd: number | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => VehicleMake, (make) => make.models)
  @JoinColumn({ name: 'make_id' })
  make: VehicleMake;
}

