import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CommunicationTemplateType {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
}

export enum CommunicationTemplateAction {
  EMAIL_ESTIMATE = 'EMAIL_ESTIMATE',
  EMAIL_INVOICE = 'EMAIL_INVOICE',
  VEHICLE_READY = 'VEHICLE_READY',
  VEHICLE_IN_PROGRESS = 'VEHICLE_IN_PROGRESS',
  VEHICLE_PENDING = 'VEHICLE_PENDING',
  INVOICE_CREATED = 'INVOICE_CREATED',
}

@Entity('communication_templates')
@Index(['action', 'type'], { unique: true })
export class CommunicationTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'enum',
    enum: CommunicationTemplateType,
    default: CommunicationTemplateType.EMAIL,
  })
  type: CommunicationTemplateType;

  @Column({
    type: 'enum',
    enum: CommunicationTemplateAction,
  })
  action: CommunicationTemplateAction;

  @Column({ type: 'varchar', length: 500, nullable: true })
  subject: string | null; // For email templates

  @Column({ type: 'text' })
  body: string;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
