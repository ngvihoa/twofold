import { z } from 'zod';
import { AbilityId, CardRole, PlayerId, WinReason } from './enums';
import {
  CardIdSchema,
  CardInstanceIdSchema,
  CardPositionSchema,
  CardRoleSchema,
  CouncilOrderSchema,
  CouncilReactionOrderSchema,
  DefenseOrderSchema,
  GamePhaseStateSchema,
  NightOrderSchema,
  PurgeOrderSchema,
} from './schemas';

/** Lifecycle và visibility độc lập của card instance trong ruleset v0.2. */
export const CardRuntimeStateSchema = z.object({
  life: z.enum(['ALIVE', 'DEAD']),
  visibility: z.enum(['HIDDEN', 'REVEALED']),
});
export type CardRuntimeStateV2 = z.infer<typeof CardRuntimeStateSchema>;

export const CardEffectExpirySchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('AFTER_PHASE'),
    phase: z.enum(['NIGHT_RESOLUTION', 'COUNCIL_RESOLUTION']),
    round: z.number().int().positive(),
  }),
  z.object({ type: z.literal('WHEN_TRIGGERED') }),
  z.object({ type: z.literal('PERMANENT') }),
]);

export const CardEffectSourceSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('ABILITY'),
    abilityId: z.nativeEnum(AbilityId),
    instanceId: CardInstanceIdSchema,
    playerId: z.nativeEnum(PlayerId),
  }),
  z.object({ type: z.literal('RULE'), rule: z.enum(['FAILED_COUNCIL', 'PURGE_LOCK', 'DAY_ABILITY_USED']) }),
]);

/** Effect authoritative; nhiều effect có thể đồng thời tồn tại trên một card. */
export const CardEffectStateSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(['PROTECTION', 'REVENGE_MARK', 'COUNCIL_LOCK', 'PURGE_LOCK', 'ROUND_EXHAUSTED']),
  source: CardEffectSourceSchema,
  appliedRound: z.number().int().positive(),
  expires: CardEffectExpirySchema,
});
export type CardEffectStateV2 = z.infer<typeof CardEffectStateSchema>;

const UnlimitedAbilityStateSchema = z.object({
  abilityId: z.union([
    z.literal(AbilityId.WEREWOLF_ATTACK),
    z.literal(AbilityId.SEER_INSPECT),
    z.literal(AbilityId.AVENGER_MARK),
  ]),
});

const FiniteAbilityStateSchema = z.object({
  abilityId: z.union([
    z.literal(AbilityId.WITCH_REVIVE),
    z.literal(AbilityId.WITCH_POISON),
    z.literal(AbilityId.SHOOTER_SHOOT),
    z.literal(AbilityId.PRIEST_PURIFY),
    z.literal(AbilityId.SUBSTITUTE_SACRIFICE),
    z.literal(AbilityId.WOLF_GUARD_RESCUE),
  ]),
  remainingUses: z.number().int().nonnegative(),
});

/** Runtime resource/memory thuộc ability của role, không thuộc card effect. */
export const AbilityStateSchema = z.union([
  UnlimitedAbilityStateSchema,
  FiniteAbilityStateSchema,
  z.object({
    abilityId: z.literal(AbilityId.GUARD_PROTECT),
    lastTarget: z
      .object({ instanceId: CardInstanceIdSchema, round: z.number().int().positive() })
      .nullable(),
  }),
]);
export type AbilityStateV2 = z.infer<typeof AbilityStateSchema>;

export const RoleStateSchema = z.object({
  id: CardRoleSchema,
  abilities: z.array(AbilityStateSchema),
});
export type RoleStateV2 = z.infer<typeof RoleStateSchema>;

export const CardInstanceStateSchema = z.object({
  id: CardInstanceIdSchema,
  role: RoleStateSchema,
  state: CardRuntimeStateSchema,
  effects: z.array(CardEffectStateSchema),
});

/** Board slot cố định; `occupant` đi theo card vật lý khi SWAP. */
export const GameCardSchema = z.object({
  id: CardIdSchema,
  position: CardPositionSchema,
  owner: z.nativeEnum(PlayerId),
  occupant: CardInstanceStateSchema,
});
export type GameCardV2 = z.infer<typeof GameCardSchema>;

export const PlayerSetupStateSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('ARRANGING') }),
  z.object({ status: z.literal('LOCKED') }),
]);
export type PlayerSetupState = z.infer<typeof PlayerSetupStateSchema>;

export const PlayerSubmissionStateSchema = z.object({
  council: z.object({
    accusation: CouncilOrderSchema.nullable(),
    reaction: CouncilReactionOrderSchema.nullable(),
    pendingTargetId: CardIdSchema.nullable(),
  }),
  night: NightOrderSchema.nullable(),
  defense: DefenseOrderSchema.nullable(),
  purge: PurgeOrderSchema.nullable(),
  finalGuess: CardRoleSchema.nullable(),
});
export type PlayerSubmissionStateV2 = z.infer<
  typeof PlayerSubmissionStateSchema
>;

export const PlayerSpecialAbilityStateSchema = z.object({
  abilityId: z.literal('BLOOD_MOON'),
  unlockRound: z.number().int().positive(),
  cooldownRounds: z.number().int().nonnegative(),
  readyRound: z.number().int().positive(),
});
export type PlayerSpecialAbilityStateV2 = z.infer<
  typeof PlayerSpecialAbilityStateSchema
>;

export const PrivateIntelEntrySchema = z.object({
  id: z.string().min(1),
  sourceAbilityId: z.literal(AbilityId.SEER_INSPECT),
  sourceInstanceId: CardInstanceIdSchema,
  targetInstanceId: CardInstanceIdSchema,
  observedAtSlotId: CardIdSchema,
  discoveredRole: CardRoleSchema,
  discoveredRound: z.number().int().positive(),
});
export type PrivateIntelEntry = z.infer<typeof PrivateIntelEntrySchema>;

/** Authoritative player domain state v0.2; connection/session data nằm ngoài. */
export const GamePlayerStateSchema = z.object({
  id: z.nativeEnum(PlayerId),
  board: z.array(GameCardSchema).length(10),
  setup: PlayerSetupStateSchema,
  submissions: PlayerSubmissionStateSchema,
  specialAbilities: z.array(PlayerSpecialAbilityStateSchema),
  privateIntel: z.array(PrivateIntelEntrySchema),
});
export type GamePlayerState = z.infer<typeof GamePlayerStateSchema>;

/** Effect được phép gửi ra view; loại source và internal effect ID. */
export const VisibleCardEffectSchema = CardEffectStateSchema.pick({
  kind: true,
  appliedRound: true,
  expires: true,
});
export type VisibleCardEffectV2 = z.infer<typeof VisibleCardEffectSchema>;

export const PrivateCardViewSchema = z.object({
  id: CardIdSchema,
  instanceId: CardInstanceIdSchema,
  position: CardPositionSchema,
  owner: z.nativeEnum(PlayerId),
  state: CardRuntimeStateSchema,
  role: RoleStateSchema,
  effects: z.array(VisibleCardEffectSchema),
});
export type PrivateCardViewV2 = z.infer<typeof PrivateCardViewSchema>;

export const PublicCardViewV2Schema = z
  .object({
    id: CardIdSchema,
    instanceId: CardInstanceIdSchema,
    position: CardPositionSchema,
    owner: z.nativeEnum(PlayerId),
    state: CardRuntimeStateSchema,
    role: CardRoleSchema.nullable(),
    effects: z.array(VisibleCardEffectSchema),
  })
  .superRefine((card, context) => {
    const shouldExposeRole = card.state.visibility === 'REVEALED';
    if (shouldExposeRole !== (card.role !== null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['role'],
        message: 'Public role phải khớp visibility của card.',
      });
    }
  });
export type PublicCardViewV2 = z.infer<typeof PublicCardViewV2Schema>;

export const PlayerSubmissionLocksSchema = z.object({
  councilAccusation: z.boolean(),
  councilReaction: z.boolean(),
  night: z.boolean(),
  defense: z.boolean(),
  purge: z.boolean(),
  finalGuess: z.boolean(),
});
export type PlayerSubmissionLocksV2 = z.infer<
  typeof PlayerSubmissionLocksSchema
>;

export const PrivatePlayerViewSchema = z.object({
  id: z.nativeEnum(PlayerId),
  board: z.array(PrivateCardViewSchema).length(10),
  setup: PlayerSetupStateSchema,
  submissions: PlayerSubmissionStateSchema,
  specialAbilities: z.array(PlayerSpecialAbilityStateSchema),
  privateIntel: z.array(PrivateIntelEntrySchema),
});
export type PrivatePlayerViewV2 = z.infer<typeof PrivatePlayerViewSchema>;

export const OpponentPlayerViewSchema = z.object({
  id: z.nativeEnum(PlayerId),
  board: z.array(PublicCardViewV2Schema).length(10),
  setupLocked: z.boolean(),
  submissionLocks: PlayerSubmissionLocksSchema,
});
export type OpponentPlayerViewV2 = z.infer<typeof OpponentPlayerViewSchema>;

export const GameResultSchema = z.object({
  winner: z.nativeEnum(PlayerId).nullable(),
  reason: z.union([
    z.nativeEnum(WinReason),
    z.literal('FINAL_DUEL'),
    z.literal('DRAW_FINAL_DUEL'),
  ]),
});
export type GameResultV2 = z.infer<typeof GameResultSchema>;

export const GameEventVisibilitySchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PUBLIC') }),
  z.object({ type: z.literal('PRIVATE'), playerId: z.nativeEnum(PlayerId) }),
]);
export type GameEventVisibilityV2 = z.infer<
  typeof GameEventVisibilitySchema
>;

export const CardEliminationCauseSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ABILITY'), abilityId: z.nativeEnum(AbilityId), sourceCardId: CardIdSchema }),
  z.object({ type: z.literal('PLAYER_ABILITY'), abilityId: z.literal('BLOOD_MOON'), playerId: z.nativeEnum(PlayerId) }),
  z.object({ type: z.literal('COUNCIL'), playerId: z.nativeEnum(PlayerId) }),
  z.object({ type: z.literal('PURGE'), rule: z.enum(['CUT', 'SWAP', 'REVEAL', 'LOCK']) }),
  z.object({ type: z.literal('REVENGE'), sourceCardId: CardIdSchema }),
  z.object({ type: z.literal('HIDDEN_NIGHT') }),
]);
export type CardEliminationCauseV2 = z.infer<
  typeof CardEliminationCauseSchema
>;

export const GameEventPayloadSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('CARD_REVEALED'), cardId: CardIdSchema }),
  z.object({
    type: z.literal('ABILITY_RESOLVED'),
    abilityId: z.union([z.nativeEnum(AbilityId), z.literal('BLOOD_MOON')]),
    sourceCardId: CardIdSchema.nullable(),
    targetCardId: CardIdSchema.nullable(),
  }),
  z.object({ type: z.literal('EFFECT_APPLIED'), targetCardId: CardIdSchema, effectKind: CardEffectStateSchema.shape.kind }),
  z.object({ type: z.literal('EFFECT_BLOCKED'), targetCardId: CardIdSchema, effectKind: CardEffectStateSchema.shape.kind }),
  z.object({ type: z.literal('CARD_ELIMINATED'), cardId: CardIdSchema, cause: CardEliminationCauseSchema }),
  z.object({ type: z.literal('CARD_REVIVED'), cardId: CardIdSchema, sourceCardId: CardIdSchema }),
  z.object({ type: z.literal('PRIVATE_INSPECTION_RESULT'), intelId: z.string().min(1), targetCardId: CardIdSchema, discoveredRole: CardRoleSchema }),
  z.object({
    type: z.literal('COUNCIL_ACCUSATION_RESOLVED'),
    playerId: z.nativeEnum(PlayerId),
    targetCardId: CardIdSchema,
    voterIds: z.array(CardIdSchema).min(1).max(3),
    succeeded: z.boolean(),
  }),
  z.object({ type: z.literal('COUNCIL_PASSED'), playerId: z.nativeEnum(PlayerId) }),
  z.object({ type: z.literal('DEFENSE_SKIPPED'), playerId: z.nativeEnum(PlayerId) }),
  z.object({ type: z.literal('SUBSTITUTE_SACRIFICED'), sourceCardId: CardIdSchema, targetCardId: CardIdSchema }),
  z.object({
    type: z.literal('PURGE_RESOLVED'),
    playerId: z.nativeEnum(PlayerId),
    rule: z.enum(['CUT', 'SWAP', 'REVEAL', 'LOCK']),
    targetCardId: CardIdSchema.nullable(),
    swapTargetCardId: CardIdSchema.nullable(),
  }),
  z.object({
    type: z.literal('FINAL_DUEL_RESOLVED'),
    cardAId: CardIdSchema,
    cardBId: CardIdSchema,
    guessA: CardRoleSchema,
    guessB: CardRoleSchema,
    correctA: z.boolean(),
    correctB: z.boolean(),
  }),
  z.object({ type: z.literal('DAWN_PRESENTATION_COMPLETED') }),
]);
export type GameEventPayloadV2 = z.infer<typeof GameEventPayloadSchema>;

export const GameEventEnvelopeSchema = z.object({
  id: z.string().min(1),
  sequence: z.number().int().positive(),
  round: z.number().int().positive(),
  phase: z.enum([
    'SETUP',
    'DAY_A',
    'DAY_B',
    'COUNCIL_PLAN',
    'COUNCIL_RESOLUTION',
    'COUNCIL_REACTION',
    'NIGHT_PLAN',
    'DUSK_DEFENSE',
    'NIGHT_RESOLUTION',
    'DAWN',
    'PURGE_PLAN',
    'PURGE_RESOLUTION',
    'FINAL_DUEL',
    'ENDED',
  ]),
  visibility: GameEventVisibilitySchema,
});

export const GameEventSchema = GameEventEnvelopeSchema.and(GameEventPayloadSchema).superRefine(
  (event, context) => {
    if (
      event.type === 'PRIVATE_INSPECTION_RESULT' &&
      event.visibility.type !== 'PRIVATE'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['visibility'],
        message: 'PRIVATE_INSPECTION_RESULT phải có private visibility.',
      });
    }
  }
);
export type GameEventV2 = z.infer<typeof GameEventSchema>;

/** Snapshot v0.2 đã lọc theo viewer; structured events là history authoritative. */
export const GamePlayerViewV2Schema = z.object({
  gameId: z.string().min(1),
  viewerId: z.nativeEnum(PlayerId),
  round: z.number().int().positive(),
  phase: GamePhaseStateSchema,
  activePlayer: z.nativeEnum(PlayerId).nullable(),
  self: PrivatePlayerViewSchema,
  opponent: OpponentPlayerViewSchema,
  result: GameResultSchema.nullable(),
  events: z.array(GameEventSchema),
});
export type GamePlayerViewV2 = z.infer<typeof GamePlayerViewV2Schema>;
