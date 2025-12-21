import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  VersionColumn,
} from 'typeorm';
import { Customer } from './Customer';
import { Vehicle } from './Vehicle';
import { User } from './User';
import { LineItem } from './LineItem';
import { Invoice } from './Invoice';

export enum JobStatus {
  BOOKED = 'BOOKED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING = 'PENDING',
  AWAITING_PICKUP = 'AWAITING_PICKUP',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('jobs')
export class Job {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  code: string;

  @Column({ name: 'customer_id', type: 'uuid' })
  customerId: string;

  @Column({ name: 'vehicle_id', type: 'uuid', nullable: true })
  vehicleId: string | null;

  @Column({ name: 'assigned_to', type: 'uuid', nullable: true })
  assignedTo: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: JobStatus.BOOKED,
  })
  status: JobStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'internal_notes', type: 'text', nullable: true })
  internalNotes: string | null;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  taxRate: number;

  @Column({ name: 'discount_amount', type: 'decimal', precision: 10, scale: 2, default: 0 })
  discountAmount: number;

  @Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
  discountPercent: number;

  @Column({ name: 'due_date', type: 'timestamptz', nullable: true })
  dueDate: Date | null;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date | null;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date | null;

  @Column({ name: 'invoice_id', type: 'uuid', nullable: true })
  invoiceId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn()
  version: number;

  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Vehicle, { nullable: true })
  @JoinColumn({ name: 'vehicle_id' })
  vehicle: Vehicle | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'assigned_to' })
  assignee: User;

  @OneToMany(() => LineItem, (lineItem) => lineItem.job, { cascade: true })
  lineItems: LineItem[];

  @OneToOne(() => Invoice, (invoice) => invoice.job, { nullable: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice: Invoice | null;
}

