import { AbilityId, CardRole, Faction } from '@twofold/shared-types';
import type { CardId } from './cards';

export interface RoleDefinition {
  id: CardRole;
  displayName: string;
  faction: Faction;
  abilities: readonly AbilityId[];
}

export type AbilityState =
  | { readonly abilityId: AbilityId.WEREWOLF_ATTACK }
  | { readonly abilityId: AbilityId.SEER_INSPECT; readonly remainingUses: number }
  | {
      readonly abilityId: AbilityId.GUARD_PROTECT;
      readonly lastTarget: { readonly cardId: CardId; readonly round: number } | null;
    }
  | { readonly abilityId: AbilityId.WITCH_REVIVE; readonly remainingUses: number }
  | { readonly abilityId: AbilityId.WITCH_POISON; readonly remainingUses: number }
  | { readonly abilityId: AbilityId.SHOOTER_SHOOT; readonly remainingUses: number }
  | { readonly abilityId: AbilityId.AVENGER_MARK }
  | { readonly abilityId: AbilityId.PRIEST_PURIFY; readonly remainingUses: number }
  | { readonly abilityId: AbilityId.WOLF_GUARD_RESCUE; readonly remainingUses: number };

export interface RoleState {
  readonly id: CardRole;
  readonly abilities: readonly AbilityState[];
}

export type RoleCommand = {
  readonly type: 'ABILITY_USED';
  readonly abilityId: AbilityId;
  readonly targetId?: CardId;
  readonly round: number;
};

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

function createInitialAbilityStates(role: CardRole): readonly AbilityState[] {
  switch (role) {
    case CardRole.WEREWOLF:
      return [{ abilityId: AbilityId.WEREWOLF_ATTACK }];
    case CardRole.SEER:
      return [{ abilityId: AbilityId.SEER_INSPECT, remainingUses: 3 }];
    case CardRole.GUARD:
      return [{ abilityId: AbilityId.GUARD_PROTECT, lastTarget: null }];
    case CardRole.WITCH:
      return [
        { abilityId: AbilityId.WITCH_REVIVE, remainingUses: 1 },
        { abilityId: AbilityId.WITCH_POISON, remainingUses: 1 },
      ];
    case CardRole.SHOOTER:
      return [{ abilityId: AbilityId.SHOOTER_SHOOT, remainingUses: 1 }];
    case CardRole.AVENGER:
      return [{ abilityId: AbilityId.AVENGER_MARK }];
    case CardRole.PRIEST:
      return [{ abilityId: AbilityId.PRIEST_PURIFY, remainingUses: 1 }];
    case CardRole.WOLF_GUARD:
      return [{ abilityId: AbilityId.WOLF_GUARD_RESCUE, remainingUses: 1 }];
    default:
      return [];
  }
}

export function createInitialRoleState(role: CardRole): RoleState {
  return { id: role, abilities: createInitialAbilityStates(role) };
}

export function transitionRole(role: RoleState, command: RoleCommand): RoleState {
  if (!Number.isInteger(command.round) || command.round < 1) {
    throw new RangeError('Round của ability command phải là số nguyên dương.');
  }

  const abilityIndex = role.abilities.findIndex(
    (ability) => ability.abilityId === command.abilityId
  );
  if (abilityIndex < 0) {
    throw new Error(`${role.id} không có ability ${command.abilityId}.`);
  }

  const ability = role.abilities[abilityIndex];
  let nextAbility: AbilityState;

  if (ability.abilityId === AbilityId.GUARD_PROTECT) {
    if (!command.targetId) throw new Error('Guard ability cần target.');
    if (
      ability.lastTarget?.cardId === command.targetId &&
      ability.lastTarget.round >= command.round - 1
    ) {
      throw new Error('Không được bảo vệ cùng một target ở hai vòng liên tiếp.');
    }
    nextAbility = {
      ...ability,
      lastTarget: { cardId: command.targetId, round: command.round },
    };
  } else if ('remainingUses' in ability) {
    if (ability.remainingUses < 1) {
      throw new Error(`Ability ${ability.abilityId} đã hết lượt sử dụng.`);
    }
    nextAbility = { ...ability, remainingUses: ability.remainingUses - 1 };
  } else {
    return role;
  }

  const abilities = [...role.abilities];
  abilities[abilityIndex] = nextAbility;
  return { ...role, abilities };
}

export function getRoleAbility<TAbilityId extends AbilityId>(
  role: RoleState,
  abilityId: TAbilityId
): Extract<AbilityState, { abilityId: TAbilityId }> | undefined {
  return role.abilities.find(
    (ability): ability is Extract<AbilityState, { abilityId: TAbilityId }> =>
      ability.abilityId === abilityId
  );
}
