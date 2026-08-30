/**
 * Twofold Core Enums & Constants
 */

export enum CardRole {
  VILLAGER = 'VILLAGER',         // Dân làng
  WEREWOLF = 'WEREWOLF',         // Ma sói
  SEER = 'SEER',                 // Tiên tri
  GUARD = 'GUARD',               // Bảo vệ
  WITCH = 'WITCH',               // Phù thủy
  SHOOTER = 'SHOOTER',           // Xạ thủ
  AVENGER = 'AVENGER',           // Kẻ báo thù
  PRIEST = 'PRIEST',             // Mục sư
  WOLF_GUARD = 'WOLF_GUARD',     // Sói Hộ Vệ
}

export enum Faction {
  VILLAGE = 'VILLAGE',           // Phe Dân làng
  WEREWOLF = 'WEREWOLF',         // Phe Ma sói
  NEUTRAL = 'NEUTRAL',           // Phe Trung lập
}

export enum AbilityId {
  WEREWOLF_ATTACK = 'WEREWOLF_ATTACK',
  SEER_INSPECT = 'SEER_INSPECT',
  GUARD_PROTECT = 'GUARD_PROTECT',
  WITCH_REVIVE = 'WITCH_REVIVE',
  WITCH_POISON = 'WITCH_POISON',
  SHOOTER_SHOOT = 'SHOOTER_SHOOT',
  AVENGER_MARK = 'AVENGER_MARK',
  PRIEST_PURIFY = 'PRIEST_PURIFY',
  WOLF_GUARD_RESCUE = 'WOLF_GUARD_RESCUE',
}

export enum CardStatus {
  HIDDEN = 'HIDDEN',             // Vai trò ẩn với đối thủ
  REVEALED = 'REVEALED',         // Đã lộ vai trò công khai
  PROTECTED = 'PROTECTED',       // Đang có khiên/bảo vệ trong đêm
  DEAD = 'DEAD',                 // Đã bị loại khỏi sân
}

export enum TurnPhase {
  SETUP = 'SETUP',               // Pha chọn & gán 10 lá trước trận
  DAY_A = 'DAY_A',               // Pha hành động ngày A (Vòng 1)
  DAY_B = 'DAY_B',               // Pha hành động ngày B (Vòng 1)
  COUNCIL_PLAN = 'COUNCIL_PLAN', // Pha lên kế hoạch họp hội đồng (Vòng 2+)
  COUNCIL_RESOLUTION = 'COUNCIL_RESOLUTION', // Pha họp hội đồng (Vòng 2+)
  NIGHT_PLAN = 'NIGHT_PLAN',     // Pha lên kế hoạch đêm (Vòng 1+)
  DUSK_DEFENSE = 'DUSK_DEFENSE', // Pha phòng thủ hoàng hôn (Vòng 1+)
  NIGHT_RESOLUTION = 'NIGHT_RESOLUTION', // Pha giải quyết đêm (Vòng 1+)
  DAWN = 'DAWN',                 // Pha bình minh (Vòng 1+)
  PURGE_PLAN = 'PURGE_PLAN',     // Pha lên kế hoạch thanh triệt (Vòng 1+)
  PURGE_RESOLUTION = 'PURGE_RESOLUTION', // Pha giải quyết thanh trừng (Vòng 1+)
  FINAL_DUEL = 'FINAL_DUEL',     // Pha đấu tay đôi cuối trận (Vòng 1+)
  ENDED = 'ENDED',               // Trận đã kết thúc

  /** @deprecated Chỉ dùng bởi contract/player view v0.1. */
  COUNTDOWN = 'COUNTDOWN',
  /** @deprecated Chỉ dùng bởi contract/player view v0.1. */
  DAY = 'DAY',
  /** @deprecated Chỉ dùng bởi contract/player view v0.1. */
  NIGHT = 'NIGHT',
  /** @deprecated Tên cũ của Purge trong contract v0.1. */
  CALAMITY = 'CALAMITY',
}

export enum PlayerId {
  PLAYER_A = 'PLAYER_A',         // Host / Đi trước
  PLAYER_B = 'PLAYER_B',         // Guest / Đi sau
}

/** @deprecated Action contract v0.1; dùng `PlayerActionType` cho ruleset v0.2. */
export enum ActionType {
  USE_SKILL = 'USE_SKILL',
  HANG = 'HANG',
  PASS = 'PASS',
}

export enum PlayerActionType {
  SETUP_REORDER = 'SETUP_REORDER',                            // Sắp thứ tự card instance trước khi khóa
  SETUP_LOCK = 'SETUP_LOCK',                                  // Khóa setup (chọn bài xong)
  DAY_SUBMIT = 'DAY_SUBMIT',                                  // Submit hành động ngày  
  COUNCIL_ACCUSATION_SUBMIT = 'COUNCIL_ACCUSATION_SUBMIT',    // Submit cáo buộc hội đồng
  COUNCIL_REACTION_SUBMIT = 'COUNCIL_REACTION_SUBMIT',        // Submit phản ứng hội đồng
  NIGHT_SUBMIT = 'NIGHT_SUBMIT',                              // Submit hành động đêm              
  DEFENSE_SUBMIT = 'DEFENSE_SUBMIT',                          // Submit hành động phòng thủ hoàng hôn  
  PURGE_SUBMIT = 'PURGE_SUBMIT',                              // Submit hành động thanh trừng  
  FINAL_GUESS_SUBMIT = 'FINAL_GUESS_SUBMIT',                  // Submit đoán vai trò cuối trận
}

export enum DayActionType {
  PASS = 'PASS',                 // Không làm gì
  SHOOT = 'SHOOT',               // Bắn (Xạ thủ)
  MARK = 'MARK',                 // Đánh dấu báo thù (Kẻ báo thù)
  PURIFY = 'PURIFY',             // Thanh tẩy (Mục sư)
  REVIVE = 'REVIVE',             // Hồi sinh (Phù thủy)
}

export enum CouncilOrderType {
  PASS = 'PASS',                 // Không buộc tội
  ACCUSE = 'ACCUSE',             // Buộc tội
}

export enum WinReason {
  ELIMINATION = 'ELIMINATION',   // Đối thủ hết sạch bài trên sân
  SURRENDER = 'SURRENDER',       // Đối thủ nhận thua
  TIMEOUT = 'TIMEOUT',           // Hết giờ / Hết hạn kết nối lại (Reconnect timeout)
}
