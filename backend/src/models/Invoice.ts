import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Job } from './Job';
import { CreditNote } from './CreditNote';
import { Payment } from './Payment';

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => Job, (job) => job.invoice)
  @JoinColumn({ name: 'job_id' })
  job: Job;

  @OneToMany(() => CreditNote, (creditNote) => creditNote.invoice)
  creditNotes: CreditNote[];

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments: Payment[];
}

