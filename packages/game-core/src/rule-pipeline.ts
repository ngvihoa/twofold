import { AbilityId, CardRole, Faction, PlayerId, WinReason } from '@twofold/shared-types';
import {
  CardEffectKind,
  CardEffectRule,
  type CardEffectState,
  type CardId,
  type GameCard,
  hasCardEffect,
  isCardAlive,
  transitionCard,
} from './cards';
import { appendGameEvents, type CardEliminationCause, type GameEventDraft } from './game-events';
import { type GameState, transitionGameState } from './game-state';
import {
  type CouncilOrder,
  type CouncilReactionOrder,
  type DefenseOrder,
  type NightOrder,
  PlayerSpecialAbilityId,
  type PlayerState,
  type PurgeOrder,
  replacePlayerCard,
} from './players';
import {
  getRoleAbility,
  getRoleDefinition,
  STANDARD_DECK,
  transitionRole,
  type AbilityState,
} from './roles';

/** Player action hiện đã được port vào validation/resolution pipeline. */
export type PlayerGameAction =
  | { readonly type: 'SETUP_LOCK'; readonly playerId: PlayerId }
  | {
      readonly type: 'DAY_SUBMIT';
      readonly playerId: PlayerId;
      readonly action: DayAction;
    }
  | {
      readonly type: 'COUNCIL_ACCUSATION_SUBMIT';
      readonly playerId: PlayerId;
      readonly order: CouncilOrder;
    }
  | {
      readonly type: 'COUNCIL_REACTION_SUBMIT';
      readonly playerId: PlayerId;
      readonly order: CouncilReactionOrder;
    }
  | {
      readonly type: 'NIGHT_SUBMIT';
      readonly playerId: PlayerId;
      readonly order: NightOrder;
    }
  | {
      readonly type: 'DEFENSE_SUBMIT';
      readonly playerId: PlayerId;
      readonly order: DefenseOrder;
    }
  | {
      readonly type: 'PURGE_SUBMIT';
      readonly playerId: PlayerId;
      readonly order: PurgeOrder;
    };

/** Main Action được resolve ngay trong Day turn của player. */
export type DayAction =
  | { readonly type: 'PASS' }
  | { readonly type: 'SHOOT'; readonly sourceId: CardId; readonly targetId: CardId }
  | { readonly type: 'MARK'; readonly sourceId: CardId; readonly targetId: CardId }
  | { readonly type: 'PURIFY'; readonly sourceId: CardId; readonly targetId: CardId }
  | { readonly type: 'REVIVE'; readonly sourceId: CardId; readonly targetId: CardId };

/** Lỗi validation cho action không hợp lệ theo authoritative state hiện tại. */
export class RuleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RuleValidationError';
  }
}

/**
 * Entry point của rule pipeline.
 *
 * Action luôn được validate trước khi state thay đổi. Khi đủ submission của
 * phase đồng thời, pipeline tự resolve, phát event, cleanup và chuyển phase.
 */
export function dispatchPlayerAction(
  state: GameState,
  action: PlayerGameAction
): GameState {
  if (state.result || state.phase.type === 'ENDED') {
    throw new RuleValidationError('Game đã kết thúc.');
  }

  switch (action.type) {
    case 'SETUP_LOCK': {
      assertPhase(state, 'SETUP');
      if (state.players[action.playerId].setup.status === 'LOCKED') {
        throw new RuleValidationError(`${action.playerId} đã khóa Setup.`);
      }
      return transitionGameState(state, {
        type: 'SETUP_LOCKED',
        playerId: action.playerId,
      });
    }

    case 'DAY_SUBMIT':
      validateDayActor(state, action.playerId);
      return resolveDayAction(state, action.playerId, action.action);

    case 'COUNCIL_ACCUSATION_SUBMIT':
      return submitCouncilAccusation(state, action.playerId, action.order);

    case 'COUNCIL_REACTION_SUBMIT':
      return submitCouncilReaction(state, action.playerId, action.order);

    case 'NIGHT_SUBMIT':
      return submitNightOrder(state, action.playerId, action.order);

    case 'DEFENSE_SUBMIT':
      return submitDefenseOrder(state, action.playerId, action.order);

    case 'PURGE_SUBMIT':
      return submitPurgeOrder(state, action.playerId, action.order);
  }
}

function resolveDayAction(
  state: GameState,
  playerId: PlayerId,
  action: DayAction
): GameState {
  if (action.type === 'PASS') return completeDayAction(state, playerId);

  const source = getOwnedLivingCard(state, playerId, action.sourceId, 'Day source');
  const events: GameEventDraft[] = [];
  let next = state;

  switch (action.type) {
    case 'SHOOT': {
      const ability = requireAvailableAbility(source, AbilityId.SHOOTER_SHOOT);
      const target = getOpponentLivingCard(state, playerId, action.targetId, 'Shooter target');
      const opponent = state.players[target.owner];
      if (target.state.visibility !== 'REVEALED') {
        throw new RuleValidationError('Shooter chỉ bắn được target đã lộ.');
      }
      if (opponent.board.filter((card) => card.state.visibility === 'REVEALED').length < 2) {
        throw new RuleValidationError('Shooter cần đối thủ có ít nhất hai role đã lộ.');
      }
      if (ability.remainingUses < 1) {
        throw new RuleValidationError('Shooter đã hết đạn.');
      }

      const resolvedSource = useAndRevealSource(
        next,
        source,
        AbilityId.SHOOTER_SHOOT,
        target.id,
        events
      );
      next = resolvedSource.state;
      const eliminated = eliminateCard(next, target.id, true, {
        type: 'ABILITY',
        abilityId: AbilityId.SHOOTER_SHOOT,
        sourceCardId: source.id,
      }, events);
      next = eliminated.state;
      next = resolveRevengeChain(next, eliminated.eliminatedIds, true, events);
      break;
    }

    case 'MARK': {
      requireAvailableAbility(source, AbilityId.AVENGER_MARK);
      const target = getOpponentLivingCard(state, playerId, action.targetId, 'Avenger target');
      const resolvedSource = useAndRevealSource(
        next,
        source,
        AbilityId.AVENGER_MARK,
        target.id,
        events
      );
      next = removeExistingRevengeMark(resolvedSource.state, source.id);
      const currentTarget = getCard(next, target.id);
      const mark: CardEffectState = {
        id: `revenge:${playerId}:${source.id}:${target.id}:round:${next.round}`,
        kind: CardEffectKind.REVENGE_MARK,
        source: {
          type: 'ABILITY',
          abilityId: AbilityId.AVENGER_MARK,
          cardId: source.id,
          playerId,
        },
        appliedRound: next.round,
        expires: {
          type: 'AFTER_PHASE',
          phase: 'NIGHT_RESOLUTION',
          round: next.round,
        },
      };
      next = replaceCard(
        next,
        transitionCard(currentTarget, { type: 'APPLY_EFFECT', effect: mark })
      );
      events.push({
        type: 'EFFECT_APPLIED',
        visibility: { type: 'PUBLIC' },
        targetCardId: target.id,
        effectKind: CardEffectKind.REVENGE_MARK,
      });
      break;
    }

    case 'PURIFY': {
      requireAvailableAbility(source, AbilityId.PRIEST_PURIFY);
      const target = getOpponentLivingCard(state, playerId, action.targetId, 'Priest target');
      const resolvedSource = useAndRevealSource(
        next,
        source,
        AbilityId.PRIEST_PURIFY,
        target.id,
        events
      );
      next = resolvedSource.state;
      const targetIsWolf =
        getRoleDefinition(target.role.id).faction === Faction.WEREWOLF;
      const victimId = targetIsWolf ? target.id : source.id;
      const eliminated = eliminateCard(next, victimId, true, {
        type: 'ABILITY',
        abilityId: AbilityId.PRIEST_PURIFY,
        sourceCardId: source.id,
      }, events);
      next = eliminated.state;
      next = resolveRevengeChain(next, eliminated.eliminatedIds, true, events);
      break;
    }

    case 'REVIVE': {
      requireAvailableAbility(source, AbilityId.WITCH_REVIVE);
      const target = getOwnedCard(state, playerId, action.targetId, 'Witch target');
      if (isCardAlive(target)) {
        throw new RuleValidationError('Witch chỉ hồi sinh card đã chết bên mình.');
      }
      const resolvedSource = useAndRevealSource(
        next,
        source,
        AbilityId.WITCH_REVIVE,
        target.id,
        events
      );
      next = resolvedSource.state;
      const revived = transitionCard(getCard(next, target.id), { type: 'REVIVE' });
      next = replaceCard(next, revived);
      events.push({
        type: 'CARD_REVIVED',
        visibility: { type: 'PUBLIC' },
        cardId: target.id,
        sourceCardId: source.id,
      });
      break;
    }
  }

  next = appendGameEvents(next, events);
  return completeDayAction(next, playerId);
}

function completeDayAction(state: GameState, playerId: PlayerId): GameState {
  const result = getEliminationResult(state);
  if (result) return transitionGameState(state, { type: 'GAME_ENDED', result });
  if (hasFinalDuelBoard(state)) {
    return transitionGameState(state, { type: 'FINAL_DUEL_REQUIRED' });
  }
  return transitionGameState(state, {
    type: 'DAY_ACTION_COMPLETED',
    playerId,
  });
}

function validateDayActor(state: GameState, playerId: PlayerId): void {
  const expected =
    state.phase.type === 'DAY_A'
      ? PlayerId.PLAYER_A
      : state.phase.type === 'DAY_B'
        ? PlayerId.PLAYER_B
        : null;
  if (expected !== playerId) {
    throw new RuleValidationError(`Không phải Day turn của ${playerId}.`);
  }
}

function requireAvailableAbility<TAbilityId extends AbilityId>(
  source: GameCard,
  abilityId: TAbilityId
): Extract<AbilityState, { abilityId: TAbilityId }> {
  assertCardAbilitySourceAvailable(source);
  const ability = getRoleAbility(source.role, abilityId);
  if (!ability) {
    throw new RuleValidationError(`${source.id} không sở hữu ${abilityId}.`);
  }
  if ('remainingUses' in ability && ability.remainingUses < 1) {
    throw new RuleValidationError(`${abilityId} đã hết lượt sử dụng.`);
  }
  return ability;
}

function useAndRevealSource(
  state: GameState,
  source: GameCard,
  abilityId: AbilityId,
  targetId: CardId,
  events: GameEventDraft[]
): { readonly state: GameState; readonly source: GameCard } {
  let next = state;
  let updatedSource = getCard(next, source.id);
  if (updatedSource.state.visibility === 'HIDDEN') {
    updatedSource = transitionCard(updatedSource, { type: 'REVEAL' });
    events.push({
      type: 'CARD_REVEALED',
      visibility: { type: 'PUBLIC' },
      cardId: source.id,
    });
  }
  updatedSource = {
    ...updatedSource,
    role: transitionRole(updatedSource.role, {
      type: 'ABILITY_USED',
      abilityId,
      targetId,
      round: next.round,
    }),
  };
  next = replaceCard(next, updatedSource);
  events.push({
    type: 'ABILITY_RESOLVED',
    visibility: { type: 'PUBLIC' },
    abilityId,
    sourceCardId: source.id,
    targetCardId: targetId,
  });
  return { state: next, source: updatedSource };
}

function eliminateCard(
  state: GameState,
  cardId: CardId,
  revealOnDeath: boolean,
  cause: CardEliminationCause,
  events: GameEventDraft[]
): { readonly state: GameState; readonly eliminatedIds: readonly CardId[] } {
  let card = getCard(state, cardId);
  if (!isCardAlive(card)) return { state, eliminatedIds: [] };
  let next = state;
  if (revealOnDeath && card.state.visibility === 'HIDDEN') {
    card = transitionCard(card, { type: 'REVEAL' });
    next = replaceCard(next, card);
    events.push({
      type: 'CARD_REVEALED',
      visibility: { type: 'PUBLIC' },
      cardId,
    });
  }
  card = transitionCard(card, { type: 'ELIMINATE' });
  next = replaceCard(next, card);
  events.push({
    type: 'CARD_ELIMINATED',
    visibility: { type: 'PUBLIC' },
    cardId,
    cause,
  });
  return { state: next, eliminatedIds: [cardId] };
}

function resolveRevengeChain(
  state: GameState,
  eliminatedIds: readonly CardId[],
  revealOnDeath: boolean,
  events: GameEventDraft[]
): GameState {
  const queue = [...eliminatedIds];
  const resolvedSources = new Set<CardId>();
  let next = state;

  while (queue.length > 0) {
    const sourceId = queue.shift();
    if (!sourceId || resolvedSources.has(sourceId)) continue;
    resolvedSources.add(sourceId);
    const source = getCard(next, sourceId);
    if (!getRoleAbility(source.role, AbilityId.AVENGER_MARK)) continue;

    const markedTarget = findRevengeTarget(next, source.id);
    if (!markedTarget || !isCardAlive(markedTarget)) continue;
    const eliminated = eliminateCard(
      next,
      markedTarget.id,
      revealOnDeath,
      { type: 'REVENGE', sourceCardId: source.id },
      events
    );
    next = eliminated.state;
    queue.push(...eliminated.eliminatedIds);
  }
  return next;
}

function findRevengeTarget(state: GameState, sourceCardId: CardId): GameCard | null {
  for (const playerId of PLAYER_ORDER) {
    for (const card of state.players[playerId].board) {
      if (
        card.effects.some(
          (effect) =>
            effect.kind === CardEffectKind.REVENGE_MARK &&
            effect.source.type === 'ABILITY' &&
            effect.source.cardId === sourceCardId
        )
      ) {
        return card;
      }
    }
  }
  return null;
}

function removeExistingRevengeMark(state: GameState, sourceCardId: CardId): GameState {
  let next = state;
  for (const playerId of PLAYER_ORDER) {
    for (const card of next.players[playerId].board) {
      const marks = card.effects.filter(
        (effect) =>
          effect.kind === CardEffectKind.REVENGE_MARK &&
          effect.source.type === 'ABILITY' &&
          effect.source.cardId === sourceCardId
      );
      let updated = card;
      for (const mark of marks) {
        updated = transitionCard(updated, { type: 'REMOVE_EFFECT', effectId: mark.id });
      }
      if (updated !== card) next = replaceCard(next, updated);
    }
  }
  return next;
}

function submitCouncilAccusation(
  state: GameState,
  playerId: PlayerId,
  order: CouncilOrder
): GameState {
  assertPhase(state, 'COUNCIL_PLAN');
  assertSubmissionOpen(
    state.players[playerId].submissions.council.accusation,
    'Council Accusation',
    playerId
  );
  validateCouncilAccusation(state, playerId, order);

  const next = updatePlayer(state, playerId, (player) => ({
    ...player,
    submissions: {
      ...player.submissions,
      council: {
        ...player.submissions.council,
        accusation:
          order.type === 'ACCUSE'
            ? { ...order, voterIds: [...order.voterIds] }
            : { ...order },
      },
    },
  }));
  return resolveCouncilWhenReady(next);
}

function validateCouncilAccusation(
  state: GameState,
  playerId: PlayerId,
  order: CouncilOrder
): void {
  if (order.type === 'PASS') return;

  const target = getOpponentLivingCard(
    state,
    playerId,
    order.targetId,
    'Council target'
  );
  if (target.state.visibility === 'REVEALED') {
    if (order.guessedRole !== null) {
      throw new RuleValidationError('Target đã lộ không cần guessedRole.');
    }
  } else {
    if (order.guessedRole === null) {
      throw new RuleValidationError('Target còn ẩn cần guessedRole.');
    }
    if (!availableCouncilRoleGuesses(state, target.owner).includes(order.guessedRole)) {
      throw new RuleValidationError('Role này không còn trong các khả năng chưa lộ.');
    }
  }

  if (order.voterIds.length !== 3 || new Set(order.voterIds).size !== 3) {
    throw new RuleValidationError('Council cần đúng ba voter khác nhau.');
  }
  for (const voterId of order.voterIds) {
    const voter = getOwnedLivingCard(state, playerId, voterId, 'Council voter');
    if (getRoleDefinition(voter.role.id).faction !== Faction.VILLAGE) {
      throw new RuleValidationError(`${voter.id} không thuộc phe Dân.`);
    }
    if (hasCardEffect(voter, CardEffectKind.COUNCIL_LOCK)) {
      throw new RuleValidationError(`${voter.id} đang bị khóa Council.`);
    }
    if (hasCardEffect(voter, CardEffectKind.PURGE_LOCK)) {
      throw new RuleValidationError(
        `${voter.id} đang bị Khóa mạch và không thể tham gia Council.`
      );
    }
  }
}

function availableCouncilRoleGuesses(
  state: GameState,
  targetPlayerId: PlayerId
): readonly CardRole[] {
  const remaining = new Map<CardRole, number>();
  for (const role of STANDARD_DECK) {
    remaining.set(role, (remaining.get(role) ?? 0) + 1);
  }
  for (const card of state.players[targetPlayerId].board) {
    if (card.state.visibility !== 'REVEALED') continue;
    remaining.set(card.role.id, Math.max(0, (remaining.get(card.role.id) ?? 0) - 1));
  }
  return Object.values(CardRole).filter((role) => (remaining.get(role) ?? 0) > 0);
}

function submitCouncilReaction(
  state: GameState,
  playerId: PlayerId,
  order: CouncilReactionOrder
): GameState {
  assertPhase(state, 'COUNCIL_PLAN');
  assertSubmissionOpen(
    state.players[playerId].submissions.council.reaction,
    'Council Reaction',
    playerId
  );
  validateCouncilReaction(state, playerId, order);

  const next = updatePlayer(state, playerId, (player) => ({
    ...player,
    submissions: {
      ...player.submissions,
      council: {
        ...player.submissions.council,
        reaction: { ...order },
      },
    },
  }));
  return resolveCouncilWhenReady(next);
}

function validateCouncilReaction(
  state: GameState,
  playerId: PlayerId,
  order: CouncilReactionOrder
): void {
  if (order.type === 'PASS') return;
  const source = getOwnedLivingCard(state, playerId, order.sourceId, 'Wolf Guard source');
  getOwnedLivingCard(state, playerId, order.targetId, 'Wolf Guard target');
  requireAvailableAbility(source, AbilityId.WOLF_GUARD_RESCUE);
}

function resolveCouncilWhenReady(state: GameState): GameState {
  if (!allCouncilSlotsSubmitted(state)) return state;
  return resolveCouncil(
    transitionGameState(state, { type: 'COUNCIL_ORDERS_LOCKED' })
  );
}

function allCouncilSlotsSubmitted(state: GameState): boolean {
  return PLAYER_ORDER.every((playerId) => {
    const council = state.players[playerId].submissions.council;
    return council.accusation !== null && council.reaction !== null;
  });
}

function resolveCouncil(state: GameState): GameState {
  const accusationOrders = snapshotCouncilOrders(state, 'accusation');
  const reactionOrders = snapshotCouncilOrders(state, 'reaction');
  const initialCards = new Map<CardId, GameCard>();
  for (const playerId of PLAYER_ORDER) {
    for (const card of state.players[playerId].board) initialCards.set(card.id, card);
  }

  const events: GameEventDraft[] = [];
  const pendingDeaths = new Map<CardId, CardEliminationCause>();
  const failedVoters: Array<{
    readonly playerId: PlayerId;
    readonly voterIds: readonly [CardId, CardId, CardId];
  }> = [];
  const successfulTargets = new Map<PlayerId, CardId>();
  let next = state;

  for (const playerId of PLAYER_ORDER) {
    const accusation = accusationOrders[playerId];
    if (accusation.type === 'PASS') continue;

    for (const voterId of accusation.voterIds) {
      const voter = getCard(next, voterId);
      if (voter.state.visibility === 'HIDDEN') {
        next = replaceCard(next, transitionCard(voter, { type: 'REVEAL' }));
        events.push({
          type: 'CARD_REVEALED',
          visibility: { type: 'PUBLIC' },
          cardId: voter.id,
        });
      }
    }

    const originalTarget = initialCards.get(accusation.targetId);
    if (!originalTarget) throw new Error(`Thiếu Council target ${accusation.targetId}.`);
    const votePower = accusation.voterIds.reduce((total, voterId) => {
      const voter = initialCards.get(voterId);
      return total + (voter?.role.id === CardRole.VILLAGER ? 2 : 1);
    }, 0);
    const correct =
      votePower >= 3 &&
      isCardAlive(originalTarget) &&
      (originalTarget.state.visibility === 'REVEALED' ||
        originalTarget.role.id === accusation.guessedRole);

    if (correct) {
      successfulTargets.set(playerId, originalTarget.id);
    } else {
      failedVoters.push({ playerId, voterIds: accusation.voterIds });
      events.push({
        type: 'COUNCIL_FAILED',
        visibility: { type: 'PUBLIC' },
        playerId,
        voterIds: accusation.voterIds,
      });
    }
  }

  next = clearExpiredCouncilLocks(next);

  for (const failure of failedVoters) {
    for (const voterId of failure.voterIds) {
      const voter = getCard(next, voterId);
      if (!isCardAlive(voter)) continue;
      const lock: CardEffectState = {
        id: `council-lock:${failure.playerId}:${voter.id}:round:${next.round}`,
        kind: CardEffectKind.COUNCIL_LOCK,
        source: { type: 'RULE', rule: CardEffectRule.FAILED_COUNCIL },
        appliedRound: next.round,
        expires: {
          type: 'AFTER_PHASE',
          phase: 'COUNCIL_RESOLUTION',
          round: next.round + 1,
        },
      };
      next = replaceCard(next, transitionCard(voter, { type: 'APPLY_EFFECT', effect: lock }));
      events.push({
        type: 'EFFECT_APPLIED',
        visibility: { type: 'PUBLIC' },
        targetCardId: voter.id,
        effectKind: CardEffectKind.COUNCIL_LOCK,
      });
    }
  }

  for (const [accuserId, targetId] of successfulTargets) {
    const defenderId = getCard(next, targetId).owner;
    const reaction = reactionOrders[defenderId];
    if (reaction.type === 'WOLF_GUARD_RESCUE' && reaction.targetId === targetId) {
      let source = getCard(next, reaction.sourceId);
      if (source.state.visibility === 'HIDDEN') {
        source = transitionCard(source, { type: 'REVEAL' });
        events.push({
          type: 'CARD_REVEALED',
          visibility: { type: 'PUBLIC' },
          cardId: source.id,
        });
      }
      source = {
        ...source,
        role: transitionRole(source.role, {
          type: 'ABILITY_USED',
          abilityId: AbilityId.WOLF_GUARD_RESCUE,
          targetId,
          round: next.round,
        }),
      };
      next = replaceCard(next, source);
      events.push({
        type: 'WOLF_GUARD_RESCUED',
        visibility: { type: 'PUBLIC' },
        sourceCardId: source.id,
        targetCardId: targetId,
      });
      continue;
    }
    pendingDeaths.set(targetId, { type: 'COUNCIL', playerId: accuserId });
  }

  const eliminatedIds: CardId[] = [];
  for (const [targetId, cause] of pendingDeaths) {
    const eliminated = eliminateCard(next, targetId, true, cause, events);
    next = eliminated.state;
    eliminatedIds.push(...eliminated.eliminatedIds);
  }
  next = resolveRevengeChain(next, eliminatedIds, true, events);
  next = clearCouncilSubmissions(next);
  next = appendGameEvents(next, events);

  const result = getEliminationResult(next);
  if (result) return transitionGameState(next, { type: 'GAME_ENDED', result });
  if (hasFinalDuelBoard(next)) {
    return transitionGameState(next, { type: 'FINAL_DUEL_REQUIRED' });
  }
  return transitionGameState(next, { type: 'COUNCIL_RESOLVED' });
}

function snapshotCouncilOrders<TKey extends 'accusation' | 'reaction'>(
  state: GameState,
  key: TKey
): Record<PlayerId, NonNullable<PlayerState['submissions']['council'][TKey]>> {
  const orderA = state.players[PlayerId.PLAYER_A].submissions.council[key];
  const orderB = state.players[PlayerId.PLAYER_B].submissions.council[key];
  if (!orderA || !orderB) throw new Error(`Không đủ Council ${key} để resolve.`);
  return {
    [PlayerId.PLAYER_A]: orderA,
    [PlayerId.PLAYER_B]: orderB,
  } as Record<PlayerId, NonNullable<PlayerState['submissions']['council'][TKey]>>;
}

function clearExpiredCouncilLocks(state: GameState): GameState {
  let next = state;
  for (const playerId of PLAYER_ORDER) {
    for (const card of next.players[playerId].board) {
      let updated = card;
      for (const effect of card.effects) {
        if (
          effect.kind === CardEffectKind.COUNCIL_LOCK &&
          effect.expires.type === 'AFTER_PHASE' &&
          effect.expires.phase === 'COUNCIL_RESOLUTION' &&
          effect.expires.round <= state.round
        ) {
          updated = transitionCard(updated, { type: 'REMOVE_EFFECT', effectId: effect.id });
        }
      }
      if (updated !== card) next = replaceCard(next, updated);
    }
  }
  return next;
}

function clearCouncilSubmissions(state: GameState): GameState {
  let next = state;
  for (const playerId of PLAYER_ORDER) {
    next = updatePlayer(next, playerId, (player) => ({
      ...player,
      submissions: {
        ...player.submissions,
        council: { accusation: null, reaction: null },
      },
    }));
  }
  return next;
}

function submitPurgeOrder(
  state: GameState,
  playerId: PlayerId,
  order: PurgeOrder
): GameState {
  assertPhase(state, 'PURGE_PLAN');
  assertSubmissionOpen(state.players[playerId].submissions.purge, 'Purge', playerId);
  const expectedRule = getPurgeRule(state.round);
  if (order.rule !== expectedRule) {
    throw new RuleValidationError(
      `Vòng ${state.round} yêu cầu Purge rule ${expectedRule}, không phải ${order.rule}.`
    );
  }
  validatePurgeOrder(state, playerId, order);

  let next = updatePlayer(state, playerId, (player) => ({
    ...player,
    submissions: { ...player.submissions, purge: { ...order } },
  }));
  if (!bothPlayersSubmitted(next, 'purge')) return next;

  next = transitionGameState(next, { type: 'PURGE_ORDERS_LOCKED' });
  return resolvePurge(next);
}

function getPurgeRule(round: number): PurgeOrder['rule'] {
  if (round < 6) {
    throw new RuleValidationError('Purge chỉ mở từ Vòng 6.');
  }
  return (['CUT', 'SWAP', 'REVEAL', 'LOCK'] as const)[(round - 6) % 4];
}

function validatePurgeOrder(
  state: GameState,
  playerId: PlayerId,
  order: PurgeOrder
): void {
  if (order.rule === 'SWAP') {
    getOwnedLivingCard(state, playerId, order.ownTargetId, 'Purge own target');
    getOpponentLivingCard(
      state,
      playerId,
      order.opponentTargetId,
      'Purge opponent target'
    );
    return;
  }

  if (order.rule === 'REVEAL' && order.targetId === null) {
    const hasHiddenLivingCard = state.players[playerId].board.some(
      (card) => isCardAlive(card) && card.state.visibility === 'HIDDEN'
    );
    if (hasHiddenLivingCard) {
      throw new RuleValidationError('Purge REVEAL cần chọn một card sống còn ẩn.');
    }
    return;
  }

  if (order.targetId === null) {
    throw new RuleValidationError(`Purge ${order.rule} cần target.`);
  }
  const target = getOwnedLivingCard(state, playerId, order.targetId, 'Purge target');
  if (order.rule === 'REVEAL' && target.state.visibility === 'REVEALED') {
    throw new RuleValidationError('Purge REVEAL cần một card đang ẩn.');
  }
}

function resolvePurge(state: GameState): GameState {
  const orders = snapshotOrders(state, 'purge');
  const events: GameEventDraft[] = [];
  let next = state;

  if (orders[PlayerId.PLAYER_A].rule === 'SWAP') {
    const swapOrders = PLAYER_ORDER.map((playerId) => orders[playerId]).filter(
      (order): order is Extract<PurgeOrder, { rule: 'SWAP' }> => order.rule === 'SWAP'
    );
    const selectedIds = swapOrders.flatMap((order) => [
      order.ownTargetId,
      order.opponentTargetId,
    ]);
    if (swapOrders.length !== 2 || new Set(selectedIds).size !== selectedIds.length) {
      throw new RuleValidationError(
        'Purge SWAP bị trùng vị trí; mỗi card chỉ được tham gia một lần.'
      );
    }

    const snapshot = new Map<CardId, GameCard>();
    for (const playerId of PLAYER_ORDER) {
      for (const card of state.players[playerId].board) snapshot.set(card.id, card);
    }
    const replacements = new Map<CardId, GameCard>();
    for (const playerId of PLAYER_ORDER) {
      const order = orders[playerId];
      if (order.rule !== 'SWAP') throw new Error('Purge SWAP snapshot không đồng nhất.');
      const ownSlot = snapshot.get(order.ownTargetId);
      const opponentSlot = snapshot.get(order.opponentTargetId);
      if (!ownSlot || !opponentSlot) throw new Error('Thiếu card trong Purge SWAP snapshot.');
      replacements.set(ownSlot.id, moveCardRuntimeToSlot(opponentSlot, ownSlot));
      replacements.set(opponentSlot.id, moveCardRuntimeToSlot(ownSlot, opponentSlot));
      events.push({
        type: 'PURGE_RESOLVED',
        visibility: { type: 'PUBLIC' },
        playerId,
        rule: order.rule,
        targetCardId: order.ownTargetId,
        swapTargetCardId: order.opponentTargetId,
      });
    }
    for (const replacement of replacements.values()) {
      next = replaceCard(next, replacement);
    }
  } else {
    const pendingCuts: CardId[] = [];
    for (const playerId of PLAYER_ORDER) {
      const order = orders[playerId];
      if (order.rule === 'SWAP') throw new Error('Purge rule snapshot không đồng nhất.');
      events.push({
        type: 'PURGE_RESOLVED',
        visibility: { type: 'PUBLIC' },
        playerId,
        rule: order.rule,
        targetCardId: order.targetId,
        swapTargetCardId: null,
      });
      if (order.targetId === null) continue;

      if (order.rule === 'CUT') {
        pendingCuts.push(order.targetId);
      } else if (order.rule === 'REVEAL') {
        const target = getCard(next, order.targetId);
        next = replaceCard(next, transitionCard(target, { type: 'REVEAL' }));
        events.push({
          type: 'CARD_REVEALED',
          visibility: { type: 'PUBLIC' },
          cardId: target.id,
        });
      } else {
        const target = getCard(next, order.targetId);
        const lock: CardEffectState = {
          id: `purge-lock:${playerId}:${target.id}:round:${next.round}`,
          kind: CardEffectKind.PURGE_LOCK,
          source: { type: 'RULE', rule: CardEffectRule.PURGE_LOCK },
          appliedRound: next.round,
          expires: {
            type: 'AFTER_PHASE',
            phase: 'NIGHT_RESOLUTION',
            round: next.round,
          },
        };
        next = replaceCard(
          next,
          transitionCard(target, { type: 'APPLY_EFFECT', effect: lock })
        );
        events.push({
          type: 'EFFECT_APPLIED',
          visibility: { type: 'PUBLIC' },
          targetCardId: target.id,
          effectKind: CardEffectKind.PURGE_LOCK,
        });
      }
    }

    const eliminatedIds: CardId[] = [];
    for (const targetId of pendingCuts) {
      const eliminated = eliminateCard(
        next,
        targetId,
        true,
        { type: 'PURGE', rule: 'CUT' },
        events
      );
      next = eliminated.state;
      eliminatedIds.push(...eliminated.eliminatedIds);
    }
    next = resolveRevengeChain(next, eliminatedIds, true, events);
  }

  next = clearSubmission(next, 'purge');
  next = appendGameEvents(next, events);
  const result = getEliminationResult(next);
  if (result) return transitionGameState(next, { type: 'GAME_ENDED', result });
  if (hasFinalDuelBoard(next)) {
    return transitionGameState(next, { type: 'FINAL_DUEL_REQUIRED' });
  }
  return transitionGameState(next, { type: 'PURGE_RESOLVED' });
}

function moveCardRuntimeToSlot(source: GameCard, slot: GameCard): GameCard {
  return {
    ...source,
    id: slot.id,
    position: slot.position,
    owner: slot.owner,
  };
}

function submitNightOrder(
  state: GameState,
  playerId: PlayerId,
  order: NightOrder
): GameState {
  assertPhase(state, 'NIGHT_PLAN');
  assertSubmissionOpen(state.players[playerId].submissions.night, 'Night', playerId);
  validateNightOrder(state, playerId, order);

  const next = updatePlayer(state, playerId, (player) => ({
    ...player,
    submissions: { ...player.submissions, night: { ...order } },
  }));
  return bothPlayersSubmitted(next, 'night')
    ? transitionGameState(next, { type: 'NIGHT_ORDERS_LOCKED' })
    : next;
}

function validateNightOrder(state: GameState, playerId: PlayerId, order: NightOrder): void {
  if (order.type === 'PASS') return;
  if (order.type === 'BLOOD_MOON') {
    const ability = state.players[playerId].specialAbilities.find(
      (candidate) => candidate.abilityId === PlayerSpecialAbilityId.BLOOD_MOON
    );
    if (!ability) {
      throw new RuleValidationError(`${playerId} không sở hữu Blood Moon.`);
    }
    if (state.round < ability.unlockRound) {
      throw new RuleValidationError(
        `Blood Moon chỉ mở từ Vòng ${ability.unlockRound}.`
      );
    }
    if (state.round < ability.readyRound) {
      throw new RuleValidationError(
        `Blood Moon hồi lại ở Vòng ${ability.readyRound}.`
      );
    }
    const target = getOpponentLivingCard(
      state,
      playerId,
      order.targetId,
      'Blood Moon target'
    );
    if (target.state.visibility !== 'REVEALED') {
      throw new RuleValidationError('Blood Moon chỉ đánh được role đã lộ.');
    }
    return;
  }

  const source = getOwnedLivingCard(state, playerId, order.sourceId, 'Night source');
  const target = getOpponentLivingCard(state, playerId, order.targetId, 'Night target');
  assertCardAbilitySourceAvailable(source);
  const ability = getRoleAbility(source.role, order.abilityId);
  if (!ability) {
    throw new RuleValidationError(`${source.id} không sở hữu ${order.abilityId}.`);
  }
  if ('remainingUses' in ability && ability.remainingUses < 1) {
    throw new RuleValidationError(`${order.abilityId} đã hết lượt sử dụng.`);
  }

  if (order.abilityId === AbilityId.SEER_INSPECT) {
    const known = state.players[playerId].privateIntel.find(
      (intel) => intel.targetCardId === target.id
    );
    if (known && getRoleDefinition(known.discoveredRole).faction !== Faction.WEREWOLF) {
      throw new RuleValidationError('Không thể soi lại target phe sáng đã biết.');
    }
  }
}

function submitDefenseOrder(
  state: GameState,
  playerId: PlayerId,
  order: DefenseOrder
): GameState {
  assertPhase(state, 'DUSK_DEFENSE');
  assertSubmissionOpen(state.players[playerId].submissions.defense, 'Defense', playerId);
  validateDefenseOrder(state, playerId, order);

  let next = updatePlayer(state, playerId, (player) => ({
    ...player,
    submissions: { ...player.submissions, defense: { ...order } },
  }));
  if (!bothPlayersSubmitted(next, 'defense')) return next;

  next = transitionGameState(next, { type: 'DEFENSE_ORDERS_LOCKED' });
  return resolveNight(next);
}

function validateDefenseOrder(
  state: GameState,
  playerId: PlayerId,
  order: DefenseOrder
): void {
  if (order.type === 'PASS') return;
  const source = getOwnedLivingCard(state, playerId, order.sourceId, 'Guard source');
  const target = getOwnedLivingCard(state, playerId, order.targetId, 'Guard target');
  assertCardAbilitySourceAvailable(source);
  const guard = getRoleAbility(source.role, AbilityId.GUARD_PROTECT);
  if (!guard) throw new RuleValidationError(`${source.id} không phải Guard hợp lệ.`);
  if (source.id === target.id) {
    throw new RuleValidationError('Guard không được tự bảo vệ.');
  }
  if (
    guard.lastTarget?.cardId === target.id &&
    guard.lastTarget.round >= state.round - 1
  ) {
    throw new RuleValidationError('Không được bảo vệ cùng target ở hai vòng liên tiếp.');
  }
}

function resolveNight(state: GameState): GameState {
  const nightOrders = snapshotOrders(state, 'night');
  const defenseOrders = snapshotOrders(state, 'defense');
  const events: GameEventDraft[] = [];
  const pendingDeaths = new Map<CardId, CardEliminationCause>();
  let next = state;

  for (const playerId of PLAYER_ORDER) {
    const defense = defenseOrders[playerId];
    if (defense.type !== 'PROTECT') continue;
    const source = getCard(next, defense.sourceId);
    const target = getCard(next, defense.targetId);
    const updatedSource = {
      ...source,
      role: transitionRole(source.role, {
        type: 'ABILITY_USED',
        abilityId: AbilityId.GUARD_PROTECT,
        targetId: target.id,
        round: next.round,
      }),
    };
    next = replaceCard(next, updatedSource);

    const protection: CardEffectState = {
      id: `protection:${playerId}:${source.id}:${target.id}:round:${next.round}`,
      kind: CardEffectKind.PROTECTION,
      source: {
        type: 'ABILITY',
        abilityId: AbilityId.GUARD_PROTECT,
        cardId: source.id,
        playerId,
      },
      appliedRound: next.round,
      expires: {
        type: 'AFTER_PHASE',
        phase: 'NIGHT_RESOLUTION',
        round: next.round,
      },
    };
    next = replaceCard(next, transitionCard(target, { type: 'APPLY_EFFECT', effect: protection }));
    events.push({
      type: 'EFFECT_APPLIED',
      visibility: { type: 'PUBLIC' },
      targetCardId: target.id,
      effectKind: CardEffectKind.PROTECTION,
    });
  }

  for (const playerId of PLAYER_ORDER) {
    const order = nightOrders[playerId];
    if (order.type === 'PASS') continue;
    if (order.type === 'BLOOD_MOON') {
      const ability = next.players[playerId].specialAbilities.find(
        (candidate) => candidate.abilityId === PlayerSpecialAbilityId.BLOOD_MOON
      );
      if (!ability) throw new Error(`${playerId} thiếu Blood Moon khi resolve.`);
      const target = getCard(next, order.targetId);
      next = updatePlayer(next, playerId, (player) => ({
        ...player,
        specialAbilities: player.specialAbilities.map((candidate) =>
          candidate.abilityId === PlayerSpecialAbilityId.BLOOD_MOON
            ? {
                ...candidate,
                readyRound: state.round + candidate.cooldownRounds,
              }
            : candidate
        ),
      }));
      events.push({
        type: 'ABILITY_RESOLVED',
        visibility: { type: 'PUBLIC' },
        abilityId: PlayerSpecialAbilityId.BLOOD_MOON,
        sourceCardId: null,
        targetCardId: target.id,
      });
      if (hasCardEffect(target, CardEffectKind.PROTECTION)) {
        events.push({
          type: 'EFFECT_BLOCKED',
          visibility: { type: 'PUBLIC' },
          targetCardId: target.id,
          effectKind: CardEffectKind.PROTECTION,
        });
      } else {
        pendingDeaths.set(target.id, {
          type: 'PLAYER_ABILITY',
          abilityId: PlayerSpecialAbilityId.BLOOD_MOON,
          playerId,
        });
      }
      continue;
    }

    let source = getCard(next, order.sourceId);
    const target = getCard(next, order.targetId);
    if (source.state.visibility === 'HIDDEN') {
      source = transitionCard(source, { type: 'REVEAL' });
      next = replaceCard(next, source);
      events.push({
        type: 'CARD_REVEALED',
        visibility: { type: 'PUBLIC' },
        cardId: source.id,
      });
    }

    source = {
      ...source,
      role: transitionRole(source.role, {
        type: 'ABILITY_USED',
        abilityId: order.abilityId,
        targetId: target.id,
        round: next.round,
      }),
    };
    next = replaceCard(next, source);

    if (order.abilityId === AbilityId.SEER_INSPECT) {
      const known = next.players[playerId].privateIntel.find(
        (intel) => intel.targetCardId === target.id
      );
      events.push({
        type: 'ABILITY_RESOLVED',
        visibility: { type: 'PRIVATE', playerId },
        abilityId: order.abilityId,
        sourceCardId: source.id,
        targetCardId: target.id,
      });
      if (known) {
        pendingDeaths.set(target.id, {
          type: 'ABILITY',
          abilityId: order.abilityId,
          sourceCardId: source.id,
        });
      } else {
        const intel = {
          id: `intel:${playerId}:${source.id}:${target.id}:round:${next.round}`,
          sourceAbilityId: AbilityId.SEER_INSPECT as const,
          sourceCardId: source.id,
          targetCardId: target.id,
          discoveredRole: target.role.id,
          discoveredRound: next.round,
        };
        next = updatePlayer(next, playerId, (player) => ({
          ...player,
          privateIntel: [...player.privateIntel, intel],
        }));
        events.push({
          type: 'PRIVATE_INSPECTION_RESULT',
          visibility: { type: 'PRIVATE', playerId },
          intelId: intel.id,
          targetCardId: target.id,
          discoveredRole: target.role.id,
        });
      }
      continue;
    }

    events.push({
      type: 'ABILITY_RESOLVED',
      visibility: { type: 'PUBLIC' },
      abilityId: order.abilityId,
      sourceCardId: source.id,
      targetCardId: target.id,
    });
    if (hasCardEffect(target, CardEffectKind.PROTECTION)) {
      events.push({
        type: 'EFFECT_BLOCKED',
        visibility: { type: 'PUBLIC' },
        targetCardId: target.id,
        effectKind: CardEffectKind.PROTECTION,
      });
    } else {
      pendingDeaths.set(target.id, {
        type: 'ABILITY',
        abilityId: order.abilityId,
        sourceCardId: source.id,
      });
    }
  }

  const nightEliminatedIds: CardId[] = [];
  for (const [cardId, cause] of pendingDeaths) {
    const eliminated = eliminateCard(next, cardId, false, cause, events);
    next = eliminated.state;
    nightEliminatedIds.push(...eliminated.eliminatedIds);
  }
  next = resolveRevengeChain(next, nightEliminatedIds, false, events);

  next = clearNightEffects(next);
  next = clearSubmission(clearSubmission(next, 'night'), 'defense');
  next = appendGameEvents(next, events);
  next = transitionGameState(next, { type: 'NIGHT_RESOLVED' });
  next = appendGameEvents(next, [
    {
      type: 'DAWN_PRESENTATION_COMPLETED',
      visibility: { type: 'PUBLIC' },
    },
  ]);

  const result = getEliminationResult(next);
  if (result) return transitionGameState(next, { type: 'GAME_ENDED', result });
  if (hasFinalDuelBoard(next)) {
    return transitionGameState(next, { type: 'FINAL_DUEL_REQUIRED' });
  }

  return transitionGameState(next, { type: 'DAWN_COMPLETED' });
}

function clearNightEffects(state: GameState): GameState {
  let next = state;
  for (const playerId of PLAYER_ORDER) {
    for (const card of next.players[playerId].board) {
      let updated = card;
      for (const effect of card.effects) {
        if (
          effect.kind === CardEffectKind.PROTECTION ||
          effect.kind === CardEffectKind.REVENGE_MARK ||
          effect.kind === CardEffectKind.PURGE_LOCK
        ) {
          updated = transitionCard(updated, { type: 'REMOVE_EFFECT', effectId: effect.id });
        }
      }
      if (updated !== card) next = replaceCard(next, updated);
    }
  }
  return next;
}

function getEliminationResult(state: GameState) {
  const aliveA = livingCount(state.players[PlayerId.PLAYER_A]);
  const aliveB = livingCount(state.players[PlayerId.PLAYER_B]);
  if (aliveA > 0 && aliveB > 0) return null;
  return {
    winner:
      aliveA === aliveB
        ? null
        : aliveA > 0
          ? PlayerId.PLAYER_A
          : PlayerId.PLAYER_B,
    reason: WinReason.ELIMINATION,
  };
}

function hasFinalDuelBoard(state: GameState): boolean {
  return (
    livingCount(state.players[PlayerId.PLAYER_A]) === 1 &&
    livingCount(state.players[PlayerId.PLAYER_B]) === 1
  );
}

function livingCount(player: PlayerState): number {
  return player.board.filter(isCardAlive).length;
}

const PLAYER_ORDER = [PlayerId.PLAYER_A, PlayerId.PLAYER_B] as const;

type SubmissionKey = 'night' | 'defense' | 'purge';

function bothPlayersSubmitted(state: GameState, key: SubmissionKey): boolean {
  return PLAYER_ORDER.every((playerId) => state.players[playerId].submissions[key] !== null);
}

function snapshotOrders<TKey extends SubmissionKey>(state: GameState, key: TKey) {
  const orderA = state.players[PlayerId.PLAYER_A].submissions[key];
  const orderB = state.players[PlayerId.PLAYER_B].submissions[key];
  if (!orderA || !orderB) throw new Error(`Không đủ ${key} submission để resolve.`);
  return {
    [PlayerId.PLAYER_A]: orderA,
    [PlayerId.PLAYER_B]: orderB,
  } as Record<PlayerId, NonNullable<PlayerState['submissions'][TKey]>>;
}

function clearSubmission(state: GameState, key: SubmissionKey): GameState {
  let next = state;
  for (const playerId of PLAYER_ORDER) {
    next = updatePlayer(next, playerId, (player) => ({
      ...player,
      submissions: { ...player.submissions, [key]: null },
    }));
  }
  return next;
}

function assertPhase(state: GameState, phase: GameState['phase']['type']): void {
  if (state.phase.type !== phase) {
    throw new RuleValidationError(`Action yêu cầu phase ${phase}, hiện tại là ${state.phase.type}.`);
  }
}

function assertSubmissionOpen(
  submission: unknown,
  label: string,
  playerId: PlayerId
): void {
  if (submission !== null) {
    throw new RuleValidationError(`${playerId} đã khóa ${label} Order.`);
  }
}

function assertCardAbilitySourceAvailable(source: GameCard): void {
  if (hasCardEffect(source, CardEffectKind.PURGE_LOCK)) {
    throw new RuleValidationError(
      `${source.id} đang bị Khóa mạch và không thể dùng ability trong vòng này.`
    );
  }
}

function getOwnedLivingCard(
  state: GameState,
  playerId: PlayerId,
  cardId: CardId,
  label: string
): GameCard {
  const card = getCard(state, cardId);
  if (card.owner !== playerId || !isCardAlive(card)) {
    throw new RuleValidationError(`${label} ${cardId} không hợp lệ.`);
  }
  return card;
}

function getOwnedCard(
  state: GameState,
  playerId: PlayerId,
  cardId: CardId,
  label: string
): GameCard {
  const card = getCard(state, cardId);
  if (card.owner !== playerId) {
    throw new RuleValidationError(`${label} ${cardId} không hợp lệ.`);
  }
  return card;
}

function getOpponentLivingCard(
  state: GameState,
  playerId: PlayerId,
  cardId: CardId,
  label: string
): GameCard {
  const card = getCard(state, cardId);
  if (card.owner === playerId || !isCardAlive(card)) {
    throw new RuleValidationError(`${label} ${cardId} không hợp lệ.`);
  }
  return card;
}

function getCard(state: GameState, cardId: CardId): GameCard {
  for (const playerId of PLAYER_ORDER) {
    const card = state.players[playerId].board.find((candidate) => candidate.id === cardId);
    if (card) return card;
  }
  throw new RuleValidationError(`Không tìm thấy card ${cardId}.`);
}

function replaceCard(state: GameState, card: GameCard): GameState {
  return updatePlayer(state, card.owner, (player) => replacePlayerCard(player, card));
}

function updatePlayer(
  state: GameState,
  playerId: PlayerId,
  update: (player: PlayerState) => PlayerState
): GameState {
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: update(state.players[playerId]),
    },
  };
}
