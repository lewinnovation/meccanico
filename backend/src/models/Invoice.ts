import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { Job } from './Job';

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  invoiceNumber: string;

  @Column({ name: 'job_id', type: 'uuid', unique: true })
  jobId: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: InvoiceStatus.UNPAID,
  })
  status: InvoiceStatus;

  @Column({ name: 'invoice_date', type: 'timestamptz' })
  invoiceDate: Date;

  @Column({ name: 'due_date', type: 'timestamptz' })
  dueDate: Date;

  @Column({ name: 'payment_note', type: 'text', nullable: true })
  paymentNote: string | null;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Job, (job) => job.invoice)
  @JoinColumn({ name: 'job_id' })
  job: Job;
}

