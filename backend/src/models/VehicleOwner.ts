import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Vehicle } from './Vehicle';
import { Customer } from './Customer';

@Entity('vehicle_owners')
@Index(['vehicleId'])
@Index(['customerId'])
export class VehicleOwner {
  @PrimaryColumn({ name: 'vehicle_id', type: 'uuid' })
  vehicleId: string;

  @PrimaryColumn({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'is_primary', type: 'boolean', default: false })
  isPrimary: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.vehicleOwners, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle;

  @ManyToOne(() => Customer, (customer) => customer.vehicleOwners, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}
