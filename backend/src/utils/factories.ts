import { Factory, FactorizedAttrs, SubFactory } from '@jorgebodega/typeorm-factory';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcryptjs';
import {
  User, UserRole,
  Customer,
  Vehicle, VehicleOwner, VehicleMake, VehicleModel, VehicleOdometerReading,
  Inventory,
  Labour,
  Service, ServiceItem, ServiceItemType,
  Template, TemplateItem,
  Job, JobStatus,
  LineItem, LineItemType,
  Invoice, InvoiceStatus,
  Settings,
  AuditLog,
  CommunicationTemplate, CommunicationTemplateType, CommunicationTemplateAction,
  PaymentMethod,
  Payment,
  CreditNote
} from '../models';
import { CODE_PREFIXES, generateCode, generateCustomerCode, generateJobCode } from './codeGenerator';

// Helper for consistent passwords
const DEFAULT_PASSWORD = 'password123';
const getPasswordHash = () => bcrypt.hashSync(DEFAULT_PASSWORD, 10);

export class UserFactory extends Factory<User> {
  protected entity = User;
  protected attrs(): FactorizedAttrs<User> {
    return {
      email: faker.internet.email(),
      passwordHash: getPasswordHash(),
      name: faker.person.fullName(),
      role: faker.helpers.arrayElement(Object.values(UserRole)),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class VehicleMakeFactory extends Factory<VehicleMake> {
  protected entity = VehicleMake;
  protected attrs(): FactorizedAttrs<VehicleMake> {
    return {
      name: faker.vehicle.manufacturer(),
      country: faker.location.country(),
      sortOrder: faker.number.int({ min: 0, max: 100 }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class VehicleModelFactory extends Factory<VehicleModel> {
  protected entity = VehicleModel;
  protected attrs(): FactorizedAttrs<VehicleModel> {
    return {
      name: faker.vehicle.model(),
      make: new SubFactory(VehicleMakeFactory),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class CustomerFactory extends Factory<Customer> {
  protected entity = Customer;
  protected attrs(): FactorizedAttrs<Customer> {
    const name = faker.person.fullName();
    return {
      name,
      code: async () => await generateCustomerCode(name),
      email: faker.internet.email(),
      phone: faker.phone.number(),
      address: faker.location.streetAddress(),
      notes: faker.lorem.sentence(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class VehicleFactory extends Factory<Vehicle> {
  protected entity = Vehicle;
  protected attrs(): FactorizedAttrs<Vehicle> {
    return {
      code: async () => await generateCode('vehicles', CODE_PREFIXES.VEHICLE),
      make: faker.vehicle.manufacturer(),
      model: faker.vehicle.model(),
      year: faker.date.past({ years: 20 }).getFullYear(),
      licensePlate: faker.vehicle.vrm(),
      color: faker.vehicle.color(),
      odometer: faker.number.int({ min: 1000, max: 200000 }),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class VehicleOwnerFactory extends Factory<VehicleOwner> {
  protected entity = VehicleOwner;
  protected attrs(): FactorizedAttrs<VehicleOwner> {
    return {
      vehicle: new SubFactory(VehicleFactory),
      customer: new SubFactory(CustomerFactory),
      isPrimary: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class VehicleOdometerReadingFactory extends Factory<VehicleOdometerReading> {
  protected entity = VehicleOdometerReading;
  protected attrs(): FactorizedAttrs<VehicleOdometerReading> {
    return {
      vehicle: new SubFactory(VehicleFactory),
      reading: faker.number.int({ min: 1000, max: 200000 }),
      readingDate: faker.date.past(),
      notes: faker.lorem.sentence(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class InventoryFactory extends Factory<Inventory> {
  protected entity = Inventory;
  protected attrs(): FactorizedAttrs<Inventory> {
    return {
      code: async () => await generateCode('inventory', CODE_PREFIXES.INVENTORY),
      name: faker.commerce.productName(),
      description: faker.commerce.productDescription(),
      sku: faker.string.alphanumeric(8).toUpperCase(),
      unitPrice: parseFloat(faker.commerce.price({ min: 10, max: 200 })),
      costPrice: parseFloat(faker.commerce.price({ min: 5, max: 100 })),
      quantityInStock: faker.number.int({ min: 0, max: 100 }),
      minimumStock: faker.number.int({ min: 5, max: 20 }),
      category: faker.commerce.department(),
      unit: 'each',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class LabourFactory extends Factory<Labour> {
  protected entity = Labour;
  protected attrs(): FactorizedAttrs<Labour> {
    const isFlatRate = faker.datatype.boolean();
    return {
      code: async () => await generateCode('labour', CODE_PREFIXES.LABOUR),
      name: faker.person.jobType(),
      description: faker.lorem.sentence(),
      hourlyRate: isFlatRate ? 0 : parseFloat(faker.commerce.price({ min: 50, max: 200 })),
      defaultHours: faker.number.float({ min: 0.5, max: 5, multipleOf: 0.5 }),
      isFlatRate,
      category: 'General',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class ServiceFactory extends Factory<Service> {
  protected entity = Service;
  protected attrs(): FactorizedAttrs<Service> {
    return {
      code: async () => await generateCode('services', CODE_PREFIXES.SERVICE),
      name: faker.commerce.productName() + ' Service',
      description: faker.lorem.sentence(),
      basePrice: parseFloat(faker.commerce.price({ min: 100, max: 1000 })),
      category: 'Maintenance',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class ServiceItemFactory extends Factory<ServiceItem> {
  protected entity = ServiceItem;
  protected attrs(): FactorizedAttrs<ServiceItem> {
    return {
      service: new SubFactory(ServiceFactory),
      itemType: ServiceItemType.INVENTORY,
      itemId: null, // Should be set when using the factory if linking to specific items
      quantity: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class TemplateFactory extends Factory<Template> {
  protected entity = Template;
  protected attrs(): FactorizedAttrs<Template> {
    return {
      code: async () => await generateCode('templates', CODE_PREFIXES.TEMPLATE),
      name: faker.commerce.productName() + ' Template',
      description: faker.lorem.sentence(),
      createdBy: new SubFactory(UserFactory),
      isGlobal: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class TemplateItemFactory extends Factory<TemplateItem> {
  protected entity = TemplateItem;
  protected attrs(): FactorizedAttrs<TemplateItem> {
    return {
      template: new SubFactory(TemplateFactory),
      itemType: LineItemType.TEXT,
      itemId: null,
      description: faker.lorem.sentence(),
      quantity: 1,
      unitPrice: 0,
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class JobFactory extends Factory<Job> {
  protected entity = Job;
  protected attrs(): FactorizedAttrs<Job> {
    return {
      code: async () => await generateJobCode(),
      customer: new SubFactory(CustomerFactory),
      vehicle: new SubFactory(VehicleFactory),
      assignedTo: new SubFactory(UserFactory),
      status: JobStatus.BOOKED,
      notes: faker.lorem.paragraph(),
      taxRate: 10.0,
      discountAmount: 0,
      discountPercent: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class LineItemFactory extends Factory<LineItem> {
  protected entity = LineItem;
  protected attrs(): FactorizedAttrs<LineItem> {
    return {
      job: new SubFactory(JobFactory),
      type: LineItemType.TEXT,
      referenceId: null,
      description: faker.lorem.sentence(),
      quantity: 1,
      unitPrice: parseFloat(faker.commerce.price({ min: 10, max: 100 })),
      sortOrder: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class InvoiceFactory extends Factory<Invoice> {
  protected entity = Invoice;
  protected attrs(): FactorizedAttrs<Invoice> {
    return {
      invoiceNumber: faker.string.alphanumeric(8).toUpperCase(),
      job: new SubFactory(JobFactory),
      customer: new SubFactory(CustomerFactory), // Ideally same as Job's customer
      status: InvoiceStatus.DRAFT,
      issueDate: new Date(),
      dueDate: faker.date.future(),
      notes: faker.lorem.sentence(),
      subtotal: 0,
      taxTotal: 0,
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class PaymentMethodFactory extends Factory<PaymentMethod> {
  protected entity = PaymentMethod;
  protected attrs(): FactorizedAttrs<PaymentMethod> {
    return {
      name: faker.finance.transactionType().toUpperCase(),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class PaymentFactory extends Factory<Payment> {
  protected entity = Payment;
  protected attrs(): FactorizedAttrs<Payment> {
    return {
      invoice: new SubFactory(InvoiceFactory),
      paymentMethod: new SubFactory(PaymentMethodFactory),
      amount: parseFloat(faker.commerce.price({ min: 10, max: 100 })),
      paymentDate: new Date(),
      paymentNote: faker.lorem.sentence(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class CreditNoteFactory extends Factory<CreditNote> {
  protected entity = CreditNote;
  protected attrs(): FactorizedAttrs<CreditNote> {
    return {
      creditNoteNumber: faker.string.alphanumeric(8).toUpperCase(),
      invoice: new SubFactory(InvoiceFactory),
      amount: parseFloat(faker.commerce.price({ min: 10, max: 50 })),
      reason: faker.lorem.sentence(),
      creditDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class SettingsFactory extends Factory<Settings> {
  protected entity = Settings;
  protected attrs(): FactorizedAttrs<Settings> {
    return {
      key: faker.lorem.slug(),
      value: faker.lorem.word(),
      description: faker.lorem.sentence(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

export class AuditLogFactory extends Factory<AuditLog> {
  protected entity = AuditLog;
  protected attrs(): FactorizedAttrs<AuditLog> {
    return {
      user: new SubFactory(UserFactory),
      action: faker.helpers.arrayElement(['CREATE', 'UPDATE', 'DELETE', 'LOGIN']),
      entity: faker.lorem.word(),
      entityId: faker.string.uuid(),
      details: faker.helpers.objectEntry({}),
      ipAddress: faker.internet.ip(),
      createdAt: new Date(),
    };
  }
}

export class CommunicationTemplateFactory extends Factory<CommunicationTemplate> {
  protected entity = CommunicationTemplate;
  protected attrs(): FactorizedAttrs<CommunicationTemplate> {
    return {
      name: faker.lorem.words(3),
      type: CommunicationTemplateType.EMAIL,
      action: faker.helpers.arrayElement(Object.values(CommunicationTemplateAction)),
      subject: faker.lorem.sentence(),
      body: faker.lorem.paragraphs(2),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}
