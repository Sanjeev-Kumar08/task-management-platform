import { describe, it, expect, beforeEach } from 'vitest';
import { loginSchema, registerSchema } from '../src/lib/validators';
import { useUiStore } from '../src/stores/uiStore';
import { cn } from '../src/utils/cn';
import { createId } from '../src/utils/id';
import { readJson, writeJson, STORAGE_KEYS } from '../src/utils/storage';
import { normalizeId } from '../src/utils/normalize';

describe('validators', () => {
  it('accepts valid login', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: 'x' }).success).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(loginSchema.safeParse({ email: 'bad', password: 'x' }).success).toBe(false);
  });

  it('rejects short register password', () => {
    const result = registerSchema.safeParse({
      name: 'Ada',
      email: 'ada@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });
});

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ theme: 'light', sidebarCollapsed: false, toasts: [] });
  });

  it('toggles theme', () => {
    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).toBe('dark');
  });

  it('adds and dismisses toast', () => {
    useUiStore.getState().pushToast('fail', 'error');
    expect(useUiStore.getState().toasts).toHaveLength(1);
    const id = useUiStore.getState().toasts[0].id;
    useUiStore.getState().dismissToast(id);
    expect(useUiStore.getState().toasts).toHaveLength(0);
  });
});

describe('utils', () => {
  it('merges class names', () => {
    expect(cn('a', false && 'b', 'c')).toContain('a');
  });

  it('creates ids', () => {
    expect(createId().length).toBeGreaterThan(5);
  });

  it('normalizes ids', () => {
    expect(normalizeId({ _id: 'abc' }).id).toBe('abc');
  });

  it('persists json in storage', () => {
    writeJson(STORAGE_KEYS.theme, 'dark');
    expect(readJson(STORAGE_KEYS.theme, 'light')).toBe('dark');
  });
});
