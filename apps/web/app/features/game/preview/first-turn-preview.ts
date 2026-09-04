import {
  STANDARD_DECK,
  createInitialCard,
  createInitialGameState,
  createInitialPlayerState,
  serializePlayerView,
  transitionGameState,
} from '@twofold/game-core';
import {
  GamePlayerViewV2Schema,
  PlayerId,
  type GamePlayerViewV2,
  type PlayerGameAction,
} from '@twofold/shared-types';

export interface FirstTurnActionSummary {
  readonly title: string;
  readonly detail: string;
}

/** Tạo snapshot Day A hợp lệ để review UX mà không giả lập room transport. */
export function createFirstTurnPreviewView(
  roomId: string,
  viewerId: PlayerId
): GamePlayerViewV2 {
  const initial = createInitialGameState(roomId, `${roomId}:first-turn-preview`, {
    [PlayerId.PLAYER_A]: createInitialPlayerState(
      PlayerId.PLAYER_A,
      STANDARD_DECK.map((role, index) =>
        createInitialCard(PlayerId.PLAYER_A, index + 1, role)
      )
    ),
    [PlayerId.PLAYER_B]: createInitialPlayerState(
      PlayerId.PLAYER_B,
      STANDARD_DECK.map((role, index) =>
        createInitialCard(PlayerId.PLAYER_B, index + 1, role)
      )
    ),
  });
  const playerALocked = transitionGameState(initial, {
    type: 'SETUP_LOCKED',
    playerId: PlayerId.PLAYER_A,
  });
  const ready = transitionGameState(playerALocked, {
    type: 'SETUP_LOCKED',
    playerId: PlayerId.PLAYER_B,
  });
  return GamePlayerViewV2Schema.parse(serializePlayerView(ready, viewerId));
}

/** Chuyển preview sang lượt Day B sau khi UI đã nhận lựa chọn đầu tiên. */
export function completeFirstTurnPreview(
  view: GamePlayerViewV2
): GamePlayerViewV2 {
  return GamePlayerViewV2Schema.parse({
    ...view,
    phase: { type: 'DAY_B' },
    activePlayer: PlayerId.PLAYER_B,
  });
}

/** Copy xác nhận không tuyên bố resolve gameplay khi preview chỉ khóa lựa chọn. */
export function describeFirstTurnAction(
  action: PlayerGameAction
): FirstTurnActionSummary {
  if (action.type !== 'DAY_SUBMIT') {
    return {
      title: 'Lựa chọn đã được ghi nhận',
      detail: 'Bản mô phỏng đã chuyển sang lượt kế tiếp.',
    };
  }
  if (action.action.type === 'PASS') {
    return {
      title: 'Bạn đã bỏ lượt',
      detail: 'Lượt Ban ngày chuyển sang Người chơi B.',
    };
  }
  const labels = {
    SHOOT: 'Xạ thủ bắn',
    MARK: 'Đánh dấu báo thù',
    PURIFY: 'Thanh tẩy',
    REVIVE: 'Hồi sinh',
  } as const;
  return {
    title: `${labels[action.action.type]} đã khóa`,
    detail: `${action.action.sourceId} đã chọn ${action.action.targetId}. Lượt Ban ngày chuyển sang Người chơi B.`,
  };
}
