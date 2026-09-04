import { describe, expect, it } from 'vitest';
import {
  createMockRoomCode,
  normalizePlayerName,
  normalizeRoomCode,
  validatePlayerName,
  validateRoomCode,
} from './entry-flow';

describe('entry flow', () => {
  it('normalizes player names without destroying valid Vietnamese text', () => {
    expect(normalizePlayerName('  Minh   Anh  ')).toBe('Minh Anh');
    expect(validatePlayerName(' An ')).toEqual({ value: 'An', error: null });
    expect(validatePlayerName(' A ')).toEqual({ value: 'A', error: 'Tên cần có ít nhất 2 ký tự.' });
  });

  it('normalizes room codes to six uppercase alphanumeric characters', () => {
    expect(normalizeRoomCode(' ab-cd12xyz ')).toBe('ABCD12');
    expect(validateRoomCode('abcd12')).toEqual({ value: 'ABCD12', error: null });
    expect(validateRoomCode('A12')).toEqual({ value: 'A12', error: 'Mã phòng cần đủ 6 ký tự.' });
  });

  it('creates readable mock room codes without ambiguous characters', () => {
    expect(createMockRoomCode(() => 0)).toBe('AAAAAA');
    expect(createMockRoomCode(() => 0.999)).toMatch(/^[A-HJ-NP-Z2-9]{6}$/);
  });
});
