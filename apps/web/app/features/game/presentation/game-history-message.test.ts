import {
  AbilityId,
  CardRole,
  Faction,
  GamePresentationEventSchema,
  PlayerId,
  type GamePresentationEventPayloadV2,
  type GamePresentationEventV2,
} from '@twofold/shared-types';
import { describe, expect, it } from 'vitest';
import { formatGameHistoryMessage } from './game-history-message';

function gameEvent(payload: GamePresentationEventPayloadV2): GamePresentationEventV2 {
  return GamePresentationEventSchema.parse({
    id: 'game:event:1',
    sequence: 1,
    round: 3,
    phase: 'NIGHT_RESOLUTION',
    ...payload,
  });
}

const revealedCard = {
  cardId: 'A1' as const,
  instanceId: 'A:1' as const,
  owner: PlayerId.PLAYER_A,
  role: CardRole.VILLAGER,
  faction: Faction.VILLAGE,
};

describe('formatGameHistoryMessage', () => {
  it.each([
    [
      {
        type: 'ABILITY_RESOLVED',
        abilityId: AbilityId.SEER_INSPECT,
        sourceCardId: 'A4',
        targetCardId: 'B1',
      },
      'Lá A4 thi triển Tiên tri soi',
    ],
    [{ type: 'CARD_REVEALED', ...revealedCard }, 'Lá A1 đã lộ diện'],
    [{ type: 'CARD_ELIMINATED', ...revealedCard }, 'Lá A1 đã bị loại'],
    [
      {
        type: 'CARD_SAVED',
        cardId: 'A3',
        instanceId: 'A:3',
        owner: PlayerId.PLAYER_A,
      },
      'Lá A3 đã được cứu',
    ],
    [{ type: 'CARD_REVIVED', ...revealedCard }, 'Lá A1 trở lại bàn đấu'],
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
        type: 'COUNCIL_RESOLVED',
        playerId: PlayerId.PLAYER_A,
        targetCardId: 'B5',
        guessedRole: CardRole.WEREWOLF,
        votePower: 3,
        succeeded: true,
      },
      'Hội đồng kết tội lá B5',
    ],
    [
      { type: 'COUNCIL_PASSED', playerId: PlayerId.PLAYER_B },
      'Người chơi B không mở cáo buộc',
    ],
    [
      { type: 'PURGE_RESOLVED', rule: 'SWAP', status: 'RESOLVED' },
      'Thanh Trừng Hoán Đổi đã phân giải',
    ],
    [
      { type: 'MATCH_ENDED', winner: PlayerId.PLAYER_A, reason: 'FINAL_DUEL' },
      'Người chơi A chiến thắng',
    ],
  ] satisfies readonly (readonly [GamePresentationEventPayloadV2, string])[])(
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
