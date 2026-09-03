import { CardRole } from '@twofold/shared-types';

/** Artwork của role dùng thống nhất giữa Setup và bàn đấu runtime. */
export const GAME_ROLE_ART = {
  [CardRole.VILLAGER]: '/characters/dan-lang.png',
  [CardRole.WEREWOLF]: '/characters/ma-soi-thuong.png',
  [CardRole.SEER]: '/characters/tien-tri.png',
  [CardRole.GUARD]: '/characters/bao-ve.png',
  [CardRole.WITCH]: '/characters/phu-thuy.webp',
  [CardRole.SHOOTER]: '/characters/xa-thu.webp',
  [CardRole.AVENGER]: '/characters/ke-bao-thu.png',
  [CardRole.PRIEST]: '/characters/muc-su.png',
  [CardRole.SUBSTITUTE]: '/characters/soi-ho-ve.webp',
  [CardRole.WOLF_GUARD]: '/characters/soi-ho-ve.webp',
} as const satisfies Record<CardRole, string>;

export function getGameRoleArt(role: CardRole): string {
  return GAME_ROLE_ART[role];
}
