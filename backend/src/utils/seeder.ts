import { DataSource } from 'typeorm';
import { Seeder } from '@jorgebodega/typeorm-seeding';
import {
  UserFactory,
  VehicleMakeFactory,
  VehicleModelFactory,
  CustomerFactory,
  VehicleFactory,
  VehicleOwnerFactory,
  InventoryFactory,
  LabourFactory,
  ServiceFactory,
  ServiceItemFactory,
  TemplateFactory,
  TemplateItemFactory,
  JobFactory,
  LineItemFactory,
  InvoiceFactory,
  SettingsFactory,
  CommunicationTemplateFactory,
  PaymentMethodFactory,
  PaymentFactory,
  CreditNoteFactory,
} from './factories';
import {
  User,
  Settings,
  UserRole,
  JobStatus,
  ServiceItemType,
  LineItemType,
  CommunicationTemplateType,
  CommunicationTemplateAction,
} from '../models';
import { vehicleMakesWithModels } from './vehicleData';
import { CODE_PREFIXES, generateCustomerCode, generateCode, generateJobCode } from './codeGenerator';
import { InvoiceService } from '../services/InvoiceService';
import { CreditNoteService } from '../services/CreditNoteService';
import { PaymentService } from '../services/PaymentService';
import { PaymentMethodService } from '../services/PaymentMethodService';

/**
 * Generate job code with specific date
 */
function generateJobCodeForDate(date: Date, sequence: number): string {
  const yy = date.getFullYear().toString().slice(-2);
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const paddedNumber = sequence.toString().padStart(3, '0');
  return `${CODE_PREFIXES.JOB}${yy}${mm}${dd}${paddedNumber}`;
}

export class MainSeeder extends Seeder {
  async run(dataSource: DataSource): Promise<void> {
    console.log('🌱 Starting database seeding via Seeder...');

    // 1. Clear existing data
    await this.clearData(dataSource);

    // 2. Seed Vehicle Makes & Models
    await this.seedVehicleMakesAndModels();

    // 3. Seed Users
    const users = await this.seedUsers(dataSource);

    // 4. Seed Settings
    await this.seedSettings(dataSource);

    // 5. Seed Payment Methods
    await this.seedPaymentMethods();

    // 6. Seed Customers
    const customers = await this.seedCustomers();

    // 7. Seed Vehicles
    const vehicles = await this.seedVehicles(customers);

    // 8. Seed Inventory
    const inventoryItems = await this.seedInventory();

    // 9. Seed Labour
    const labourItems = await this.seedLabour();

    // 10. Seed Services
    const services = await this.seedServices(inventoryItems, labourItems);

    // 11. Seed Templates
    await this.seedTemplates(users.admin, inventoryItems, labourItems, services);

    // 12. Seed Jobs
    await this.seedJobs(users.mechanic, customers, vehicles, inventoryItems, labourItems, services);

    // 13. Seed Communication Templates
    await this.seedCommunicationTemplates();

    console.log('✅ Database seeding completed successfully');
  }

  private async clearData(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    
    // Helper function to safely truncate a table if it exists
    const truncateTableIfExists = async (tableName: string): Promise<void> => {
      const tableExists = await queryRunner.query(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )`,
        [tableName]
      );
      
      if (tableExists[0]?.exists) {
        // Use TRUNCATE CASCADE to handle foreign keys
        await queryRunner.query(`TRUNCATE TABLE ${tableName} CASCADE`);
      }
    };

    try {
      // Connect if not already (though usually it is)
      // queryRunner.connect() is implied if using dataSource directly, but let's stick to simple queries if possible
      // or just use queryRunner for transactions if needed.
      // Here we just use the runner for queries.

      await truncateTableIfExists('communication_templates');
      await truncateTableIfExists('payments');
      await truncateTableIfExists('credit_notes');
      await truncateTableIfExists('payment_methods');
      await truncateTableIfExists('template_items');
      await truncateTableIfExists('templates');
      await truncateTableIfExists('line_items');
      await truncateTableIfExists('invoices');
      await truncateTableIfExists('jobs');
      await truncateTableIfExists('service_items');
      await truncateTableIfExists('services');
      await truncateTableIfExists('labour');
      await truncateTableIfExists('inventory');
      await truncateTableIfExists('vehicle_owners');
      await truncateTableIfExists('vehicles');
      await truncateTableIfExists('vehicle_models');
      await truncateTableIfExists('vehicle_makes');
      await truncateTableIfExists('customers');
      
      // We don't truncate users or settings generally if we want to preserve them, but seedData.ts doesn't truncate users?
      // seedData.ts logic: "Clear all seed data first... await truncateTableIfExists('customers')..." 
      // It DOES truncate customers, but users?
      // seedData.ts checks if admin exists in seedDefaultUsers.
      // But it does not truncate 'users' table in the main list.
      // So we will follow that.

      console.log('  ✓ Cleared all existing seed data');
    } catch (error) {
      console.error('Error clearing data:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  private async seedVehicleMakesAndModels(): Promise<void> {
    console.log('  Seeding vehicle makes and models...');
    let sortOrder = 0;
    for (const makeData of vehicleMakesWithModels) {
      const make = await new VehicleMakeFactory().create({
        name: makeData.name,
        country: makeData.country || undefined,
        sortOrder: sortOrder++,
      });

      for (const modelName of makeData.models) {
        await new VehicleModelFactory().create({
          make,
          name: modelName,
        });
      }
    }
    console.log(`  ✓ Seeded ${vehicleMakesWithModels.length} makes with their models`);
  }

  private async seedUsers(dataSource: DataSource) {
    console.log('  Seeding default users...');
    const userRepository = dataSource.getRepository(User);
    
    const adminEmail = 'admin@meccanico.dev';
    const mechanicEmail = 'mechanic@meccanico.dev';
    const viewerEmail = 'viewer@meccanico.dev';

    const adminFactory = new UserFactory();
    
    let admin = await userRepository.findOne({ where: { email: adminEmail } });
    if (!admin) {
      admin = await adminFactory.create({
        email: adminEmail,
        name: 'Admin User',
        role: UserRole.ADMIN,
      });
    }

    const mechanicFactory = new UserFactory();
    let mechanic = await userRepository.findOne({ where: { email: mechanicEmail } });
    if (!mechanic) {
      mechanic = await mechanicFactory.create({
        email: mechanicEmail,
        name: 'John Mechanic',
        role: UserRole.MECHANIC,
      });
    }

    const viewerFactory = new UserFactory();
    let viewer = await userRepository.findOne({ where: { email: viewerEmail } });
    if (!viewer) {
      viewer = await viewerFactory.create({
        email: viewerEmail,
        name: 'Service Viewer',
        role: UserRole.VIEWER,
      });
    }

    console.log('  ✓ Seeded default users');
    return { admin, mechanic, viewer };
  }

  private async seedSettings(dataSource: DataSource) {
    console.log('  Seeding settings...');
    const settingsRepository = dataSource.getRepository(Settings);
    const defaultSettings = [
      { key: 'shop_info', value: { name: 'Meccanico Auto Repair', email: 'info@meccanico.dev', phone: '+61 2 1234 5678', address: '123 Main Street', city: 'Sydney', state: 'NSW', postcode: '2000', country: 'Australia', abn: '12 345 678 901', website: 'https://meccanico.dev' } },
      { key: 'tax_settings', value: { name: 'GST', defaultRate: 10.0, enabled: true } },
      { key: 'currency_settings', value: { code: 'AUD', symbol: '$', position: 'before' } },
      { key: 'odometer.unit', value: 'km' },
      { key: 'invoice.prefix', value: 'INV-' },
      { key: 'invoice.terms', value: 'Payment due within 30 days.' },
      { key: 'invoice.footer', value: 'Thank you for your business!' },
      { key: 'invoice.payment_terms_days', value: 14 },
      { key: 'vehicle_lexicon', value: { makes: [], models: [] } },
    ];

    const factory = new SettingsFactory();
    for (const setting of defaultSettings) {
      const existing = await settingsRepository.findOne({ where: { key: setting.key } });
      if (!existing) {
        await factory.create(setting);
      }
    }
    console.log('  ✓ Seeded default settings');
  }

  private async seedPaymentMethods() {
    console.log('  Seeding payment methods...');
    const methods = [
      'VISA', 'MASTER/BANK CARD', 'EFTPOS', 'DIRECT PAYMENT',
      'MOTORCHARGE', 'CASH', 'CHEQUE RECEIVED', 'FLEET CARD',
      'AMERICAN EXPRESS', 'BANK', 'CALTEX STARFLEET'
    ];
    for (const name of methods) {
        // seedData.ts says "Data is already cleared in seedDatabase, so just create"
        // But we handle clearData separately.
        await new PaymentMethodFactory().create({ name });
    }
    console.log(`  ✓ Seeded ${methods.length} payment methods`);
  }

  private async seedCustomers() {
    console.log('  Seeding customers...');
    const customerData = [
      { name: 'John Smith', email: 'john.smith@example.com', phone: '+61 400 111 222', address: '45 Oak Street, Melbourne VIC 3000', notes: 'Regular customer, prefers morning appointments' },
      { name: 'Sarah Johnson', email: 'sarah.j@example.com', phone: '+61 400 222 333', address: '12 Elm Avenue, Brisbane QLD 4000', notes: 'Fleet customer - 3 vehicles' },
      { name: 'Michael Brown', email: 'm.brown@example.com', phone: '+61 400 333 444', address: '78 Pine Road, Perth WA 6000', notes: null },
      { name: 'Emma Wilson', email: 'emma.wilson@example.com', phone: '+61 400 444 555', address: '23 Maple Drive, Adelaide SA 5000', notes: 'VIP customer - 10% discount' },
      { name: 'David Lee', email: 'david.lee@example.com', phone: '+61 400 555 666', address: '56 Cedar Lane, Canberra ACT 2600', notes: null },
      { name: 'Lisa Anderson', email: 'lisa.a@example.com', phone: '+61 400 666 777', address: '89 Birch Street, Hobart TAS 7000', notes: 'Corporate account' },
      { name: 'Robert Taylor', email: 'r.taylor@example.com', phone: '+61 400 777 888', address: '34 Willow Way, Darwin NT 0800', notes: null },
      { name: 'Jennifer Martinez', email: 'j.martinez@example.com', phone: '+61 400 888 999', address: '67 Ash Court, Gold Coast QLD 4217', notes: 'New customer' },
    ];

    const customers = [];
    for (const data of customerData) {
      const code = await generateCustomerCode(data.name);
      const customer = await new CustomerFactory().create({
        ...data,
        code,
        notes: data.notes || undefined,
      });
      customers.push(customer);
    }
    console.log(`  ✓ Seeded ${customers.length} customers`);
    return customers;
  }

  private async seedVehicles(customers: any[]) {
    console.log('  Seeding vehicles...');
    const vehicleData = [
      { customerIndex: 0, make: 'Toyota', model: 'Camry', year: 2020, licensePlate: 'ABC123', color: 'Silver', odometer: 45000 },
      { customerIndex: 0, make: 'Honda', model: 'Civic', year: 2018, licensePlate: 'XYZ789', color: 'Blue', odometer: 62000 },
      { customerIndex: 1, make: 'Ford', model: 'Ranger', year: 2021, licensePlate: 'DEF456', color: 'White', odometer: 28000 },
      { customerIndex: 1, make: 'Mazda', model: 'CX-5', year: 2019, licensePlate: 'GHI789', color: 'Red', odometer: 55000 },
      { customerIndex: 1, make: 'Hyundai', model: 'Tucson', year: 2022, licensePlate: 'JKL012', color: 'Black', odometer: 15000 },
      { customerIndex: 2, make: 'Volkswagen', model: 'Golf', year: 2017, licensePlate: 'MNO345', color: 'Grey', odometer: 78000 },
      { customerIndex: 3, make: 'BMW', model: '3 Series', year: 2023, licensePlate: 'PQR678', color: 'Black', odometer: 8000 },
      { customerIndex: 4, make: 'Nissan', model: 'X-Trail', year: 2020, licensePlate: 'STU901', color: 'White', odometer: 42000 },
      { customerIndex: 5, make: 'Subaru', model: 'Outback', year: 2019, licensePlate: 'VWX234', color: 'Green', odometer: 60000 },
      { customerIndex: 6, make: 'Toyota', model: 'RAV4', year: 2021, licensePlate: 'YZA567', color: 'Blue', odometer: 35000 },
      { customerIndex: 7, make: 'Kia', model: 'Sportage', year: 2022, licensePlate: 'BCD890', color: 'Silver', odometer: 20000 },
    ];

    const vehicles = [];
    for (const data of vehicleData) {
      const code = await generateCode('vehicles', CODE_PREFIXES.VEHICLE);
      const vehicle = await new VehicleFactory().create({
        code,
        make: data.make,
        model: data.model,
        year: data.year,
        licensePlate: data.licensePlate,
        color: data.color,
        odometer: data.odometer,
      });
      
      await new VehicleOwnerFactory().create({
        vehicle,
        customer: customers[data.customerIndex],
        isPrimary: true,
      });

      vehicles.push(vehicle);
    }
    console.log(`  ✓ Seeded ${vehicles.length} vehicles`);
    return vehicles;
  }

  private async seedInventory() {
    console.log('  Seeding inventory items...');
    const inventoryData = [
      { name: 'Oil Filter', description: 'Standard oil filter', sku: 'OF-001', unitPrice: 12.99, costPrice: 8.50, quantityInStock: 50, minimumStock: 10, category: 'Filters', unit: 'each' },
      { name: 'Air Filter', description: 'High-quality air filter', sku: 'AF-001', unitPrice: 25.50, costPrice: 15.00, quantityInStock: 30, minimumStock: 5, category: 'Filters', unit: 'each' },
      { name: 'Brake Pads - Front', description: 'Ceramic brake pads front', sku: 'BP-F-001', unitPrice: 89.99, costPrice: 55.00, quantityInStock: 20, minimumStock: 4, category: 'Brakes', unit: 'set' },
      { name: 'Brake Pads - Rear', description: 'Ceramic brake pads rear', sku: 'BP-R-001', unitPrice: 79.99, costPrice: 50.00, quantityInStock: 18, minimumStock: 4, category: 'Brakes', unit: 'set' },
      { name: 'Brake Fluid', description: 'DOT 4 brake fluid', sku: 'BF-001', unitPrice: 15.99, costPrice: 8.00, quantityInStock: 25, minimumStock: 5, category: 'Fluids', unit: 'bottle' },
      { name: 'Engine Oil 5W-30', description: 'Synthetic engine oil 5L', sku: 'EO-530', unitPrice: 45.99, costPrice: 28.00, quantityInStock: 40, minimumStock: 10, category: 'Fluids', unit: 'bottle' },
      { name: 'Spark Plugs', description: 'Iridium spark plugs set of 4', sku: 'SP-001', unitPrice: 65.00, costPrice: 40.00, quantityInStock: 15, minimumStock: 3, category: 'Ignition', unit: 'set' },
      { name: 'Wiper Blades', description: 'Premium wiper blades pair', sku: 'WB-001', unitPrice: 35.00, costPrice: 20.00, quantityInStock: 12, minimumStock: 2, category: 'Accessories', unit: 'pair' },
      { name: 'Battery', description: '12V Car battery', sku: 'BAT-001', unitPrice: 149.99, costPrice: 95.00, quantityInStock: 8, minimumStock: 2, category: 'Electrical', unit: 'each' },
      { name: 'Timing Belt', description: 'Timing belt kit', sku: 'TB-001', unitPrice: 120.00, costPrice: 75.00, quantityInStock: 6, minimumStock: 2, category: 'Engine', unit: 'kit' },
      { name: 'Radiator Hose', description: 'Upper radiator hose', sku: 'RH-001', unitPrice: 28.50, costPrice: 15.00, quantityInStock: 10, minimumStock: 2, category: 'Cooling', unit: 'each' },
      { name: 'Headlight Bulb', description: 'H7 halogen headlight bulb', sku: 'HB-001', unitPrice: 18.99, costPrice: 10.00, quantityInStock: 20, minimumStock: 5, category: 'Electrical', unit: 'each' },
      { name: 'Wheel Bearing', description: 'Front wheel bearing', sku: 'WBG-001', unitPrice: 85.00, costPrice: 50.00, quantityInStock: 5, minimumStock: 2, category: 'Suspension', unit: 'each' },
      { name: 'Shock Absorber', description: 'Front shock absorber', sku: 'SA-001', unitPrice: 125.00, costPrice: 80.00, quantityInStock: 4, minimumStock: 1, category: 'Suspension', unit: 'each' },
      { name: 'Transmission Fluid', description: 'ATF transmission fluid 4L', sku: 'TF-001', unitPrice: 55.99, costPrice: 35.00, quantityInStock: 15, minimumStock: 3, category: 'Fluids', unit: 'bottle' },
    ];

    const items = [];
    for (const data of inventoryData) {
      const code = await generateCode('inventory', CODE_PREFIXES.INVENTORY);
      items.push(await new InventoryFactory().create({ ...data, code }));
    }
    console.log(`  ✓ Seeded ${items.length} inventory items`);
    return items;
  }

  private async seedLabour() {
    console.log('  Seeding labour rates...');
    const labourData = [
      { name: 'General Labor', description: 'Standard mechanic labor', hourlyRate: 85.00, defaultHours: 1, isFlatRate: false, category: 'General' },
      { name: 'Senior Mechanic', description: 'Senior mechanic labor', hourlyRate: 120.00, defaultHours: 1, isFlatRate: false, category: 'General' },
      { name: 'Diagnostic', description: 'Vehicle diagnostic service', hourlyRate: 150.00, defaultHours: 1, isFlatRate: false, category: 'Diagnostic' },
      { name: 'Oil Change Service', description: 'Complete oil change service', hourlyRate: 0, defaultHours: 0.5, isFlatRate: true, category: 'Service', unitPrice: 45.00 },
      { name: 'Brake Service', description: 'Complete brake service', hourlyRate: 0, defaultHours: 2, isFlatRate: true, category: 'Service', unitPrice: 180.00 },
      { name: 'Tire Rotation', description: 'Tire rotation service', hourlyRate: 0, defaultHours: 0.5, isFlatRate: true, category: 'Service', unitPrice: 35.00 },
      { name: 'Battery Replacement', description: 'Battery replacement service', hourlyRate: 0, defaultHours: 0.5, isFlatRate: true, category: 'Service', unitPrice: 25.00 },
      { name: 'AC Service', description: 'Air conditioning service', hourlyRate: 100.00, defaultHours: 1.5, isFlatRate: false, category: 'HVAC' },
    ];

    const items = [];
    for (const data of labourData) {
      const code = await generateCode('labour', CODE_PREFIXES.LABOUR);
      items.push(await new LabourFactory().create({
        ...data,
        code,
        hourlyRate: data.isFlatRate && 'unitPrice' in data ? (data as any).unitPrice : data.hourlyRate,
      }));
    }
    console.log(`  ✓ Seeded ${items.length} labour rates`);
    return items;
  }

  private async seedServices(inventoryItems: any[], labourItems: any[]) {
    console.log('  Seeding services...');
    const generalLabour = labourItems.find((l: any) => l.name === 'General Labor')!;
    const oilFilter = inventoryItems.find((i: any) => i.name === 'Oil Filter')!;
    const engineOil = inventoryItems.find((i: any) => i.name === 'Engine Oil 5W-30')!;
    const brakePadsFront = inventoryItems.find((i: any) => i.name === 'Brake Pads - Front')!;
    const brakePadsRear = inventoryItems.find((i: any) => i.name === 'Brake Pads - Rear')!;
    const brakeFluid = inventoryItems.find((i: any) => i.name === 'Brake Fluid')!;
    const brakeServiceLabour = labourItems.find((l: any) => l.name === 'Brake Service')!;

    const services = [];

    // Service 1: Oil Change
    const oilChange = await new ServiceFactory().create({
      code: await generateCode('services', CODE_PREFIXES.SERVICE),
      name: 'Oil Change Service',
      description: 'Complete oil and filter change',
      basePrice: 89.99,
      category: 'Maintenance',
    });
    
    await new ServiceItemFactory().create({ service: oilChange, itemType: ServiceItemType.INVENTORY, itemId: oilFilter.id, quantity: 1 });
    await new ServiceItemFactory().create({ service: oilChange, itemType: ServiceItemType.INVENTORY, itemId: engineOil.id, quantity: 1 });
    await new ServiceItemFactory().create({ service: oilChange, itemType: ServiceItemType.LABOUR, itemId: generalLabour.id, quantity: 0.5 });
    services.push(oilChange);

    // Service 2: Brake Service
    const brakeService = await new ServiceFactory().create({
      code: await generateCode('services', CODE_PREFIXES.SERVICE),
      name: 'Complete Brake Service',
      description: 'Full brake pad replacement and fluid change',
      basePrice: 450.00,
      category: 'Brakes',
    });
    
    await new ServiceItemFactory().create({ service: brakeService, itemType: ServiceItemType.INVENTORY, itemId: brakePadsFront.id, quantity: 1 });
    await new ServiceItemFactory().create({ service: brakeService, itemType: ServiceItemType.INVENTORY, itemId: brakePadsRear.id, quantity: 1 });
    await new ServiceItemFactory().create({ service: brakeService, itemType: ServiceItemType.INVENTORY, itemId: brakeFluid.id, quantity: 1 });
    await new ServiceItemFactory().create({ service: brakeService, itemType: ServiceItemType.LABOUR, itemId: brakeServiceLabour.id, quantity: 1 });
    services.push(brakeService);

    // Service 3: Clutch Change
    const clutchService = await new ServiceFactory().create({
        code: await generateCode('services', CODE_PREFIXES.SERVICE),
        name: 'Clutch Change',
        description: 'Complete clutch replacement service',
        basePrice: 850.00,
        category: 'Transmission',
    });
    services.push(clutchService);

    console.log(`  ✓ Seeded ${services.length} services`);
    return services;
  }

  private async seedTemplates(admin: any, inventoryItems: any[], labourItems: any[], services: any[]) {
    console.log('  Seeding templates...');
    const generalLabour = labourItems.find((l: any) => l.name === 'General Labor')!;
    const oilFilter = inventoryItems.find((i: any) => i.name === 'Oil Filter')!;
    const engineOil = inventoryItems.find((i: any) => i.name === 'Engine Oil 5W-30')!;
    const airFilter = inventoryItems.find((i: any) => i.name === 'Air Filter')!;
    const sparkPlugs = inventoryItems.find((i: any) => i.name === 'Spark Plugs')!;

    // Template 1: Standard Service
    const t1 = await new TemplateFactory().create({
      code: await generateCode('templates', CODE_PREFIXES.TEMPLATE),
      name: 'Standard Service',
      description: 'Standard vehicle service template',
      createdBy: admin,
      isGlobal: true,
    });
    
    await new TemplateItemFactory().create({ template: t1, itemType: LineItemType.TEXT, description: 'Standard Service', sortOrder: 0 });
    await new TemplateItemFactory().create({ template: t1, itemType: LineItemType.INVENTORY, itemId: oilFilter.id, quantity: 1, unitPrice: oilFilter.unitPrice, sortOrder: 1, description: `${oilFilter.name} (${oilFilter.code})` });
    await new TemplateItemFactory().create({ template: t1, itemType: LineItemType.INVENTORY, itemId: engineOil.id, quantity: 1, unitPrice: engineOil.unitPrice, sortOrder: 2, description: `${engineOil.name} (${engineOil.code})` });
    await new TemplateItemFactory().create({ template: t1, itemType: LineItemType.LABOUR, itemId: generalLabour.id, quantity: 1, unitPrice: generalLabour.hourlyRate, sortOrder: 3, description: `${generalLabour.name} (${generalLabour.code})` });

    // Template 2: Major Service
    const t2 = await new TemplateFactory().create({
        code: await generateCode('templates', CODE_PREFIXES.TEMPLATE),
        name: 'Major Service',
        description: 'Major vehicle service template',
        createdBy: admin,
        isGlobal: true,
    });
    
    await new TemplateItemFactory().create({ template: t2, itemType: LineItemType.TEXT, description: 'Major Service', sortOrder: 0 });
    await new TemplateItemFactory().create({ template: t2, itemType: LineItemType.INVENTORY, itemId: oilFilter.id, quantity: 1, unitPrice: oilFilter.unitPrice, sortOrder: 1, description: `${oilFilter.name} (${oilFilter.code})` });
    await new TemplateItemFactory().create({ template: t2, itemType: LineItemType.INVENTORY, itemId: engineOil.id, quantity: 1, unitPrice: engineOil.unitPrice, sortOrder: 2, description: `${engineOil.name} (${engineOil.code})` });
    await new TemplateItemFactory().create({ template: t2, itemType: LineItemType.INVENTORY, itemId: airFilter.id, quantity: 1, unitPrice: airFilter.unitPrice, sortOrder: 3, description: `${airFilter.name} (${airFilter.code})` });
    await new TemplateItemFactory().create({ template: t2, itemType: LineItemType.INVENTORY, itemId: sparkPlugs.id, quantity: 1, unitPrice: sparkPlugs.unitPrice, sortOrder: 4, description: `${sparkPlugs.name} (${sparkPlugs.code})` });
    await new TemplateItemFactory().create({ template: t2, itemType: LineItemType.LABOUR, itemId: generalLabour.id, quantity: 2, unitPrice: generalLabour.hourlyRate, sortOrder: 5, description: `${generalLabour.name} (${generalLabour.code})` });

    console.log('  ✓ Seeded 2 templates');
  }

  private async seedJobs(mechanic: any, customers: any[], vehicles: any[], inventoryItems: any[], labourItems: any[], services: any[]) {
    console.log('  Seeding jobs...');
    const generalLabour = labourItems.find((l: any) => l.name === 'General Labor')!;
    const oilFilter = inventoryItems.find((i: any) => i.name === 'Oil Filter')!;
    const engineOil = inventoryItems.find((i: any) => i.name === 'Engine Oil 5W-30')!;
    const brakePadsFront = inventoryItems.find((i: any) => i.name === 'Brake Pads - Front')!;
    const oilChangeService = services.find((s: any) => s.name === 'Oil Change Service')!;

    const now = new Date();
    const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(now); lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(now); lastMonth.setMonth(lastMonth.getMonth() - 1);

    // Job 1: BOOKED
    const job1 = await new JobFactory().create({
      code: generateJobCodeForDate(yesterday, 1),
      customer: customers[0],
      vehicle: vehicles[0],
      assignedTo: mechanic,
      status: JobStatus.BOOKED,
      notes: 'Customer requested quote for oil change',
      createdAt: yesterday,
    });

    await new LineItemFactory().create({ job: job1, type: LineItemType.TEXT, description: 'Service', sortOrder: 0 });
    await new LineItemFactory().create({ job: job1, type: LineItemType.INVENTORY, referenceId: oilFilter.id, description: `${oilFilter.name} (${oilFilter.code})`, quantity: 1, unitPrice: oilFilter.unitPrice, sortOrder: 1 });
    await new LineItemFactory().create({ job: job1, type: LineItemType.INVENTORY, referenceId: engineOil.id, description: `${engineOil.name} (${engineOil.code})`, quantity: 1, unitPrice: engineOil.unitPrice, sortOrder: 2 });
    await new LineItemFactory().create({ job: job1, type: LineItemType.LABOUR, referenceId: generalLabour.id, description: `${generalLabour.name} (${generalLabour.code})`, quantity: 0.5, unitPrice: generalLabour.hourlyRate, sortOrder: 3 });

    // Job 2: IN_PROGRESS
    const job2 = await new JobFactory().create({
      code: generateJobCodeForDate(lastWeek, 1),
      customer: customers[1],
      vehicle: vehicles[2],
      assignedTo: mechanic,
      status: JobStatus.IN_PROGRESS,
      notes: 'Brake pad replacement in progress',
      startedAt: yesterday,
      createdAt: lastWeek,
    });

    await new LineItemFactory().create({ job: job2, type: LineItemType.INVENTORY, referenceId: brakePadsFront.id, description: `${brakePadsFront.name} (${brakePadsFront.code})`, quantity: 1, unitPrice: brakePadsFront.unitPrice, sortOrder: 0 });
    await new LineItemFactory().create({ job: job2, type: LineItemType.LABOUR, referenceId: generalLabour.id, description: `${generalLabour.name} (${generalLabour.code})`, quantity: 2, unitPrice: generalLabour.hourlyRate, sortOrder: 1 });

    // Job 3: COMPLETED (will have invoice)
    const job3 = await new JobFactory().create({
      code: generateJobCodeForDate(lastWeek, 2),
      customer: customers[2],
      vehicle: vehicles[5],
      assignedTo: mechanic,
      status: JobStatus.COMPLETED,
      notes: 'Service completed',
      startedAt: lastWeek,
      completedAt: yesterday,
      createdAt: lastMonth,
    });
    
    await new LineItemFactory().create({ job: job3, type: LineItemType.SERVICE, referenceId: oilChangeService.id, description: `${oilChangeService.name} (${oilChangeService.code})`, quantity: 1, unitPrice: oilChangeService.basePrice, sortOrder: 0 });

    // Job 4: COMPLETED (will have paid invoice)
    const job4 = await new JobFactory().create({
        code: generateJobCodeForDate(lastMonth, 1),
        customer: customers[3],
        vehicle: vehicles[6],
        assignedTo: mechanic,
        status: JobStatus.COMPLETED,
        notes: 'Payment received',
        discountPercent: 10.0,
        startedAt: lastMonth,
        completedAt: lastWeek,
        createdAt: lastMonth,
    });

    await new LineItemFactory().create({ job: job4, type: LineItemType.TEXT, description: 'Scanning', sortOrder: 0 });
    await new LineItemFactory().create({ job: job4, type: LineItemType.INVENTORY, referenceId: oilFilter.id, description: `${oilFilter.name} (${oilFilter.code})`, quantity: 1, unitPrice: oilFilter.unitPrice, sortOrder: 1 });

    // Job 5: PENDING
    const job5 = await new JobFactory().create({
        code: generateJobCodeForDate(lastWeek, 3),
        customer: customers[4],
        vehicle: vehicles[7],
        assignedTo: mechanic,
        status: JobStatus.PENDING,
        notes: 'Waiting for parts',
        createdAt: lastWeek,
    });

    console.log('  ✓ Seeded 5 jobs in various statuses');

    // Create invoices/payments logic
    const invoiceService = new InvoiceService();
    const creditNoteService = new CreditNoteService();
    const paymentMethodService = new PaymentMethodService();
    const paymentService = new PaymentService();

    // Get payment methods
    const paymentMethods = await paymentMethodService.findAll();
    const cashPaymentMethod = paymentMethods.find(pm => pm.name === 'CASH') || paymentMethods[0];
    const cardPaymentMethod = paymentMethods.find(pm => pm.name === 'VISA' || pm.name === 'MASTER/BANK CARD') || paymentMethods[0];

    // Create invoice for job3 (unpaid)
    let invoice3;
    try {
      invoice3 = await invoiceService.createFromJob(job3.id);
      console.log(`  ✓ Created invoice ${invoice3.invoiceNumber} for job ${job3.code}`);
    } catch (error) {
      console.error(`  ✗ Failed to create invoice for job ${job3.code}:`, error);
    }

    // Create invoice for job4 (paid with partial payments)
    try {
        const invoice4 = await invoiceService.createFromJob(job4.id);
        
        // Credit note for Invoice 4
        try {
            const remainingBalance = await creditNoteService.getRemainingBalance(invoice4.id);
            if (remainingBalance >= 1.00) {
                const creditAmount = Math.min(remainingBalance * 0.15, remainingBalance);
                const taxRate = invoice4.job?.taxRate || 10; // Default if not loaded
                const preTaxCreditAmount = creditAmount / (1 + taxRate / 100);

                if (preTaxCreditAmount > 0.01) {
                    await creditNoteService.create({
                        invoiceId: invoice4.id,
                        amount: parseFloat(preTaxCreditAmount.toFixed(2)),
                        reason: 'Warranty adjustment - Brake service',
                        creditDate: new Date(),
                    });
                }
            }
        } catch(e) { console.error('Error creating credit note for invoice 4', e); }

        // Payments for Invoice 4
        if (cashPaymentMethod && cardPaymentMethod) {
            const remainingAfterCredit = await paymentService.getRemainingBalance(invoice4.id);
            const firstPaymentAmount = Math.min(50, remainingAfterCredit);
            
            if (firstPaymentAmount > 0) {
                await paymentService.create({
                    invoiceId: invoice4.id,
                    paymentMethodId: cashPaymentMethod.id,
                    amount: firstPaymentAmount,
                    paymentNote: 'Partial payment - cash',
                });
            }

            const remainingAfterFirst = await paymentService.getRemainingBalance(invoice4.id);
            if (remainingAfterFirst > 0) {
                await paymentService.create({
                    invoiceId: invoice4.id,
                    paymentMethodId: cardPaymentMethod.id,
                    amount: remainingAfterFirst,
                    paymentNote: 'Final payment - credit card',
                });
            }
        }
        console.log(`  ✓ Created and fully paid invoice ${invoice4.invoiceNumber} for job ${job4.code}`);
    } catch (error) {
        console.error(`  ✗ Failed to create invoice for job ${job4.code}:`, error);
    }

    // Credit Note for Invoice 3
    if (invoice3) {
        try {
            const remainingBalance = await creditNoteService.getRemainingBalance(invoice3.id);
            if (remainingBalance >= 1.00) {
                const creditAmount = Math.min(remainingBalance * 0.15, remainingBalance);
                const taxRate = invoice3.job?.taxRate || 10;
                const preTaxCreditAmount = creditAmount / (1 + taxRate / 100);

                if (preTaxCreditAmount > 0.01) {
                    await creditNoteService.create({
                        invoiceId: invoice3.id,
                        amount: parseFloat(preTaxCreditAmount.toFixed(2)),
                        reason: 'Returned unused parts - Oil filter',
                        creditDate: new Date(),
                    });
                    console.log(`  ✓ Created credit note for invoice ${invoice3.invoiceNumber}`);
                }
            }
        } catch (error) {
            console.error('Error creating credit note for invoice 3', error);
        }
    }
  }

  private async seedCommunicationTemplates() {
    console.log('  Seeding communication templates...');
    // Basic templates
    const templates = [
        {
        name: 'Email Estimate',
        type: CommunicationTemplateType.EMAIL,
        action: CommunicationTemplateAction.EMAIL_ESTIMATE,
        subject: 'Estimate for {vehicle_make} {vehicle_model} ({rego})',
        body: `<p>Hi {customer_name},</p><p>Please find attached your estimate for {car_information}.</p><p><strong>Job Code:</strong> {job_code}</p>{line_items}<p><strong>Estimate Total:</strong> {estimate_total}</p><p><em>This is an estimate and does not require payment.</em></p><p>If you have any questions or would like to proceed with this work, please don't hesitate to contact us.</p><p><strong>Phone:</strong> {shop_phone}<br><strong>Email:</strong> {shop_email}</p><p>We look forward to serving you.</p><p>Best regards,<br>{shop_name}</p>`,
      },
      {
        name: 'Email Invoice',
        type: CommunicationTemplateType.EMAIL,
        action: CommunicationTemplateAction.EMAIL_INVOICE,
        subject: 'Invoice for {vehicle_make} {vehicle_model} ({rego})',
        body: `<p>Hi {customer_name},</p><p>Please find attached your invoice for {car_information}.</p><p><strong>Job Code:</strong> {job_code}</p>{line_items}<p><strong>Total amount due:</strong> {invoice_total}</p><p>Payment can be made via the methods listed on the invoice. If you have any questions, please contact us.</p><p><strong>Phone:</strong> {shop_phone}<br><strong>Email:</strong> {shop_email}</p><p>Thank you for your business!</p><p>Best regards,<br>{shop_name}</p>`,
      },
      {
        name: 'Vehicle Ready',
        type: CommunicationTemplateType.EMAIL,
        action: CommunicationTemplateAction.VEHICLE_READY,
        subject: 'Your {car_information} is ready for pickup',
        body: `Hi {customer_name},\n\nGreat news! Your {car_information} is ready for pickup.\n\nJob Code: {job_code}\n\nPlease contact us to arrange a convenient time to collect your vehicle.\n\nPhone: {shop_phone}\nEmail: {shop_email}\n\nWe look forward to seeing you soon.\n\nBest regards,\n{shop_name}`,
      },
      {
        name: 'Vehicle In Progress',
        type: CommunicationTemplateType.EMAIL,
        action: CommunicationTemplateAction.VEHICLE_IN_PROGRESS,
        subject: 'Update on your {car_information}',
        body: `Hi {customer_name},\n\nThis is an update on your {car_information}.\n\nJob Code: {job_code}\nStatus: {job_status}\n\nWe are currently working on your vehicle and will keep you updated on our progress.\n\nIf you have any questions, please don't hesitate to contact us.\n\nPhone: {shop_phone}\nEmail: {shop_email}\n\nBest regards,\n{shop_name}`,
      },
      {
        name: 'Vehicle Pending',
        type: CommunicationTemplateType.EMAIL,
        action: CommunicationTemplateAction.VEHICLE_PENDING,
        subject: 'Update on your {car_information}',
        body: `Hi {customer_name},\n\nThis is an update on your {car_information}.\n\nJob Code: {job_code}\nStatus: {job_status}\n\nWe are currently waiting on parts/materials to complete the work on your vehicle. We will contact you as soon as we have an update.\n\nIf you have any questions, please don't hesitate to contact us.\n\nPhone: {shop_phone}\nEmail: {shop_email}\n\nBest regards,\n{shop_name}`,
      },
      {
        name: 'Invoice Created',
        type: CommunicationTemplateType.EMAIL,
        action: CommunicationTemplateAction.INVOICE_CREATED,
        subject: 'Invoice created for {car_information} - {job_code}',
        body: `Hi {customer_name},\n\nAn invoice has been created for your {car_information}.\n\nJob Code: {job_code}\nInvoice Total: {invoice_total}\n\nPayment details are available on the invoice. If you have any questions, please contact us.\n\nPhone: {shop_phone}\nEmail: {shop_email}\n\nThank you for your business!\n\nBest regards,\n{shop_name}`,
      },
      {
        name: 'New Account',
        type: CommunicationTemplateType.EMAIL,
        action: CommunicationTemplateAction.EMAIL_NEW_ACCOUNT,
        subject: 'Welcome to {shop_name} - Your Account Details',
        body: `<p>Hi {user_name},</p><p>Your account has been created for {shop_name}.</p><p><strong>Email:</strong> {user_email}</p><p><strong>Temporary Password:</strong> {password}</p><p>Please log in at <a href="{login_url}">{login_url}</a> and change your password as soon as possible.</p><p>If you have any questions, please contact us.</p><p><strong>Phone:</strong> {shop_phone}<br><strong>Email:</strong> {shop_email}</p><p>Welcome aboard!</p><p>Best regards,<br>{shop_name}</p>`,
      },
      {
        name: 'Password Reset',
        type: CommunicationTemplateType.EMAIL,
        action: CommunicationTemplateAction.EMAIL_PASSWORD_RESET,
        subject: 'Password Reset - {shop_name}',
        body: `<p>Hi {user_name},</p><p>Your password has been reset for your {shop_name} account.</p><p><strong>Email:</strong> {user_email}</p><p><strong>New Password:</strong> {password}</p><p>Please log in at <a href="{login_url}">{login_url}</a> and change your password as soon as possible.</p><p>If you did not request this password reset, please contact us immediately.</p><p><strong>Phone:</strong> {shop_phone}<br><strong>Email:</strong> {shop_email}</p><p>Best regards,<br>{shop_name}</p>`,
      },
      {
        name: 'Account Suspended',
        type: CommunicationTemplateType.EMAIL,
        action: CommunicationTemplateAction.EMAIL_ACCOUNT_SUSPENDED,
        subject: 'Account Suspended - {shop_name}',
        body: `<p>Hi {user_name},</p><p>Your account for {shop_name} has been suspended.</p><p><strong>Email:</strong> {user_email}</p><p>You will not be able to access the system until your account is reactivated by an administrator.</p><p>If you believe this is an error or have any questions, please contact us.</p><p><strong>Phone:</strong> {shop_phone}<br><strong>Email:</strong> {shop_email}</p><p>Best regards,<br>{shop_name}</p>`,
      }
    ];
    
    for (const t of templates) {
      await new CommunicationTemplateFactory().create(t);
    }
    console.log(`  ✓ Seeded ${templates.length} communication templates`);
  }
}
