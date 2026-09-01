import { z } from 'zod';
import { AbilityId, CardRole, PlayerId } from './enums';

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

// Ruleset v0.2 -------------------------------------------------------------

/** Authoritative phase state; mỗi phase là một state machine branch. */
export const GamePhaseStateSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('SETUP') }),
  z.object({ type: z.literal('DAY_A') }),
  z.object({ type: z.literal('DAY_B') }),
  z.object({ type: z.literal('COUNCIL_PLAN') }),
  z.object({ type: z.literal('COUNCIL_RESOLUTION') }),
  z.object({ type: z.literal('COUNCIL_REACTION') }),
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
    voterIds: z.array(CardIdSchema).min(1).max(3),
  }),
]);
export type CouncilOrder = z.infer<typeof CouncilOrderSchema>;

export const CouncilReactionOrderSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PASS') }),
  z.object({
    type: z.literal('SUBSTITUTE_SACRIFICE'),
    sourceId: CardIdSchema,
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
  z.object({ rule: z.literal('SWAP'), ownTargetId: CardIdSchema.nullable(), opponentTargetId: CardIdSchema.nullable() }),
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
