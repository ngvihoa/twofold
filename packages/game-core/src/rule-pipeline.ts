import { AbilityId, Faction, PlayerId, WinReason } from '@twofold/shared-types';
import {
  CardEffectKind,
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
  type DefenseOrder,
  type NightOrder,
  type PlayerState,
  replacePlayerCard,
} from './players';
import { getRoleAbility, getRoleDefinition, transitionRole } from './roles';

/** Player action hiện đã được port vào validation/resolution pipeline. */
export type PlayerGameAction =
  | { readonly type: 'SETUP_LOCK'; readonly playerId: PlayerId }
  | { readonly type: 'DAY_PASS'; readonly playerId: PlayerId }
  | {
      readonly type: 'COUNCIL_SUBMIT';
      readonly playerId: PlayerId;
      readonly order: CouncilOrder;
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
    };

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

    case 'DAY_PASS':
      validateDayActor(state, action.playerId);
      return transitionGameState(state, {
        type: 'DAY_ACTION_COMPLETED',
        playerId: action.playerId,
      });

    case 'COUNCIL_SUBMIT':
      return submitCouncilOrder(state, action.playerId, action.order);

    case 'NIGHT_SUBMIT':
      return submitNightOrder(state, action.playerId, action.order);

    case 'DEFENSE_SUBMIT':
      return submitDefenseOrder(state, action.playerId, action.order);
  }
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

function submitCouncilOrder(
  state: GameState,
  playerId: PlayerId,
  order: CouncilOrder
): GameState {
  assertPhase(state, 'COUNCIL_PLAN');
  assertSubmissionOpen(state.players[playerId].submissions.council, 'Council', playerId);
  if (order.type !== 'PASS') {
    throw new RuleValidationError('Council accusation chưa được port trong slice này.');
  }

  let next = updatePlayer(state, playerId, (player) => ({
    ...player,
    submissions: { ...player.submissions, council: { ...order } },
  }));
  if (!bothPlayersSubmitted(next, 'council')) return next;

  next = transitionGameState(next, { type: 'COUNCIL_ORDERS_LOCKED' });
  next = clearSubmission(next, 'council');
  return transitionGameState(next, { type: 'COUNCIL_RESOLVED' });
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
    throw new RuleValidationError('Blood Moon resolution chưa được port trong slice này.');
  }

  const source = getOwnedLivingCard(state, playerId, order.sourceId, 'Night source');
  const target = getOpponentLivingCard(state, playerId, order.targetId, 'Night target');
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
      throw new Error('Blood Moon order lọt qua validation trước khi được port.');
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

  for (const [cardId, cause] of pendingDeaths) {
    const card = getCard(next, cardId);
    if (!isCardAlive(card)) continue;
    next = replaceCard(next, transitionCard(card, { type: 'ELIMINATE' }));
    events.push({
      type: 'CARD_ELIMINATED',
      visibility: { type: 'PUBLIC' },
      cardId,
      cause,
    });
  }

  next = clearProtectionEffects(next);
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

function clearProtectionEffects(state: GameState): GameState {
  let next = state;
  for (const playerId of PLAYER_ORDER) {
    for (const card of next.players[playerId].board) {
      let updated = card;
      for (const effect of card.effects) {
        if (effect.kind === CardEffectKind.PROTECTION) {
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

type SubmissionKey = 'council' | 'night' | 'defense';

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
