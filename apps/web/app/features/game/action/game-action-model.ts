import {
  AbilityId,
  PlayerGameActionSchema,
  type CardId,
  type CardRole,
  type DayAction,
  type GamePlayerViewV2,
  type NightOrder,
  type PlayerGameAction,
  type PlayerId,
  type PrivateCardViewV2,
  type PurgeOrder,
} from '@twofold/shared-types';

export type DayAbilityActionType = Exclude<DayAction['type'], 'PASS'>;
export type NightAbilityId = Extract<
  NightOrder,
  { type: 'USE_ABILITY' }
>['abilityId'];

export const DAY_ACTION_ABILITY = {
  SHOOT: AbilityId.SHOOTER_SHOOT,
  MARK: AbilityId.AVENGER_MARK,
  PURIFY: AbilityId.PRIEST_PURIFY,
  REVIVE: AbilityId.WITCH_REVIVE,
} as const satisfies Record<DayAbilityActionType, AbilityId>;

/** Card đang sống theo lifecycle axis, độc lập visibility. */
export function isLivingCard(card: { readonly state: { readonly life: string } }): boolean {
  return card.state.life === 'ALIVE';
}

/** Ability còn dùng được theo resource/effect đã xuất hiện trong filtered view. */
export function hasAvailableAbility(
  card: PrivateCardViewV2,
  abilityId: AbilityId
): boolean {
  if (!isLivingCard(card)) return false;
  if (
    abilityId !== AbilityId.SUBSTITUTE_SACRIFICE &&
    card.effects.some((effect) => effect.kind === 'PURGE_LOCK')
  ) return false;
  if (card.effects.some((effect) => effect.kind === 'ROUND_EXHAUSTED')) return false;
  const ability = card.role.abilities.find((candidate) => candidate.abilityId === abilityId);
  return Boolean(
    ability && (!('remainingUses' in ability) || ability.remainingUses > 0)
  );
}

/** Lọc source card sở hữu một ability đang khả dụng. */
export function getAbilitySources(
  view: GamePlayerViewV2,
  abilityId: AbilityId
): readonly PrivateCardViewV2[] {
  return view.self.board.filter((card) => hasAvailableAbility(card, abilityId));
}

/** Rule Purge được xác định theo chu kỳ bắt đầu từ Vòng 6. */
export function getPurgeRuleForRound(round: number): PurgeOrder['rule'] {
  if (!Number.isInteger(round) || round < 6) {
    throw new Error('Purge rule chỉ tồn tại từ Vòng 6.');
  }
  return (['CUT', 'SWAP', 'REVEAL', 'LOCK'] as const)[(round - 6) % 4];
}

function parseAction(action: unknown): PlayerGameAction {
  return PlayerGameActionSchema.parse(action);
}

/** Tạo command bỏ lượt cho Day turn hiện tại. */
export function createDayPassAction(playerId: PlayerId): PlayerGameAction {
  return parseAction({ type: 'DAY_SUBMIT', playerId, action: { type: 'PASS' } });
}

/** Tạo command dùng role ability ban ngày từ source lên target. */
export function createDayAbilityAction(
  playerId: PlayerId,
  type: DayAbilityActionType,
  sourceId: CardId,
  targetId: CardId
): PlayerGameAction {
  return parseAction({
    type: 'DAY_SUBMIT',
    playerId,
    action: { type, sourceId, targetId },
  });
}

/** Tạo Council accusation pass, độc lập với reaction order. */
export function createCouncilPassAction(playerId: PlayerId): PlayerGameAction {
  return parseAction({
    type: 'COUNCIL_ACCUSATION_SUBMIT',
    playerId,
    order: { type: 'PASS' },
  });
}

/** Tạo cáo buộc Council với từ một đến ba voter khác nhau. */
export function createCouncilAccusationAction(
  playerId: PlayerId,
  targetId: CardId,
  guessedRole: CardRole | null,
  voterIds: readonly CardId[]
): PlayerGameAction {
  if (voterIds.length < 1 || voterIds.length > 3 || new Set(voterIds).size !== voterIds.length) {
    throw new Error('Council accusation cần từ một đến ba voter khác nhau.');
  }
  return parseAction({
    type: 'COUNCIL_ACCUSATION_SUBMIT',
    playerId,
    order: { type: 'ACCUSE', targetId, guessedRole, voterIds },
  });
}

/** Tạo Council reaction pass, không thay đổi accusation order. */
export function createCouncilReactionPassAction(
  playerId: PlayerId
): PlayerGameAction {
  return parseAction({
    type: 'COUNCIL_REACTION_SUBMIT',
    playerId,
    order: { type: 'PASS' },
  });
}

/** Tạo reaction để Kẻ Thế Mạng chết thay target đang chờ xử lý. */
export function createCouncilReactionAction(
  playerId: PlayerId,
  sourceId: CardId
): PlayerGameAction {
  return parseAction({
    type: 'COUNCIL_REACTION_SUBMIT',
    playerId,
    order: { type: 'SUBSTITUTE_SACRIFICE', sourceId },
  });
}

/** Tạo Night pass order cho player. */
export function createNightPassAction(playerId: PlayerId): PlayerGameAction {
  return parseAction({ type: 'NIGHT_SUBMIT', playerId, order: { type: 'PASS' } });
}

/** Tạo Night order dùng role ability từ source lên target. */
export function createNightAbilityAction(
  playerId: PlayerId,
  abilityId: NightAbilityId,
  sourceId: CardId,
  targetId: CardId
): PlayerGameAction {
  return parseAction({
    type: 'NIGHT_SUBMIT',
    playerId,
    order: { type: 'USE_ABILITY', abilityId, sourceId, targetId },
  });
}

/** Tạo Night order dùng special ability Blood Moon lên target. */
export function createBloodMoonAction(
  playerId: PlayerId,
  targetId: CardId
): PlayerGameAction {
  return parseAction({
    type: 'NIGHT_SUBMIT',
    playerId,
    order: { type: 'BLOOD_MOON', targetId },
  });
}

/** Tạo Defense pass order cho player. */
export function createDefensePassAction(playerId: PlayerId): PlayerGameAction {
  return parseAction({ type: 'DEFENSE_SUBMIT', playerId, order: { type: 'PASS' } });
}

/** Tạo Defense order bảo vệ target bằng Guard source. */
export function createDefenseProtectAction(
  playerId: PlayerId,
  sourceId: CardId,
  targetId: CardId
): PlayerGameAction {
  return parseAction({
    type: 'DEFENSE_SUBMIT',
    playerId,
    order: { type: 'PROTECT', sourceId, targetId },
  });
}

/** Bọc Purge order theo rule của round thành shared player command. */
export function createPurgeAction(
  playerId: PlayerId,
  order: PurgeOrder
): PlayerGameAction {
  return parseAction({ type: 'PURGE_SUBMIT', playerId, order });
}

/** Tạo dự đoán role trong Final Duel. */
export function createFinalGuessAction(
  playerId: PlayerId,
  guess: CardRole
): PlayerGameAction {
  return parseAction({ type: 'FINAL_GUESS_SUBMIT', playerId, guess });
}
