import {
  AbilityId,
  CardRole,
  Faction,
  PlayerId,
  WinReason,
  type DayAction,
  type PlayerGameAction,
} from '@twofold/shared-types';
import {
  CardEffectKind,
  CardEffectRule,
  type CardEffectState,
  type CardId,
  type CardInstanceId,
  type GameCard,
  hasCardEffect,
  isCardAlive,
  transitionCard,
} from './cards';
import { appendGameEvents, type CardEliminationCause, type GameEventDraft } from './game-events';
import {
  FinalDuelResultReason,
  type GameState,
  transitionGameState,
} from './game-state';
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

/** Action DTO được suy ra từ authoritative schema trong `shared-types`. */
export type { DayAction, PlayerGameAction } from '@twofold/shared-types';

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
    case 'SETUP_REORDER':
      return reorderSetupBoard(state, action.playerId, action.order);

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

    case 'FINAL_GUESS_SUBMIT':
      return submitFinalGuess(state, action.playerId, action.guess);
  }
}

function reorderSetupBoard(
  state: GameState,
  playerId: PlayerId,
  order: Extract<PlayerGameAction, { readonly type: 'SETUP_REORDER' }>['order']
): GameState {
  assertPhase(state, 'SETUP');
  const player = state.players[playerId];
  if (player.setup.status !== 'ARRANGING') {
    throw new RuleValidationError(`${playerId} đã khóa Setup.`);
  }

  const currentIds = player.board.map((card) => card.occupant.id);
  if (
    order.length !== currentIds.length ||
    new Set(order).size !== currentIds.length ||
    order.some((instanceId) => !currentIds.includes(instanceId))
  ) {
    throw new RuleValidationError(
      'Setup order phải chứa đúng toàn bộ card instance hiện có, không trùng lặp.'
    );
  }

  const occupants = new Map(
    player.board.map((card) => [card.occupant.id, card.occupant] as const)
  );
  return updatePlayer(state, playerId, (current) => ({
    ...current,
    board: current.board.map((slot, index) => ({
      ...slot,
      occupant: occupants.get(order[index])!,
    })),
  }));
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
      if (target.occupant.state.visibility !== 'REVEALED') {
        throw new RuleValidationError('Shooter chỉ bắn được target đã lộ.');
      }
      if (
        opponent.board.filter(
          (card) => card.occupant.state.visibility === 'REVEALED'
        ).length < 2
      ) {
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
        events,
        true
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
      next = removeExistingRevengeMark(
        resolvedSource.state,
        source.occupant.id
      );
      const currentTarget = getCard(next, target.id);
      const mark: CardEffectState = {
        id: `revenge:${playerId}:${source.id}:${target.id}:round:${next.round}`,
        kind: CardEffectKind.REVENGE_MARK,
        source: {
          type: 'ABILITY',
          abilityId: AbilityId.AVENGER_MARK,
          instanceId: source.occupant.id,
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
        getRoleDefinition(target.occupant.role.id).faction === Faction.WEREWOLF;
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
  const ability = getRoleAbility(source.occupant.role, abilityId);
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
  events: GameEventDraft[],
  revealSource = true
): { readonly state: GameState; readonly source: GameCard } {
  let next = state;
  let updatedSource = getCard(next, source.id);
  if (revealSource && updatedSource.occupant.state.visibility === 'HIDDEN') {
    updatedSource = transitionCard(updatedSource, { type: 'REVEAL' });
    events.push({
      type: 'CARD_REVEALED',
      visibility: { type: 'PUBLIC' },
      cardId: source.id,
    });
  }
  updatedSource = {
    ...updatedSource,
    occupant: {
      ...updatedSource.occupant,
      role: transitionRole(updatedSource.occupant.role, {
        type: 'ABILITY_USED',
        abilityId,
        targetInstanceId: getCard(next, targetId).occupant.id,
        round: next.round,
      }),
    },
  };
  updatedSource = transitionCard(updatedSource, {
    type: 'APPLY_EFFECT',
    effect: {
      id: `round-exhausted:${source.occupant.id}:round:${next.round}`,
      kind: CardEffectKind.ROUND_EXHAUSTED,
      source: { type: 'RULE', rule: CardEffectRule.DAY_ABILITY_USED },
      appliedRound: next.round,
      expires: {
        type: 'AFTER_PHASE',
        phase: 'NIGHT_RESOLUTION',
        round: next.round,
      },
    },
  });
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
  if (revealOnDeath && card.occupant.state.visibility === 'HIDDEN') {
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
    if (!getRoleAbility(source.occupant.role, AbilityId.AVENGER_MARK)) continue;

    const markedTarget = findRevengeTarget(next, source.occupant.id);
    if (!markedTarget || !isCardAlive(markedTarget)) continue;
    if (hasCardEffect(markedTarget, CardEffectKind.PROTECTION)) {
      events.push({
        type: 'EFFECT_BLOCKED',
        visibility: { type: 'PUBLIC' },
        targetCardId: markedTarget.id,
        effectKind: CardEffectKind.PROTECTION,
      });
      continue;
    }
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

function findRevengeTarget(
  state: GameState,
  sourceInstanceId: CardInstanceId
): GameCard | null {
  for (const playerId of PLAYER_ORDER) {
    for (const card of state.players[playerId].board) {
      if (
        card.occupant.effects.some(
          (effect) =>
            effect.kind === CardEffectKind.REVENGE_MARK &&
            effect.source.type === 'ABILITY' &&
            effect.source.instanceId === sourceInstanceId
        )
      ) {
        return card;
      }
    }
  }
  return null;
}

function removeExistingRevengeMark(
  state: GameState,
  sourceInstanceId: CardInstanceId
): GameState {
  let next = state;
  for (const playerId of PLAYER_ORDER) {
    for (const card of next.players[playerId].board) {
      const marks = card.occupant.effects.filter(
        (effect) =>
          effect.kind === CardEffectKind.REVENGE_MARK &&
          effect.source.type === 'ABILITY' &&
          effect.source.instanceId === sourceInstanceId
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
  return PLAYER_ORDER.every(
    (candidate) => next.players[candidate].submissions.council.accusation !== null
  )
    ? prepareCouncilResolution(
        transitionGameState(next, { type: 'COUNCIL_ORDERS_LOCKED' })
      )
    : next;
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
  if (target.occupant.state.visibility === 'REVEALED') {
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

  if (
    order.voterIds.length < 1 ||
    order.voterIds.length > 3 ||
    new Set(order.voterIds).size !== order.voterIds.length
  ) {
    throw new RuleValidationError('Council cần từ một đến ba voter khác nhau.');
  }
  let votePower = 0;
  for (const voterId of order.voterIds) {
    const voter = getOwnedLivingCard(state, playerId, voterId, 'Council voter');
    if (getRoleDefinition(voter.occupant.role.id).faction !== Faction.VILLAGE) {
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
    if (hasCardEffect(voter, CardEffectKind.ROUND_EXHAUSTED)) {
      throw new RuleValidationError(
        `${voter.id} đã dùng kỹ năng trong vòng này nên không thể tham gia Council.`
      );
    }
    votePower += voter.occupant.role.id === CardRole.VILLAGER ? 2 : 1;
  }
  if (votePower < 3) {
    throw new RuleValidationError('Council cần tổng trọng số ít nhất ba phiếu.');
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
    if (card.occupant.state.visibility !== 'REVEALED') continue;
    remaining.set(
      card.occupant.role.id,
      Math.max(0, (remaining.get(card.occupant.role.id) ?? 0) - 1)
    );
  }
  return [...remaining.entries()]
    .filter(([, count]) => count > 0)
    .map(([role]) => role);
}

function submitCouncilReaction(
  state: GameState,
  playerId: PlayerId,
  order: CouncilReactionOrder
): GameState {
  assertPhase(state, 'COUNCIL_REACTION');
  const pendingTargetId = state.players[playerId].submissions.council.pendingTargetId;
  if (!pendingTargetId) {
    throw new RuleValidationError(`${playerId} không có án Treo cổ cần phản ứng.`);
  }
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
  return PLAYER_ORDER.every((candidate) => {
    const council = next.players[candidate].submissions.council;
    return council.pendingTargetId === null || council.reaction !== null;
  })
    ? resolveCouncilReactions(next)
    : next;
}

function validateCouncilReaction(
  state: GameState,
  playerId: PlayerId,
  order: CouncilReactionOrder
): void {
  if (order.type === 'PASS') return;
  const targetId = state.players[playerId].submissions.council.pendingTargetId;
  if (!targetId) throw new RuleValidationError('Không có target cần chết thay.');
  const source = getOwnedLivingCard(state, playerId, order.sourceId, 'Substitute source');
  if (source.id === targetId) {
    throw new RuleValidationError('Kẻ Thế Mạng không thể chết thay cho chính mình.');
  }
  const ability = getRoleAbility(
    source.occupant.role,
    AbilityId.SUBSTITUTE_SACRIFICE
  );
  if (!ability || ability.remainingUses < 1) {
    throw new RuleValidationError('Không còn Kẻ Thế Mạng hợp lệ.');
  }
}

function prepareCouncilResolution(state: GameState): GameState {
  const accusationOrders = snapshotCouncilOrders(state, 'accusation');
  const initialCards = new Map<CardId, GameCard>();
  for (const playerId of PLAYER_ORDER) {
    for (const card of state.players[playerId].board) initialCards.set(card.id, card);
  }

  const events: GameEventDraft[] = [];
  const failedVoters: Array<{
    readonly playerId: PlayerId;
    readonly voterIds: readonly CardId[];
  }> = [];
  let next = state;

  for (const playerId of PLAYER_ORDER) {
    const accusation = accusationOrders[playerId];
    if (accusation.type === 'PASS') {
      events.push({
        type: 'COUNCIL_PASSED',
        visibility: { type: 'PUBLIC' },
        playerId,
      });
      continue;
    }

    for (const voterId of accusation.voterIds) {
      const voter = getCard(next, voterId);
      if (voter.occupant.state.visibility === 'HIDDEN') {
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
      return total + (voter?.occupant.role.id === CardRole.VILLAGER ? 2 : 1);
    }, 0);
    const correct =
      votePower >= 3 &&
      isCardAlive(originalTarget) &&
      (originalTarget.occupant.state.visibility === 'REVEALED' ||
        originalTarget.occupant.role.id === accusation.guessedRole);

    events.push({
      type: 'COUNCIL_ACCUSATION_RESOLVED',
      visibility: { type: 'PUBLIC' },
      playerId,
      targetCardId: accusation.targetId,
      voterIds: accusation.voterIds,
      guessedRole: accusation.guessedRole,
      votePower,
      succeeded: correct,
    });
    if (correct) {
      const target = getCard(next, originalTarget.id);
      if (target.occupant.state.visibility === 'HIDDEN') {
        next = replaceCard(next, transitionCard(target, { type: 'REVEAL' }));
        events.push({
          type: 'CARD_REVEALED',
          visibility: { type: 'PUBLIC' },
          cardId: target.id,
        });
      }
      next = updatePlayer(next, originalTarget.owner, (player) => ({
        ...player,
        submissions: {
          ...player.submissions,
          council: {
            ...player.submissions.council,
            pendingTargetId: originalTarget.id,
          },
        },
      }));
    } else {
      failedVoters.push({ playerId, voterIds: accusation.voterIds });
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

  for (const playerId of PLAYER_ORDER) {
    if (next.players[playerId].submissions.council.pendingTargetId !== null) continue;
    next = updatePlayer(next, playerId, (player) => ({
      ...player,
      submissions: {
        ...player.submissions,
        council: { ...player.submissions.council, reaction: { type: 'PASS' } },
      },
    }));
  }
  next = appendGameEvents(next, events);

  const needsReaction = PLAYER_ORDER.some(
    (playerId) => next.players[playerId].submissions.council.pendingTargetId !== null
  );
  return needsReaction
    ? transitionGameState(next, { type: 'COUNCIL_REACTION_REQUIRED' })
    : finishCouncilResolution(next);
}

function resolveCouncilReactions(state: GameState): GameState {
  const events: GameEventDraft[] = [];
  const pendingDeaths = new Map<CardId, CardEliminationCause>();
  let next = state;

  for (const defenderId of PLAYER_ORDER) {
    const council = next.players[defenderId].submissions.council;
    const targetId = council.pendingTargetId;
    if (!targetId) continue;
    const reaction = council.reaction;
    if (!reaction) throw new Error(`Thiếu Council reaction của ${defenderId}.`);

    if (reaction.type === 'SUBSTITUTE_SACRIFICE') {
      let source = getCard(next, reaction.sourceId);
      if (source.occupant.state.visibility === 'HIDDEN') {
        source = transitionCard(source, { type: 'REVEAL' });
        events.push({
          type: 'CARD_REVEALED',
          visibility: { type: 'PUBLIC' },
          cardId: source.id,
        });
      }
      source = {
        ...source,
        occupant: {
          ...source.occupant,
          role: transitionRole(source.occupant.role, {
            type: 'ABILITY_USED',
            abilityId: AbilityId.SUBSTITUTE_SACRIFICE,
            targetInstanceId: getCard(next, targetId).occupant.id,
            round: next.round,
          }),
        },
      };
      next = replaceCard(next, source);
      events.push({
        type: 'SUBSTITUTE_SACRIFICED',
        visibility: { type: 'PUBLIC' },
        sourceCardId: source.id,
        targetCardId: targetId,
      });
      pendingDeaths.set(source.id, {
        type: 'COUNCIL',
        playerId: otherPlayer(defenderId),
      });
    } else {
      pendingDeaths.set(targetId, {
        type: 'COUNCIL',
        playerId: otherPlayer(defenderId),
      });
    }
  }

  const eliminatedIds: CardId[] = [];
  for (const [targetId, cause] of pendingDeaths) {
    const eliminated = eliminateCard(next, targetId, true, cause, events);
    next = eliminated.state;
    eliminatedIds.push(...eliminated.eliminatedIds);
  }
  next = resolveRevengeChain(next, eliminatedIds, true, events);
  next = appendGameEvents(next, events);
  return finishCouncilResolution(next);
}

function finishCouncilResolution(state: GameState): GameState {
  const next = clearCouncilSubmissions(state);

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
      for (const effect of card.occupant.effects) {
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
        council: { accusation: null, reaction: null, pendingTargetId: null },
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
    if (order.ownTargetId === null && order.opponentTargetId === null) {
      if (hasValidSwapOption(state, playerId)) {
        throw new RuleValidationError(
          'Purge SWAP vẫn còn cặp lá hợp lệ; không thể bỏ qua.'
        );
      }
      return;
    }
    if (order.ownTargetId === null || order.opponentTargetId === null) {
      throw new RuleValidationError(
        'Purge SWAP cần cả lá bên mình và lá đối thủ.'
      );
    }
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
      (card) =>
        isCardAlive(card) && card.occupant.state.visibility === 'HIDDEN'
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
  if (
    order.rule === 'REVEAL' &&
    target.occupant.state.visibility === 'REVEALED'
  ) {
    throw new RuleValidationError('Purge REVEAL cần một card đang ẩn.');
  }
}

/**
 * Kiểm tra còn tồn tại một cặp SWAP hợp lệ (không đụng vào cặp đối thủ đã
 * khóa, nếu có). Dùng để cho phép bỏ qua SWAP khi mọi cặp đều bị chọn trước.
 */
function hasValidSwapOption(state: GameState, playerId: PlayerId): boolean {
  const opponentId =
    playerId === PlayerId.PLAYER_A ? PlayerId.PLAYER_B : PlayerId.PLAYER_A;
  const submitted = state.players[opponentId].submissions.purge;
  const takenIds =
    submitted && submitted.rule === 'SWAP'
      ? new Set<CardId>(
          [submitted.ownTargetId, submitted.opponentTargetId].filter(
            (id): id is CardId => id !== null
          )
        )
      : null;
  const ownIds = state.players[playerId].board
    .filter(isCardAlive)
    .map((card) => card.id);
  const opponentIds = state.players[opponentId].board
    .filter(isCardAlive)
    .map((card) => card.id);
  for (const ownId of ownIds) {
    for (const opponentIdCandidate of opponentIds) {
      if (
        takenIds &&
        (takenIds.has(ownId) || takenIds.has(opponentIdCandidate))
      ) {
        continue;
      }
      return true;
    }
  }
  return false;
}

function resolvePurge(state: GameState): GameState {
  const orders = snapshotOrders(state, 'purge');
  const events: GameEventDraft[] = [];
  let next = state;

  if (orders[PlayerId.PLAYER_A].rule === 'SWAP') {
    const snapshot = new Map<CardId, GameCard>();
    for (const playerId of PLAYER_ORDER) {
      for (const card of state.players[playerId].board) snapshot.set(card.id, card);
    }
    const replacements = new Map<CardId, GameCard>();
    const selectedCardIds = PLAYER_ORDER.flatMap((playerId) => {
      const order = orders[playerId];
      if (order.rule !== 'SWAP') throw new Error('Purge SWAP snapshot không đồng nhất.');
      return [order.ownTargetId, order.opponentTargetId].filter(
        (cardId): cardId is CardId => cardId !== null
      );
    });
    const hasOverlappingSelection = new Set(selectedCardIds).size !== selectedCardIds.length;
    for (const playerId of PLAYER_ORDER) {
      const order = orders[playerId];
      if (order.rule !== 'SWAP') throw new Error('Purge SWAP snapshot không đồng nhất.');
      if (
        hasOverlappingSelection ||
        order.ownTargetId === null ||
        order.opponentTargetId === null
      ) {
        // Hai lệnh SWAP được phân giải như một batch. Nếu chúng chạm cùng
        // một slot thì cả batch fizzle để kết quả không phụ thuộc thứ tự player.
        events.push({
          type: 'PURGE_RESOLVED',
          visibility: { type: 'PUBLIC' },
          playerId,
          rule: 'SWAP',
          targetCardId: null,
          swapTargetCardId: null,
        });
        continue;
      }
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
    ...slot,
    occupant: source.occupant,
  };
}

function submitFinalGuess(
  state: GameState,
  playerId: PlayerId,
  guess: CardRole
): GameState {
  assertPhase(state, 'FINAL_DUEL');
  assertSubmissionOpen(
    state.players[playerId].submissions.finalGuess,
    'Final Duel Guess',
    playerId
  );
  if (!Object.values(CardRole).includes(guess)) {
    throw new RuleValidationError('Final Duel guess không phải role hợp lệ.');
  }
  if (!hasFinalDuelBoard(state)) {
    throw new RuleValidationError('Final Duel yêu cầu mỗi bên còn đúng một card sống.');
  }

  const next = updatePlayer(state, playerId, (player) => ({
    ...player,
    submissions: { ...player.submissions, finalGuess: guess },
  }));
  return bothPlayersSubmitted(next, 'finalGuess') ? resolveFinalDuel(next) : next;
}

function resolveFinalDuel(state: GameState): GameState {
  const guesses = snapshotOrders(state, 'finalGuess');
  const cardA = state.players[PlayerId.PLAYER_A].board.find(isCardAlive);
  const cardB = state.players[PlayerId.PLAYER_B].board.find(isCardAlive);
  if (!cardA || !cardB) throw new Error('Final Duel snapshot thiếu card sống.');

  const events: GameEventDraft[] = [];
  let next = state;
  for (const card of [cardA, cardB]) {
    if (card.occupant.state.visibility === 'REVEALED') continue;
    next = replaceCard(next, transitionCard(card, { type: 'REVEAL' }));
    events.push({
      type: 'CARD_REVEALED',
      visibility: { type: 'PUBLIC' },
      cardId: card.id,
    });
  }

  const correctA = guesses[PlayerId.PLAYER_A] === cardB.occupant.role.id;
  const correctB = guesses[PlayerId.PLAYER_B] === cardA.occupant.role.id;
  events.push({
    type: 'FINAL_DUEL_RESOLVED',
    visibility: { type: 'PUBLIC' },
    cardAId: cardA.id,
    cardBId: cardB.id,
    guessA: guesses[PlayerId.PLAYER_A],
    guessB: guesses[PlayerId.PLAYER_B],
    correctA,
    correctB,
  });

  next = clearSubmission(next, 'finalGuess');
  next = appendGameEvents(next, events);
  return transitionGameState(next, {
    type: 'GAME_ENDED',
    result: {
      winner:
        correctA === correctB
          ? null
          : correctA
            ? PlayerId.PLAYER_A
            : PlayerId.PLAYER_B,
      reason:
        correctA === correctB
          ? FinalDuelResultReason.DRAW
          : FinalDuelResultReason.VICTORY,
    },
  });
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
    if (target.occupant.state.visibility !== 'REVEALED') {
      throw new RuleValidationError('Blood Moon chỉ đánh được role đã lộ.');
    }
    return;
  }

  const source = getOwnedLivingCard(state, playerId, order.sourceId, 'Night source');
  const target = getOpponentLivingCard(state, playerId, order.targetId, 'Night target');
  assertCardAbilitySourceAvailable(source);
  const ability = getRoleAbility(source.occupant.role, order.abilityId);
  if (!ability) {
    throw new RuleValidationError(`${source.id} không sở hữu ${order.abilityId}.`);
  }
  if ('remainingUses' in ability && ability.remainingUses < 1) {
    throw new RuleValidationError(`${order.abilityId} đã hết lượt sử dụng.`);
  }

  if (order.abilityId === AbilityId.SEER_INSPECT) {
    const known = state.players[playerId].privateIntel.find(
      (intel) => intel.targetInstanceId === target.occupant.id
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
  const guard = getRoleAbility(source.occupant.role, AbilityId.GUARD_PROTECT);
  if (!guard) throw new RuleValidationError(`${source.id} không phải Guard hợp lệ.`);
  if (source.id === target.id) {
    throw new RuleValidationError('Guard không được tự bảo vệ.');
  }
  if (
    guard.lastTarget?.instanceId === target.occupant.id &&
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
    if (defense.type !== 'PROTECT') {
      events.push({
        type: 'DEFENSE_SKIPPED',
        visibility: { type: 'PRIVATE', playerId },
        playerId,
      });
      continue;
    }
    const source = getCard(next, defense.sourceId);
    const target = getCard(next, defense.targetId);
    const updatedSource = {
      ...source,
      occupant: {
        ...source.occupant,
        role: transitionRole(source.occupant.role, {
          type: 'ABILITY_USED',
          abilityId: AbilityId.GUARD_PROTECT,
          targetInstanceId: target.occupant.id,
          round: next.round,
        }),
      },
    };
    next = replaceCard(next, updatedSource);

    const protection: CardEffectState = {
      id: `protection:${playerId}:${source.id}:${target.id}:round:${next.round}`,
      kind: CardEffectKind.PROTECTION,
      source: {
        type: 'ABILITY',
        abilityId: AbilityId.GUARD_PROTECT,
        instanceId: source.occupant.id,
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
      type: 'ABILITY_RESOLVED',
      visibility: { type: 'PRIVATE', playerId },
      abilityId: AbilityId.GUARD_PROTECT,
      sourceCardId: source.id,
      targetCardId: target.id,
    });
    events.push({
      type: 'EFFECT_APPLIED',
      visibility: { type: 'PRIVATE', playerId },
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
        visibility: { type: 'PRIVATE', playerId },
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
        pendingDeaths.set(target.id, { type: 'HIDDEN_NIGHT' });
      }
      continue;
    }

    let source = getCard(next, order.sourceId);
    const target = getCard(next, order.targetId);
    const knownIntel =
      order.abilityId === AbilityId.SEER_INSPECT
        ? next.players[playerId].privateIntel.find(
            (intel) => intel.targetInstanceId === target.occupant.id
          )
        : undefined;
    const isSeerExecution =
      order.abilityId === AbilityId.SEER_INSPECT &&
      knownIntel !== undefined &&
      getRoleDefinition(knownIntel.discoveredRole).faction === Faction.WEREWOLF;
    if (isSeerExecution && source.occupant.state.visibility === 'HIDDEN') {
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
      occupant: {
        ...source.occupant,
        role: transitionRole(source.occupant.role, {
          type: 'ABILITY_USED',
          abilityId: order.abilityId,
          targetInstanceId: target.occupant.id,
          round: next.round,
        }),
      },
    };
    next = replaceCard(next, source);

    if (order.abilityId === AbilityId.SEER_INSPECT) {
      events.push({
        type: 'ABILITY_RESOLVED',
        visibility: { type: 'PRIVATE', playerId },
        abilityId: order.abilityId,
        sourceCardId: source.id,
        targetCardId: target.id,
      });
      if (knownIntel) {
        pendingDeaths.set(target.id, { type: 'HIDDEN_NIGHT' });
      } else {
        const intel = {
          id: `intel:${playerId}:${source.id}:${target.id}:round:${next.round}`,
          sourceAbilityId: AbilityId.SEER_INSPECT as const,
          sourceInstanceId: source.occupant.id,
          targetInstanceId: target.occupant.id,
          observedAtSlotId: target.id,
          discoveredRole: target.occupant.role.id,
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
          discoveredRole: target.occupant.role.id,
        });
      }
      continue;
    }

    events.push({
      type: 'ABILITY_RESOLVED',
      visibility: { type: 'PRIVATE', playerId },
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
      pendingDeaths.set(target.id, { type: 'HIDDEN_NIGHT' });
    }
  }

  const nightEliminatedIds: CardId[] = [];
  for (const [cardId] of pendingDeaths) {
    const eliminated = eliminateCard(
      next,
      cardId,
      false,
      { type: 'HIDDEN_NIGHT' },
      events
    );
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

  next = transitionGameState(next, { type: 'DAWN_COMPLETED' });
  if (hasFinalDuelBoard(next)) {
    return transitionGameState(next, { type: 'FINAL_DUEL_REQUIRED' });
  }

  return next;
}

function clearNightEffects(state: GameState): GameState {
  let next = state;
  for (const playerId of PLAYER_ORDER) {
    for (const card of next.players[playerId].board) {
      let updated = card;
      for (const effect of card.occupant.effects) {
        if (
          effect.kind === CardEffectKind.PROTECTION ||
          effect.kind === CardEffectKind.REVENGE_MARK ||
          effect.kind === CardEffectKind.PURGE_LOCK ||
          effect.kind === CardEffectKind.ROUND_EXHAUSTED
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

function otherPlayer(playerId: PlayerId): PlayerId {
  return playerId === PlayerId.PLAYER_A
    ? PlayerId.PLAYER_B
    : PlayerId.PLAYER_A;
}

type SubmissionKey = 'night' | 'defense' | 'purge' | 'finalGuess';

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
  if (hasCardEffect(source, CardEffectKind.ROUND_EXHAUSTED)) {
    throw new RuleValidationError(
      `${source.id} đã dùng kỹ năng trong vòng này và không thể hành động thêm.`
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
