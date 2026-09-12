import { describe, it, expect } from 'vitest';
import { createWorkspaceSchema } from '@/lib/validators';

describe('workspace create validation', () => {
  it('accepts a valid workspace name', () => {
    const result = createWorkspaceSchema.safeParse({ name: 'Acme Team' });
    expect(result.success).toBe(true);
  });

  it('rejects short names', () => {
    const result = createWorkspaceSchema.safeParse({ name: 'A' });
    expect(result.success).toBe(false);
  });
});
