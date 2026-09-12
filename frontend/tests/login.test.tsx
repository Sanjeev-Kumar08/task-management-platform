import { describe, expect, it } from 'vitest';
import { loginSchema } from '@/lib/validators';

describe('login validation', () => {
  it('accepts valid credentials', () => {
    const result = loginSchema.safeParse({
      email: 'owner@demo.com',
      password: 'Password123!',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = loginSchema.safeParse({
      email: 'not-an-email',
      password: 'Password123!',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toMatch(/valid email/i);
    }
  });

  it('rejects empty password', () => {
    const result = loginSchema.safeParse({
      email: 'owner@demo.com',
      password: '',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password?.[0]).toMatch(/required/i);
    }
  });
});
