import { PlayerId } from '@twofold/shared-types';
import { describe, expect, it } from 'vitest';
import { createDayAbilityAction, createDayPassAction } from '../action/game-action-model';
import {
  completeFirstTurnPreview,
  createFirstTurnPreviewView,
  describeFirstTurnAction,
} from './first-turn-preview';

describe('first turn UX preview', () => {
  it('starts from a locked Day A snapshot without leaking opponent roles', () => {
    const view = createFirstTurnPreviewView('ABC123', PlayerId.PLAYER_A);

    expect(view.phase.type).toBe('DAY_A');
    expect(view.activePlayer).toBe(PlayerId.PLAYER_A);
    expect(view.self.setup.status).toBe('LOCKED');
    expect(view.opponent.setupLocked).toBe(true);
    expect(view.opponent.board.every((card) => card.role === null)).toBe(true);
  });

  it('keeps the viewer while moving the preview to Day B', () => {
    const view = createFirstTurnPreviewView('ABC123', PlayerId.PLAYER_A);
    const next = completeFirstTurnPreview(view);

    expect(next.viewerId).toBe(PlayerId.PLAYER_A);
    expect(next.phase.type).toBe('DAY_B');
    expect(next.activePlayer).toBe(PlayerId.PLAYER_B);
  });

  it('describes both a role action and a pass in player language', () => {
    expect(describeFirstTurnAction(
      createDayAbilityAction(PlayerId.PLAYER_A, 'MARK', 'A7', 'B3')
    )).toEqual({
      title: 'Đánh dấu báo thù đã khóa',
      detail: 'A7 đã chọn B3. Lượt Ban ngày chuyển sang Người chơi B.',
    });
    expect(describeFirstTurnAction(createDayPassAction(PlayerId.PLAYER_A)).title)
      .toBe('Bạn đã bỏ lượt');
  });
});
