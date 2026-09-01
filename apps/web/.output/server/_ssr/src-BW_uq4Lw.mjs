import { a as literalType, c as objectType, d as unionType, f as ZodIssueCode, i as enumType, l as stringType, n as booleanType, o as nativeEnumType, r as discriminatedUnionType, s as numberType, t as arrayType, u as tupleType } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/src-BW_uq4Lw.js
/**
* Twofold Core Enums & Constants
*/
var CardRole = /* @__PURE__ */ function(CardRole) {
	CardRole["VILLAGER"] = "VILLAGER";
	CardRole["WEREWOLF"] = "WEREWOLF";
	CardRole["SEER"] = "SEER";
	CardRole["GUARD"] = "GUARD";
	CardRole["WITCH"] = "WITCH";
	CardRole["SHOOTER"] = "SHOOTER";
	CardRole["AVENGER"] = "AVENGER";
	CardRole["PRIEST"] = "PRIEST";
	CardRole["WOLF_GUARD"] = "WOLF_GUARD";
	return CardRole;
}({});
var Faction = /* @__PURE__ */ function(Faction) {
	Faction["VILLAGE"] = "VILLAGE";
	Faction["WEREWOLF"] = "WEREWOLF";
	Faction["NEUTRAL"] = "NEUTRAL";
	return Faction;
}({});
var AbilityId = /* @__PURE__ */ function(AbilityId) {
	AbilityId["WEREWOLF_ATTACK"] = "WEREWOLF_ATTACK";
	AbilityId["SEER_INSPECT"] = "SEER_INSPECT";
	AbilityId["GUARD_PROTECT"] = "GUARD_PROTECT";
	AbilityId["WITCH_REVIVE"] = "WITCH_REVIVE";
	AbilityId["WITCH_POISON"] = "WITCH_POISON";
	AbilityId["SHOOTER_SHOOT"] = "SHOOTER_SHOOT";
	AbilityId["AVENGER_MARK"] = "AVENGER_MARK";
	AbilityId["PRIEST_PURIFY"] = "PRIEST_PURIFY";
	AbilityId["WOLF_GUARD_RESCUE"] = "WOLF_GUARD_RESCUE";
	return AbilityId;
}({});
var PlayerId = /* @__PURE__ */ function(PlayerId) {
	PlayerId["PLAYER_A"] = "PLAYER_A";
	PlayerId["PLAYER_B"] = "PLAYER_B";
	return PlayerId;
}({});
var WinReason = /* @__PURE__ */ function(WinReason) {
	WinReason["ELIMINATION"] = "ELIMINATION";
	WinReason["SURRENDER"] = "SURRENDER";
	WinReason["TIMEOUT"] = "TIMEOUT";
	return WinReason;
}({});
var CardIdSchema = stringType().regex(/^[AB](?:[1-9]|10)$/);
/** ID bất biến của card instance, đi theo occupant qua Purge SWAP. */
var CardInstanceIdSchema = stringType().regex(/^[AB]:(?:[1-9]|10)$/);
var CardPositionSchema = numberType().int().min(1).max(10);
var CardRoleSchema = nativeEnumType(CardRole);
/** Authoritative phase state; mỗi phase là một state machine branch. */
var GamePhaseStateSchema = discriminatedUnionType("type", [
	objectType({ type: literalType("SETUP") }),
	objectType({ type: literalType("DAY_A") }),
	objectType({ type: literalType("DAY_B") }),
	objectType({ type: literalType("COUNCIL_PLAN") }),
	objectType({ type: literalType("COUNCIL_RESOLUTION") }),
	objectType({ type: literalType("NIGHT_PLAN") }),
	objectType({ type: literalType("DUSK_DEFENSE") }),
	objectType({ type: literalType("NIGHT_RESOLUTION") }),
	objectType({ type: literalType("DAWN") }),
	objectType({ type: literalType("PURGE_PLAN") }),
	objectType({ type: literalType("PURGE_RESOLUTION") }),
	objectType({ type: literalType("FINAL_DUEL") }),
	objectType({ type: literalType("ENDED") })
]);
var DayActionSchema = discriminatedUnionType("type", [objectType({ type: literalType("PASS") }), ...[
	"SHOOT",
	"MARK",
	"PURIFY",
	"REVIVE"
].map((type) => objectType({
	type: literalType(type),
	sourceId: CardIdSchema,
	targetId: CardIdSchema
}))]);
var CouncilOrderSchema = discriminatedUnionType("type", [objectType({ type: literalType("PASS") }), objectType({
	type: literalType("ACCUSE"),
	targetId: CardIdSchema,
	guessedRole: CardRoleSchema.nullable(),
	voterIds: tupleType([
		CardIdSchema,
		CardIdSchema,
		CardIdSchema
	])
})]);
var CouncilReactionOrderSchema = discriminatedUnionType("type", [objectType({ type: literalType("PASS") }), objectType({
	type: literalType("WOLF_GUARD_RESCUE"),
	sourceId: CardIdSchema,
	targetId: CardIdSchema
})]);
var NightOrderSchema = discriminatedUnionType("type", [
	objectType({ type: literalType("PASS") }),
	objectType({
		type: literalType("USE_ABILITY"),
		sourceId: CardIdSchema,
		abilityId: unionType([
			literalType(AbilityId.WEREWOLF_ATTACK),
			literalType(AbilityId.SEER_INSPECT),
			literalType(AbilityId.WITCH_POISON)
		]),
		targetId: CardIdSchema
	}),
	objectType({
		type: literalType("BLOOD_MOON"),
		targetId: CardIdSchema
	})
]);
var DefenseOrderSchema = discriminatedUnionType("type", [objectType({ type: literalType("PASS") }), objectType({
	type: literalType("PROTECT"),
	sourceId: CardIdSchema,
	targetId: CardIdSchema
})]);
var PurgeOrderSchema = discriminatedUnionType("rule", [
	objectType({
		rule: literalType("CUT"),
		targetId: CardIdSchema
	}),
	objectType({
		rule: literalType("SWAP"),
		ownTargetId: CardIdSchema.nullable(),
		opponentTargetId: CardIdSchema.nullable()
	}),
	objectType({
		rule: literalType("REVEAL"),
		targetId: CardIdSchema.nullable()
	}),
	objectType({
		rule: literalType("LOCK"),
		targetId: CardIdSchema
	})
]);
var PlayerGameActionSchema = discriminatedUnionType("type", [
	objectType({
		type: literalType("SETUP_REORDER"),
		playerId: nativeEnumType(PlayerId),
		order: tupleType([
			CardInstanceIdSchema,
			CardInstanceIdSchema,
			CardInstanceIdSchema,
			CardInstanceIdSchema,
			CardInstanceIdSchema,
			CardInstanceIdSchema,
			CardInstanceIdSchema,
			CardInstanceIdSchema,
			CardInstanceIdSchema,
			CardInstanceIdSchema
		])
	}),
	objectType({
		type: literalType("SETUP_LOCK"),
		playerId: nativeEnumType(PlayerId)
	}),
	objectType({
		type: literalType("DAY_SUBMIT"),
		playerId: nativeEnumType(PlayerId),
		action: DayActionSchema
	}),
	objectType({
		type: literalType("COUNCIL_ACCUSATION_SUBMIT"),
		playerId: nativeEnumType(PlayerId),
		order: CouncilOrderSchema
	}),
	objectType({
		type: literalType("COUNCIL_REACTION_SUBMIT"),
		playerId: nativeEnumType(PlayerId),
		order: CouncilReactionOrderSchema
	}),
	objectType({
		type: literalType("NIGHT_SUBMIT"),
		playerId: nativeEnumType(PlayerId),
		order: NightOrderSchema
	}),
	objectType({
		type: literalType("DEFENSE_SUBMIT"),
		playerId: nativeEnumType(PlayerId),
		order: DefenseOrderSchema
	}),
	objectType({
		type: literalType("PURGE_SUBMIT"),
		playerId: nativeEnumType(PlayerId),
		order: PurgeOrderSchema
	}),
	objectType({
		type: literalType("FINAL_GUESS_SUBMIT"),
		playerId: nativeEnumType(PlayerId),
		guess: CardRoleSchema
	})
]);
/** Lifecycle và visibility độc lập của card instance trong ruleset v0.2. */
var CardRuntimeStateSchema = objectType({
	life: enumType(["ALIVE", "DEAD"]),
	visibility: enumType(["HIDDEN", "REVEALED"])
});
var CardEffectExpirySchema = discriminatedUnionType("type", [
	objectType({
		type: literalType("AFTER_PHASE"),
		phase: enumType(["NIGHT_RESOLUTION", "COUNCIL_RESOLUTION"]),
		round: numberType().int().positive()
	}),
	objectType({ type: literalType("WHEN_TRIGGERED") }),
	objectType({ type: literalType("PERMANENT") })
]);
var CardEffectSourceSchema = discriminatedUnionType("type", [objectType({
	type: literalType("ABILITY"),
	abilityId: nativeEnumType(AbilityId),
	instanceId: CardInstanceIdSchema,
	playerId: nativeEnumType(PlayerId)
}), objectType({
	type: literalType("RULE"),
	rule: enumType(["FAILED_COUNCIL", "PURGE_LOCK"])
})]);
/** Effect authoritative; nhiều effect có thể đồng thời tồn tại trên một card. */
var CardEffectStateSchema = objectType({
	id: stringType().min(1),
	kind: enumType([
		"PROTECTION",
		"REVENGE_MARK",
		"COUNCIL_LOCK",
		"PURGE_LOCK"
	]),
	source: CardEffectSourceSchema,
	appliedRound: numberType().int().positive(),
	expires: CardEffectExpirySchema
});
var UnlimitedAbilityStateSchema = objectType({ abilityId: unionType([
	literalType(AbilityId.WEREWOLF_ATTACK),
	literalType(AbilityId.SEER_INSPECT),
	literalType(AbilityId.AVENGER_MARK)
]) });
var FiniteAbilityStateSchema = objectType({
	abilityId: unionType([
		literalType(AbilityId.WITCH_REVIVE),
		literalType(AbilityId.WITCH_POISON),
		literalType(AbilityId.SHOOTER_SHOOT),
		literalType(AbilityId.PRIEST_PURIFY),
		literalType(AbilityId.WOLF_GUARD_RESCUE)
	]),
	remainingUses: numberType().int().nonnegative()
});
/** Runtime resource/memory thuộc ability của role, không thuộc card effect. */
var AbilityStateSchema = unionType([
	UnlimitedAbilityStateSchema,
	FiniteAbilityStateSchema,
	objectType({
		abilityId: literalType(AbilityId.GUARD_PROTECT),
		lastTarget: objectType({
			instanceId: CardInstanceIdSchema,
			round: numberType().int().positive()
		}).nullable()
	})
]);
var RoleStateSchema = objectType({
	id: CardRoleSchema,
	abilities: arrayType(AbilityStateSchema)
});
var CardInstanceStateSchema = objectType({
	id: CardInstanceIdSchema,
	role: RoleStateSchema,
	state: CardRuntimeStateSchema,
	effects: arrayType(CardEffectStateSchema)
});
/** Board slot cố định; `occupant` đi theo card vật lý khi SWAP. */
var GameCardSchema = objectType({
	id: CardIdSchema,
	position: CardPositionSchema,
	owner: nativeEnumType(PlayerId),
	occupant: CardInstanceStateSchema
});
var PlayerSetupStateSchema = discriminatedUnionType("status", [objectType({ status: literalType("ARRANGING") }), objectType({ status: literalType("LOCKED") })]);
var PlayerSubmissionStateSchema = objectType({
	council: objectType({
		accusation: CouncilOrderSchema.nullable(),
		reaction: CouncilReactionOrderSchema.nullable()
	}),
	night: NightOrderSchema.nullable(),
	defense: DefenseOrderSchema.nullable(),
	purge: PurgeOrderSchema.nullable(),
	finalGuess: CardRoleSchema.nullable()
});
var PlayerSpecialAbilityStateSchema = objectType({
	abilityId: literalType("BLOOD_MOON"),
	unlockRound: numberType().int().positive(),
	cooldownRounds: numberType().int().nonnegative(),
	readyRound: numberType().int().positive()
});
var PrivateIntelEntrySchema = objectType({
	id: stringType().min(1),
	sourceAbilityId: literalType(AbilityId.SEER_INSPECT),
	sourceInstanceId: CardInstanceIdSchema,
	targetInstanceId: CardInstanceIdSchema,
	observedAtSlotId: CardIdSchema,
	discoveredRole: CardRoleSchema,
	discoveredRound: numberType().int().positive()
});
objectType({
	id: nativeEnumType(PlayerId),
	board: arrayType(GameCardSchema).length(10),
	setup: PlayerSetupStateSchema,
	submissions: PlayerSubmissionStateSchema,
	specialAbilities: arrayType(PlayerSpecialAbilityStateSchema),
	privateIntel: arrayType(PrivateIntelEntrySchema)
});
/** Effect được phép gửi ra view; loại source và internal effect ID. */
var VisibleCardEffectSchema = CardEffectStateSchema.pick({
	kind: true,
	appliedRound: true,
	expires: true
});
var PrivateCardViewSchema = objectType({
	id: CardIdSchema,
	instanceId: CardInstanceIdSchema,
	position: CardPositionSchema,
	owner: nativeEnumType(PlayerId),
	state: CardRuntimeStateSchema,
	role: RoleStateSchema,
	effects: arrayType(VisibleCardEffectSchema)
});
var PublicCardViewV2Schema = objectType({
	id: CardIdSchema,
	instanceId: CardInstanceIdSchema,
	position: CardPositionSchema,
	owner: nativeEnumType(PlayerId),
	state: CardRuntimeStateSchema,
	role: CardRoleSchema.nullable(),
	effects: arrayType(VisibleCardEffectSchema)
}).superRefine((card, context) => {
	if (card.state.visibility === "REVEALED" !== (card.role !== null)) context.addIssue({
		code: ZodIssueCode.custom,
		path: ["role"],
		message: "Public role phải khớp visibility của card."
	});
});
var PlayerSubmissionLocksSchema = objectType({
	councilAccusation: booleanType(),
	councilReaction: booleanType(),
	night: booleanType(),
	defense: booleanType(),
	purge: booleanType(),
	finalGuess: booleanType()
});
var PrivatePlayerViewSchema = objectType({
	id: nativeEnumType(PlayerId),
	board: arrayType(PrivateCardViewSchema).length(10),
	setup: PlayerSetupStateSchema,
	submissions: PlayerSubmissionStateSchema,
	specialAbilities: arrayType(PlayerSpecialAbilityStateSchema),
	privateIntel: arrayType(PrivateIntelEntrySchema)
});
var OpponentPlayerViewSchema = objectType({
	id: nativeEnumType(PlayerId),
	board: arrayType(PublicCardViewV2Schema).length(10),
	setupLocked: booleanType(),
	submissionLocks: PlayerSubmissionLocksSchema
});
var GameResultSchema = objectType({
	winner: nativeEnumType(PlayerId).nullable(),
	reason: unionType([
		nativeEnumType(WinReason),
		literalType("FINAL_DUEL"),
		literalType("DRAW_FINAL_DUEL")
	])
});
var GameEventVisibilitySchema = discriminatedUnionType("type", [objectType({ type: literalType("PUBLIC") }), objectType({
	type: literalType("PRIVATE"),
	playerId: nativeEnumType(PlayerId)
})]);
var CardEliminationCauseSchema = discriminatedUnionType("type", [
	objectType({
		type: literalType("ABILITY"),
		abilityId: nativeEnumType(AbilityId),
		sourceCardId: CardIdSchema
	}),
	objectType({
		type: literalType("PLAYER_ABILITY"),
		abilityId: literalType("BLOOD_MOON"),
		playerId: nativeEnumType(PlayerId)
	}),
	objectType({
		type: literalType("COUNCIL"),
		playerId: nativeEnumType(PlayerId)
	}),
	objectType({
		type: literalType("PURGE"),
		rule: enumType([
			"CUT",
			"SWAP",
			"REVEAL",
			"LOCK"
		])
	}),
	objectType({
		type: literalType("REVENGE"),
		sourceCardId: CardIdSchema
	})
]);
var GameEventPayloadSchema = discriminatedUnionType("type", [
	objectType({
		type: literalType("CARD_REVEALED"),
		cardId: CardIdSchema
	}),
	objectType({
		type: literalType("ABILITY_RESOLVED"),
		abilityId: unionType([nativeEnumType(AbilityId), literalType("BLOOD_MOON")]),
		sourceCardId: CardIdSchema.nullable(),
		targetCardId: CardIdSchema.nullable()
	}),
	objectType({
		type: literalType("EFFECT_APPLIED"),
		targetCardId: CardIdSchema,
		effectKind: CardEffectStateSchema.shape.kind
	}),
	objectType({
		type: literalType("EFFECT_BLOCKED"),
		targetCardId: CardIdSchema,
		effectKind: CardEffectStateSchema.shape.kind
	}),
	objectType({
		type: literalType("CARD_ELIMINATED"),
		cardId: CardIdSchema,
		cause: CardEliminationCauseSchema
	}),
	objectType({
		type: literalType("CARD_REVIVED"),
		cardId: CardIdSchema,
		sourceCardId: CardIdSchema
	}),
	objectType({
		type: literalType("PRIVATE_INSPECTION_RESULT"),
		intelId: stringType().min(1),
		targetCardId: CardIdSchema,
		discoveredRole: CardRoleSchema
	}),
	objectType({
		type: literalType("COUNCIL_ACCUSATION_RESOLVED"),
		playerId: nativeEnumType(PlayerId),
		targetCardId: CardIdSchema,
		voterIds: tupleType([
			CardIdSchema,
			CardIdSchema,
			CardIdSchema
		]),
		succeeded: booleanType()
	}),
	objectType({
		type: literalType("COUNCIL_PASSED"),
		playerId: nativeEnumType(PlayerId)
	}),
	objectType({
		type: literalType("DEFENSE_SKIPPED"),
		playerId: nativeEnumType(PlayerId)
	}),
	objectType({
		type: literalType("WOLF_GUARD_RESCUED"),
		sourceCardId: CardIdSchema,
		targetCardId: CardIdSchema
	}),
	objectType({
		type: literalType("PURGE_RESOLVED"),
		playerId: nativeEnumType(PlayerId),
		rule: enumType([
			"CUT",
			"SWAP",
			"REVEAL",
			"LOCK"
		]),
		targetCardId: CardIdSchema.nullable(),
		swapTargetCardId: CardIdSchema.nullable()
	}),
	objectType({
		type: literalType("FINAL_DUEL_RESOLVED"),
		cardAId: CardIdSchema,
		cardBId: CardIdSchema,
		guessA: CardRoleSchema,
		guessB: CardRoleSchema,
		correctA: booleanType(),
		correctB: booleanType()
	}),
	objectType({ type: literalType("DAWN_PRESENTATION_COMPLETED") })
]);
var GameEventSchema = objectType({
	id: stringType().min(1),
	sequence: numberType().int().positive(),
	round: numberType().int().positive(),
	phase: enumType([
		"SETUP",
		"DAY_A",
		"DAY_B",
		"COUNCIL_PLAN",
		"COUNCIL_RESOLUTION",
		"NIGHT_PLAN",
		"DUSK_DEFENSE",
		"NIGHT_RESOLUTION",
		"DAWN",
		"PURGE_PLAN",
		"PURGE_RESOLUTION",
		"FINAL_DUEL",
		"ENDED"
	]),
	visibility: GameEventVisibilitySchema
}).and(GameEventPayloadSchema).superRefine((event, context) => {
	if (event.type === "PRIVATE_INSPECTION_RESULT" && event.visibility.type !== "PRIVATE") context.addIssue({
		code: ZodIssueCode.custom,
		path: ["visibility"],
		message: "PRIVATE_INSPECTION_RESULT phải có private visibility."
	});
});
/** Snapshot v0.2 đã lọc theo viewer; structured events là history authoritative. */
var GamePlayerViewV2Schema = objectType({
	gameId: stringType().min(1),
	viewerId: nativeEnumType(PlayerId),
	round: numberType().int().positive(),
	phase: GamePhaseStateSchema,
	activePlayer: nativeEnumType(PlayerId).nullable(),
	self: PrivatePlayerViewSchema,
	opponent: OpponentPlayerViewSchema,
	result: GameResultSchema.nullable(),
	events: arrayType(GameEventSchema)
});
/** Gameplay messages duy nhất cho ruleset v0.2. */
var ClientWsMessageSchema = discriminatedUnionType("type", [
	objectType({
		type: literalType("JOIN_ROOM"),
		payload: objectType({
			roomId: stringType().min(1),
			playerName: stringType().min(1),
			reconnectSessionId: stringType().optional()
		})
	}),
	objectType({
		type: literalType("SUBMIT_ACTION"),
		payload: PlayerGameActionSchema
	}),
	objectType({
		type: literalType("SURRENDER"),
		payload: objectType({})
	}),
	objectType({
		type: literalType("REMATCH_REQUEST"),
		payload: objectType({})
	}),
	objectType({
		type: literalType("PING"),
		payload: objectType({ timestamp: numberType() })
	})
]);
/** Server snapshot v0.2 chứa filtered view và structured event stream. */
var ServerWsMessageSchema = discriminatedUnionType("type", [
	objectType({
		type: literalType("ROOM_JOINED"),
		payload: objectType({
			roomId: stringType().min(1),
			assignedPlayerId: nativeEnumType(PlayerId),
			sessionId: stringType().min(1)
		})
	}),
	objectType({
		type: literalType("GAME_STATE_UPDATE"),
		payload: GamePlayerViewV2Schema
	}),
	objectType({
		type: literalType("ACTION_REJECTED"),
		payload: objectType({
			code: stringType().min(1),
			message: stringType().min(1)
		})
	}),
	objectType({
		type: literalType("ERROR"),
		payload: objectType({
			code: stringType().min(1),
			message: stringType().min(1)
		})
	}),
	objectType({
		type: literalType("PONG"),
		payload: objectType({ timestamp: numberType() })
	})
]);
objectType({ hostName: stringType().min(1).max(20).default("Player A") });
objectType({
	roomId: stringType(),
	roomCode: stringType(),
	hostSessionId: stringType(),
	assignedPlayerId: literalType(PlayerId.PLAYER_A)
});
objectType({ roomCode: stringType().min(4).max(10) });
objectType({
	roomId: stringType(),
	roomCode: stringType(),
	isHostConnected: booleanType(),
	isGuestConnected: booleanType(),
	isGameStarted: booleanType()
});
//#endregion
export { PlayerGameActionSchema as a, Faction as i, CardRole as n, PlayerId as o, ClientWsMessageSchema as r, ServerWsMessageSchema as s, AbilityId as t };
