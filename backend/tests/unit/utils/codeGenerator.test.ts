import { AppDataSource } from '../../../src/config/database';
import { 
  generateCode, 
  generateCustomerCode, 
  CODE_PREFIXES 
} from '../../../src/utils/codeGenerator';

// Mock the database
jest.mock('../../../src/config/database', () => ({
  AppDataSource: {
    createQueryRunner: jest.fn(),
  },
}));

const mockQueryRunner = {
  query: jest.fn(),
  connect: jest.fn(),
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
};
const mockCreateQueryRunner = AppDataSource.createQueryRunner as jest.Mock;

const mockQueryWithResult = (result: unknown[]) => {
  mockQueryRunner.query.mockResolvedValueOnce([]).mockResolvedValueOnce(result);
};

describe('codeGenerator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateQueryRunner.mockReturnValue(mockQueryRunner);
    mockQueryRunner.query.mockResolvedValue([]);
  });

  describe('generateCode', () => {
    it('should generate first code as 001 when no existing codes', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCode('jobs', CODE_PREFIXES.JOB);
      
      expect(code).toBe('J001');
    });

    it('should increment code number from last existing code', async () => {
      mockQueryWithResult([{ code: 'J042' }]);
      
      const code = await generateCode('jobs', CODE_PREFIXES.JOB);
      
      expect(code).toBe('J043');
    });

    it('should pad numbers to 3 digits', async () => {
      mockQueryWithResult([{ code: 'V005' }]);
      
      const code = await generateCode('vehicles', CODE_PREFIXES.VEHICLE);
      
      expect(code).toBe('V006');
    });

    it('should handle numbers larger than 999', async () => {
      mockQueryWithResult([{ code: 'I1234' }]);
      
      const code = await generateCode('inventory', CODE_PREFIXES.INVENTORY);
      
      expect(code).toBe('I1235');
    });

    it('should use correct prefix for each entity type', async () => {
      mockQueryRunner.query.mockResolvedValue([]);
      
      expect(await generateCode('customers', CODE_PREFIXES.CUSTOMER)).toMatch(/^C\d{3}$/);
      expect(await generateCode('vehicles', CODE_PREFIXES.VEHICLE)).toMatch(/^V\d{3}$/);
      expect(await generateCode('jobs', CODE_PREFIXES.JOB)).toMatch(/^J\d{3}$/);
      expect(await generateCode('inventory', CODE_PREFIXES.INVENTORY)).toMatch(/^I\d{3}$/);
      expect(await generateCode('labour', CODE_PREFIXES.LABOUR)).toMatch(/^L\d{3}$/);
      expect(await generateCode('services', CODE_PREFIXES.SERVICE)).toMatch(/^S\d{3}$/);
      expect(await generateCode('templates', CODE_PREFIXES.TEMPLATE)).toMatch(/^T\d{3}$/);
    });
  });

  describe('generateCustomerCode', () => {
    it('should generate code with first 5 letters of name in uppercase', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode('John Smith');
      
      expect(code).toBe('CJOHNS001');
    });

    it('should remove spaces from name before extracting letters', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode('Mary Jane Watson');
      
      expect(code).toBe('CMARYJ001');
    });

    it('should pad short names with X', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode('Bob');
      
      // BOB + XX (pad to 5) = BOBXX
      expect(code).toBe('CBOBXX001');
    });

    it('should pad 4-letter names with one X', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode('Jack');
      
      expect(code).toBe('CJACKX001');
    });

    it('should handle exactly 5 letter names', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode('Alice');
      
      expect(code).toBe('CALICE001');
    });

    it('should convert lowercase names to uppercase', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode('alice');
      
      expect(code).toBe('CALICE001');
    });

    it('should handle mixed case names', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode('JoHn SmItH');
      
      expect(code).toBe('CJOHNS001');
    });

    it('should start at 001 for new name prefix', async () => {
      // CJOHNS001 exists, but John Doe gives CJOHND which is different prefix
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode('John Doe');
      
      // JOHND is a new prefix, so starts at 001
      expect(code).toBe('CJOHND001');
    });

    it('should increment number for exact same prefix', async () => {
      mockQueryWithResult([{ code: 'CJOHNS005' }]);
      
      const code = await generateCustomerCode('John Smith');
      
      expect(code).toBe('CJOHNS006');
    });

    it('should handle single character name', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode('X');
      
      expect(code).toBe('CXXXXX001');
    });

    it('should handle empty string by using all X', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode('');
      
      expect(code).toBe('CXXXXX001');
    });

    it('should handle names with only spaces', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode('   ');
      
      expect(code).toBe('CXXXXX001');
    });

    it('should handle names with special characters', async () => {
      mockQueryWithResult([]);
      
      const code = await generateCustomerCode("O'Brien");
      
      // Removes special chars, uses OBRIE (O + B + R + I + E)
      expect(code).toBe('COBRIE001');
    });

    it('should handle numbers in high range', async () => {
      mockQueryWithResult([{ code: 'CJOHNS999' }]);
      
      const code = await generateCustomerCode('John Smith');
      
      expect(code).toBe('CJOHNS1000');
    });
  });

  describe('CODE_PREFIXES', () => {
    it('should have correct prefix values', () => {
      expect(CODE_PREFIXES.CUSTOMER).toBe('C');
      expect(CODE_PREFIXES.VEHICLE).toBe('V');
      expect(CODE_PREFIXES.JOB).toBe('J');
      expect(CODE_PREFIXES.INVENTORY).toBe('I');
      expect(CODE_PREFIXES.LABOUR).toBe('L');
      expect(CODE_PREFIXES.SERVICE).toBe('S');
      expect(CODE_PREFIXES.TEMPLATE).toBe('T');
    });
  });
});

