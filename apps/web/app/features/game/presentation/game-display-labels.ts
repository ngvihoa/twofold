import { CardRole } from '@twofold/shared-types';

/** Tên vai trò dùng ở presentation; domain và wire contract vẫn giữ enum ổn định. */
export const GAME_ROLE_LABELS = {
  [CardRole.VILLAGER]: 'Dân làng',
  [CardRole.WEREWOLF]: 'Ma sói',
  [CardRole.SEER]: 'Tiên tri',
  [CardRole.GUARD]: 'Bảo vệ',
  [CardRole.WITCH]: 'Phù thủy',
  [CardRole.SHOOTER]: 'Xạ thủ',
  [CardRole.AVENGER]: 'Kẻ báo thù',
  [CardRole.PRIEST]: 'Mục sư',
  [CardRole.WOLF_GUARD]: 'Sói Hộ Vệ',
} as const satisfies Record<CardRole, string>;

export interface GameRoleTooltipContent {
  readonly name: string;
  readonly faction: 'Phe Dân làng' | 'Phe Ma sói';
  readonly description: string;
}

const GAME_ROLE_TOOLTIPS = {
  [CardRole.VILLAGER]: {
    faction: 'Phe Dân làng',
    description:
      'Không có kỹ năng chủ động. Khi tham gia Hội đồng, lá này có trọng số 2 phiếu thay vì 1.',
  },
  [CardRole.WEREWOLF]: {
    faction: 'Phe Ma sói',
    description:
      'Ban đêm chọn một lá đối thủ để tấn công. Đòn đánh sẽ bị Khiên bảo hộ chặn.',
  },
  [CardRole.SEER]: {
    faction: 'Phe Dân làng',
    description:
      'Ban đêm soi một lá đối thủ và nhận kết quả riêng. Soi lại một lá phe Sói đã biết sẽ kết liễu mục tiêu; Khiên không chặn được soi.',
  },
  [CardRole.GUARD]: {
    faction: 'Phe Dân làng',
    description:
      'Ở Hoàng hôn, bảo vệ một lá khác bên mình khỏi tấn công, đầu độc hoặc Huyết Nguyệt. Không thể tự bảo vệ hay chọn cùng mục tiêu hai vòng liên tiếp.',
  },
  [CardRole.WITCH]: {
    faction: 'Phe Dân làng',
    description:
      'Ban ngày hồi sinh một đồng minh đã chết; ban đêm đầu độc một lá đối thủ. Mỗi kỹ năng được dùng 1 lần trong trận.',
  },
  [CardRole.SHOOTER]: {
    faction: 'Phe Dân làng',
    description:
      'Ban ngày bắn hạ một lá đối thủ đã lộ. Chỉ có 1 viên đạn và cần đối thủ có ít nhất hai vai trò đã công khai.',
  },
  [CardRole.AVENGER]: {
    faction: 'Phe Dân làng',
    description:
      'Ban ngày đánh dấu một lá đối thủ. Nếu Kẻ báo thù bị loại khi dấu còn hiệu lực, mục tiêu cũng bị kéo theo.',
  },
  [CardRole.PRIEST]: {
    faction: 'Phe Dân làng',
    description:
      'Thanh tẩy một lá đối thủ vào Ban ngày. Chọn đúng phe Sói sẽ loại mục tiêu; chọn nhầm phe Dân khiến Mục sư bị loại. Dùng 1 lần.',
  },
  [CardRole.WOLF_GUARD]: {
    faction: 'Phe Ma sói',
    description:
      'Phản ứng trong Hội đồng để cứu một lá bên mình khỏi phán quyết loại bỏ thành công. Dùng 1 lần trong trận.',
  },
} as const satisfies Record<
  CardRole,
  Omit<GameRoleTooltipContent, 'name'>
>;

export function formatGameRoleName(role: CardRole): string {
  return GAME_ROLE_LABELS[role];
}

export function getGameRoleTooltipContent(
  role: CardRole
): GameRoleTooltipContent {
  return {
    name: formatGameRoleName(role),
    ...GAME_ROLE_TOOLTIPS[role],
  };
}
