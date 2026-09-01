import {
  AbilityId,
  CardRole,
  GameEventSchema,
  PlayerId,
  type GameEventPayloadV2,
  type GameEventV2,
} from '@twofold/shared-types';
import { describe, expect, it } from 'vitest';
import { formatGameHistoryMessage } from './game-history-message';

function gameEvent(payload: GameEventPayloadV2): GameEventV2 {
  return GameEventSchema.parse({
    id: 'game:event:1',
    sequence: 1,
    round: 3,
    phase: 'NIGHT_RESOLUTION',
    visibility:
      payload.type === 'PRIVATE_INSPECTION_RESULT'
        ? { type: 'PRIVATE', playerId: PlayerId.PLAYER_A }
        : { type: 'PUBLIC' },
    ...payload,
  });
}

describe('formatGameHistoryMessage', () => {
  it.each([
    [{ type: 'CARD_REVEALED', cardId: 'A1' }, 'Lá A1 đã lộ diện'],
    [
      {
        type: 'ABILITY_RESOLVED',
        abilityId: AbilityId.WEREWOLF_ATTACK,
        sourceCardId: 'A2',
        targetCardId: 'B2',
      },
      'Lá A2 thi triển Ma sói tấn công',
    ],
    [
      { type: 'EFFECT_APPLIED', targetCardId: 'A3', effectKind: 'PROTECTION' },
      'Khiên bảo hộ phủ lên lá A3',
    ],
    [
      { type: 'EFFECT_BLOCKED', targetCardId: 'A3', effectKind: 'PROTECTION' },
      'Khiên bảo hộ đã chặn đòn',
    ],
    [
      {
        type: 'CARD_ELIMINATED',
        cardId: 'B2',
        cause: {
          type: 'ABILITY',
          abilityId: AbilityId.WEREWOLF_ATTACK,
          sourceCardId: 'A2',
        },
      },
      'Lá B2 đã bị loại',
    ],
    [
      { type: 'CARD_REVIVED', cardId: 'A4', sourceCardId: 'A5' },
      'Lá A4 trở lại bàn đấu',
    ],
    [
      {
        type: 'PRIVATE_INSPECTION_RESULT',
        intelId: 'intel-1',
        targetCardId: 'B4',
        discoveredRole: CardRole.WEREWOLF,
      },
      'Tiên tri nhìn thấu lá B4',
    ],
    [
      {
        type: 'COUNCIL_ACCUSATION_RESOLVED',
        playerId: PlayerId.PLAYER_A,
        targetCardId: 'B5',
        voterIds: ['A1', 'A2', 'A3'],
        succeeded: true,
      },
      'Hội đồng kết tội lá B5',
    ],
    [
      { type: 'COUNCIL_PASSED', playerId: PlayerId.PLAYER_B },
      'Người chơi B không mở cáo buộc',
    ],
    [
      { type: 'DEFENSE_SKIPPED', playerId: PlayerId.PLAYER_A },
      'Người chơi A bỏ qua phòng thủ',
    ],
    [
      { type: 'SUBSTITUTE_SACRIFICED', sourceCardId: 'B8', targetCardId: 'B4' },
      'Kẻ Thế Mạng cứu lá B4',
    ],
    [
      {
        type: 'PURGE_RESOLVED',
        playerId: PlayerId.PLAYER_A,
        rule: 'SWAP',
        targetCardId: 'A6',
        swapTargetCardId: 'B6',
      },
      'Người chơi A thực hiện Hoán Đổi',
    ],
    [
      {
        type: 'FINAL_DUEL_RESOLVED',
        cardAId: 'A10',
        cardBId: 'B10',
        guessA: CardRole.SEER,
        guessB: CardRole.WEREWOLF,
        correctA: true,
        correctB: false,
      },
      'Đấu tay đôi cuối trận đã phân định',
    ],
    [{ type: 'DAWN_PRESENTATION_COMPLETED' }, 'Bình minh đã khép lại'],
  ] satisfies readonly (readonly [GameEventPayloadV2, string])[])(
    'formats event case %# with readable Vietnamese wording',
    (payload, expectedTitle) => {
      const message = formatGameHistoryMessage(gameEvent(payload));

      expect(message.title).toBe(expectedTitle);
      expect(message.detail.length).toBeGreaterThan(10);
      expect(message.title).not.toBe(payload.type);
    }
  );

  it('describes private intel without exposing its internal identifier', () => {
    const message = formatGameHistoryMessage(
      gameEvent({
        type: 'PRIVATE_INSPECTION_RESULT',
        intelId: 'secret-internal-id',
        targetCardId: 'B4',
        discoveredRole: CardRole.WEREWOLF,
      })
    );

    expect(message.detail).toContain('Ma sói');
    expect(`${message.title} ${message.detail}`).not.toContain('secret-internal-id');
  });
});
