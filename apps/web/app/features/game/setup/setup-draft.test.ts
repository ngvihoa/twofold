import { PlayerGameActionSchema, PlayerId } from '@twofold/shared-types';
import {
  STANDARD_DECK,
  createInitialCard,
  createInitialGameState,
  createInitialPlayerState,
  serializePlayerView,
} from '@twofold/game-core';
import { describe, expect, it } from 'vitest';
import {
  createSetupDraft,
  createSetupLockAction,
  createSetupReorderAction,
  moveSetupCard,
  reconcileSetupDraft,
  setupOrderKey,
  toSetupOrder,
} from './setup-draft';

function createPrivateBoard() {
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
  const game = createInitialGameState('setup-ui-test', 'setup-ui-seed', {
    [PlayerId.PLAYER_A]: playerA,
    [PlayerId.PLAYER_B]: playerB,
  });
  return serializePlayerView(game, PlayerId.PLAYER_A).self.board;
}

describe('setup draft', () => {
  it('creates a 10-card draft and reorders it without mutating the baseline', () => {
    const draft = createSetupDraft(createPrivateBoard());
    const moved = moveSetupCard(draft.order, 0, 2);

    expect(draft.order.slice(0, 3)).toEqual(['A:1', 'A:2', 'A:3']);
    expect(moved.slice(0, 3)).toEqual(['A:2', 'A:3', 'A:1']);
    expect(moved).not.toBe(draft.order);
  });

  it('keeps an unsaved draft when a snapshot repeats the same authoritative order', () => {
    const baseline = createSetupDraft(createPrivateBoard());
    const edited = {
      ...baseline,
      order: moveSetupCard(baseline.order, 0, 1),
    };

    const reconciled = reconcileSetupDraft(edited, baseline.order);

    expect(reconciled).toBe(edited);
    expect(reconciled.order.slice(0, 2)).toEqual(['A:2', 'A:1']);
  });

  it('adopts a changed authoritative order after server acknowledgement', () => {
    const baseline = createSetupDraft(createPrivateBoard());
    const submittedOrder = moveSetupCard(baseline.order, 0, 1);
    const edited = { ...baseline, order: submittedOrder };

    const reconciled = reconcileSetupDraft(edited, submittedOrder);

    expect(reconciled).not.toBe(edited);
    expect(reconciled.order).toBe(submittedOrder);
    expect(reconciled.authoritativeKey).toBe(setupOrderKey(submittedOrder));
  });

  it('creates setup actions accepted by the shared v0.2 schema', () => {
    const order = createSetupDraft(createPrivateBoard()).order;

    expect(
      PlayerGameActionSchema.parse(
        createSetupReorderAction(PlayerId.PLAYER_A, order)
      )
    ).toMatchObject({ type: 'SETUP_REORDER', order });
    expect(
      PlayerGameActionSchema.parse(createSetupLockAction(PlayerId.PLAYER_A))
    ).toEqual({ type: 'SETUP_LOCK', playerId: PlayerId.PLAYER_A });
  });

  it('rejects incomplete and duplicate setup orders', () => {
    expect(() => toSetupOrder(['A:1'])).toThrow(/đúng 10/u);
    expect(() =>
      toSetupOrder([
        'A:1', 'A:1', 'A:2', 'A:3', 'A:4',
        'A:5', 'A:6', 'A:7', 'A:8', 'A:9',
      ])
    ).toThrow(/trùng/u);
  });
});
