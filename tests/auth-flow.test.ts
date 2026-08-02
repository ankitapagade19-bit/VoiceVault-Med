import { describe, expect, it } from 'vitest';
import { generateTemporaryPassword, validatePasswordStrength } from '@/lib/auth';

describe('password workflow helpers', () => {
  it('creates a temporary password that meets the policy', () => {
    const password = generateTemporaryPassword();

    expect(password.length).toBeGreaterThanOrEqual(12);
    expect(validatePasswordStrength(password)).toEqual({ valid: true, issues: [] });
  });

  it('rejects weak passwords clearly', () => {
    const result = validatePasswordStrength('password');

    expect(result.valid).toBe(false);
    expect(result.issues.length).toBeGreaterThan(0);
  });
});
