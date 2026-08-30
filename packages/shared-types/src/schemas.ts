import { z } from 'zod';
import {
  ActionType,
  CardRole,
  CardStatus,
  TurnPhase,
  PlayerId,
  WinReason,
  AbilityId,
} from './enums';

/** ID của board slot v0.2, từ A1-A10 hoặc B1-B10. */
export type CardPosition = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type CardId = `${'A' | 'B'}${CardPosition}`;
export type CardInstanceId = `${'A' | 'B'}:${CardPosition}`;

export const CardIdSchema = z
  .string()
  .regex(/^[AB](?:[1-9]|10)$/) as z.ZodType<CardId>;

/** ID bất biến của card instance, đi theo occupant qua Purge SWAP. */
export const CardInstanceIdSchema = z
  .string()
  .regex(/^[AB]:(?:[1-9]|10)$/) as z.ZodType<CardInstanceId>;

export const CardPositionSchema = z
  .number()
  .int()
  .min(1)
  .max(10) as z.ZodType<CardPosition>;

export const CardRoleSchema = z.nativeEnum(CardRole);

// Schema cho 1 lá bài đầy đủ (Master State trên Server)
export const CardSchema = z.object({
  id: CardIdSchema,
  index: z.number().min(0).max(9), // 0 đến 9
  owner: z.nativeEnum(PlayerId),
  role: CardRoleSchema,
  status: z.nativeEnum(CardStatus).default(CardStatus.HIDDEN),
  skillUsedDay: z.boolean().default(false),
  skillUsedNight: z.boolean().default(false),
  skillUsedTotal: z.number().default(0),
});

export type Card = z.infer<typeof CardSchema>;

// Schema cho 1 lá bài ở góc nhìn công khai (Public Card View)
export const PublicCardSchema = z.object({
  id: CardIdSchema,
  index: z.number().min(0).max(9),
  owner: z.nativeEnum(PlayerId),
  status: z.nativeEnum(CardStatus),
  role: CardRoleSchema.nullable(), // null nếu status === HIDDEN
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
]);

export type GameAction = z.infer<typeof GameActionSchema>;

// Ruleset v0.2 -------------------------------------------------------------

/** Authoritative phase state; mỗi phase là một state machine branch. */
export const GamePhaseStateSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('SETUP') }),
  z.object({ type: z.literal('DAY_A') }),
  z.object({ type: z.literal('DAY_B') }),
  z.object({ type: z.literal('COUNCIL_PLAN') }),
  z.object({ type: z.literal('COUNCIL_RESOLUTION') }),
  z.object({ type: z.literal('NIGHT_PLAN') }),
  z.object({ type: z.literal('DUSK_DEFENSE') }),
  z.object({ type: z.literal('NIGHT_RESOLUTION') }),
  z.object({ type: z.literal('DAWN') }),
  z.object({ type: z.literal('PURGE_PLAN') }),
  z.object({ type: z.literal('PURGE_RESOLUTION') }),
  z.object({ type: z.literal('FINAL_DUEL') }),
  z.object({ type: z.literal('ENDED') }),
]);
export type GamePhaseState = z.infer<typeof GamePhaseStateSchema>;

export const DayActionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PASS') }),
  ...(['SHOOT', 'MARK', 'PURIFY', 'REVIVE'] as const).map(
    (type) => z.object({ type: z.literal(type), sourceId: CardIdSchema, targetId: CardIdSchema })
  ),
]);
export type DayAction = z.infer<typeof DayActionSchema>;

export const CouncilOrderSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PASS') }),
  z.object({
    type: z.literal('ACCUSE'),
    targetId: CardIdSchema,
    guessedRole: CardRoleSchema.nullable(),
    voterIds: z.tuple([CardIdSchema, CardIdSchema, CardIdSchema]),
  }),
]);
export type CouncilOrder = z.infer<typeof CouncilOrderSchema>;

export const CouncilReactionOrderSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PASS') }),
  z.object({
    type: z.literal('WOLF_GUARD_RESCUE'),
    sourceId: CardIdSchema,
    targetId: CardIdSchema,
  }),
]);
export type CouncilReactionOrder = z.infer<typeof CouncilReactionOrderSchema>;

export const NightOrderSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PASS') }),
  z.object({
    type: z.literal('USE_ABILITY'),
    sourceId: CardIdSchema,
    abilityId: z.union([
      z.literal(AbilityId.WEREWOLF_ATTACK),
      z.literal(AbilityId.SEER_INSPECT),
      z.literal(AbilityId.WITCH_POISON),
    ]),
    targetId: CardIdSchema,
  }),
  z.object({ type: z.literal('BLOOD_MOON'), targetId: CardIdSchema }),
]);
export type NightOrder = z.infer<typeof NightOrderSchema>;

export const DefenseOrderSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PASS') }),
  z.object({ type: z.literal('PROTECT'), sourceId: CardIdSchema, targetId: CardIdSchema }),
]);
export type DefenseOrder = z.infer<typeof DefenseOrderSchema>;

export const PurgeOrderSchema = z.discriminatedUnion('rule', [
  z.object({ rule: z.literal('CUT'), targetId: CardIdSchema }),
  z.object({ rule: z.literal('SWAP'), ownTargetId: CardIdSchema, opponentTargetId: CardIdSchema }),
  z.object({ rule: z.literal('REVEAL'), targetId: CardIdSchema.nullable() }),
  z.object({ rule: z.literal('LOCK'), targetId: CardIdSchema }),
]);
export type PurgeOrder = z.infer<typeof PurgeOrderSchema>;

export const PlayerGameActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('SETUP_REORDER'),
    playerId: z.nativeEnum(PlayerId),
    order: z.tuple([
      CardInstanceIdSchema,
      CardInstanceIdSchema,
      CardInstanceIdSchema,
      CardInstanceIdSchema,
      CardInstanceIdSchema,
      CardInstanceIdSchema,
      CardInstanceIdSchema,
      CardInstanceIdSchema,
      CardInstanceIdSchema,
      CardInstanceIdSchema,
    ]),
  }),
  z.object({
    type: z.literal('SETUP_LOCK'),
    playerId: z.nativeEnum(PlayerId),
  }),
  z.object({
    type: z.literal('DAY_SUBMIT'),
    playerId: z.nativeEnum(PlayerId),
    action: DayActionSchema,
  }),
  z.object({
    type: z.literal('COUNCIL_ACCUSATION_SUBMIT'),
    playerId: z.nativeEnum(PlayerId),
    order: CouncilOrderSchema,
  }),
  z.object({
    type: z.literal('COUNCIL_REACTION_SUBMIT'),
    playerId: z.nativeEnum(PlayerId),
    order: CouncilReactionOrderSchema,
  }),
  z.object({
    type: z.literal('NIGHT_SUBMIT'),
    playerId: z.nativeEnum(PlayerId),
    order: NightOrderSchema,
  }),
  z.object({
    type: z.literal('DEFENSE_SUBMIT'),
    playerId: z.nativeEnum(PlayerId),
    order: DefenseOrderSchema,
  }),
  z.object({
    type: z.literal('PURGE_SUBMIT'),
    playerId: z.nativeEnum(PlayerId),
    order: PurgeOrderSchema,
  }),
  z.object({
    type: z.literal('FINAL_GUESS_SUBMIT'),
    playerId: z.nativeEnum(PlayerId),
    guess: CardRoleSchema,
  }),
]);
export type PlayerGameAction = z.infer<typeof PlayerGameActionSchema>;
