import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToMany,
  OneToMany,
  JoinTable,
  VersionColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { Job } from './Job';
import { VehicleOwner } from './VehicleOwner';

@Entity('vehicles')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 100 })
  make: string;

  @Column({ type: 'varchar', length: 100 })
  model: string;

  @Column({ type: 'integer', nullable: true })
  year: number | null;

  @Column({ type: 'varchar', length: 17, nullable: true })
  vin: string | null;

  @Column({ name: 'license_plate', type: 'varchar', length: 20, nullable: true })
  licensePlate: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  color: string | null;

  @Column({ type: 'integer', nullable: true })
  mileage: number | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn()
  version: number;

  @ManyToMany(() => Customer, (customer) => customer.vehicles)
  @JoinTable({
    name: 'vehicle_owners',
    joinColumn: { name: 'vehicle_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'customer_id', referencedColumnName: 'id' },
  })
  owners: Customer[];

  @OneToMany(() => VehicleOwner, (vehicleOwner) => vehicleOwner.vehicle)
  vehicleOwners: VehicleOwner[];

  @OneToMany(() => Job, (job) => job.vehicle)
  jobs: Job[];
}

