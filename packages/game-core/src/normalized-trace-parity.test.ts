import { describe, expect, it } from 'vitest';
import {
  AbilityId,
  CardRole,
  PlayerId,
} from '@twofold/shared-types';
import {
  CardEffectKind,
  type CardId,
  type CardInstanceId,
  createInitialCard,
} from './cards';
import { createInitialGameState, type GameState } from './game-state';
import { createInitialPlayerState, PlayerSpecialAbilityId } from './players';
import { dispatchPlayerAction } from './rule-pipeline';
import { getRoleAbility } from './roles';
// Prototype imports are test-only and never enter the game-core runtime graph.
import {
  ROLE_DEFS,
  createGame as createPrototypeGame,
  dispatch as dispatchPrototype,
} from '../../../apps/spec-reviewer/game-flow-demo/engine.mjs';

const PROTOTYPE_TO_CORE_ROLE: Record<string, CardRole> = {
  villager: CardRole.VILLAGER,
  wolf: CardRole.WEREWOLF,
  seer: CardRole.SEER,
  guard: CardRole.GUARD,
  witch: CardRole.WITCH,
  shooter: CardRole.SHOOTER,
  avenger: CardRole.AVENGER,
  priest: CardRole.PRIEST,
  wolfguard: CardRole.WOLF_GUARD,
};

const CORE_TO_PROTOTYPE_ROLE = Object.fromEntries(
  Object.entries(PROTOTYPE_TO_CORE_ROLE).map(([prototypeRole, coreRole]) => [
    coreRole,
    prototypeRole,
  ])
) as Record<CardRole, string>;

const PLAYER_BY_SEAT = {
  A: PlayerId.PLAYER_A,
  B: PlayerId.PLAYER_B,
} as const;

const FINITE_ABILITY_KEYS = {
  [AbilityId.WITCH_REVIVE]: 'revive',
  [AbilityId.WITCH_POISON]: 'poison',
  [AbilityId.SHOOTER_SHOOT]: 'bullet',
  [AbilityId.PRIEST_PURIFY]: 'holyWater',
  [AbilityId.WOLF_GUARD_RESCUE]: 'rescue',
} as const;

type Seat = keyof typeof PLAYER_BY_SEAT;
type PrototypeState = ReturnType<typeof createPrototypeGame>;

interface PrototypeCard {
  readonly id: string;
  readonly instanceId: CardInstanceId;
  readonly role: string;
  readonly alive: boolean;
  readonly revealed: boolean;
  readonly shielded: boolean;
  readonly voteCooldown: number;
  readonly purgeLockedRound: number;
  readonly seerInspected: 'light' | 'dark' | null;
  readonly uses: Record<string, number>;
}

interface TracePair {
  prototype: PrototypeState;
  core: GameState;
  readonly inspected: {
    readonly viewer: Seat;
    readonly targetInstanceId: CardInstanceId;
  };
}

function prototypeCardByRole(state: PrototypeState, seat: Seat, role: string) {
  const card = state.players[seat].board.find(
    (candidate: { role: string; alive: boolean }) =>
      candidate.role === role && candidate.alive
  );
  if (!card) throw new Error(`${seat} không còn role ${role}.`);
  return card;
}

function prototypeCardByInstance(
  state: PrototypeState,
  instanceId: CardInstanceId
) {
  for (const seat of ['A', 'B'] as const) {
    const card = state.players[seat].board.find(
      (candidate: { instanceId: string }) => candidate.instanceId === instanceId
    );
    if (card) return card;
  }
  throw new Error(`Không tìm thấy prototype instance ${instanceId}.`);
}

function prototypeSlotByInstance(
  state: PrototypeState,
  instanceId: CardInstanceId
): string {
  return prototypeCardByInstance(state, instanceId).id;
}

function livingPrototypeCards(state: PrototypeState, seat: Seat) {
  return state.players[seat].board.filter(
    (card: { alive: boolean }) => card.alive
  );
}

function createTracePair(seed: string): TracePair {
  let prototype = createPrototypeGame(seed);
  const inspectedTarget = prototypeCardByRole(prototype, 'B', 'villager');
  const createBoard = (seat: Seat) =>
    prototype.players[seat].board.map(
      (card: { role: string }, index: number) =>
        createInitialCard(
          PLAYER_BY_SEAT[seat],
          index + 1,
          PROTOTYPE_TO_CORE_ROLE[card.role]
        )
    );

  let core = createInitialGameState(seed, seed, {
    [PlayerId.PLAYER_A]: createInitialPlayerState(
      PlayerId.PLAYER_A,
      createBoard('A')
    ),
    [PlayerId.PLAYER_B]: createInitialPlayerState(
      PlayerId.PLAYER_B,
      createBoard('B')
    ),
  });

  for (const seat of ['A', 'B'] as const) {
    prototype = dispatchPrototype(prototype, {
      type: 'setup.submit',
      seat,
      order: prototype.players[seat].board.map(
        (card: { id: string }) => card.id
      ),
    });
    core = dispatchPlayerAction(core, {
      type: 'SETUP_LOCK',
      playerId: PLAYER_BY_SEAT[seat],
    });
  }
  prototype = dispatchPrototype(prototype, { type: 'round.begin' });

  return {
    prototype,
    core,
    inspected: {
      viewer: 'A',
      targetInstanceId: inspectedTarget.instanceId,
    },
  };
}

function normalizePrototypePhase(phase: string): string {
  const phases: Record<string, string> = {
    'day-A': 'DAY_A',
    'day-B': 'DAY_B',
    council: 'COUNCIL_PLAN',
    'night-plan': 'NIGHT_PLAN',
    'dusk-defense': 'DUSK_DEFENSE',
    'night-resolution': 'NIGHT_RESOLUTION',
    purge: 'PURGE_PLAN',
    'final-duel': 'FINAL_DUEL',
    ended: 'ENDED',
  };
  return phases[phase] ?? phase.toUpperCase();
}

function normalizePrototype(pair: TracePair) {
  const state = pair.prototype;
  const inspectedCard = prototypeCardByInstance(
    state,
    pair.inspected.targetInstanceId
  );

  return {
    round: state.round,
    phase: normalizePrototypePhase(state.phase),
    board: (['A', 'B'] as const).flatMap((seat) =>
      state.players[seat].board.map((card: PrototypeCard) => ({
        slotId: card.id,
        instanceId: card.instanceId,
        role: card.role,
        life: card.alive ? 'ALIVE' : 'DEAD',
        visibility: card.revealed ? 'REVEALED' : 'HIDDEN',
        effects: [
          ...(card.shielded ? [CardEffectKind.PROTECTION] : []),
          ...(card.voteCooldown > 0 ? [CardEffectKind.COUNCIL_LOCK] : []),
          ...(card.purgeLockedRound === state.round
            ? [CardEffectKind.PURGE_LOCK]
            : []),
        ].sort(),
      }))
    ),
    resources: Object.fromEntries(
      (['A', 'B'] as const).flatMap((seat) =>
        state.players[seat].board.map((card: PrototypeCard) => [
          card.instanceId,
          {
            role: card.role,
            ...(card.role === 'witch'
              ? { revive: card.uses.revive, poison: card.uses.poison }
              : {}),
            ...(card.role === 'shooter' ? { bullet: card.uses.bullet } : {}),
            ...(card.role === 'priest'
              ? { holyWater: card.uses.holyWater }
              : {}),
            ...(card.role === 'wolfguard'
              ? { rescue: card.uses.rescue }
              : {}),
          },
        ])
      )
    ),
    guardMemory: {
      A: state.players.A.lastGuardTarget,
      B: state.players.B.lastGuardTarget,
    },
    bloodMoonReadyRound: {
      A: state.players.A.bloodMoonReadyRound,
      B: state.players.B.bloodMoonReadyRound,
    },
    intel:
      inspectedCard.seerInspected === null
        ? []
        : [
          {
            viewer: pair.inspected.viewer,
            targetInstanceId: inspectedCard.instanceId,
            discoveredRole: inspectedCard.role,
          },
        ],
    result: state.result
      ? { winner: state.result.winner as Seat | null }
      : null,
  };
}

function normalizeCore(pair: TracePair) {
  const state = pair.core;
  const board = (['A', 'B'] as const).flatMap((seat) =>
    state.players[PLAYER_BY_SEAT[seat]].board.map((card) => ({
      slotId: card.id,
      instanceId: card.occupant.id,
      role: CORE_TO_PROTOTYPE_ROLE[card.occupant.role.id],
      life: card.occupant.state.life,
      visibility: card.occupant.state.visibility,
      effects: card.occupant.effects.map((effect) => effect.kind).sort(),
    }))
  );

  const resources = Object.fromEntries(
    (['A', 'B'] as const).flatMap((seat) =>
      state.players[PLAYER_BY_SEAT[seat]].board.map((card) => {
        const finiteResources = Object.fromEntries(
          card.occupant.role.abilities.flatMap((ability) => {
            if (!('remainingUses' in ability)) return [];
            const key = FINITE_ABILITY_KEYS[
              ability.abilityId as keyof typeof FINITE_ABILITY_KEYS
            ];
            return key ? [[key, ability.remainingUses]] : [];
          })
        );
        return [
          card.occupant.id,
          {
            role: CORE_TO_PROTOTYPE_ROLE[card.occupant.role.id],
            ...finiteResources,
          },
        ];
      })
    )
  );

  const guardMemory = Object.fromEntries(
    (['A', 'B'] as const).map((seat) => {
      const guardCard = state.players[PLAYER_BY_SEAT[seat]].board.find(
        (card) => card.occupant.role.id === CardRole.GUARD
      );
      const guard = guardCard
        ? getRoleAbility(guardCard.occupant.role, AbilityId.GUARD_PROTECT)
        : undefined;
      return [seat, guard?.lastTarget?.instanceId ?? null];
    })
  );

  const bloodMoonReadyRound = Object.fromEntries(
    (['A', 'B'] as const).map((seat) => {
      const bloodMoon = state.players[PLAYER_BY_SEAT[seat]].specialAbilities.find(
        (ability) => ability.abilityId === PlayerSpecialAbilityId.BLOOD_MOON
      );
      return [seat, bloodMoon?.readyRound ?? null];
    })
  );

  const intel = state.players[PLAYER_BY_SEAT[pair.inspected.viewer]].privateIntel
    .filter((entry) => entry.targetInstanceId === pair.inspected.targetInstanceId)
    .map((entry) => ({
      viewer: pair.inspected.viewer,
      targetInstanceId: entry.targetInstanceId,
      discoveredRole: CORE_TO_PROTOTYPE_ROLE[entry.discoveredRole],
    }));

  return {
    round: state.round,
    phase: state.phase.type,
    board,
    resources,
    guardMemory,
    bloodMoonReadyRound,
    intel,
    result: state.result
      ? {
        winner:
          state.result.winner === null
            ? null
            : state.result.winner === PlayerId.PLAYER_A
              ? 'A'
              : 'B',
      }
      : null,
  };
}

function expectParity(pair: TracePair, checkpoint: string): void {
  expect(normalizeCore(pair), checkpoint).toEqual(normalizePrototype(pair));
}

function passDay(pair: TracePair): void {
  for (const seat of ['A', 'B'] as const) {
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'day.submit',
      seat,
      kind: 'pass',
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'DAY_SUBMIT',
      playerId: PLAYER_BY_SEAT[seat],
      action: { type: 'PASS' },
    });
  }
}

function passCouncil(pair: TracePair): void {
  for (const seat of ['A', 'B'] as const) {
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'council.submit',
      seat,
      kind: 'pass',
      pass: true,
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PLAYER_BY_SEAT[seat],
      order: { type: 'PASS' },
    });
  }
  for (const seat of ['A', 'B'] as const) {
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'COUNCIL_REACTION_SUBMIT',
      playerId: PLAYER_BY_SEAT[seat],
      order: { type: 'PASS' },
    });
  }
}

function submitCouncilAccusations(
  pair: TracePair,
  orders: Record<
    Seat,
    | { readonly type: 'PASS' }
    | {
      readonly type: 'ACCUSE';
      readonly targetInstanceId: CardInstanceId;
      readonly voterInstanceIds: readonly [
        CardInstanceId,
        CardInstanceId,
        CardInstanceId,
      ];
    }
  >
): void {
  for (const seat of ['A', 'B'] as const) {
    const order = orders[seat];
    if (order.type === 'PASS') {
      pair.prototype = dispatchPrototype(pair.prototype, {
        type: 'council.submit',
        seat,
        kind: 'pass',
        pass: true,
      });
      pair.core = dispatchPlayerAction(pair.core, {
        type: 'COUNCIL_ACCUSATION_SUBMIT',
        playerId: PLAYER_BY_SEAT[seat],
        order: { type: 'PASS' },
      });
      continue;
    }

    const target = prototypeCardByInstance(
      pair.prototype,
      order.targetInstanceId
    );
    const targetId = target.id;
    const voterIds = order.voterInstanceIds.map((instanceId) =>
      prototypeSlotByInstance(pair.prototype, instanceId)
    ) as [string, string, string];
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'council.submit',
      seat,
      kind: 'accuse',
      target: targetId,
      guess: target.role,
      voters: voterIds,
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'COUNCIL_ACCUSATION_SUBMIT',
      playerId: PLAYER_BY_SEAT[seat],
      order: {
        type: 'ACCUSE',
        targetId: targetId as CardId,
        guessedRole: target.revealed
          ? null
          : PROTOTYPE_TO_CORE_ROLE[target.role],
        voterIds: voterIds as [CardId, CardId, CardId],
      },
    });
  }

  for (const seat of ['A', 'B'] as const) {
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'COUNCIL_REACTION_SUBMIT',
      playerId: PLAYER_BY_SEAT[seat],
      order: { type: 'PASS' },
    });
  }
}

function passNight(pair: TracePair): void {
  for (const seat of ['A', 'B'] as const) {
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'night.submit',
      seat,
      kind: 'pass',
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'NIGHT_SUBMIT',
      playerId: PLAYER_BY_SEAT[seat],
      order: { type: 'PASS' },
    });
  }
  resolveDefensePasses(pair);
}

function resolveDefensePasses(pair: TracePair): void {
  for (const seat of ['A', 'B'] as const) {
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'defense.submit',
      seat,
      pass: true,
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'DEFENSE_SUBMIT',
      playerId: PLAYER_BY_SEAT[seat],
      order: { type: 'PASS' },
    });
  }
  pair.prototype = dispatchPrototype(pair.prototype, { type: 'night.resolve' });
}

function findAliveOutside(
  pair: TracePair,
  seat: Seat,
  protectedInstances: ReadonlySet<CardInstanceId>
): CardInstanceId {
  const card = livingPrototypeCards(pair.prototype, seat).find(
    (candidate: { instanceId: CardInstanceId }) =>
      !protectedInstances.has(candidate.instanceId)
  );
  if (!card) throw new Error(`${seat} không còn target ngoài protected set.`);
  return card.instanceId;
}

function submitPurgeCut(
  pair: TracePair,
  targets: Record<Seat, CardInstanceId>
): void {
  for (const seat of ['A', 'B'] as const) {
    const targetId = prototypeSlotByInstance(pair.prototype, targets[seat]);
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'purge.submit',
      seat,
      target: targetId,
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'PURGE_SUBMIT',
      playerId: PLAYER_BY_SEAT[seat],
      order: { rule: 'CUT', targetId: targetId as CardId },
    });
  }
}

function useBloodMoon(
  pair: TracePair,
  actor: Seat,
  targetInstanceId: CardInstanceId
): void {
  const targetId = prototypeSlotByInstance(pair.prototype, targetInstanceId);
  for (const seat of ['A', 'B'] as const) {
    if (seat === actor) {
      pair.prototype = dispatchPrototype(pair.prototype, {
        type: 'night.submit',
        seat,
        kind: 'bloodmoon',
        target: targetId,
      });
      pair.core = dispatchPlayerAction(pair.core, {
        type: 'NIGHT_SUBMIT',
        playerId: PLAYER_BY_SEAT[seat],
        order: { type: 'BLOOD_MOON', targetId: targetId as CardId },
      });
    } else {
      pair.prototype = dispatchPrototype(pair.prototype, {
        type: 'night.submit',
        seat,
        kind: 'pass',
      });
      pair.core = dispatchPlayerAction(pair.core, {
        type: 'NIGHT_SUBMIT',
        playerId: PLAYER_BY_SEAT[seat],
        order: { type: 'PASS' },
      });
    }
  }
  resolveDefensePasses(pair);
}

describe('normalized standard-deck prototype parity trace', () => {
  it('matches Council, Night, all Purge rules, SWAP identity and Final Duel', () => {
    const pair = createTracePair('normalized-full-trace');
    const aShooter = prototypeCardByRole(pair.prototype, 'A', 'shooter').instanceId;
    const aPriest = prototypeCardByRole(pair.prototype, 'A', 'priest').instanceId;
    const aFinal = prototypeCardByRole(pair.prototype, 'A', 'villager').instanceId;
    const aSwapCandidates = livingPrototypeCards(pair.prototype, 'A')
      .filter(
        (card: PrototypeCard) =>
          ROLE_DEFS[card.role].faction === 'village' &&
          ![aShooter, aPriest, aFinal].includes(card.instanceId)
      )
      .slice(0, 2)
      .map((card: PrototypeCard) => card.instanceId);
    if (aSwapCandidates.length !== 2) throw new Error('Thiếu A swap candidates.');

    const bPriest = prototypeCardByRole(pair.prototype, 'B', 'priest').instanceId;
    const bShooter = prototypeCardByRole(pair.prototype, 'B', 'shooter').instanceId;
    const bVillager = pair.inspected.targetInstanceId;
    const bSeer = prototypeCardByRole(pair.prototype, 'B', 'seer').instanceId;
    const aKeep = new Set<CardInstanceId>([
      aShooter,
      aPriest,
      aFinal,
      ...aSwapCandidates,
    ]);
    const bKeep = new Set<CardInstanceId>([
      bPriest,
      bShooter,
      bVillager,
      bSeer,
    ]);

    expectParity(pair, 'after setup');

    // Round 1: Seer intel bypasses Guard protection; sources/resources normalize.
    const aSeer = prototypeCardByRole(pair.prototype, 'A', 'seer');
    const bGuard = prototypeCardByRole(pair.prototype, 'B', 'guard');
    const inspectedTarget = prototypeCardByInstance(pair.prototype, bVillager);
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'day.submit',
      seat: 'A',
      kind: 'pass',
    });
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'day.submit',
      seat: 'B',
      kind: 'pass',
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: { type: 'PASS' },
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      action: { type: 'PASS' },
    });
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'night.submit',
      seat: 'A',
      kind: 'inspect',
      source: aSeer.id,
      target: inspectedTarget.id,
    });
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'night.submit',
      seat: 'B',
      kind: 'pass',
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: {
        type: 'USE_ABILITY',
        sourceId: aSeer.id,
        abilityId: AbilityId.SEER_INSPECT,
        targetId: inspectedTarget.id,
      },
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'NIGHT_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: { type: 'PASS' },
    });
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'defense.submit',
      seat: 'A',
      pass: true,
    });
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'defense.submit',
      seat: 'B',
      source: bGuard.id,
      target: inspectedTarget.id,
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'DEFENSE_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      order: { type: 'PASS' },
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'DEFENSE_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      order: {
        type: 'PROTECT',
        sourceId: bGuard.id,
        targetId: inspectedTarget.id,
      },
    });
    pair.prototype = dispatchPrototype(pair.prototype, { type: 'night.resolve' });
    expectParity(pair, 'after round-one Seer and Guard');

    // Rounds 2–5: correct simultaneous Council accusations shrink both boards.
    for (let round = 2; round <= 5; round += 1) {
      passDay(pair);
      const bVoterPool = [bPriest, bShooter, bVillager, bSeer];
      const bVoters = (round === 3
        ? [bPriest, bShooter, bSeer]
        : bVoterPool.slice(0, 3)) as [
          CardInstanceId,
          CardInstanceId,
          CardInstanceId,
        ];
      submitCouncilAccusations(pair, {
        A: {
          type: 'ACCUSE',
          targetInstanceId: findAliveOutside(pair, 'B', bKeep),
          voterInstanceIds: [aShooter, aPriest, aFinal],
        },
        B: {
          type: 'ACCUSE',
          targetInstanceId: findAliveOutside(pair, 'A', aKeep),
          voterInstanceIds: bVoters,
        },
      });
      expectParity(pair, `after Council round ${round}`);
      passNight(pair);
      expectParity(pair, `after Night round ${round}`);
    }

    // Round 6 CUT, followed by Blood Moon against a previously revealed voter.
    submitPurgeCut(pair, {
      A: findAliveOutside(pair, 'A', aKeep),
      B: findAliveOutside(pair, 'B', bKeep),
    });
    expectParity(pair, 'after Purge CUT');
    passDay(pair);
    passCouncil(pair);
    useBloodMoon(pair, 'A', bSeer);
    expectParity(pair, 'after round-six Blood Moon');

    // Round 7 SWAP deliberately moves the Seer-inspected physical instance.
    const bSwapExtra = findAliveOutside(pair, 'B', bKeep);
    const swapOrders = {
      A: { own: aSwapCandidates[0], opponent: bVillager },
      B: { own: bSwapExtra, opponent: aSwapCandidates[1] },
    } as const;
    for (const seat of ['A', 'B'] as const) {
      const ownTargetId = prototypeSlotByInstance(
        pair.prototype,
        swapOrders[seat].own
      );
      const opponentTargetId = prototypeSlotByInstance(
        pair.prototype,
        swapOrders[seat].opponent
      );
      pair.prototype = dispatchPrototype(pair.prototype, {
        type: 'purge.submit',
        seat,
        target: ownTargetId,
        swapTarget: opponentTargetId,
      });
      pair.core = dispatchPlayerAction(pair.core, {
        type: 'PURGE_SUBMIT',
        playerId: PLAYER_BY_SEAT[seat],
        order: {
          rule: 'SWAP',
          ownTargetId: ownTargetId as CardId,
          opponentTargetId: opponentTargetId as CardId,
        },
      });
    }
    expectParity(pair, 'after Purge SWAP with inspected instance');

    const bLateCards = livingPrototypeCards(pair.prototype, 'B');
    const bLatePriest = bLateCards.find(
      (card: PrototypeCard) => card.role === 'priest'
    );
    if (!bLatePriest) throw new Error('B Priest phải còn sống sau SWAP.');
    const bLateOthers = bLateCards.filter(
      (card: PrototypeCard) => card.instanceId !== bLatePriest.instanceId
    );
    const bFinal = bLateOthers[0].instanceId as CardInstanceId;
    const bShotVictim = bLateOthers[1].instanceId as CardInstanceId;
    const bLateKeep = new Set<CardInstanceId>([
      bLatePriest.instanceId,
      bFinal,
      bShotVictim,
    ]);
    const aLateKeep = new Set<CardInstanceId>([aShooter, aPriest, aFinal]);

    passDay(pair);
    submitCouncilAccusations(pair, {
      A: {
        type: 'ACCUSE',
        targetInstanceId: findAliveOutside(pair, 'B', bLateKeep),
        voterInstanceIds: [aShooter, aPriest, aFinal],
      },
      B: {
        type: 'ACCUSE',
        targetInstanceId: findAliveOutside(pair, 'A', aLateKeep),
        voterInstanceIds: [bLatePriest.instanceId, bFinal, bShotVictim],
      },
    });
    passNight(pair);
    expectParity(pair, 'after round-seven Council and Night');

    // Round 8 REVEAL, Priest self-elimination, then one-sided Council kill.
    for (const seat of ['A', 'B'] as const) {
      const hidden = livingPrototypeCards(pair.prototype, seat).find(
        (card: PrototypeCard) => !card.revealed
      );
      pair.prototype = dispatchPrototype(pair.prototype, {
        type: 'purge.submit',
        seat,
        target: hidden?.id,
      });
      pair.core = dispatchPlayerAction(pair.core, {
        type: 'PURGE_SUBMIT',
        playerId: PLAYER_BY_SEAT[seat],
        order: {
          rule: 'REVEAL',
          targetId: (hidden?.id ?? null) as CardId | null,
        },
      });
    }
    expectParity(pair, 'after Purge REVEAL');

    const aPriestSlot = prototypeSlotByInstance(pair.prototype, aPriest);
    const bVillageTarget = livingPrototypeCards(pair.prototype, 'B')[0];
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'day.submit',
      seat: 'A',
      kind: 'purify',
      source: aPriestSlot,
      target: bVillageTarget.id,
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: {
        type: 'PURIFY',
        sourceId: aPriestSlot as CardId,
        targetId: bVillageTarget.id,
      },
    });
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'day.submit',
      seat: 'B',
      kind: 'pass',
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      action: { type: 'PASS' },
    });
    submitCouncilAccusations(pair, {
      A: { type: 'PASS' },
      B: {
        type: 'ACCUSE',
        targetInstanceId: findAliveOutside(
          pair,
          'A',
          new Set<CardInstanceId>([aShooter, aFinal])
        ),
        voterInstanceIds: [bLatePriest.instanceId, bFinal, bShotVictim],
      },
    });
    passNight(pair);
    expectParity(pair, 'after round-eight reveal and asymmetric Council');

    // Round 9 LOCK: locked cards remain valid Blood Moon participants because
    // Blood Moon belongs to PlayerState, not to a card source.
    const aFinalSlot = prototypeSlotByInstance(pair.prototype, aFinal);
    const bFinalSlot = prototypeSlotByInstance(pair.prototype, bFinal);
    for (const seat of ['A', 'B'] as const) {
      const targetId = seat === 'A' ? aFinalSlot : bFinalSlot;
      pair.prototype = dispatchPrototype(pair.prototype, {
        type: 'purge.submit',
        seat,
        target: targetId,
      });
      pair.core = dispatchPlayerAction(pair.core, {
        type: 'PURGE_SUBMIT',
        playerId: PLAYER_BY_SEAT[seat],
        order: { rule: 'LOCK', targetId: targetId as CardId },
      });
    }
    expectParity(pair, 'after Purge LOCK');

    const aShooterSlot = prototypeSlotByInstance(pair.prototype, aShooter);
    const bShotSlot = prototypeSlotByInstance(pair.prototype, bShotVictim);
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'day.submit',
      seat: 'A',
      kind: 'shoot',
      source: aShooterSlot,
      target: bShotSlot,
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      action: {
        type: 'SHOOT',
        sourceId: aShooterSlot as CardId,
        targetId: bShotSlot as CardId,
      },
    });

    const bPriestSlot = prototypeSlotByInstance(
      pair.prototype,
      bLatePriest.instanceId
    );
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'day.submit',
      seat: 'B',
      kind: 'purify',
      source: bPriestSlot,
      target: aFinalSlot,
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'DAY_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      action: {
        type: 'PURIFY',
        sourceId: bPriestSlot as CardId,
        targetId: aFinalSlot as CardId,
      },
    });
    expectParity(pair, 'after round-nine Day abilities');

    passCouncil(pair);
    useBloodMoon(pair, 'B', aFinal);
    expectParity(pair, 'at Final Duel');

    const aLast = livingPrototypeCards(pair.prototype, 'A')[0];
    const bLast = livingPrototypeCards(pair.prototype, 'B')[0];
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'final.submit',
      seat: 'A',
      guess: bLast.role,
    });
    pair.prototype = dispatchPrototype(pair.prototype, {
      type: 'final.submit',
      seat: 'B',
      guess: aLast.role,
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_A,
      guess: PROTOTYPE_TO_CORE_ROLE[bLast.role],
    });
    pair.core = dispatchPlayerAction(pair.core, {
      type: 'FINAL_GUESS_SUBMIT',
      playerId: PlayerId.PLAYER_B,
      guess: PROTOTYPE_TO_CORE_ROLE[aLast.role],
    });
    expectParity(pair, 'after Final Duel');
  });
});
