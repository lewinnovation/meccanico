// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { detectSearchType } from '../utils/jobSearch';

describe('detectSearchType', () => {
  it('detects VINs', () => {
    expect(detectSearchType('1HGCM82633A004352')).toBe('vin');
  });

  it('detects license plates', () => {
    expect(detectSearchType('ABC123')).toBe('licensePlate');
  });

  it('detects emails', () => {
    expect(detectSearchType('someone@example.com')).toBe('email');
  });

  it('detects phone numbers', () => {
    expect(detectSearchType('(415) 555-0100')).toBe('phone');
  });

  it('defaults to name for other inputs', () => {
    expect(detectSearchType('Jane Doe Smith')).toBe('name');
  });
});
