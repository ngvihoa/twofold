import { z } from 'zod';
import { CardRole, CardStatus, TurnPhase, PlayerId, ActionType, WinReason } from './enums';

// Schema cho 1 lá bài đầy đủ (Master State trên Server)
export const CardSchema = z.object({
  id: z.string(),
  index: z.number().min(0).max(9), // 0 đến 9
  owner: z.nativeEnum(PlayerId),
  role: z.nativeEnum(CardRole),
  status: z.nativeEnum(CardStatus).default(CardStatus.HIDDEN),
  skillUsedDay: z.boolean().default(false),
  skillUsedNight: z.boolean().default(false),
  skillUsedTotal: z.number().default(0),
});

export type Card = z.infer<typeof CardSchema>;

// Schema cho 1 lá bài ở góc nhìn công khai (Public Card View)
export const PublicCardSchema = z.object({
  id: z.string(),
  index: z.number().min(0).max(9),
  owner: z.nativeEnum(PlayerId),
  status: z.nativeEnum(CardStatus),
  role: z.nativeEnum(CardRole).nullable(), // null nếu status === HIDDEN
});

export type PublicCard = z.infer<typeof PublicCardSchema>;

// Thông tin người chơi
export const PlayerStateSchema = z.object({
  id: z.nativeEnum(PlayerId),
  sessionId: z.string(),
  name: z.string(),
  isReady: z.boolean().default(false),
  isConnected: z.boolean().default(true),
  hasActedInPhase: z.boolean().default(false),
});

export type PlayerState = z.infer<typeof PlayerStateSchema>;

// Nhật ký sự kiện (Event Log Entry)
export const EventLogEntrySchema = z.object({
  id: z.string(),
  round: z.number(),
  phase: z.nativeEnum(TurnPhase),
  timestamp: z.number(),
  actor: z.nativeEnum(PlayerId).nullable(),
  message: z.string(),
  isPublic: z.boolean().default(true),
  revealedCardId: z.string().optional(),
  eliminatedCardId: z.string().optional(),
});

export type EventLogEntry = z.infer<typeof EventLogEntrySchema>;

// Trạng thái bàn đấu gửi riêng cho từng người chơi (Private Player View)
export const PlayerGameViewSchema = z.object({
  roomId: z.string(),
  playerId: z.nativeEnum(PlayerId),
  opponentConnected: z.boolean(),
  currentPhase: z.nativeEnum(TurnPhase),
  activeTurnPlayer: z.nativeEnum(PlayerId).nullable(),
  roundNumber: z.number(),
  myCards: z.array(CardSchema).length(10),
  opponentCards: z.array(PublicCardSchema).length(10),
  logs: z.array(EventLogEntrySchema),
  winner: z.nativeEnum(PlayerId).nullable(),
  winReason: z.nativeEnum(WinReason).nullable(),
});

export type PlayerGameView = z.infer<typeof PlayerGameViewSchema>;

// Action Payloads
export const UseSkillPayloadSchema = z.object({
  sourceCardIndex: z.number().min(0).max(9),
  targetCardIndex: z.number().min(0).max(9),
  targetPlayer: z.nativeEnum(PlayerId),
});

export const HangActionPayloadSchema = z.object({
  targetCardIndex: z.number().min(0).max(9),
  guessedRole: z.nativeEnum(CardRole),
});

export const GameActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(ActionType.USE_SKILL),
    payload: UseSkillPayloadSchema,
  }),
  z.object({
    type: z.literal(ActionType.HANG),
    payload: HangActionPayloadSchema,
  }),
  z.object({
    type: z.literal(ActionType.PASS),
    payload: z.object({}),
  }),
  z.object({
    type: z.literal(ActionType.HUNTER_REVENGE),
    payload: z.object({
      targetCardIndex: z.number().min(0).max(9),
    }),
  }),
]);

export type GameAction = z.infer<typeof GameActionSchema>;

