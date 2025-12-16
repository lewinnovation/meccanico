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

/**
 * Generate the next code for an entity type
 * Format: {PREFIX}{NNN} e.g., C001, J042
 */
export async function generateCode(
  entityName: string,
  prefix: CodePrefix
): Promise<string> {
  const tableName = entityName.toLowerCase();
  
  // Get the highest code number for this entity type
  const result = await AppDataSource.query(`
    SELECT code FROM ${tableName}
    WHERE code LIKE '${prefix}%'
    ORDER BY code DESC
    LIMIT 1
  `);

  let nextNumber = 1;
  
  if (result.length > 0) {
    const lastCode = result[0].code as string;
    const lastNumber = parseInt(lastCode.substring(1), 10);
    nextNumber = lastNumber + 1;
  }

  // Pad to 3 digits minimum, but allow more if needed
  const paddedNumber = nextNumber.toString().padStart(3, '0');
  return `${prefix}${paddedNumber}`;
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
  
  const result = await AppDataSource.query(`
    SELECT code FROM ${tableName}
    WHERE code LIKE '${prefix}%'
    ORDER BY code DESC
    LIMIT 1
  `);

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
}

