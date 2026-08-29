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
  COUNTDOWN = 'COUNTDOWN',       // Đếm ngược 3s
  DAY = 'DAY',                   // Pha Ban ngày (A -> B)
  NIGHT = 'NIGHT',               // Pha Ban đêm (chọn kín)
  DAWN = 'DAWN',                 // Pha Bình minh (công bố kết quả đêm)
  CALAMITY = 'CALAMITY',         // Pha Tai họa (từ Vòng 7)
  ENDED = 'ENDED',               // Trận đấu kết thúc
}

export enum PlayerId {
  PLAYER_A = 'PLAYER_A',         // Host / Đi trước
  PLAYER_B = 'PLAYER_B',         // Guest / Đi sau
}

export enum ActionType {
  USE_SKILL = 'USE_SKILL',       // Dùng kỹ năng ngày/đêm
  HANG = 'HANG',                 // Treo cổ (đoán vai trò)
  PASS = 'PASS',                 // Bỏ lượt
}

export enum WinReason {
  ELIMINATION = 'ELIMINATION',   // Đối thủ hết sạch bài trên sân
  SURRENDER = 'SURRENDER',       // Đối thủ nhận thua
  TIMEOUT = 'TIMEOUT',           // Hết giờ / Hết hạn kết nối lại (Reconnect timeout)
}
