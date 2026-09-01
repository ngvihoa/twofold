import { CardRole } from '@twofold/shared-types';

/** Tên vai trò dùng ở presentation; domain và wire contract vẫn giữ enum ổn định. */
export const GAME_ROLE_LABELS = {
  [CardRole.VILLAGER]: 'Dân làng',
  [CardRole.WEREWOLF]: 'Ma sói',
  [CardRole.SEER]: 'Tiên tri',
  [CardRole.GUARD]: 'Bảo vệ',
  [CardRole.WITCH]: 'Phù thủy',
  [CardRole.SHOOTER]: 'Xạ thủ',
  [CardRole.AVENGER]: 'Kẻ báo thù',
  [CardRole.PRIEST]: 'Mục sư',
  [CardRole.WOLF_GUARD]: 'Sói Hộ Vệ',
} as const satisfies Record<CardRole, string>;

export function formatGameRoleName(role: CardRole): string {
  return GAME_ROLE_LABELS[role];
}
