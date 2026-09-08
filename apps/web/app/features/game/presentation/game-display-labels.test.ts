import { describe, expect, it } from 'vitest';
import {
  GAME_CARD_LIFE_LABELS,
  GAME_CARD_VISIBILITY_LABELS,
  GAME_PHASE_LABELS,
  formatGameCardLife,
  formatGameCardVisibility,
  formatGamePhaseName,
} from './game-display-labels';

describe('game phase labels', () => {
  it('maps every technical phase to meaningful Vietnamese wording', () => {
    expect(GAME_PHASE_LABELS).toEqual({
      SETUP: 'Chuẩn bị đội hình',
      DAY_A: 'Ban ngày · Người chơi A hành động',
      DAY_B: 'Ban ngày · Người chơi B hành động',
      COUNCIL_PLAN: 'Hội đồng · Lập cáo buộc',
      COUNCIL_RESOLUTION: 'Hội đồng · Công bố phán quyết',
      COUNCIL_REACTION: 'Hội đồng · Quyết định chết thay',
      NIGHT_PLAN: 'Ban đêm · Chọn hành động',
      DUSK_DEFENSE: 'Phòng thủ ban đêm · Đặt khiên',
      NIGHT_RESOLUTION: 'Ban đêm · Phân giải hành động',
      DAWN: 'Bình minh · Công bố kết quả',
      PURGE_PLAN: 'Thanh Trừng · Chọn mục tiêu',
      PURGE_RESOLUTION: 'Thanh Trừng · Công bố kết quả',
      FINAL_DUEL: 'Đối đầu cuối trận',
      ENDED: 'Trận đấu kết thúc',
    });
  });

  it('formats DAY_A without exposing its enum value', () => {
    const label = formatGamePhaseName('DAY_A');

    expect(label).toBe('Ban ngày · Người chơi A hành động');
    expect(label).not.toContain('DAY_A');
  });
});

describe('game card state labels', () => {
  it('maps lifecycle and visibility enums to Vietnamese wording', () => {
    expect(GAME_CARD_LIFE_LABELS).toEqual({
      ALIVE: 'Sống',
      DEAD: 'Chết',
    });
    expect(GAME_CARD_VISIBILITY_LABELS).toEqual({
      HIDDEN: 'Ẩn',
      REVEALED: 'Hiện',
    });
    expect(formatGameCardLife('ALIVE')).toBe('Sống');
    expect(formatGameCardVisibility('REVEALED')).toBe('Hiện');
  });
});
