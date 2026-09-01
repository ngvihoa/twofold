import { describe, expect, it } from 'vitest';
import {
  AbilityId,
  CardIdSchema,
  CardRole,
  ClientWsMessageSchema,
  GameEventSchema,
  GamePlayerViewV2Schema,
  PlayerGameActionSchema,
  PlayerId,
  PublicCardViewV2Schema,
  ServerWsMessageSchema,
} from '@twofold/shared-types';
import { createInitialCard } from './cards';
import { createInitialGameState } from './game-state';
import { appendGameEvents } from './game-events';
import { serializePlayerView } from './player-view';
import { createInitialPlayerState } from './players';
import { STANDARD_DECK } from './roles';
import {
  dispatchPlayerAction,
  type PlayerGameAction as CorePlayerGameAction,
} from './rule-pipeline';

function createStandardGame() {
  const playerA = createInitialPlayerState(
    PlayerId.PLAYER_A,
    STANDARD_DECK.map((role, index) =>
      createInitialCard(PlayerId.PLAYER_A, index + 1, role)
    )
  );
  const playerB = createInitialPlayerState(
    PlayerId.PLAYER_B,
    STANDARD_DECK.map((role, index) =>
      createInitialCard(PlayerId.PLAYER_B, index + 1, role)
    )
  );
  return createInitialGameState('shared-contract', 'shared-contract-seed', {
    [PlayerId.PLAYER_A]: playerA,
    [PlayerId.PLAYER_B]: playerB,
  });
}

describe('shared-types ruleset v0.2 contract', () => {
  it('parses every action variant produced for the core pipeline', () => {
    const actions: readonly CorePlayerGameAction[] = [
      {
        type: 'SETUP_REORDER',
        playerId: PlayerId.PLAYER_A,
        order: ['A:10', 'A:9', 'A:8', 'A:7', 'A:6', 'A:5', 'A:4', 'A:3', 'A:2', 'A:1'],
      },
      { type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_A },
      {
        type: 'DAY_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        action: { type: 'SHOOT', sourceId: 'A7', targetId: 'B1' },
      },
      {
        type: 'COUNCIL_ACCUSATION_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: {
          type: 'ACCUSE',
          targetId: 'B1',
          guessedRole: CardRole.WEREWOLF,
          voterIds: ['A1', 'A2', 'A3'],
        },
      },
      {
        type: 'COUNCIL_REACTION_SUBMIT',
        playerId: PlayerId.PLAYER_B,
        order: { type: 'SUBSTITUTE_SACRIFICE', sourceId: 'B10' },
      },
      {
        type: 'NIGHT_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: {
          type: 'USE_ABILITY',
          sourceId: 'A4',
          abilityId: AbilityId.SEER_INSPECT,
          targetId: 'B1',
        },
      },
      {
        type: 'DEFENSE_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: { type: 'PROTECT', sourceId: 'A5', targetId: 'B1' },
      },
      {
        type: 'PURGE_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: { rule: 'SWAP', ownTargetId: 'A1', opponentTargetId: 'B1' },
      },
      {
        type: 'FINAL_GUESS_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        guess: CardRole.WEREWOLF,
      },
    ];

    for (const action of actions) {
      expect(PlayerGameActionSchema.safeParse(action).success).toBe(true);
    }

    expect(
      ClientWsMessageSchema.safeParse({
        type: 'SUBMIT_ACTION',
        payload: actions[0],
      }).success
    ).toBe(true);
  });

  it('reorders card occupants during Setup before the player locks', () => {
    const game = createStandardGame();
    const reversed = [...game.players[PlayerId.PLAYER_A].board]
      .reverse()
      .map((card) => card.occupant.id) as [
      'A:10',
      'A:9',
      'A:8',
      'A:7',
      'A:6',
      'A:5',
      'A:4',
      'A:3',
      'A:2',
      'A:1',
    ];
    const reordered = dispatchPlayerAction(game, {
      type: 'SETUP_REORDER',
      playerId: PlayerId.PLAYER_A,
      order: reversed,
    });

    expect(reordered.players[PlayerId.PLAYER_A].board[0].occupant.id).toBe('A:10');
    const locked = dispatchPlayerAction(reordered, {
      type: 'SETUP_LOCK',
      playerId: PlayerId.PLAYER_A,
    });
    expect(locked.players[PlayerId.PLAYER_A].setup.status).toBe('LOCKED');
  });

  it('parses the real filtered player view emitted by game-core', () => {
    const game = appendGameEvents(createStandardGame(), [
      {
        type: 'CARD_REVEALED',
        cardId: 'B1',
        visibility: { type: 'PUBLIC' },
      },
      {
        type: 'PRIVATE_INSPECTION_RESULT',
        intelId: 'intel-a-b1-round-1',
        targetCardId: 'B1',
        discoveredRole: CardRole.VILLAGER,
        visibility: { type: 'PRIVATE', playerId: PlayerId.PLAYER_A },
      },
    ]);
    const view = serializePlayerView(game, PlayerId.PLAYER_A);
    const parsed = GamePlayerViewV2Schema.parse(view);

    expect(parsed.self.board).toHaveLength(10);
    expect(parsed.opponent.board.every((card) => card.role === null)).toBe(true);
    expect(parsed.events).toHaveLength(2);
    expect(
      ServerWsMessageSchema.safeParse({
        type: 'GAME_STATE_UPDATE',
        payload: view,
      }).success
    ).toBe(true);
  });

  it('rejects malformed IDs, empty Council voters and public hidden roles', () => {
    expect(CardIdSchema.safeParse('A20').success).toBe(false);
    expect(
      PlayerGameActionSchema.safeParse({
        type: 'COUNCIL_ACCUSATION_SUBMIT',
        playerId: PlayerId.PLAYER_A,
        order: {
          type: 'ACCUSE',
          targetId: 'B1',
          guessedRole: CardRole.WEREWOLF,
          voterIds: [],
        },
      }).success
    ).toBe(false);
    expect(
      PublicCardViewV2Schema.safeParse({
        id: 'B1',
        instanceId: 'B:1',
        position: 1,
        owner: PlayerId.PLAYER_B,
        state: { life: 'DEAD', visibility: 'HIDDEN' },
        role: CardRole.WEREWOLF,
        effects: [],
      }).success
    ).toBe(false);
  });

  it('rejects Seer intel events accidentally marked public', () => {
    expect(
      GameEventSchema.safeParse({
        id: 'game:event:1',
        sequence: 1,
        round: 1,
        phase: 'NIGHT_RESOLUTION',
        visibility: { type: 'PUBLIC' },
        type: 'PRIVATE_INSPECTION_RESULT',
        intelId: 'intel-1',
        targetCardId: 'B1',
        discoveredRole: CardRole.WEREWOLF,
      }).success
    ).toBe(false);
  });
});
