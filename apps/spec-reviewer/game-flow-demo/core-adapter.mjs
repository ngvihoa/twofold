import {
  AbilityId,
  CardRole,
  Faction,
  PlayerId,
} from '@twofold/shared-types';
import {
  CardEffectKind,
  STANDARD_DECK,
  createInitialCard,
  createInitialGameState,
  createInitialPlayerState,
  dispatchPlayerAction,
  getRoleAbility,
  getRoleDefinition,
} from '@twofold/game-core';

const SEAT_TO_PLAYER = {
  A: PlayerId.PLAYER_A,
  B: PlayerId.PLAYER_B,
};

const PLAYER_TO_SEAT = {
  [PlayerId.PLAYER_A]: 'A',
  [PlayerId.PLAYER_B]: 'B',
};

const ROLE_TO_KEY = {
  [CardRole.VILLAGER]: 'villager',
  [CardRole.WEREWOLF]: 'wolf',
  [CardRole.SEER]: 'seer',
  [CardRole.GUARD]: 'guard',
  [CardRole.WITCH]: 'witch',
  [CardRole.SHOOTER]: 'shooter',
  [CardRole.AVENGER]: 'avenger',
  [CardRole.PRIEST]: 'priest',
  [CardRole.WOLF_GUARD]: 'wolfguard',
};

const KEY_TO_ROLE = Object.fromEntries(
  Object.entries(ROLE_TO_KEY).map(([role, key]) => [key, role]),
);

export const ROLE_DEFS = Object.fromEntries(
  Object.entries(KEY_TO_ROLE).map(([key, role]) => {
    const definition = getRoleDefinition(role);
    return [
      key,
      {
        name: definition.displayName,
        faction: definition.faction === Faction.WEREWOLF ? 'werewolf' : 'village',
      },
    ];
  }),
);

export const BASE_DECK = STANDARD_DECK.map((role) => ROLE_TO_KEY[role]);

export const SPECIAL_CARD = {
  key: 'bloodmoon',
  name: 'Huyết Nguyệt',
  unlockRound: 6,
  cooldownRounds: 2,
};

function assertSeat(seat) {
  if (seat !== 'A' && seat !== 'B') throw new Error('Seat phải là A hoặc B.');
}

function otherSeat(seat) {
  return seat === 'A' ? 'B' : 'A';
}

function hashSeed(value) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function randomFromSeed(seed) {
  let value = hashSeed(seed) || 1;
  return () => {
    value += 0x6d2b79f5;
    let next = value;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffledDeck(seed, seat) {
  const random = randomFromSeed(`${seed}:${seat}`);
  const deck = [...STANDARD_DECK];
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [deck[index], deck[swapIndex]] = [deck[swapIndex], deck[index]];
  }
  return deck;
}

function initialCore(seed) {
  const players = Object.fromEntries(
    ['A', 'B'].map((seat) => {
      const playerId = SEAT_TO_PLAYER[seat];
      const board = shuffledDeck(seed, seat).map((role, index) =>
        createInitialCard(playerId, index + 1, role),
      );
      return [playerId, createInitialPlayerState(playerId, board)];
    }),
  );
  return createInitialGameState(seed, seed, players);
}

function phaseFor(core, override) {
  if (override) return override;
  return {
    SETUP: 'setup-A',
    DAY_A: 'day-A',
    DAY_B: 'day-B',
    COUNCIL_PLAN: 'council',
    COUNCIL_RESOLUTION: 'council',
    NIGHT_PLAN: 'night-plan',
    DUSK_DEFENSE: 'dusk-defense',
    NIGHT_RESOLUTION: 'night-resolution',
    DAWN: 'night-resolution',
    PURGE_PLAN: 'purge',
    PURGE_RESOLUTION: 'purge',
    FINAL_DUEL: 'final-duel',
    ENDED: 'ended',
  }[core.phase.type];
}

function abilityUses(role, abilityId, fallback = 0) {
  const ability = getRoleAbility(role, abilityId);
  if (!ability) return fallback;
  return 'remainingUses' in ability ? ability.remainingUses : Infinity;
}

function hasEffect(card, kind) {
  return card.occupant.effects.some((effect) => effect.kind === kind);
}

function legacyCouncil(player) {
  const { accusation, reaction } = player.submissions.council;
  if (!accusation || !reaction) return null;
  if (accusation.type === 'ACCUSE') {
    return {
      kind: 'accuse',
      target: accusation.targetId,
      guess: accusation.guessedRole ? ROLE_TO_KEY[accusation.guessedRole] : null,
      voters: [...accusation.voterIds],
    };
  }
  if (reaction.type === 'WOLF_GUARD_RESCUE') {
    return {
      kind: 'protect',
      source: reaction.sourceId,
      target: reaction.targetId,
    };
  }
  return { kind: 'pass', pass: true };
}

function legacyNight(order) {
  if (!order) return null;
  if (order.type === 'PASS') return { kind: 'pass' };
  if (order.type === 'BLOOD_MOON') return { kind: 'bloodmoon', target: order.targetId };
  return {
    kind: {
      [AbilityId.WEREWOLF_ATTACK]: 'attack',
      [AbilityId.SEER_INSPECT]: 'inspect',
      [AbilityId.WITCH_POISON]: 'poison',
    }[order.abilityId],
    source: order.sourceId,
    target: order.targetId,
  };
}

function legacyDefense(order) {
  if (!order) return null;
  return order.type === 'PASS'
    ? { pass: true }
    : { pass: false, source: order.sourceId, target: order.targetId };
}

function legacyPurge(order) {
  if (!order) return null;
  if (order.rule === 'SWAP') {
    return {
      rule: 'swap',
      target: order.ownTargetId,
      swapTarget: order.opponentTargetId,
    };
  }
  return { rule: order.rule.toLowerCase(), target: order.targetId };
}

function projectCard(core, playerId, card, pendingDefense) {
  const inspectingPlayer = core.players[SEAT_TO_PLAYER[otherSeat(PLAYER_TO_SEAT[playerId])]];
  const intel = inspectingPlayer.privateIntel.find(
    (entry) => entry.targetInstanceId === card.occupant.id,
  );
  const purgeLock = card.occupant.effects.find(
    (effect) => effect.kind === CardEffectKind.PURGE_LOCK,
  );
  const councilLock = hasEffect(card, CardEffectKind.COUNCIL_LOCK);
  const pendingShield = Object.values(pendingDefense ?? {}).some(
    (order) => order && !order.pass && order.target === card.id,
  );
  const submittedShield = Object.values(core.players).some(
    (player) =>
      player.submissions.defense?.type === 'PROTECT' &&
      player.submissions.defense.targetId === card.id,
  );
  const role = card.occupant.role;

  return {
    id: card.id,
    instanceId: card.occupant.id,
    role: ROLE_TO_KEY[role.id],
    alive: card.occupant.state.life === 'ALIVE',
    revealed: card.occupant.state.visibility === 'REVEALED',
    shielded:
      pendingShield || submittedShield || hasEffect(card, CardEffectKind.PROTECTION),
    purgeLockedRound: purgeLock?.appliedRound ?? -1,
    seerInspected: intel
      ? getRoleDefinition(intel.discoveredRole).faction === Faction.WEREWOLF
        ? 'dark'
        : 'light'
      : null,
    dayExhausted: false,
    voteCooldown: councilLock ? 1 : 0,
    uses: {
      guard: abilityUses(role, AbilityId.GUARD_PROTECT),
      seer: abilityUses(role, AbilityId.SEER_INSPECT),
      revive: abilityUses(role, AbilityId.WITCH_REVIVE),
      poison: abilityUses(role, AbilityId.WITCH_POISON),
      bullet: abilityUses(role, AbilityId.SHOOTER_SHOOT),
      holyWater: abilityUses(role, AbilityId.PRIEST_PURIFY),
      rescue: abilityUses(role, AbilityId.WOLF_GUARD_RESCUE),
    },
  };
}

function revengeTargetFor(core, playerId) {
  const avengerInstances = new Set(
    core.players[playerId].board
      .filter((card) => card.occupant.role.id === CardRole.AVENGER)
      .map((card) => card.occupant.id),
  );
  for (const player of Object.values(core.players)) {
    for (const card of player.board) {
      const mark = card.occupant.effects.find(
        (effect) =>
          effect.kind === CardEffectKind.REVENGE_MARK &&
          effect.source.type === 'ABILITY' &&
          avengerInstances.has(effect.source.instanceId),
      );
      if (mark) return card.id;
    }
  }
  return null;
}

function lastGuardTargetFor(player) {
  for (const card of player.board) {
    const guard = getRoleAbility(card.occupant.role, AbilityId.GUARD_PROTECT);
    if (guard?.lastTarget) return guard.lastTarget.instanceId;
  }
  return null;
}

function findCardById(core, cardId) {
  for (const player of Object.values(core.players)) {
    const card = player.board.find((candidate) => candidate.id === cardId);
    if (card) return card;
  }
  return null;
}

function seatOfCard(cardId) {
  return cardId?.[0] ?? '?';
}

function roleName(card) {
  return getRoleDefinition(card.occupant.role.id).displayName;
}

function votePowerFor(core, voterIds) {
  return voterIds.reduce((total, voterId) => {
    const card = findCardById(core, voterId);
    return total + (card?.occupant.role.id === CardRole.VILLAGER ? 2 : 1);
  }, 0);
}

function causeLabel(event) {
  const { cause } = event;
  switch (cause.type) {
    case 'COUNCIL':
      return `Hội đồng của ${PLAYER_TO_SEAT[cause.playerId]}`;
    case 'PLAYER_ABILITY':
      return `Huyết Nguyệt của ${PLAYER_TO_SEAT[cause.playerId]}`;
    case 'ABILITY':
      if (cause.abilityId === AbilityId.WEREWOLF_ATTACK) {
        return `Ma sói của ${seatOfCard(cause.sourceCardId)}`;
      }
      if (cause.abilityId === AbilityId.WITCH_POISON) {
        return `độc của ${seatOfCard(cause.sourceCardId)}`;
      }
      if (cause.abilityId === AbilityId.SEER_INSPECT) {
        return 'Tiên tri kết liễu';
      }
      return `năng lực ${cause.abilityId}`;
    case 'PURGE':
      return `Thanh trừng Vòng ${event.round}`;
    case 'REVENGE':
      return `báo thù của ${cause.sourceCardId}`;
    default:
      return 'nguyên nhân không rõ';
  }
}

function eventMessage(event, core) {
  switch (event.type) {
    case 'CARD_REVEALED':
      return `${event.cardId} đã lộ role.`;
    case 'CARD_ELIMINATED': {
      const card = findCardById(core, event.cardId);
      const revealed = card?.occupant.state.visibility === 'REVEALED';
      return `${event.cardId} chết do ${causeLabel(event)}.${
        revealed ? ` Role: ${roleName(card)}.` : ' Danh tính vẫn ẩn.'
      }`;
    }
    case 'CARD_REVIVED':
      return `${event.cardId} đã được hồi sinh.`;
    case 'EFFECT_APPLIED':
      if (event.effectKind === CardEffectKind.PROTECTION) {
        return `${seatOfCard(event.targetCardId)} công khai khiên tại ${event.targetCardId}.`;
      }
      return `${event.effectKind} được áp dụng lên ${event.targetCardId}.`;
    case 'EFFECT_BLOCKED':
      return `${event.targetCardId} đã chặn một effect.`;
    case 'COUNCIL_ACCUSATION_RESOLVED': {
      const seat = PLAYER_TO_SEAT[event.playerId];
      const votePower = votePowerFor(core, event.voterIds);
      return event.succeeded
        ? `${seat} đạt ${votePower} phiếu và buộc tội đúng ${event.targetCardId}.`
        : `${seat} buộc tội thất bại với ${votePower} phiếu hợp lệ.`;
    }
    case 'COUNCIL_PASSED':
      return `${PLAYER_TO_SEAT[event.playerId]} bỏ qua Hội đồng.`;
    case 'DEFENSE_SKIPPED':
      return `${PLAYER_TO_SEAT[event.playerId]} không đặt khiên.`;
    case 'WOLF_GUARD_RESCUED':
      return `${event.sourceCardId} đã bảo kê ${event.targetCardId}.`;
    case 'PURGE_RESOLVED':
      return `${PLAYER_TO_SEAT[event.playerId]} đã hoàn tất ${event.rule}.`;
    case 'FINAL_DUEL_RESOLVED':
      return 'Final Duel đã được phân định.';
    case 'DAWN_PRESENTATION_COMPLETED':
      return 'Bình minh đã hoàn tất.';
    case 'ABILITY_RESOLVED':
      if (event.abilityId === AbilityId.SEER_INSPECT && event.targetCardId === null) {
        return `${seatOfCard(event.sourceCardId)} dùng Tiên tri. Kết quả được giữ riêng.`;
      }
      return `${event.abilityId} đã được xử lý.`;
    default:
      return null;
  }
}

function publicMessages(core) {
  const events = core.events;
  const messages = [];
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    if (event.visibility.type !== 'PUBLIC') continue;
    const following = events[index + 1];
    if (
      event.type === 'CARD_REVEALED' &&
      following?.type === 'CARD_ELIMINATED' &&
      following.cardId === event.cardId
    ) {
      // Reveal + loại bỏ cùng một lá được gộp thành một dòng chết kèm role.
      continue;
    }
    const message = eventMessage(event, core);
    if (message) messages.push(message);
  }
  return messages;
}

function projectPlayer(core, playerId, meta) {
  const player = core.players[playerId];
  const seat = PLAYER_TO_SEAT[playerId];
  const bloodMoon = player.specialAbilities.find(
    (ability) => ability.abilityId === 'BLOOD_MOON',
  );
  return {
    board: player.board.map((card) =>
      projectCard(core, playerId, card, meta.pendingDefense),
    ),
    setupLocked: player.setup.status === 'LOCKED',
    eliminationSpent: false,
    bloodMoonReadyRound: bloodMoon?.readyRound ?? SPECIAL_CARD.unlockRound,
    council: legacyCouncil(player),
    defense:
      meta.pendingDefense?.[seat] ?? legacyDefense(player.submissions.defense),
    purge: legacyPurge(player.submissions.purge),
    lastGuardTarget: lastGuardTargetFor(player),
    revengeTarget: revengeTargetFor(core, playerId),
    night: legacyNight(player.submissions.night),
    finalGuess: player.submissions.finalGuess
      ? ROLE_TO_KEY[player.submissions.finalGuess]
      : null,
    notes: player.privateIntel.map((intel) => {
      const currentCard = Object.values(core.players)
        .flatMap((candidate) => candidate.board)
        .find((card) => card.occupant.id === intel.targetInstanceId);
      return `${currentCard?.id ?? intel.observedAtSlotId} là ${getRoleDefinition(intel.discoveredRole).displayName}`;
    }),
  };
}

function resultFor(result) {
  if (!result) return null;
  const reason = {
    ELIMINATION: 'Đối thủ hết bài',
    SURRENDER: 'Đối thủ đầu hàng',
    TIMEOUT: 'Đối thủ hết thời gian',
    FINAL_DUEL: 'Đoán đúng role cuối',
    DRAW_FINAL_DUEL: 'Hai bên có cùng kết quả Final Duel',
  }[result.reason] ?? result.reason;
  return { winner: result.winner ? PLAYER_TO_SEAT[result.winner] : null, reason };
}

function project(core, meta = {}) {
  return {
    __core: core,
    __pendingCore: meta.pendingCore ?? null,
    __phaseOverride: meta.phaseOverride ?? null,
    __pendingDefense: meta.pendingDefense ?? null,
    seed: core.seed,
    round: core.round,
    phase: phaseFor(core, meta.phaseOverride),
    firstSeat: 'A',
    players: {
      A: projectPlayer(core, PlayerId.PLAYER_A, meta),
      B: projectPlayer(core, PlayerId.PLAYER_B, meta),
    },
    result: resultFor(core.result),
    log: [
      'Hai bên bí mật xếp thứ tự 10 lá trước khi lên bàn.',
      ...publicMessages(core),
    ].slice(-10),
  };
}

export function createGame(seed = 'twofold-01') {
  return project(initialCore(seed), { phaseOverride: 'setup-A' });
}

export function beginRound(state) {
  if (state.phase !== 'match-intro') {
    throw new Error('Chưa sẵn sàng bắt đầu Vòng 1.');
  }
  return project(state.__core);
}

function getCoreCard(core, cardId) {
  const playerId = cardId?.startsWith('A')
    ? PlayerId.PLAYER_A
    : cardId?.startsWith('B')
      ? PlayerId.PLAYER_B
      : null;
  const card = playerId
    ? core.players[playerId].board.find((candidate) => candidate.id === cardId)
    : null;
  if (!card) throw new Error(`Không tìm thấy lá ${cardId}.`);
  return card;
}

function setupSubmit(state, action) {
  assertSeat(action.seat);
  const playerId = SEAT_TO_PLAYER[action.seat];
  const projectedPlayer = state.players[action.seat];
  const bySlot = new Map(projectedPlayer.board.map((card) => [card.id, card.instanceId]));
  const order = action.order.map((slotId) => bySlot.get(slotId));
  if (order.length !== 10 || order.some((instanceId) => !instanceId)) {
    throw new Error('Đội hình phải chứa đúng 10 lá hiện có.');
  }
  let core = dispatchPlayerAction(state.__core, {
    type: 'SETUP_REORDER',
    playerId,
    order,
  });
  core = dispatchPlayerAction(core, { type: 'SETUP_LOCK', playerId });
  return project(core, {
    phaseOverride: action.seat === 'A' ? 'setup-B' : 'match-intro',
  });
}

function purgeOrder(round, action) {
  const rule = ['CUT', 'SWAP', 'REVEAL', 'LOCK'][(round - 6) % 4];
  if (rule === 'SWAP') {
    return {
      rule,
      ownTargetId: action.target,
      opponentTargetId: action.swapTarget,
    };
  }
  return { rule, targetId: action.target ?? null };
}

function councilActions(core, action) {
  const target = action.target ? getCoreCard(core, action.target) : null;
  const accusation =
    action.kind === 'accuse'
      ? {
          type: 'ACCUSE',
          targetId: action.target,
          guessedRole:
            target.occupant.state.visibility === 'REVEALED'
              ? null
              : KEY_TO_ROLE[action.guess],
          voterIds: action.voters,
        }
      : { type: 'PASS' };
  const reaction =
    action.kind === 'protect'
      ? {
          type: 'WOLF_GUARD_RESCUE',
          sourceId: action.source,
          targetId: action.target,
        }
      : { type: 'PASS' };
  return { accusation, reaction };
}

function dayAction(action) {
  if (action.kind === 'pass') return { type: 'PASS' };
  return {
    type: action.kind.toUpperCase(),
    sourceId: action.source,
    targetId: action.target,
  };
}

function nightOrder(action) {
  if (action.kind === 'pass') return { type: 'PASS' };
  if (action.kind === 'bloodmoon') {
    return { type: 'BLOOD_MOON', targetId: action.target };
  }
  return {
    type: 'USE_ABILITY',
    sourceId: action.source,
    abilityId: {
      attack: AbilityId.WEREWOLF_ATTACK,
      inspect: AbilityId.SEER_INSPECT,
      poison: AbilityId.WITCH_POISON,
    }[action.kind],
    targetId: action.target,
  };
}

export function dispatch(state, action) {
  if (state.phase === 'ended') throw new Error('Ván đấu đã kết thúc.');
  if (action.type === 'round.begin') return beginRound(state);
  if (action.type === 'setup.submit') return setupSubmit(state, action);
  if (action.type === 'night.resolve') {
    if (!state.__pendingCore) throw new Error('Không có Night resolution đang chờ.');
    return project(state.__pendingCore);
  }

  assertSeat(action.seat);
  const playerId = SEAT_TO_PLAYER[action.seat];
  let core = state.__core;

  if (action.type === 'day.submit') {
    core = dispatchPlayerAction(core, {
      type: 'DAY_SUBMIT',
      playerId,
      action: dayAction(action),
    });
  } else if (action.type === 'council.submit') {
    const orders = councilActions(core, action);
    core = dispatchPlayerAction(core, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId,
      order: orders.accusation,
    });
    core = dispatchPlayerAction(core, {
      type: 'COUNCIL_REACTION_SUBMIT',
      playerId,
      order: orders.reaction,
    });
  } else if (action.type === 'night.submit') {
    core = dispatchPlayerAction(core, {
      type: 'NIGHT_SUBMIT',
      playerId,
      order: nightOrder(action),
    });
  } else if (action.type === 'defense.submit') {
    const order = action.pass
      ? { type: 'PASS' }
      : { type: 'PROTECT', sourceId: action.source, targetId: action.target };
    const otherPlayerId = SEAT_TO_PLAYER[otherSeat(action.seat)];
    const resolvesNight = core.players[otherPlayerId].submissions.defense !== null;
    const resolvedCore = dispatchPlayerAction(core, {
      type: 'DEFENSE_SUBMIT',
      playerId,
      order,
    });
    if (resolvesNight) {
      const pendingDefense = {
        A: legacyDefense(core.players[PlayerId.PLAYER_A].submissions.defense),
        B: legacyDefense(core.players[PlayerId.PLAYER_B].submissions.defense),
        [action.seat]: legacyDefense(order),
      };
      return project(core, {
        phaseOverride: 'night-resolution',
        pendingCore: resolvedCore,
        pendingDefense,
      });
    }
    core = resolvedCore;
  } else if (action.type === 'purge.submit') {
    core = dispatchPlayerAction(core, {
      type: 'PURGE_SUBMIT',
      playerId,
      order: purgeOrder(core.round, action),
    });
  } else if (action.type === 'final.submit') {
    core = dispatchPlayerAction(core, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId,
      guess: KEY_TO_ROLE[action.guess],
    });
  } else {
    throw new Error('Action type không hợp lệ.');
  }

  return project(core);
}

export function availableRoleGuesses(state, targetSeat) {
  assertSeat(targetSeat);
  const remaining = BASE_DECK.reduce(
    (counts, role) => ({ ...counts, [role]: (counts[role] ?? 0) + 1 }),
    {},
  );
  for (const card of state.players[targetSeat].board) {
    if (card.revealed) remaining[card.role] = Math.max(0, remaining[card.role] - 1);
  }
  return Object.keys(ROLE_DEFS).filter((role) => remaining[role] > 0);
}

export function publicView(state) {
  const board = Object.fromEntries(
    ['A', 'B'].map((seat) => [
      seat,
      state.players[seat].board.map((card) => {
        const canVote =
          card.alive &&
          card.revealed &&
          ROLE_DEFS[card.role].faction === 'village' &&
          card.voteCooldown === 0 &&
          card.purgeLockedRound !== state.round;
        return {
          id: card.id,
          alive: card.alive,
          role: card.revealed ? ROLE_DEFS[card.role].name : '?',
          faction: card.revealed ? ROLE_DEFS[card.role].faction : '?',
          shielded: card.shielded,
          staged: Boolean(
            card.revealed && state.players[seat].night?.source === card.id,
          ),
          canVote,
          votePower: canVote ? (card.role === 'villager' ? 2 : 1) : 0,
        };
      }),
    ]),
  );
  return {
    round: state.round,
    phase: state.phase,
    elimination: { A: 'ready', B: 'ready' },
    special: {
      A: {
        unlocked: state.round >= SPECIAL_CARD.unlockRound,
        ready: state.round >= state.players.A.bloodMoonReadyRound,
        readyRound: state.players.A.bloodMoonReadyRound,
      },
      B: {
        unlocked: state.round >= SPECIAL_CARD.unlockRound,
        ready: state.round >= state.players.B.bloodMoonReadyRound,
        readyRound: state.players.B.bloodMoonReadyRound,
      },
    },
    board,
    result: state.result,
    log: [...state.log],
  };
}

export function privateView(state, seat) {
  assertSeat(seat);
  return {
    seat,
    hand: state.players[seat].board.map((card) => ({
      id: card.id,
      role: ROLE_DEFS[card.role].name,
      alive: card.alive,
      revealed: card.revealed,
      uses: { ...card.uses },
    })),
    notes: [...state.players[seat].notes],
  };
}

export function chatSnapshot(state) {
  const view = publicView(state);
  const lines = [`[TWOFOLD · V${view.round} · ${view.phase.toUpperCase()}]`];
  for (const seat of ['A', 'B']) {
    const cards = view.board[seat];
    const revealed = cards
      .filter((card) => card.role !== '?')
      .map((card) => `${card.id}=${card.role}${card.alive ? '' : '†'}`);
    lines.push(
      `${seat}: ${cards.filter((card) => card.alive).length}/10 sống · lộ ${revealed.join(', ') || '—'}`,
    );
  }
  lines.push(`Gần nhất: ${view.log.slice(-3).join(' / ')}`);
  if (view.result) {
    lines.push(`Kết quả: ${view.result.winner || 'HÒA'} — ${view.result.reason}`);
  }
  return lines.join('\n');
}
