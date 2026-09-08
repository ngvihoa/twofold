import { describe, expect, it } from 'vitest';
import { cn } from './classnames';

describe('cn', () => {
  it('keeps conditional classes and lets the last conflicting utility win', () => {
    expect(cn('px-2 text-sm', false, null, 'px-4')).toBe('text-sm px-4');
  });
});
