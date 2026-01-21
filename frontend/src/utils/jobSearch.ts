export type JobSearchType = 'vin' | 'licensePlate' | 'email' | 'phone' | 'name';

// Pattern detection utilities for customer/vehicle search input.
export const detectSearchType = (input: string): JobSearchType => {
  const trimmed = input.trim();

  // VIN: exactly 17 alphanumeric characters
  if (/^[A-Z0-9]{17}$/i.test(trimmed)) {
    return 'vin';
  }

  // License plate: 2-8 alphanumeric characters, may contain spaces/hyphens
  if (/^[A-Z0-9\s-]{2,8}$/i.test(trimmed) && trimmed.length <= 8) {
    return 'licensePlate';
  }

  // Email: contains @ symbol
  if (trimmed.includes('@')) {
    return 'email';
  }

  // Phone: mostly digits with optional formatting
  const digitsOnly = trimmed.replace(/[\s\-()]/g, '');
  if (/^\d{7,15}$/.test(digitsOnly)) {
    return 'phone';
  }

  // Default to name
  return 'name';
};
