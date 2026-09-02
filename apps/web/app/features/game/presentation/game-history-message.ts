import {
  AbilityId,
  PlayerId,
  type GamePresentationEventV2,
} from '@twofold/shared-types';
import { formatGameRoleName } from './game-display-labels';

export interface GameHistoryMessage {
  readonly title: string;
  readonly detail: string;
}

type PurgeRule = Extract<
  GamePresentationEventV2,
  { readonly type: 'PURGE_RESOLVED' }
>['rule'];

type HistoryAbilityId = Extract<
  GamePresentationEventV2,
  { readonly type: 'ABILITY_RESOLVED' }
>['abilityId'];

const ABILITY_LABELS = {
  [AbilityId.WEREWOLF_ATTACK]: 'Ma sói tấn công',
  [AbilityId.SEER_INSPECT]: 'Tiên tri soi',
  [AbilityId.GUARD_PROTECT]: 'Bảo vệ che chở',
  [AbilityId.WITCH_REVIVE]: 'Phù thủy hồi sinh',
  [AbilityId.WITCH_POISON]: 'Phù thủy dùng độc',
  [AbilityId.SHOOTER_SHOOT]: 'Xạ thủ khai hỏa',
  [AbilityId.AVENGER_MARK]: 'Kẻ báo thù đánh dấu',
  [AbilityId.PRIEST_PURIFY]: 'Mục sư thanh tẩy',
  [AbilityId.SUBSTITUTE_SACRIFICE]: 'Kẻ Thế Mạng chết thay',
  [AbilityId.WOLF_GUARD_RESCUE]: 'Sói Hộ Vệ giải cứu',
  BLOOD_MOON: 'Huyết Nguyệt',
} as const satisfies Record<HistoryAbilityId, string>;

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
  event: GamePresentationEventV2
): GameHistoryMessage {
  switch (event.type) {
    case 'ABILITY_RESOLVED': {
      const ability = ABILITY_LABELS[event.abilityId];
      return {
        title: event.sourceCardId
          ? `${formatCard(event.sourceCardId)} thi triển ${ability}`
          : `${ability} đã được kích hoạt`,
        detail: event.targetCardId
          ? `Mục tiêu riêng của bạn là ${formatCardInline(event.targetCardId)}.`
          : 'Lệnh không có mục tiêu card cụ thể.',
      };
    }

    case 'CARD_REVEALED':
      return {
        title: `${formatCard(event.cardId)} đã lộ diện`,
        detail: `Vai trò công khai: ${formatGameRoleName(event.role)}.`,
      };

    case 'CARD_SAVED':
      return {
        title: `${formatCard(event.cardId)} đã được cứu`,
        detail: 'Nguồn bảo vệ và loại lệnh đêm vẫn được giữ kín.',
      };

    case 'CARD_ELIMINATED':
      return {
        title: `${formatCard(event.cardId)} đã bị loại`,
        detail: event.role
          ? `Vai trò công khai: ${formatGameRoleName(event.role)}.`
          : 'Role và nguyên nhân ban đêm vẫn được giữ kín.',
      };

    case 'CARD_REVIVED':
      return {
        title: `${formatCard(event.cardId)} trở lại bàn đấu`,
        detail: `Vai trò ${formatGameRoleName(event.role)} vẫn được công khai.`,
      };

    case 'PRIVATE_INSPECTION_RESULT':
      return {
        title: `Tiên tri nhìn thấu ${formatCardInline(event.targetCardId)}`,
        detail: `Kết quả bí mật: lá bài mang vai trò ${formatGameRoleName(event.discoveredRole)}.`,
      };

    case 'COUNCIL_RESOLVED':
      return {
        title: event.succeeded
          ? `Hội đồng kết tội ${formatCardInline(event.targetCardId)}`
          : `Cáo buộc ${formatCardInline(event.targetCardId)} thất bại`,
        detail: event.guessedRole
          ? `${PLAYER_LABELS[event.playerId]} dùng ${event.votePower} phiếu và đoán ${formatGameRoleName(event.guessedRole)}.`
          : `${PLAYER_LABELS[event.playerId]} dùng ${event.votePower} phiếu với role đã công khai.`,
      };

    case 'COUNCIL_PASSED':
      return {
        title: `${PLAYER_LABELS[event.playerId]} không mở cáo buộc`,
        detail: 'Hội đồng khép lại mà không có mục tiêu bị đưa ra xét xử.',
      };

    case 'PURGE_RESOLVED':
      return {
        title: `Thanh Trừng ${PURGE_LABELS[event.rule]} đã phân giải`,
        detail: event.status === 'FIZZLED'
          ? 'Batch bị vô hiệu do lựa chọn xung đột; target kín không được công bố.'
          : 'Batch hoàn tất; lựa chọn kín không nằm trong outcome công khai.',
      };

    case 'MATCH_ENDED':
      return {
        title: event.winner ? `${PLAYER_LABELS[event.winner]} chiến thắng` : 'Trận đấu kết thúc hòa',
        detail: `Kết quả được chốt với lý do ${event.reason}.`,
      };

    default:
      return assertNever(event);
  }
}

function formatCard(cardId: string): string {
  return `Lá ${cardId}`;
}

function formatCardInline(cardId: string): string {
  return `lá ${cardId}`;
}

function assertNever(value: never): never {
  throw new Error(`Structured event chưa có history formatter: ${JSON.stringify(value)}`);
}
