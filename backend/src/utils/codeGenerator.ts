import crypto from 'node:crypto';
import { AppDataSource } from '../config/database';

/**
 * Entity code prefixes
 */
export const CODE_PREFIXES = {
  CUSTOMER: 'C',
  VEHICLE: 'V',
  JOB: 'J',
  INVENTORY: 'I',
  LABOUR: 'L',
  SERVICE: 'S',
  TEMPLATE: 'T',
} as const;

export type CodePrefix = typeof CODE_PREFIXES[keyof typeof CODE_PREFIXES];

const getAdvisoryLockKey = (value: string) => {
  const hash = crypto.createHash('sha256').update(value).digest();
  return hash.readBigInt64BE(0);
};

const withAdvisoryLock = async <T>(
  lockKey: string,
  run: (queryRunner: {
    query: (query: string, parameters?: unknown[]) => Promise<unknown[]>;
  }) => Promise<T>
): Promise<T> => {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    await queryRunner.query('SELECT pg_advisory_xact_lock($1)', [
      getAdvisoryLockKey(lockKey).toString(),
    ]);
    const result = await run(queryRunner);
    await queryRunner.commitTransaction();
    return result;
  } catch (error) {
    await queryRunner.rollbackTransaction();
    throw error;
  } finally {
    await queryRunner.release();
  }
};

/**
 * Generate the next code for an entity type
 * Format: {PREFIX}{NNN} e.g., C001, J042
 */
export async function generateCode(
  entityName: string,
  prefix: CodePrefix
): Promise<string> {
  const tableName = entityName.toLowerCase();
  
  return withAdvisoryLock(`${tableName}:${prefix}`, async (queryRunner) => {
    // Get the highest code number for this entity type
    const result = (await queryRunner.query(
      `
      SELECT code FROM ${tableName}
      WHERE code LIKE $1
      ORDER BY CAST(substring(code, 2) AS INTEGER) DESC
      LIMIT 1
    `,
      [`${prefix}%`]
    )) as Array<{ code: string }>;

    let nextNumber = 1;
    
    if (result.length > 0) {
      const lastCode = result[0].code as string;
      const lastNumber = parseInt(lastCode.substring(1), 10);
      nextNumber = lastNumber + 1;
    }

    // Pad to 3 digits minimum, but allow more if needed
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}${paddedNumber}`;
  });
}

/**
 * Generate customer code based on name
 * Format: C{5 letters of name in caps}{000} e.g., CJOHNS001, CALICE001
 */
export async function generateCustomerCode(name: string): Promise<string> {
  // Extract first 5 letters from name (remove spaces, special chars, uppercase, pad if needed)
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const namePrefix = cleanName.substring(0, 5).padEnd(5, 'X');
  const fullPrefix = `${CODE_PREFIXES.CUSTOMER}${namePrefix}`;
  
  return withAdvisoryLock(`customers:${fullPrefix}`, async (queryRunner) => {
    // Get the highest code number for this customer name prefix
    const result = (await queryRunner.query(
      `
      SELECT code FROM customers
      WHERE code LIKE $1
      ORDER BY CAST(substring(code, 7) AS INTEGER) DESC
      LIMIT 1
    `,
      [`${fullPrefix}%`]
    )) as Array<{ code: string }>;

    let nextNumber = 1;
    
    if (result.length > 0) {
      const lastCode = result[0].code as string;
      // Extract the number portion (last 3 characters)
      const lastNumber = parseInt(lastCode.substring(6), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Pad to 3 digits
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `${fullPrefix}${paddedNumber}`;
  });
}

/**
 * Generate job code with date-based format
 * Format: J{yyMMdd}{nnn} e.g., J241216001, J241216002
 */
export async function generateJobCode(): Promise<string> {
  const now = new Date();
  const yy = now.getFullYear().toString().slice(-2);
  const mm = (now.getMonth() + 1).toString().padStart(2, '0');
  const dd = now.getDate().toString().padStart(2, '0');
  const datePrefix = `${CODE_PREFIXES.JOB}${yy}${mm}${dd}`;
  
  return withAdvisoryLock(`jobs:${datePrefix}`, async (queryRunner) => {
    // Get the highest code number for this date
    const result = (await queryRunner.query(
      `
      SELECT code FROM jobs
      WHERE code LIKE $1
      ORDER BY CAST(substring(code, 8) AS INTEGER) DESC
      LIMIT 1
    `,
      [`${datePrefix}%`]
    )) as Array<{ code: string }>;

    let nextNumber = 1;
    
    if (result.length > 0) {
      const lastCode = result[0].code as string;
      // Extract the number portion (last 3 characters after the date prefix)
      const lastNumber = parseInt(lastCode.substring(7), 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    // Pad to 3 digits
    const paddedNumber = nextNumber.toString().padStart(3, '0');
    return `${datePrefix}${paddedNumber}`;
  });
}

/**
 * Batch generate multiple codes
 */
export async function generateCodes(
  entityName: string,
  prefix: CodePrefix,
  count: number
): Promise<string[]> {
  const tableName = entityName.toLowerCase();
  
  return withAdvisoryLock(`${tableName}:${prefix}`, async (queryRunner) => {
    const result = (await queryRunner.query(
      `
      SELECT code FROM ${tableName}
      WHERE code LIKE $1
      ORDER BY CAST(substring(code, 2) AS INTEGER) DESC
      LIMIT 1
    `,
      [`${prefix}%`]
    )) as Array<{ code: string }>;

    let startNumber = 1;
    
    if (result.length > 0) {
      const lastCode = result[0].code as string;
      startNumber = parseInt(lastCode.substring(1), 10) + 1;
    }

    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      const paddedNumber = (startNumber + i).toString().padStart(3, '0');
      codes.push(`${prefix}${paddedNumber}`);
    }

    return codes;
  });
}

