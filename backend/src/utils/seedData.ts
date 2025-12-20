import { AppDataSource } from '../config/database';
import { VehicleMake } from '../models/VehicleMake';
import { VehicleModel } from '../models/VehicleModel';
import { User, UserRole } from '../models/User';
import { Customer } from '../models/Customer';
import { Vehicle } from '../models/Vehicle';
import { VehicleOwner } from '../models/VehicleOwner';
import { Inventory } from '../models/Inventory';
import { Labour } from '../models/Labour';
import { Service } from '../models/Service';
import { ServiceItem, ServiceItemType } from '../models/ServiceItem';
import { Template } from '../models/Template';
import { TemplateItem } from '../models/TemplateItem';
import { Job, JobStatus } from '../models/Job';
import { LineItem, LineItemType } from '../models/LineItem';
import { Invoice, InvoiceStatus } from '../models/Invoice';
import { Settings } from '../models/Settings';
import { CommunicationTemplate, CommunicationTemplateType, CommunicationTemplateAction } from '../models/CommunicationTemplate';
import { InvoiceService } from '../services/InvoiceService';
import * as bcrypt from 'bcryptjs';
import { generateCustomerCode, generateCode, CODE_PREFIXES } from './codeGenerator';

/**
 * Vehicle makes with their common models
 * Pre-populated data for Australian/US/European markets
 */
export const vehicleMakesWithModels = [
  {
    name: 'Toyota',
    country: 'Japan',
    models: [
      'Camry', 'Corolla', 'RAV4', 'Hilux', 'LandCruiser', 'Prado',
      'Yaris', 'Kluger', 'Fortuner', 'C-HR', 'Supra', '86', 'Avalon',
      'Prius', 'Tacoma', 'Tundra', '4Runner', 'Sequoia', 'Sienna'
    ]
  },
  {
    name: 'Honda',
    country: 'Japan',
    models: [
      'Civic', 'Accord', 'CR-V', 'HR-V', 'Jazz', 'City', 'Odyssey',
      'Pilot', 'Passport', 'Ridgeline', 'Fit', 'Insight', 'Clarity'
    ]
  },
  {
    name: 'Ford',
    country: 'USA',
    models: [
      'Ranger', 'F-150', 'F-250', 'F-350', 'Mustang', 'Focus', 'Fiesta',
      'Escape', 'Explorer', 'Bronco', 'Maverick', 'Edge', 'Expedition',
      'Transit', 'Transit Connect', 'EcoSport', 'Everest', 'Falcon', 'Territory'
    ]
  },
  {
    name: 'Chevrolet',
    country: 'USA',
    models: [
      'Silverado', 'Colorado', 'Camaro', 'Corvette', 'Malibu', 'Equinox',
      'Tahoe', 'Suburban', 'Traverse', 'Trailblazer', 'Blazer', 'Trax',
      'Bolt', 'Spark', 'Impala', 'Cruze'
    ]
  },
  {
    name: 'Mazda',
    country: 'Japan',
    models: [
      'Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-30', 'CX-5', 'CX-8',
      'CX-9', 'MX-5', 'BT-50', 'CX-50', 'CX-60', 'CX-70', 'CX-90'
    ]
  },
  {
    name: 'Hyundai',
    country: 'South Korea',
    models: [
      'i20', 'i30', 'Tucson', 'Santa Fe', 'Kona', 'Venue', 'Palisade',
      'Elantra', 'Sonata', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Staria',
      'iLoad', 'iMax', 'Accent', 'Veloster', 'Genesis'
    ]
  },
  {
    name: 'Kia',
    country: 'South Korea',
    models: [
      'Rio', 'Cerato', 'Sportage', 'Sorento', 'Seltos', 'Stonic',
      'Carnival', 'Stinger', 'EV6', 'EV9', 'Niro', 'Picanto',
      'Optima', 'Soul', 'Telluride', 'Forte'
    ]
  },
  {
    name: 'Nissan',
    country: 'Japan',
    models: [
      'X-Trail', 'Qashqai', 'Patrol', 'Navara', 'Juke', 'Pathfinder',
      'Leaf', 'Altima', 'Maxima', 'Sentra', 'Versa', '370Z', 'GT-R',
      'Frontier', 'Titan', 'Armada', 'Rogue', 'Kicks', 'Murano'
    ]
  },
  {
    name: 'Mitsubishi',
    country: 'Japan',
    models: [
      'Triton', 'Pajero', 'Pajero Sport', 'Outlander', 'ASX', 'Eclipse Cross',
      'Mirage', 'Lancer', 'Delica', 'Express', 'Montero', 'Galant'
    ]
  },
  {
    name: 'Subaru',
    country: 'Japan',
    models: [
      'Outback', 'Forester', 'XV', 'Impreza', 'WRX', 'BRZ', 'Liberty',
      'Levorg', 'Crosstrek', 'Ascent', 'Legacy', 'Solterra'
    ]
  },
  {
    name: 'Volkswagen',
    country: 'Germany',
    models: [
      'Golf', 'Polo', 'Tiguan', 'Touareg', 'Passat', 'Arteon', 'T-Cross',
      'T-Roc', 'Amarok', 'Transporter', 'Caravelle', 'Multivan',
      'ID.3', 'ID.4', 'ID.5', 'Jetta', 'Atlas', 'Taos'
    ]
  },
  {
    name: 'BMW',
    country: 'Germany',
    models: [
      '1 Series', '2 Series', '3 Series', '4 Series', '5 Series',
      '6 Series', '7 Series', '8 Series', 'X1', 'X2', 'X3', 'X4',
      'X5', 'X6', 'X7', 'Z4', 'i3', 'i4', 'iX', 'iX3', 'M2', 'M3',
      'M4', 'M5', 'M8'
    ]
  },
  {
    name: 'Mercedes-Benz',
    country: 'Germany',
    models: [
      'A-Class', 'B-Class', 'C-Class', 'E-Class', 'S-Class', 'CLA',
      'CLS', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'G-Class', 'EQA',
      'EQB', 'EQC', 'EQE', 'EQS', 'AMG GT', 'SL', 'SLC', 'Sprinter',
      'Vito', 'V-Class', 'X-Class'
    ]
  },
  {
    name: 'Audi',
    country: 'Germany',
    models: [
      'A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q5',
      'Q7', 'Q8', 'TT', 'R8', 'e-tron', 'e-tron GT', 'RS3', 'RS4',
      'RS5', 'RS6', 'RS7', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8'
    ]
  },
  {
    name: 'Lexus',
    country: 'Japan',
    models: [
      'IS', 'ES', 'GS', 'LS', 'RC', 'LC', 'UX', 'NX', 'RX', 'GX',
      'LX', 'CT', 'RZ', 'LFA'
    ]
  },
  {
    name: 'Jeep',
    country: 'USA',
    models: [
      'Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Renegade',
      'Gladiator', 'Wagoneer', 'Grand Wagoneer', 'Commander'
    ]
  },
  {
    name: 'Ram',
    country: 'USA',
    models: [
      '1500', '2500', '3500', 'ProMaster', 'ProMaster City'
    ]
  },
  {
    name: 'GMC',
    country: 'USA',
    models: [
      'Sierra', 'Canyon', 'Yukon', 'Terrain', 'Acadia', 'Savana', 'Hummer EV'
    ]
  },
  {
    name: 'Dodge',
    country: 'USA',
    models: [
      'Charger', 'Challenger', 'Durango', 'Journey', 'Grand Caravan', 'Hornet'
    ]
  },
  {
    name: 'Holden',
    country: 'Australia',
    models: [
      'Commodore', 'Colorado', 'Trailblazer', 'Astra', 'Equinox',
      'Acadia', 'Trax', 'Barina', 'Captiva', 'Cruze', 'Spark', 'Ute'
    ]
  },
  {
    name: 'Tesla',
    country: 'USA',
    models: [
      'Model S', 'Model 3', 'Model X', 'Model Y', 'Cybertruck', 'Roadster'
    ]
  },
  {
    name: 'Porsche',
    country: 'Germany',
    models: [
      '911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', '718 Boxster',
      '718 Cayman'
    ]
  },
  {
    name: 'Land Rover',
    country: 'UK',
    models: [
      'Defender', 'Discovery', 'Discovery Sport', 'Range Rover',
      'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque'
    ]
  },
  {
    name: 'Jaguar',
    country: 'UK',
    models: [
      'XE', 'XF', 'XJ', 'F-Type', 'E-Pace', 'F-Pace', 'I-Pace'
    ]
  },
  {
    name: 'Volvo',
    country: 'Sweden',
    models: [
      'S60', 'S90', 'V60', 'V90', 'XC40', 'XC60', 'XC90', 'C40'
    ]
  },
  {
    name: 'Isuzu',
    country: 'Japan',
    models: [
      'D-Max', 'MU-X', 'N Series', 'F Series', 'Giga'
    ]
  },
  {
    name: 'Suzuki',
    country: 'Japan',
    models: [
      'Swift', 'Vitara', 'Jimny', 'Ignis', 'S-Cross', 'Baleno',
      'Alto', 'Celerio', 'Ciaz', 'Ertiga', 'XL7'
    ]
  },
  {
    name: 'Renault',
    country: 'France',
    models: [
      'Clio', 'Megane', 'Captur', 'Kadjar', 'Koleos', 'Arkana',
      'Trafic', 'Master', 'Kangoo', 'Zoe', 'Austral'
    ]
  },
  {
    name: 'Peugeot',
    country: 'France',
    models: [
      '208', '308', '408', '508', '2008', '3008', '5008', 'Partner',
      'Expert', 'Boxer', 'e-208', 'e-2008'
    ]
  },
  {
    name: 'Citroen',
    country: 'France',
    models: [
      'C3', 'C4', 'C5', 'C3 Aircross', 'C5 Aircross', 'Berlingo',
      'Dispatch', 'Relay'
    ]
  },
  {
    name: 'Fiat',
    country: 'Italy',
    models: [
      '500', '500X', 'Panda', 'Tipo', 'Ducato', 'Doblo', 'Scudo'
    ]
  },
  {
    name: 'Alfa Romeo',
    country: 'Italy',
    models: [
      'Giulia', 'Stelvio', 'Tonale', 'Giulietta', '4C'
    ]
  },
  {
    name: 'Maserati',
    country: 'Italy',
    models: [
      'Ghibli', 'Quattroporte', 'Levante', 'MC20', 'GranTurismo', 'Grecale'
    ]
  },
  {
    name: 'Ferrari',
    country: 'Italy',
    models: [
      '488', 'F8', 'SF90', 'Roma', 'Portofino', '812', 'Purosangue',
      '296', 'LaFerrari'
    ]
  },
  {
    name: 'Lamborghini',
    country: 'Italy',
    models: [
      'Huracan', 'Aventador', 'Urus', 'Revuelto'
    ]
  },
  {
    name: 'Mini',
    country: 'UK',
    models: [
      'Hatch', 'Clubman', 'Countryman', 'Convertible', 'Electric'
    ]
  },
  {
    name: 'Skoda',
    country: 'Czech Republic',
    models: [
      'Fabia', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Scala',
      'Enyaq'
    ]
  },
  {
    name: 'SEAT',
    country: 'Spain',
    models: [
      'Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Cupra Formentor'
    ]
  },
  {
    name: 'Genesis',
    country: 'South Korea',
    models: [
      'G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'
    ]
  },
  {
    name: 'Infiniti',
    country: 'Japan',
    models: [
      'Q50', 'Q60', 'QX50', 'QX55', 'QX60', 'QX80'
    ]
  },
  {
    name: 'Acura',
    country: 'Japan',
    models: [
      'ILX', 'TLX', 'RDX', 'MDX', 'NSX', 'Integra'
    ]
  },
  {
    name: 'Lincoln',
    country: 'USA',
    models: [
      'Corsair', 'Nautilus', 'Aviator', 'Navigator', 'Continental'
    ]
  },
  {
    name: 'Cadillac',
    country: 'USA',
    models: [
      'CT4', 'CT5', 'XT4', 'XT5', 'XT6', 'Escalade', 'Lyriq', 'Celestiq'
    ]
  },
  {
    name: 'Buick',
    country: 'USA',
    models: [
      'Encore', 'Encore GX', 'Envision', 'Enclave'
    ]
  },
  {
    name: 'Chrysler',
    country: 'USA',
    models: [
      '300', 'Pacifica', 'Voyager'
    ]
  },
  {
    name: 'Other',
    country: null,
    models: [
      'Custom', 'Unknown', 'Kit Car', 'Trailer', 'Caravan'
    ]
  }
];

/**
 * Seed the database with comprehensive initial data
 */
export async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting comprehensive database seeding...');

  // Seed vehicle makes and models
  await seedVehicleMakesAndModels();

  // Seed default users
  await seedDefaultUsers();

  // Seed settings
  await seedSettings();

  // Seed customers
  const customers = await seedCustomers();

  // Seed vehicles
  const vehicles = await seedVehicles(customers);

  // Seed inventory
  const inventoryItems = await seedInventory();

  // Seed labour
  const labourItems = await seedLabour();

  // Seed services
  const services = await seedServices(inventoryItems, labourItems);

  // Seed templates
  await seedTemplates(inventoryItems, labourItems, services);

  // Seed jobs
  await seedJobs(customers, vehicles, inventoryItems, labourItems, services);

  // Seed communication templates
  await seedCommunicationTemplates();

  console.log('✅ Comprehensive database seeding completed');
}

/**
 * Seed vehicle makes and models
 */
async function seedVehicleMakesAndModels(): Promise<void> {
  const makeRepository = AppDataSource.getRepository(VehicleMake);
  const modelRepository = AppDataSource.getRepository(VehicleModel);

  // Check if makes already exist
  const existingMakesCount = await makeRepository.count();
  if (existingMakesCount > 0) {
    console.log('  Vehicle makes already seeded, skipping...');
    return;
  }

  console.log('  Seeding vehicle makes and models...');

  let sortOrder = 0;
  for (const makeData of vehicleMakesWithModels) {
    // Create make
    const make = makeRepository.create({
      name: makeData.name,
      country: makeData.country,
      sortOrder: sortOrder++,
    });
    await makeRepository.save(make);

    // Create models for this make
    for (const modelName of makeData.models) {
      const model = modelRepository.create({
        makeId: make.id,
        name: modelName,
      });
      await modelRepository.save(model);
    }
  }

  console.log(`  ✓ Seeded ${vehicleMakesWithModels.length} makes with their models`);
}

/**
 * Seed default users
 */
async function seedDefaultUsers(): Promise<void> {
  const userRepository = AppDataSource.getRepository(User);

  // Check if admin exists
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@meccanico.dev' },
  });

  if (existingAdmin) {
    console.log('  Default users already exist, skipping...');
    return;
  }

  console.log('  Seeding default users...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = userRepository.create({
    email: 'admin@meccanico.dev',
    passwordHash: hashedPassword,
    name: 'Admin User',
    role: UserRole.ADMIN,
    isActive: true,
  });
  await userRepository.save(admin);

  // Create mechanic user
  const mechanicPassword = await bcrypt.hash('mechanic123', 10);
  const mechanic = userRepository.create({
    email: 'mechanic@meccanico.dev',
    passwordHash: mechanicPassword,
    name: 'John Mechanic',
    role: UserRole.MECHANIC,
    isActive: true,
  });
  await userRepository.save(mechanic);

  // Create viewer user
  const viewerPassword = await bcrypt.hash('viewer123', 10);
  const viewer = userRepository.create({
    email: 'viewer@meccanico.dev',
    passwordHash: viewerPassword,
    name: 'Service Viewer',
    role: UserRole.VIEWER,
    isActive: true,
  });
  await userRepository.save(viewer);

  console.log('  ✓ Seeded default users (admin, mechanic, viewer)');
}

/**
 * Seed settings
 */
async function seedSettings(): Promise<void> {
  const settingsRepository = AppDataSource.getRepository(Settings);

  console.log('  Seeding settings...');

  const defaultSettings = [
    {
      key: 'shop_info',
      value: {
        name: 'Meccanico Auto Repair',
        address: '123 Main Street',
        city: 'Sydney',
        state: 'NSW',
        postcode: '2000',
        country: 'Australia',
        phone: '+61 2 1234 5678',
        email: 'info@meccanico.dev',
        abn: '12 345 678 901',
        website: 'https://meccanico.dev',
      },
    },
    {
      key: 'tax_settings',
      value: {
        name: 'GST',
        defaultRate: 10.0,
        enabled: true,
      },
    },
    {
      key: 'currency_settings',
      value: {
        code: 'AUD',
        symbol: '$',
        position: 'before',
      },
    },
    {
      key: 'invoice.prefix',
      value: 'INV-',
    },
    {
      key: 'invoice.terms',
      value: 'Payment due within 30 days.',
    },
    {
      key: 'invoice.footer',
      value: 'Thank you for your business!',
    },
    {
      key: 'invoice.payment_terms_days',
      value: 14,
    },
    {
      key: 'vehicle_lexicon',
      value: {
        makes: [],
        models: [],
      },
    },
  ];

  for (const setting of defaultSettings) {
    const existing = await settingsRepository.findOne({
      where: { key: setting.key },
    });

    if (!existing) {
      const settingEntity = settingsRepository.create({
        key: setting.key,
        value: setting.value,
      });
      await settingsRepository.save(settingEntity);
    }
  }

  console.log('  ✓ Seeded default settings');
}

/**
 * Seed customers
 */
async function seedCustomers(): Promise<Customer[]> {
  const customerRepository = AppDataSource.getRepository(Customer);

  // Check if customers already exist
  const existingCount = await customerRepository.count();
  if (existingCount > 0) {
    console.log('  Customers already seeded, skipping...');
    return await customerRepository.find();
  }

  console.log('  Seeding customers...');

  const customerData = [
    {
      name: 'John Smith',
      email: 'john.smith@example.com',
      phone: '+61 400 111 222',
      address: '45 Oak Street, Melbourne VIC 3000',
      notes: 'Regular customer, prefers morning appointments',
    },
    {
      name: 'Sarah Johnson',
      email: 'sarah.j@example.com',
      phone: '+61 400 222 333',
      address: '12 Elm Avenue, Brisbane QLD 4000',
      notes: 'Fleet customer - 3 vehicles',
    },
    {
      name: 'Michael Brown',
      email: 'm.brown@example.com',
      phone: '+61 400 333 444',
      address: '78 Pine Road, Perth WA 6000',
      notes: null,
    },
    {
      name: 'Emma Wilson',
      email: 'emma.wilson@example.com',
      phone: '+61 400 444 555',
      address: '23 Maple Drive, Adelaide SA 5000',
      notes: 'VIP customer - 10% discount',
    },
    {
      name: 'David Lee',
      email: 'david.lee@example.com',
      phone: '+61 400 555 666',
      address: '56 Cedar Lane, Canberra ACT 2600',
      notes: null,
    },
    {
      name: 'Lisa Anderson',
      email: 'lisa.a@example.com',
      phone: '+61 400 666 777',
      address: '89 Birch Street, Hobart TAS 7000',
      notes: 'Corporate account',
    },
    {
      name: 'Robert Taylor',
      email: 'r.taylor@example.com',
      phone: '+61 400 777 888',
      address: '34 Willow Way, Darwin NT 0800',
      notes: null,
    },
    {
      name: 'Jennifer Martinez',
      email: 'j.martinez@example.com',
      phone: '+61 400 888 999',
      address: '67 Ash Court, Gold Coast QLD 4217',
      notes: 'New customer',
    },
  ];

  const customers: Customer[] = [];

  for (const data of customerData) {
    const code = await generateCustomerCode(data.name);
    const customer = customerRepository.create({
      code,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
    });
    const saved = await customerRepository.save(customer);
    customers.push(saved);
  }

  console.log(`  ✓ Seeded ${customers.length} customers`);
  return customers;
}

/**
 * Seed vehicles
 */
async function seedVehicles(customers: Customer[]): Promise<Vehicle[]> {
  const vehicleRepository = AppDataSource.getRepository(Vehicle);
  const vehicleOwnerRepository = AppDataSource.getRepository(VehicleOwner);

  // Check if vehicles already exist
  const existingCount = await vehicleRepository.count();
  if (existingCount > 0) {
    console.log('  Vehicles already seeded, skipping...');
    return await vehicleRepository.find();
  }

  console.log('  Seeding vehicles...');

  const vehicleData = [
    { customerIndex: 0, make: 'Toyota', model: 'Camry', year: 2020, licensePlate: 'ABC123', color: 'Silver', mileage: 45000 },
    { customerIndex: 0, make: 'Honda', model: 'Civic', year: 2018, licensePlate: 'XYZ789', color: 'Blue', mileage: 62000 },
    { customerIndex: 1, make: 'Ford', model: 'Ranger', year: 2021, licensePlate: 'DEF456', color: 'White', mileage: 28000 },
    { customerIndex: 1, make: 'Mazda', model: 'CX-5', year: 2019, licensePlate: 'GHI789', color: 'Red', mileage: 55000 },
    { customerIndex: 1, make: 'Hyundai', model: 'Tucson', year: 2022, licensePlate: 'JKL012', color: 'Black', mileage: 15000 },
    { customerIndex: 2, make: 'Volkswagen', model: 'Golf', year: 2017, licensePlate: 'MNO345', color: 'Grey', mileage: 78000 },
    { customerIndex: 3, make: 'BMW', model: '3 Series', year: 2023, licensePlate: 'PQR678', color: 'Black', mileage: 8000 },
    { customerIndex: 4, make: 'Nissan', model: 'X-Trail', year: 2020, licensePlate: 'STU901', color: 'White', mileage: 42000 },
    { customerIndex: 5, make: 'Subaru', model: 'Outback', year: 2019, licensePlate: 'VWX234', color: 'Green', mileage: 60000 },
    { customerIndex: 6, make: 'Toyota', model: 'RAV4', year: 2021, licensePlate: 'YZA567', color: 'Blue', mileage: 35000 },
    { customerIndex: 7, make: 'Kia', model: 'Sportage', year: 2022, licensePlate: 'BCD890', color: 'Silver', mileage: 20000 },
  ];

  const vehicles: Vehicle[] = [];

  for (const data of vehicleData) {
    const code = await generateCode('vehicles', CODE_PREFIXES.VEHICLE);
    const vehicle = vehicleRepository.create({
      code,
      make: data.make,
      model: data.model,
      year: data.year,
      licensePlate: data.licensePlate,
      color: data.color,
      mileage: data.mileage,
    });
    const saved = await vehicleRepository.save(vehicle);
    
    // Create VehicleOwner record
    const vehicleOwner = vehicleOwnerRepository.create({
      vehicleId: saved.id,
      customerId: customers[data.customerIndex].id,
      isPrimary: true,
    });
    await vehicleOwnerRepository.save(vehicleOwner);
    
    vehicles.push(saved);
  }

  console.log(`  ✓ Seeded ${vehicles.length} vehicles`);
  return vehicles;
}

/**
 * Seed inventory items
 */
async function seedInventory(): Promise<Inventory[]> {
  const inventoryRepository = AppDataSource.getRepository(Inventory);

  // Check if inventory already exists
  const existingCount = await inventoryRepository.count();
  if (existingCount > 0) {
    console.log('  Inventory already seeded, skipping...');
    return await inventoryRepository.find();
  }

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

  const inventoryItems: Inventory[] = [];

  for (const data of inventoryData) {
    const code = await generateCode('inventory', CODE_PREFIXES.INVENTORY);
    const item = inventoryRepository.create({
      code,
      name: data.name,
      description: data.description,
      sku: data.sku,
      unitPrice: data.unitPrice,
      costPrice: data.costPrice,
      quantityInStock: data.quantityInStock,
      minimumStock: data.minimumStock,
      category: data.category,
      unit: data.unit,
      isActive: true,
    });
    const saved = await inventoryRepository.save(item);
    inventoryItems.push(saved);
  }

  console.log(`  ✓ Seeded ${inventoryItems.length} inventory items`);
  return inventoryItems;
}

/**
 * Seed labour rates
 */
async function seedLabour(): Promise<Labour[]> {
  const labourRepository = AppDataSource.getRepository(Labour);

  // Check if labour already exists
  const existingCount = await labourRepository.count();
  if (existingCount > 0) {
    console.log('  Labour already seeded, skipping...');
    return await labourRepository.find();
  }

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

  const labourItems: Labour[] = [];

  for (const data of labourData) {
    const code = await generateCode('labour', CODE_PREFIXES.LABOUR);
    const labour = labourRepository.create({
      code,
      name: data.name,
      description: data.description,
      hourlyRate: data.isFlatRate ? (data as any).unitPrice : data.hourlyRate,
      defaultHours: data.defaultHours,
      isFlatRate: data.isFlatRate,
      category: data.category,
      isActive: true,
    });
    const saved = await labourRepository.save(labour);
    labourItems.push(saved);
  }

  console.log(`  ✓ Seeded ${labourItems.length} labour rates`);
  return labourItems;
}

/**
 * Seed services
 */
async function seedServices(inventoryItems: Inventory[], labourItems: Labour[]): Promise<Service[]> {
  const serviceRepository = AppDataSource.getRepository(Service);
  const serviceItemRepository = AppDataSource.getRepository(ServiceItem);

  // Check if services already exist
  const existingCount = await serviceRepository.count();
  if (existingCount > 0) {
    console.log('  Services already seeded, skipping...');
    return await serviceRepository.find({ relations: ['items'] });
  }

  console.log('  Seeding services...');

  const services: Service[] = [];
  const generalLabour = labourItems.find(l => l.name === 'General Labor')!;
  const oilFilter = inventoryItems.find(i => i.name === 'Oil Filter')!;
  const engineOil = inventoryItems.find(i => i.name === 'Engine Oil 5W-30')!;
  const brakePadsFront = inventoryItems.find(i => i.name === 'Brake Pads - Front')!;
  const brakePadsRear = inventoryItems.find(i => i.name === 'Brake Pads - Rear')!;
  const brakeFluid = inventoryItems.find(i => i.name === 'Brake Fluid')!;
  const brakeServiceLabour = labourItems.find(l => l.name === 'Brake Service')!;

  // Service 1: Oil Change
  const oilChangeCode = await generateCode('services', CODE_PREFIXES.SERVICE);
  const oilChange = serviceRepository.create({
    code: oilChangeCode,
    name: 'Oil Change Service',
    description: 'Complete oil and filter change',
    basePrice: 89.99,
    category: 'Maintenance',
    isActive: true,
  });
  const savedOilChange = await serviceRepository.save(oilChange);
  
  await serviceItemRepository.save([
    serviceItemRepository.create({
      serviceId: savedOilChange.id,
      itemType: ServiceItemType.INVENTORY,
      itemId: oilFilter.id,
      quantity: 1,
    }),
    serviceItemRepository.create({
      serviceId: savedOilChange.id,
      itemType: ServiceItemType.INVENTORY,
      itemId: engineOil.id,
      quantity: 1,
    }),
    serviceItemRepository.create({
      serviceId: savedOilChange.id,
      itemType: ServiceItemType.LABOUR,
      itemId: generalLabour.id,
      quantity: 0.5,
    }),
  ]);
  services.push(savedOilChange);

  // Service 2: Brake Service
  const brakeServiceCode = await generateCode('services', CODE_PREFIXES.SERVICE);
  const brakeService = serviceRepository.create({
    code: brakeServiceCode,
    name: 'Complete Brake Service',
    description: 'Full brake pad replacement and fluid change',
    basePrice: 450.00,
    category: 'Brakes',
    isActive: true,
  });
  const savedBrakeService = await serviceRepository.save(brakeService);
  
  await serviceItemRepository.save([
    serviceItemRepository.create({
      serviceId: savedBrakeService.id,
      itemType: ServiceItemType.INVENTORY,
      itemId: brakePadsFront.id,
      quantity: 1,
    }),
    serviceItemRepository.create({
      serviceId: savedBrakeService.id,
      itemType: ServiceItemType.INVENTORY,
      itemId: brakePadsRear.id,
      quantity: 1,
    }),
    serviceItemRepository.create({
      serviceId: savedBrakeService.id,
      itemType: ServiceItemType.INVENTORY,
      itemId: brakeFluid.id,
      quantity: 1,
    }),
    serviceItemRepository.create({
      serviceId: savedBrakeService.id,
      itemType: ServiceItemType.LABOUR,
      itemId: brakeServiceLabour.id,
      quantity: 1,
    }),
  ]);
  services.push(savedBrakeService);

  // Service 3: Clutch Change
  const clutchCode = await generateCode('services', CODE_PREFIXES.SERVICE);
  const clutchService = serviceRepository.create({
    code: clutchCode,
    name: 'Clutch Change',
    description: 'Complete clutch replacement service',
    basePrice: 850.00,
    category: 'Transmission',
    isActive: true,
  });
  const savedClutch = await serviceRepository.save(clutchService);
  services.push(savedClutch);

  console.log(`  ✓ Seeded ${services.length} services`);
  return services;
}

/**
 * Seed templates
 */
async function seedTemplates(inventoryItems: Inventory[], labourItems: Labour[], services: Service[]): Promise<void> {
  const templateRepository = AppDataSource.getRepository(Template);
  const templateItemRepository = AppDataSource.getRepository(TemplateItem);
  const userRepository = AppDataSource.getRepository(User);

  // Check if templates already exist
  const existingCount = await templateRepository.count();
  if (existingCount > 0) {
    console.log('  Templates already seeded, skipping...');
    return;
  }

  console.log('  Seeding templates...');

  const admin = await userRepository.findOne({ where: { email: 'admin@meccanico.dev' } });
  const generalLabour = labourItems.find(l => l.name === 'General Labor')!;
  const diagnostic = labourItems.find(l => l.name === 'Diagnostic')!;
  const oilFilter = inventoryItems.find(i => i.name === 'Oil Filter')!;
  const engineOil = inventoryItems.find(i => i.name === 'Engine Oil 5W-30')!;
  const airFilter = inventoryItems.find(i => i.name === 'Air Filter')!;
  const sparkPlugs = inventoryItems.find(i => i.name === 'Spark Plugs')!;
  const oilChangeService = services.find(s => s.name === 'Oil Change Service')!;

  // Template 1: Standard Service
  const template1Code = await generateCode('templates', CODE_PREFIXES.TEMPLATE);
  const template1 = templateRepository.create({
    code: template1Code,
    name: 'Standard Service',
    description: 'Standard vehicle service template',
    createdBy: admin?.id || null,
    isGlobal: true,
  });
  const savedTemplate1 = await templateRepository.save(template1);

  await templateItemRepository.save([
    templateItemRepository.create({
      templateId: savedTemplate1.id,
      itemType: LineItemType.TEXT,
      itemId: null,
      description: 'Standard Service',
      quantity: 1,
      unitPrice: 0,
      sortOrder: 0,
    }),
    templateItemRepository.create({
      templateId: savedTemplate1.id,
      itemType: LineItemType.INVENTORY,
      itemId: oilFilter.id,
      description: `${oilFilter.name} (${oilFilter.code})`,
      quantity: 1,
      unitPrice: oilFilter.unitPrice,
      sortOrder: 1,
    }),
    templateItemRepository.create({
      templateId: savedTemplate1.id,
      itemType: LineItemType.INVENTORY,
      itemId: engineOil.id,
      description: `${engineOil.name} (${engineOil.code})`,
      quantity: 1,
      unitPrice: engineOil.unitPrice,
      sortOrder: 2,
    }),
    templateItemRepository.create({
      templateId: savedTemplate1.id,
      itemType: LineItemType.LABOUR,
      itemId: generalLabour.id,
      description: `${generalLabour.name} (${generalLabour.code})`,
      quantity: 1,
      unitPrice: generalLabour.hourlyRate,
      sortOrder: 3,
    }),
  ]);

  // Template 2: Major Service
  const template2Code = await generateCode('templates', CODE_PREFIXES.TEMPLATE);
  const template2 = templateRepository.create({
    code: template2Code,
    name: 'Major Service',
    description: 'Major vehicle service template',
    createdBy: admin?.id || null,
    isGlobal: true,
  });
  const savedTemplate2 = await templateRepository.save(template2);

  await templateItemRepository.save([
    templateItemRepository.create({
      templateId: savedTemplate2.id,
      itemType: LineItemType.TEXT,
      itemId: null,
      description: 'Major Service',
      quantity: 1,
      unitPrice: 0,
      sortOrder: 0,
    }),
    templateItemRepository.create({
      templateId: savedTemplate2.id,
      itemType: LineItemType.INVENTORY,
      itemId: oilFilter.id,
      description: `${oilFilter.name} (${oilFilter.code})`,
      quantity: 1,
      unitPrice: oilFilter.unitPrice,
      sortOrder: 1,
    }),
    templateItemRepository.create({
      templateId: savedTemplate2.id,
      itemType: LineItemType.INVENTORY,
      itemId: engineOil.id,
      description: `${engineOil.name} (${engineOil.code})`,
      quantity: 1,
      unitPrice: engineOil.unitPrice,
      sortOrder: 2,
    }),
    templateItemRepository.create({
      templateId: savedTemplate2.id,
      itemType: LineItemType.INVENTORY,
      itemId: airFilter.id,
      description: `${airFilter.name} (${airFilter.code})`,
      quantity: 1,
      unitPrice: airFilter.unitPrice,
      sortOrder: 3,
    }),
    templateItemRepository.create({
      templateId: savedTemplate2.id,
      itemType: LineItemType.INVENTORY,
      itemId: sparkPlugs.id,
      description: `${sparkPlugs.name} (${sparkPlugs.code})`,
      quantity: 1,
      unitPrice: sparkPlugs.unitPrice,
      sortOrder: 4,
    }),
    templateItemRepository.create({
      templateId: savedTemplate2.id,
      itemType: LineItemType.LABOUR,
      itemId: generalLabour.id,
      description: `${generalLabour.name} (${generalLabour.code})`,
      quantity: 2,
      unitPrice: generalLabour.hourlyRate,
      sortOrder: 5,
    }),
  ]);

  console.log('  ✓ Seeded 2 templates');
}

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

/**
 * Seed jobs
 */
async function seedJobs(
  customers: Customer[],
  vehicles: Vehicle[],
  inventoryItems: Inventory[],
  labourItems: Labour[],
  services: Service[]
): Promise<void> {
  const jobRepository = AppDataSource.getRepository(Job);
  const lineItemRepository = AppDataSource.getRepository(LineItem);
  const userRepository = AppDataSource.getRepository(User);

  // Check if jobs already exist
  const existingCount = await jobRepository.count();
  if (existingCount > 0) {
    console.log('  Jobs already seeded, skipping...');
    return;
  }

  console.log('  Seeding jobs...');

  const mechanic = await userRepository.findOne({ where: { email: 'mechanic@meccanico.dev' } });
  const generalLabour = labourItems.find(l => l.name === 'General Labor')!;
  const oilFilter = inventoryItems.find(i => i.name === 'Oil Filter')!;
  const engineOil = inventoryItems.find(i => i.name === 'Engine Oil 5W-30')!;
  const brakePadsFront = inventoryItems.find(i => i.name === 'Brake Pads - Front')!;
  const oilChangeService = services.find(s => s.name === 'Oil Change Service')!;

  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lastWeek = new Date(now);
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastMonth = new Date(now);
  lastMonth.setMonth(lastMonth.getMonth() - 1);

  // Job 1: BOOKED
  const job1Code = generateJobCodeForDate(yesterday, 1);
  const job1 = jobRepository.create({
    code: job1Code,
    customerId: customers[0].id,
    vehicleId: vehicles[0].id,
    assignedTo: mechanic?.id || null,
    status: JobStatus.BOOKED,
    notes: 'Customer requested quote for oil change',
    taxRate: 10.0,
    discountAmount: 0,
    discountPercent: 0,
    createdAt: yesterday,
  });
  const savedJob1 = await jobRepository.save(job1);

  await lineItemRepository.save([
    lineItemRepository.create({
      jobId: savedJob1.id,
      type: LineItemType.TEXT,
      referenceId: null,
      description: 'Service',
      quantity: 1,
      unitPrice: 0,
      sortOrder: 0,
    }),
    lineItemRepository.create({
      jobId: savedJob1.id,
      type: LineItemType.INVENTORY,
      referenceId: oilFilter.id,
      description: `${oilFilter.name} (${oilFilter.code})`,
      quantity: 1,
      unitPrice: oilFilter.unitPrice,
      sortOrder: 1,
    }),
    lineItemRepository.create({
      jobId: savedJob1.id,
      type: LineItemType.INVENTORY,
      referenceId: engineOil.id,
      description: `${engineOil.name} (${engineOil.code})`,
      quantity: 1,
      unitPrice: engineOil.unitPrice,
      sortOrder: 2,
    }),
    lineItemRepository.create({
      jobId: savedJob1.id,
      type: LineItemType.LABOUR,
      referenceId: generalLabour.id,
      description: `${generalLabour.name} (${generalLabour.code})`,
      quantity: 0.5,
      unitPrice: generalLabour.hourlyRate,
      sortOrder: 3,
    }),
  ]);

  // Job 2: IN_PROGRESS
  const job2Code = generateJobCodeForDate(lastWeek, 1);
  const job2 = jobRepository.create({
    code: job2Code,
    customerId: customers[1].id,
    vehicleId: vehicles[2].id,
    assignedTo: mechanic?.id || null,
    status: JobStatus.IN_PROGRESS,
    notes: 'Brake pad replacement in progress',
    taxRate: 10.0,
    discountAmount: 0,
    discountPercent: 0,
    startedAt: yesterday,
    createdAt: lastWeek,
  });
  const savedJob2 = await jobRepository.save(job2);

  await lineItemRepository.save([
    lineItemRepository.create({
      jobId: savedJob2.id,
      type: LineItemType.INVENTORY,
      referenceId: brakePadsFront.id,
      description: `${brakePadsFront.name} (${brakePadsFront.code})`,
      quantity: 1,
      unitPrice: brakePadsFront.unitPrice,
      sortOrder: 0,
    }),
    lineItemRepository.create({
      jobId: savedJob2.id,
      type: LineItemType.LABOUR,
      referenceId: generalLabour.id,
      description: `${generalLabour.name} (${generalLabour.code})`,
      quantity: 2,
      unitPrice: generalLabour.hourlyRate,
      sortOrder: 1,
    }),
  ]);

  // Job 3: COMPLETED (will have invoice)
  const job3Code = generateJobCodeForDate(lastWeek, 2);
  const job3 = jobRepository.create({
    code: job3Code,
    customerId: customers[2].id,
    vehicleId: vehicles[5].id,
    assignedTo: mechanic?.id || null,
    status: JobStatus.COMPLETED,
    notes: 'Service completed',
    taxRate: 10.0,
    discountAmount: 0,
    discountPercent: 0,
    startedAt: lastWeek,
    completedAt: yesterday,
    createdAt: lastMonth,
  });
  const savedJob3 = await jobRepository.save(job3);

  await lineItemRepository.save([
    lineItemRepository.create({
      jobId: savedJob3.id,
      type: LineItemType.SERVICE,
      referenceId: oilChangeService.id,
      description: `${oilChangeService.name} (${oilChangeService.code})`,
      quantity: 1,
      unitPrice: oilChangeService.basePrice,
      sortOrder: 0,
    }),
  ]);

  // Job 4: COMPLETED (will have paid invoice)
  const job4Code = generateJobCodeForDate(lastMonth, 1);
  const job4 = jobRepository.create({
    code: job4Code,
    customerId: customers[3].id,
    vehicleId: vehicles[6].id,
    assignedTo: mechanic?.id || null,
    status: JobStatus.COMPLETED,
    notes: 'Payment received',
    taxRate: 10.0,
    discountAmount: 0,
    discountPercent: 10.0,
    startedAt: lastMonth,
    completedAt: lastWeek,
    createdAt: lastMonth,
  });
  const savedJob4 = await jobRepository.save(job4);

  await lineItemRepository.save([
    lineItemRepository.create({
      jobId: savedJob4.id,
      type: LineItemType.TEXT,
      referenceId: null,
      description: 'Scanning',
      quantity: 1,
      unitPrice: 0,
      sortOrder: 0,
    }),
    lineItemRepository.create({
      jobId: savedJob4.id,
      type: LineItemType.INVENTORY,
      referenceId: oilFilter.id,
      description: `${oilFilter.name} (${oilFilter.code})`,
      quantity: 1,
      unitPrice: oilFilter.unitPrice,
      sortOrder: 1,
    }),
  ]);

  // Job 5: PENDING
  const job5Code = generateJobCodeForDate(lastWeek, 3);
  const job5 = jobRepository.create({
    code: job5Code,
    customerId: customers[4].id,
    vehicleId: vehicles[7].id,
    assignedTo: mechanic?.id || null,
    status: JobStatus.PENDING,
    notes: 'Waiting for parts',
    internalNotes: 'Customer approved, waiting for brake pads to arrive',
    taxRate: 10.0,
    discountAmount: 0,
    discountPercent: 0,
    startedAt: yesterday,
    createdAt: lastWeek,
  });
  await jobRepository.save(job5);

  // Create invoices for completed jobs
  const invoiceService = new InvoiceService();
  const invoiceRepository = AppDataSource.getRepository(Invoice);

  // Create invoice for job3 (unpaid)
  try {
    const invoice3 = await invoiceService.createFromJob(savedJob3.id);
    console.log(`  ✓ Created invoice ${invoice3.invoiceNumber} for job ${savedJob3.code}`);
  } catch (error) {
    console.error(`  ✗ Failed to create invoice for job ${savedJob3.code}:`, error);
  }

  // Create invoice for job4 (paid)
  try {
    const invoice4 = await invoiceService.createFromJob(savedJob4.id);
    // Mark as paid
    await invoiceService.markAsPaid(invoice4.id, { paymentNote: 'Payment received via credit card' });
    console.log(`  ✓ Created and marked as paid invoice ${invoice4.invoiceNumber} for job ${savedJob4.code}`);
  } catch (error) {
    console.error(`  ✗ Failed to create invoice for job ${savedJob4.code}:`, error);
  }

  console.log('  ✓ Seeded 5 jobs in various statuses');
  console.log('  ✓ Created invoices for completed jobs');
}

/**
 * Seed communication templates
 */
async function seedCommunicationTemplates(): Promise<void> {
  const templateRepository = AppDataSource.getRepository(CommunicationTemplate);

  // Check if templates already exist
  const existingCount = await templateRepository.count();
  if (existingCount > 0) {
    console.log('  Communication templates already seeded, skipping...');
    return;
  }

  console.log('  Seeding communication templates...');

  const defaultTemplates = [
    {
      name: 'Email Estimate',
      type: CommunicationTemplateType.EMAIL,
      action: CommunicationTemplateAction.EMAIL_ESTIMATE,
      subject: 'Estimate for {vehicle_make} {vehicle_model} ({rego})',
      body: `<p>Hi {customer_name},</p>

<p>Please find attached your estimate for {car_information}.</p>

<p><strong>Job Code:</strong> {job_code}</p>

{line_items}

<p><strong>Estimate Total:</strong> {estimate_total}</p>

<p><em>This is an estimate and does not require payment.</em></p>

<p>If you have any questions or would like to proceed with this work, please don't hesitate to contact us.</p>

<p><strong>Phone:</strong> {shop_phone}<br>
<strong>Email:</strong> {shop_email}</p>

<p>We look forward to serving you.</p>

<p>Best regards,<br>
{shop_name}</p>`,
      isActive: true,
    },
    {
      name: 'Email Invoice',
      type: CommunicationTemplateType.EMAIL,
      action: CommunicationTemplateAction.EMAIL_INVOICE,
      subject: 'Invoice for {vehicle_make} {vehicle_model} ({rego})',
      body: `<p>Hi {customer_name},</p>

<p>Please find attached your invoice for {car_information}.</p>

<p><strong>Job Code:</strong> {job_code}</p>

{line_items}

<p><strong>Total amount due:</strong> {invoice_total}</p>

<p>Payment can be made via the methods listed on the invoice. If you have any questions, please contact us.</p>

<p><strong>Phone:</strong> {shop_phone}<br>
<strong>Email:</strong> {shop_email}</p>

<p>Thank you for your business!</p>

<p>Best regards,<br>
{shop_name}</p>`,
      isActive: true,
    },
    {
      name: 'Vehicle Ready',
      type: CommunicationTemplateType.EMAIL,
      action: CommunicationTemplateAction.VEHICLE_READY,
      subject: 'Your {car_information} is ready for pickup',
      body: `Hi {customer_name},

Great news! Your {car_information} is ready for pickup.

Job Code: {job_code}

Please contact us to arrange a convenient time to collect your vehicle.

Phone: {shop_phone}
Email: {shop_email}

We look forward to seeing you soon.

Best regards,
{shop_name}`,
      isActive: true,
    },
    {
      name: 'Vehicle In Progress',
      type: CommunicationTemplateType.EMAIL,
      action: CommunicationTemplateAction.VEHICLE_IN_PROGRESS,
      subject: 'Update on your {car_information}',
      body: `Hi {customer_name},

This is an update on your {car_information}.

Job Code: {job_code}
Status: {job_status}

We are currently working on your vehicle and will keep you updated on our progress.

If you have any questions, please don't hesitate to contact us.

Phone: {shop_phone}
Email: {shop_email}

Best regards,
{shop_name}`,
      isActive: true,
    },
    {
      name: 'Vehicle Pending',
      type: CommunicationTemplateType.EMAIL,
      action: CommunicationTemplateAction.VEHICLE_PENDING,
      subject: 'Update on your {car_information}',
      body: `Hi {customer_name},

This is an update on your {car_information}.

Job Code: {job_code}
Status: {job_status}

We are currently waiting on parts/materials to complete the work on your vehicle. We will contact you as soon as we have an update.

If you have any questions, please don't hesitate to contact us.

Phone: {shop_phone}
Email: {shop_email}

Best regards,
{shop_name}`,
      isActive: true,
    },
    {
      name: 'Invoice Created',
      type: CommunicationTemplateType.EMAIL,
      action: CommunicationTemplateAction.INVOICE_CREATED,
      subject: 'Invoice created for {car_information} - {job_code}',
      body: `Hi {customer_name},

An invoice has been created for your {car_information}.

Job Code: {job_code}
Invoice Total: {invoice_total}

Payment details are available on the invoice. If you have any questions, please contact us.

Phone: {shop_phone}
Email: {shop_email}

Thank you for your business!

Best regards,
{shop_name}`,
      isActive: true,
    },
  ];

  for (const templateData of defaultTemplates) {
    const template = templateRepository.create(templateData);
    await templateRepository.save(template);
  }

  console.log(`  ✓ Seeded ${defaultTemplates.length} communication templates`);
}

/**
 * Run seeding if called directly
 */
if (require.main === module) {
  AppDataSource.initialize()
    .then(() => seedDatabase())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}
