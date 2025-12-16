import { AppDataSource } from '../config/database';
import { VehicleMake } from '../models/VehicleMake';
import { VehicleModel } from '../models/VehicleModel';
import { User, UserRole } from '../models/User';
import * as bcrypt from 'bcryptjs';

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
 * Seed the database with initial data
 */
export async function seedDatabase(): Promise<void> {
  console.log('🌱 Starting database seeding...');

  // Seed vehicle makes and models
  await seedVehicleMakesAndModels();

  // Seed default admin user
  await seedDefaultUsers();

  console.log('✅ Database seeding completed');
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
    console.log('  Default admin user already exists, skipping...');
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

