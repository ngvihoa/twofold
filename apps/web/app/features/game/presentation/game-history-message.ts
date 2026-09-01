import {
  AbilityId,
  PlayerId,
  type GameEventV2,
} from '@twofold/shared-types';
import { formatGameRoleName } from './game-display-labels';

export interface GameHistoryMessage {
  readonly title: string;
  readonly detail: string;
}

type HistoryAbilityId = Extract<
  GameEventV2,
  { readonly type: 'ABILITY_RESOLVED' }
>['abilityId'];
type HistoryEffectKind = Extract<
  GameEventV2,
  { readonly type: 'EFFECT_APPLIED' }
>['effectKind'];
type PurgeRule = Extract<
  GameEventV2,
  { readonly type: 'PURGE_RESOLVED' }
>['rule'];

const ABILITY_LABELS = {
  [AbilityId.WEREWOLF_ATTACK]: 'Ma sói tấn công',
  [AbilityId.SEER_INSPECT]: 'Tiên tri soi',
  [AbilityId.GUARD_PROTECT]: 'Bảo vệ che chở',
  [AbilityId.WITCH_REVIVE]: 'Phù thủy hồi sinh',
  [AbilityId.WITCH_POISON]: 'Phù thủy dùng độc',
  [AbilityId.SHOOTER_SHOOT]: 'Xạ thủ khai hỏa',
  [AbilityId.AVENGER_MARK]: 'Kẻ báo thù đánh dấu',
  [AbilityId.PRIEST_PURIFY]: 'Mục sư thanh tẩy',
  [AbilityId.WOLF_GUARD_RESCUE]: 'Sói Hộ Vệ giải cứu',
  BLOOD_MOON: 'Huyết Nguyệt',
} as const satisfies Record<HistoryAbilityId, string>;

const EFFECT_LABELS = {
  PROTECTION: 'Khiên bảo hộ',
  REVENGE_MARK: 'Dấu ấn báo thù',
  COUNCIL_LOCK: 'Khóa Hội đồng',
  PURGE_LOCK: 'Khóa Thanh Trừng',
} as const satisfies Record<HistoryEffectKind, string>;

const PURGE_LABELS = {
  CUT: 'Đoạn Tuyệt',
  SWAP: 'Hoán Đổi',
  REVEAL: 'Vạch Mặt',
  LOCK: 'Phong Tỏa',
} as const satisfies Record<PurgeRule, string>;

const PLAYER_LABELS = {
  [PlayerId.PLAYER_A]: 'Người chơi A',
  [PlayerId.PLAYER_B]: 'Người chơi B',
} as const satisfies Record<PlayerId, string>;

/** Chuyển structured game event thành wording ngắn gọn cho history rail. */
export function formatGameHistoryMessage(
  event: GameEventV2
): GameHistoryMessage {
  switch (event.type) {
    case 'CARD_REVEALED':
      return {
        title: `${formatCard(event.cardId)} đã lộ diện`,
        detail: 'Danh tính của lá bài giờ đã được công khai trên bàn đấu.',
      };

    case 'ABILITY_RESOLVED': {
      const ability = ABILITY_LABELS[event.abilityId];
      const source = event.sourceCardId
        ? `${formatCard(event.sourceCardId)} thi triển ${ability}`
        : `${ability} đã được kích hoạt`;
      return {
        title: source,
        detail: event.targetCardId
          ? `Mục tiêu là ${formatCardInline(event.targetCardId)}.`
          : 'Mục tiêu hoặc kết quả được giữ kín với người xem.',
      };
    }

    case 'EFFECT_APPLIED':
      return {
        title: `${EFFECT_LABELS[event.effectKind]} phủ lên ${formatCardInline(event.targetCardId)}`,
        detail: 'Hiệu ứng đã có hiệu lực và có thể thay đổi lần phân giải kế tiếp.',
      };

    case 'EFFECT_BLOCKED':
      return {
        title: `${EFFECT_LABELS[event.effectKind]} đã chặn đòn`,
        detail: `${formatCard(event.targetCardId)} thoát khỏi hiệu ứng vừa nhắm tới.`,
      };

    case 'CARD_ELIMINATED':
      return formatEliminationMessage(event);

    case 'CARD_REVIVED':
      return {
        title: `${formatCard(event.cardId)} trở lại bàn đấu`,
        detail: `${formatCard(event.sourceCardId)} đã đưa lá bài này trở về từ cõi chết.`,
      };

    case 'PRIVATE_INSPECTION_RESULT':
      return {
        title: `Tiên tri nhìn thấu ${formatCardInline(event.targetCardId)}`,
        detail: `Kết quả bí mật: lá bài mang vai trò ${formatGameRoleName(event.discoveredRole)}.`,
      };

    case 'COUNCIL_ACCUSATION_RESOLVED':
      return {
        title: event.succeeded
          ? `Hội đồng kết tội ${formatCardInline(event.targetCardId)}`
          : `Cáo buộc ${formatCardInline(event.targetCardId)} thất bại`,
        detail: `${PLAYER_LABELS[event.playerId]} triệu tập ${formatCardList(event.voterIds)} để biểu quyết.`,
      };

    case 'COUNCIL_PASSED':
      return {
        title: `${PLAYER_LABELS[event.playerId]} không mở cáo buộc`,
        detail: 'Hội đồng khép lại mà không có mục tiêu bị đưa ra xét xử.',
      };

    case 'DEFENSE_SKIPPED':
      return {
        title: `${PLAYER_LABELS[event.playerId]} bỏ qua phòng thủ`,
        detail: 'Không lá bài nào được Bảo vệ che chở trong hoàng hôn này.',
      };

    case 'WOLF_GUARD_RESCUED':
      return {
        title: `Sói Hộ Vệ cứu ${formatCardInline(event.targetCardId)}`,
        detail: `${formatCard(event.sourceCardId)} đã can thiệp và vô hiệu hóa phán quyết Hội đồng.`,
      };

    case 'PURGE_RESOLVED':
      return formatPurgeMessage(event);

    case 'FINAL_DUEL_RESOLVED':
      return {
        title: 'Đấu tay đôi cuối trận đã phân định',
        detail: `${formatCard(event.cardAId)} đoán ${formatGameRoleName(event.guessA)} (${formatCorrectness(event.correctA)}); ${formatCard(event.cardBId)} đoán ${formatGameRoleName(event.guessB)} (${formatCorrectness(event.correctB)}).`,
      };

    case 'DAWN_PRESENTATION_COMPLETED':
      return {
        title: 'Bình minh đã khép lại',
        detail: 'Mọi kết quả trong đêm đã được công bố; vòng đấu chuẩn bị tiếp diễn.',
      };

    default:
      return assertNever(event);
  }
}

function formatEliminationMessage(
  event: Extract<GameEventV2, { readonly type: 'CARD_ELIMINATED' }>
): GameHistoryMessage {
  const target = formatCard(event.cardId);
  switch (event.cause.type) {
    case 'ABILITY':
      return {
        title: `${target} đã bị loại`,
        detail: `${formatCard(event.cause.sourceCardId)} kết liễu mục tiêu bằng ${ABILITY_LABELS[event.cause.abilityId]}.`,
      };
    case 'PLAYER_ABILITY':
      return {
        title: `${target} gục ngã dưới Huyết Nguyệt`,
        detail: `${PLAYER_LABELS[event.cause.playerId]} đã kích hoạt năng lực đặc biệt.`,
      };
    case 'COUNCIL':
      return {
        title: `${target} bị Hội đồng loại bỏ`,
        detail: `Phán quyết được khởi xướng bởi ${PLAYER_LABELS[event.cause.playerId].toLowerCase()}.`,
      };
    case 'PURGE':
      return {
        title: `${target} không sống sót qua Thanh Trừng`,
        detail: `Luật ${PURGE_LABELS[event.cause.rule]} đã loại lá bài khỏi bàn đấu.`,
      };
    case 'REVENGE':
      return {
        title: `${target} bị kéo theo bởi báo thù`,
        detail: `Dấu ấn từ ${formatCardInline(event.cause.sourceCardId)} đã được kích hoạt.`,
      };
    default:
      return assertNever(event.cause);
  }
}

function formatPurgeMessage(
  event: Extract<GameEventV2, { readonly type: 'PURGE_RESOLVED' }>
): GameHistoryMessage {
  const actor = PLAYER_LABELS[event.playerId];
  switch (event.rule) {
    case 'CUT':
      return {
        title: `${actor} chọn Đoạn Tuyệt`,
        detail: event.targetCardId
          ? `${formatCard(event.targetCardId)} bị chọn để rời bàn đấu.`
          : 'Không có lá bài hợp lệ để loại bỏ.',
      };
    case 'SWAP':
      return {
        title: `${actor} thực hiện Hoán Đổi`,
        detail:
          event.targetCardId && event.swapTargetCardId
            ? `${formatCard(event.targetCardId)} đổi vị trí với ${formatCardInline(event.swapTargetCardId)}.`
            : 'Không có cặp lá bài hợp lệ để hoán đổi.',
      };
    case 'REVEAL':
      return {
        title: `${actor} chọn Vạch Mặt`,
        detail: event.targetCardId
          ? `${formatCard(event.targetCardId)} buộc phải công khai danh tính.`
          : 'Không còn lá bài ẩn hợp lệ để lật mở.',
      };
    case 'LOCK':
      return {
        title: `${actor} tung Phong Tỏa`,
        detail: event.targetCardId
          ? `${formatCard(event.targetCardId)} bị khóa bởi luật Thanh Trừng.`
          : 'Không có mục tiêu hợp lệ để phong tỏa.',
      };
    default:
      return assertNever(event.rule);
  }
}

function formatCard(cardId: string): string {
  return `Lá ${cardId}`;
}

function formatCardInline(cardId: string): string {
  return `lá ${cardId}`;
}

function formatCardList(cardIds: readonly string[]): string {
  return cardIds.map(formatCardInline).join(', ');
}

function formatCorrectness(correct: boolean): string {
  return correct ? 'đúng' : 'sai';
}

function assertNever(value: never): never {
  throw new Error(`Structured event chưa có history formatter: ${JSON.stringify(value)}`);
}
