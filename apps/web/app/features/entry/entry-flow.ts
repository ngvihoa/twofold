export const ENTRY_NAME_MAX_LENGTH = 20;
export const ENTRY_ROOM_CODE_LENGTH = 6;

export type EntryIntent = 'create' | 'join';

export interface EntryValidationResult {
  readonly value: string;
  readonly error: string | null;
}

export function normalizePlayerName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, ENTRY_NAME_MAX_LENGTH);
}

export function validatePlayerName(value: string): EntryValidationResult {
  const normalized = normalizePlayerName(value);
  if (normalized.length < 2) {
    return { value: normalized, error: 'Tên cần có ít nhất 2 ký tự.' };
  }
  return { value: normalized, error: null };
}

export function normalizeRoomCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, ENTRY_ROOM_CODE_LENGTH);
}

export function validateRoomCode(value: string): EntryValidationResult {
  const normalized = normalizeRoomCode(value);
  if (normalized.length !== ENTRY_ROOM_CODE_LENGTH) {
    return { value: normalized, error: `Mã phòng cần đủ ${ENTRY_ROOM_CODE_LENGTH} ký tự.` };
  }
  return { value: normalized, error: null };
}

export function createMockRoomCode(random: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: ENTRY_ROOM_CODE_LENGTH }, () => {
    const index = Math.min(alphabet.length - 1, Math.floor(random() * alphabet.length));
    return alphabet[index];
  }).join('');
}
