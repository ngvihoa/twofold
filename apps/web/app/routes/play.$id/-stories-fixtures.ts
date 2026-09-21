import {
  STANDARD_DECK,
  createInitialCard,
  createInitialGameState,
  createInitialPlayerState,
  serializePlayerView,
} from '@twofold/game-core';
import {
  CardRole,
  GamePlayerViewV2Schema,
  PlayerId,
  type GamePlayerViewV2,
  type PrivateCardViewV2,
  type PrivatePlayerViewV2,
  type PublicCardViewV2,
  type VisibleCardEffectV2,
} from '@twofold/shared-types';
import type { CardIntentIndicator } from './-Prototype.GameCardEffects';

/**
 * View chuẩn của Player A; bắt chước pattern trong
 * `-Prototype.GameBoard.test.tsx:30` để story và fixture không chệch runtime.
 */
export function createTestView(
  overrides: Partial<GamePlayerViewV2> = {}
): GamePlayerViewV2 {
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
  return GamePlayerViewV2Schema.parse({
    ...serializePlayerView(
      createInitialGameState('story-fixtures', 'story-fixtures-seed', {
        [PlayerId.PLAYER_A]: playerA,
        [PlayerId.PLAYER_B]: playerB,
      }),
      PlayerId.PLAYER_A
    ),
    ...overrides,
  });
}

/** View riêng tư (self) chuẩn của Player A, tách từ `createTestView().self`. */
export function createTestPlayer(
  overrides: Partial<PrivatePlayerViewV2> = {}
): PrivatePlayerViewV2 {
  return { ...createTestView().self, ...overrides };
}

/** Card đầu tiên của phe mình: Dân làng, sống, ẩn, chưa có effect. */
export const mockSelfCard: PrivateCardViewV2 = createTestView().self.board[0];

/** Card đầu tiên của đối thủ: ẩn hoàn toàn, role = null. */
export const mockOpponentCard: PublicCardViewV2 =
  createTestView().opponent.board[0];

/** Card của mình đã chết (giữ nguyên role để hiển thị khi kind = 'self'). */
export const mockEliminatedCard: PrivateCardViewV2 = {
  ...mockSelfCard,
  state: { ...mockSelfCard.state, life: 'DEAD' },
};

/** Card đối thủ đã lộ mặt: visibility = REVEALED kèm role tương ứng. */
export const mockRevealedOpponentCard: PublicCardViewV2 = {
  ...mockOpponentCard,
  state: { ...mockOpponentCard.state, visibility: 'REVEALED' },
  role: CardRole.WEREWOLF,
};

/** Đủ 5 effect hợp lệ theo ruleset, keyed theo kind. */
export const mockEffects: Record<
  VisibleCardEffectV2['kind'],
  VisibleCardEffectV2
> = {
  PROTECTION: {
    kind: 'PROTECTION',
    appliedRound: 2,
    expires: { type: 'AFTER_PHASE', phase: 'NIGHT_RESOLUTION', round: 2 },
  },
  REVENGE_MARK: {
    kind: 'REVENGE_MARK',
    appliedRound: 2,
    expires: { type: 'AFTER_PHASE', phase: 'NIGHT_RESOLUTION', round: 2 },
  },
  COUNCIL_LOCK: {
    kind: 'COUNCIL_LOCK',
    appliedRound: 3,
    expires: { type: 'AFTER_PHASE', phase: 'COUNCIL_RESOLUTION', round: 4 },
  },
  PURGE_LOCK: {
    kind: 'PURGE_LOCK',
    appliedRound: 6,
    expires: { type: 'AFTER_PHASE', phase: 'NIGHT_RESOLUTION', round: 6 },
  },
  ROUND_EXHAUSTED: {
    kind: 'ROUND_EXHAUSTED',
    appliedRound: 1,
    expires: { type: 'AFTER_PHASE', phase: 'NIGHT_RESOLUTION', round: 1 },
  },
};

/** Đủ 6 intent indicator, keyed theo kind. */
export const mockIntents: Record<CardIntentIndicator, CardIntentIndicator> = {
  PENDING_PROTECTION: 'PENDING_PROTECTION',
  PENDING_INSPECTION: 'PENDING_INSPECTION',
  PENDING_ATTACK: 'PENDING_ATTACK',
  PENDING_POISON: 'PENDING_POISON',
  PENDING_BLOOD_MOON: 'PENDING_BLOOD_MOON',
  PENDING_HANGING: 'PENDING_HANGING',
};