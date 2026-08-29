import { AbilityId, CardRole, Faction } from '@twofold/shared-types';

export interface RoleDefinition {
  id: CardRole;
  displayName: string;
  faction: Faction;
  abilities: readonly AbilityId[];
}

export const ROLE_DEFINITIONS = {
  [CardRole.VILLAGER]: {
    id: CardRole.VILLAGER,
    displayName: 'Dân làng',
    faction: Faction.VILLAGE,
    abilities: [],
  },
  [CardRole.WEREWOLF]: {
    id: CardRole.WEREWOLF,
    displayName: 'Ma sói',
    faction: Faction.WEREWOLF,
    abilities: [AbilityId.WEREWOLF_ATTACK],
  },
  [CardRole.SEER]: {
    id: CardRole.SEER,
    displayName: 'Tiên tri',
    faction: Faction.VILLAGE,
    abilities: [AbilityId.SEER_INSPECT],
  },
  [CardRole.GUARD]: {
    id: CardRole.GUARD,
    displayName: 'Bảo vệ',
    faction: Faction.VILLAGE,
    abilities: [AbilityId.GUARD_PROTECT],
  },
  [CardRole.WITCH]: {
    id: CardRole.WITCH,
    displayName: 'Phù thủy',
    faction: Faction.VILLAGE,
    abilities: [AbilityId.WITCH_REVIVE, AbilityId.WITCH_POISON],
  },
  [CardRole.SHOOTER]: {
    id: CardRole.SHOOTER,
    displayName: 'Xạ thủ',
    faction: Faction.VILLAGE,
    abilities: [AbilityId.SHOOTER_SHOOT],
  },
  [CardRole.AVENGER]: {
    id: CardRole.AVENGER,
    displayName: 'Kẻ báo thù',
    faction: Faction.VILLAGE,
    abilities: [AbilityId.AVENGER_MARK],
  },
  [CardRole.PRIEST]: {
    id: CardRole.PRIEST,
    displayName: 'Mục sư',
    faction: Faction.VILLAGE,
    abilities: [AbilityId.PRIEST_PURIFY],
  },
  [CardRole.WOLF_GUARD]: {
    id: CardRole.WOLF_GUARD,
    displayName: 'Sói Hộ Vệ',
    faction: Faction.WEREWOLF,
    abilities: [AbilityId.WOLF_GUARD_RESCUE],
  },
} as const satisfies Record<CardRole, RoleDefinition>;

export const STANDARD_DECK = [
  CardRole.VILLAGER,
  CardRole.WEREWOLF,
  CardRole.WEREWOLF,
  CardRole.SEER,
  CardRole.GUARD,
  CardRole.WITCH,
  CardRole.SHOOTER,
  CardRole.AVENGER,
  CardRole.PRIEST,
  CardRole.WOLF_GUARD,
] as const satisfies readonly CardRole[];

export function getRoleDefinition(role: CardRole): RoleDefinition {
  return ROLE_DEFINITIONS[role];
}
