import { a as defineWebSocketHandler } from "../../_libs/h3+rou3+srvx.mjs";
import { a as literalType, c as objectType, d as unionType, f as ZodIssueCode, i as enumType, l as stringType, n as booleanType, o as nativeEnumType, r as discriminatedUnionType, s as numberType, t as arrayType, u as tupleType } from "../../_libs/zod.mjs";
//#region ../../packages/shared-types/src/enums.ts
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
//#endregion
//#region ../../packages/shared-types/src/schemas.ts
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
//#endregion
//#region ../../packages/shared-types/src/game-v2.ts
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
//#endregion
//#region ../../packages/shared-types/src/events.ts
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
//#region ../../packages/game-core/src/roles.ts
/** Registry metadata tĩnh của toàn bộ role được hỗ trợ trong ruleset v0.2. */
var ROLE_DEFINITIONS = {
	[CardRole.VILLAGER]: {
		id: CardRole.VILLAGER,
		displayName: "Dân làng",
		faction: Faction.VILLAGE,
		abilities: []
	},
	[CardRole.WEREWOLF]: {
		id: CardRole.WEREWOLF,
		displayName: "Ma sói",
		faction: Faction.WEREWOLF,
		abilities: [AbilityId.WEREWOLF_ATTACK]
	},
	[CardRole.SEER]: {
		id: CardRole.SEER,
		displayName: "Tiên tri",
		faction: Faction.VILLAGE,
		abilities: [AbilityId.SEER_INSPECT]
	},
	[CardRole.GUARD]: {
		id: CardRole.GUARD,
		displayName: "Bảo vệ",
		faction: Faction.VILLAGE,
		abilities: [AbilityId.GUARD_PROTECT]
	},
	[CardRole.WITCH]: {
		id: CardRole.WITCH,
		displayName: "Phù thủy",
		faction: Faction.VILLAGE,
		abilities: [AbilityId.WITCH_REVIVE, AbilityId.WITCH_POISON]
	},
	[CardRole.SHOOTER]: {
		id: CardRole.SHOOTER,
		displayName: "Xạ thủ",
		faction: Faction.VILLAGE,
		abilities: [AbilityId.SHOOTER_SHOOT]
	},
	[CardRole.AVENGER]: {
		id: CardRole.AVENGER,
		displayName: "Kẻ báo thù",
		faction: Faction.VILLAGE,
		abilities: [AbilityId.AVENGER_MARK]
	},
	[CardRole.PRIEST]: {
		id: CardRole.PRIEST,
		displayName: "Mục sư",
		faction: Faction.VILLAGE,
		abilities: [AbilityId.PRIEST_PURIFY]
	},
	[CardRole.WOLF_GUARD]: {
		id: CardRole.WOLF_GUARD,
		displayName: "Sói Hộ Vệ",
		faction: Faction.WEREWOLF,
		abilities: [AbilityId.WOLF_GUARD_RESCUE]
	}
};
/** Thành phần deck chuẩn 10 card cho mỗi player theo ruleset v0.2. */
var STANDARD_DECK = [
	CardRole.VILLAGER,
	CardRole.WEREWOLF,
	CardRole.WEREWOLF,
	CardRole.SEER,
	CardRole.GUARD,
	CardRole.WITCH,
	CardRole.SHOOTER,
	CardRole.AVENGER,
	CardRole.PRIEST,
	CardRole.WOLF_GUARD
];
/** Tra cứu metadata bất biến của một role trong ruleset hiện tại. */
function getRoleDefinition(role) {
	return ROLE_DEFINITIONS[role];
}
/** Tạo runtime state ban đầu cho toàn bộ ability mà một role sở hữu. */
function createInitialAbilityStates(role) {
	switch (role) {
		case CardRole.WEREWOLF: return [{ abilityId: AbilityId.WEREWOLF_ATTACK }];
		case CardRole.SEER: return [{ abilityId: AbilityId.SEER_INSPECT }];
		case CardRole.GUARD: return [{
			abilityId: AbilityId.GUARD_PROTECT,
			lastTarget: null
		}];
		case CardRole.WITCH: return [{
			abilityId: AbilityId.WITCH_REVIVE,
			remainingUses: 1
		}, {
			abilityId: AbilityId.WITCH_POISON,
			remainingUses: 1
		}];
		case CardRole.SHOOTER: return [{
			abilityId: AbilityId.SHOOTER_SHOOT,
			remainingUses: 1
		}];
		case CardRole.AVENGER: return [{ abilityId: AbilityId.AVENGER_MARK }];
		case CardRole.PRIEST: return [{
			abilityId: AbilityId.PRIEST_PURIFY,
			remainingUses: 1
		}];
		case CardRole.WOLF_GUARD: return [{
			abilityId: AbilityId.WOLF_GUARD_RESCUE,
			remainingUses: 1
		}];
		default: return [];
	}
}
/**
* Tạo `RoleState` ban đầu cho một card mới, gồm role ID và usage state mặc định
* của các ability tương ứng.
*/
function createInitialRoleState(role) {
	return {
		id: role,
		abilities: createInitialAbilityStates(role)
	};
}
/**
* Áp dụng một command lên role theo kiểu immutable.
*
* Hàm giảm `remainingUses` với ability hữu hạn và cập nhật `lastTarget` cho
* Guard. Nó không resolve effect lên target card; trách nhiệm đó thuộc Rule Flow.
*
* @throws Khi role không sở hữu ability, ability đã hết lượt, round không hợp
* lệ, hoặc Guard chọn cùng target ở hai vòng liên tiếp.
*/
function transitionRole(role, command) {
	if (!Number.isInteger(command.round) || command.round < 1) throw new RangeError("Round của ability command phải là số nguyên dương.");
	const abilityIndex = role.abilities.findIndex((ability) => ability.abilityId === command.abilityId);
	if (abilityIndex < 0) throw new Error(`${role.id} không có ability ${command.abilityId}.`);
	const ability = role.abilities[abilityIndex];
	let nextAbility;
	if (ability.abilityId === AbilityId.GUARD_PROTECT) {
		if (!command.targetInstanceId) throw new Error("Guard ability cần target.");
		if (ability.lastTarget?.instanceId === command.targetInstanceId && ability.lastTarget.round >= command.round - 1) throw new Error("Không được bảo vệ cùng một target ở hai vòng liên tiếp.");
		nextAbility = {
			...ability,
			lastTarget: {
				instanceId: command.targetInstanceId,
				round: command.round
			}
		};
	} else if ("remainingUses" in ability) {
		if (ability.remainingUses < 1) throw new Error(`Ability ${ability.abilityId} đã hết lượt sử dụng.`);
		nextAbility = {
			...ability,
			remainingUses: ability.remainingUses - 1
		};
	} else return role;
	const abilities = [...role.abilities];
	abilities[abilityIndex] = nextAbility;
	return {
		...role,
		abilities
	};
}
/**
* Lấy runtime state của một ability từ role với kiểu trả về được thu hẹp theo
* `abilityId`; trả về `undefined` nếu role không sở hữu ability đó.
*/
function getRoleAbility(role, abilityId) {
	return role.abilities.find((ability) => ability.abilityId === abilityId);
}
//#endregion
//#region ../../packages/game-core/src/cards.ts
/** Phân loại các effect có thể cùng tồn tại và tác động lên một target card. */
var CardEffectKind = /* @__PURE__ */ function(CardEffectKind) {
	CardEffectKind["PROTECTION"] = "PROTECTION";
	CardEffectKind["REVENGE_MARK"] = "REVENGE_MARK";
	CardEffectKind["COUNCIL_LOCK"] = "COUNCIL_LOCK";
	CardEffectKind["PURGE_LOCK"] = "PURGE_LOCK";
	return CardEffectKind;
}({});
/** Định danh game rule có thể trực tiếp tạo effect mà không qua ability. */
var CardEffectRule = /* @__PURE__ */ function(CardEffectRule) {
	CardEffectRule["FAILED_COUNCIL"] = "FAILED_COUNCIL";
	CardEffectRule["PURGE_LOCK"] = "PURGE_LOCK";
	return CardEffectRule;
}({});
var CARD_PREFIX = {
	[PlayerId.PLAYER_A]: "A",
	[PlayerId.PLAYER_B]: "B"
};
/** Validate một số runtime và thu hẹp nó thành `CardPosition`. */
function toCardPosition(position) {
	if (!Number.isInteger(position) || position < 1 || position > 10) throw new RangeError("Card position phải là số nguyên từ 1 đến 10.");
	return position;
}
/**
* Tạo card mới ở trạng thái sống, ẩn, chưa có effect và có `RoleState` tương
* ứng với role được cấp.
*
* @throws Khi `position` không phải số nguyên từ 1 đến 10.
*/
function createInitialCard(owner, position, role) {
	const validPosition = toCardPosition(position);
	return {
		id: `${CARD_PREFIX[owner]}${validPosition}`,
		position: validPosition,
		owner,
		occupant: {
			id: `${CARD_PREFIX[owner]}:${validPosition}`,
			role: createInitialRoleState(role),
			state: {
				life: "ALIVE",
				visibility: "HIDDEN"
			},
			effects: []
		}
	};
}
/**
* Áp dụng một `CardEvent` theo kiểu immutable và trả về card state kế tiếp.
* Lifecycle event chỉ thay đổi đúng trục nó đại diện: `REVEAL` giữ nguyên life,
* còn `ELIMINATE`/`REVIVE` giữ nguyên visibility. Death/revive đồng thời dọn
* effect cũ để effect của lifecycle trước không rò sang lifecycle mới.
*
* @throws Khi áp effect lên card đã chết hoặc dùng trùng effect ID.
*/
function transitionCard(card, event) {
	switch (event.type) {
		case "REVEAL":
			if (card.occupant.state.visibility === "REVEALED") return card;
			return {
				...card,
				occupant: {
					...card.occupant,
					state: {
						...card.occupant.state,
						visibility: "REVEALED"
					}
				}
			};
		case "ELIMINATE":
			if (card.occupant.state.life === "DEAD") return card;
			return {
				...card,
				occupant: {
					...card.occupant,
					state: {
						life: "DEAD",
						visibility: card.occupant.state.visibility
					},
					effects: []
				}
			};
		case "REVIVE":
			if (card.occupant.state.life === "ALIVE") return card;
			return {
				...card,
				occupant: {
					...card.occupant,
					state: {
						life: "ALIVE",
						visibility: card.occupant.state.visibility
					},
					effects: []
				}
			};
		case "APPLY_EFFECT":
			if (card.occupant.state.life === "DEAD") throw new Error("Không thể áp dụng effect lên card đã chết.");
			if (card.occupant.effects.some((effect) => effect.id === event.effect.id)) throw new Error(`Effect ID ${event.effect.id} đã tồn tại trên ${card.id}.`);
			return {
				...card,
				occupant: {
					...card.occupant,
					effects: [...card.occupant.effects, event.effect]
				}
			};
		case "REMOVE_EFFECT": return {
			...card,
			occupant: {
				...card.occupant,
				effects: card.occupant.effects.filter((effect) => effect.id !== event.effectId)
			}
		};
		case "CLEAR_EFFECTS":
			if (card.occupant.effects.length === 0) return card;
			return {
				...card,
				occupant: {
					...card.occupant,
					effects: []
				}
			};
	}
}
/** Kiểm tra card còn sống dựa trên nhánh `life` của runtime state. */
function isCardAlive(card) {
	return card.occupant.state.life === "ALIVE";
}
/** Kiểm tra card hiện có ít nhất một effect thuộc `kind` được yêu cầu. */
function hasCardEffect(card, kind) {
	return card.occupant.effects.some((effect) => effect.kind === kind);
}
//#endregion
//#region ../../packages/game-core/src/players.ts
/** Định danh ability thuộc player, không cần source card trên board. */
var PlayerSpecialAbilityId = /* @__PURE__ */ function(PlayerSpecialAbilityId) {
	PlayerSpecialAbilityId["BLOOD_MOON"] = "BLOOD_MOON";
	return PlayerSpecialAbilityId;
}({});
/**
* Tạo state ban đầu cho player từ board đã được cấp.
*
* Board được copy để tránh chia sẻ array với caller; mọi card trên board phải
* có cùng owner với player.
*
* @throws Khi board chứa card thuộc player khác.
*/
function createInitialPlayerState(id, board) {
	if (board.some((card) => card.owner !== id)) throw new Error(`Board của ${id} chứa card thuộc player khác.`);
	return {
		id,
		board: [...board],
		setup: { status: "ARRANGING" },
		submissions: {
			council: {
				accusation: null,
				reaction: null
			},
			night: null,
			defense: null,
			purge: null,
			finalGuess: null
		},
		specialAbilities: [{
			abilityId: PlayerSpecialAbilityId.BLOOD_MOON,
			unlockRound: 6,
			cooldownRounds: 2,
			readyRound: 6
		}],
		privateIntel: []
	};
}
/**
* Thay một card bằng state mới của chính card đó trong board theo kiểu immutable.
* Dùng sau khi `transitionCard` resolve lifecycle/effect mà không mutate board cũ.
*
* @throws Khi card thuộc player khác hoặc không tồn tại trên board.
*/
function replacePlayerCard(player, card) {
	if (card.owner !== player.id) throw new Error(`Không thể đặt ${card.id} vào board của ${player.id}.`);
	const cardIndex = player.board.findIndex((candidate) => candidate.id === card.id);
	if (cardIndex < 0) throw new Error(`Không tìm thấy ${card.id} trên board của ${player.id}.`);
	const board = [...player.board];
	board[cardIndex] = card;
	return {
		...player,
		board
	};
}
//#endregion
//#region ../../packages/game-core/src/phase-machine.ts
/** Lỗi cho biết event không được phép chạy từ phase hiện tại. */
var InvalidPhaseTransitionError = class extends Error {
	constructor(phase, event) {
		super(`Không thể xử lý ${event} khi game đang ở phase ${phase}.`);
		this.name = "InvalidPhaseTransitionError";
	}
};
/** Tạo context ban đầu của phase machine tại Setup, Vòng 1. */
function createInitialPhaseMachineState() {
	return {
		round: 1,
		phase: { type: "SETUP" }
	};
}
/**
* Chuyển phase theo kiểu immutable.
*
* Council mở sau Day B từ Vòng 2. Dawn tăng round trước khi quyết định mở
* Purge; từ Vòng 6, Purge luôn diễn ra trước Day A.
*
* @throws {InvalidPhaseTransitionError} Khi event không hợp lệ ở phase hiện tại.
*/
function transitionPhase(state, event) {
	if (event.type === "GAME_ENDED") {
		if (state.phase.type === "ENDED") throw new InvalidPhaseTransitionError(state.phase.type, event.type);
		return {
			...state,
			phase: { type: "ENDED" }
		};
	}
	if (event.type === "FINAL_DUEL_REQUIRED") {
		if (state.phase.type === "ENDED" || state.phase.type === "FINAL_DUEL") throw new InvalidPhaseTransitionError(state.phase.type, event.type);
		return {
			...state,
			phase: { type: "FINAL_DUEL" }
		};
	}
	switch (state.phase.type) {
		case "SETUP":
			if (event.type === "SETUP_COMPLETED") return {
				...state,
				phase: { type: "DAY_A" }
			};
			break;
		case "DAY_A":
			if (event.type === "DAY_ACTION_COMPLETED" && event.playerId === PlayerId.PLAYER_A) return {
				...state,
				phase: { type: "DAY_B" }
			};
			break;
		case "DAY_B":
			if (event.type === "DAY_ACTION_COMPLETED" && event.playerId === PlayerId.PLAYER_B) return {
				...state,
				phase: { type: state.round >= 2 ? "COUNCIL_PLAN" : "NIGHT_PLAN" }
			};
			break;
		case "COUNCIL_PLAN":
			if (event.type === "COUNCIL_ORDERS_LOCKED") return {
				...state,
				phase: { type: "COUNCIL_RESOLUTION" }
			};
			break;
		case "COUNCIL_RESOLUTION":
			if (event.type === "COUNCIL_RESOLVED") return {
				...state,
				phase: { type: "NIGHT_PLAN" }
			};
			break;
		case "NIGHT_PLAN":
			if (event.type === "NIGHT_ORDERS_LOCKED") return {
				...state,
				phase: { type: "DUSK_DEFENSE" }
			};
			break;
		case "DUSK_DEFENSE":
			if (event.type === "DEFENSE_ORDERS_LOCKED") return {
				...state,
				phase: { type: "NIGHT_RESOLUTION" }
			};
			break;
		case "NIGHT_RESOLUTION":
			if (event.type === "NIGHT_RESOLVED") return {
				...state,
				phase: { type: "DAWN" }
			};
			break;
		case "DAWN":
			if (event.type === "DAWN_COMPLETED") {
				const nextRound = state.round + 1;
				return {
					round: nextRound,
					phase: { type: nextRound >= 6 ? "PURGE_PLAN" : "DAY_A" }
				};
			}
			break;
		case "PURGE_PLAN":
			if (event.type === "PURGE_ORDERS_LOCKED") return {
				...state,
				phase: { type: "PURGE_RESOLUTION" }
			};
			break;
		case "PURGE_RESOLUTION": if (event.type === "PURGE_RESOLVED") return {
			...state,
			phase: { type: "DAY_A" }
		};
	}
	throw new InvalidPhaseTransitionError(state.phase.type, event.type);
}
/** Trả về player đang có Day turn; các phase đồng thời trả về `null`. */
function getActivePhasePlayer(phase) {
	if (phase.type === "DAY_A") return PlayerId.PLAYER_A;
	if (phase.type === "DAY_B") return PlayerId.PLAYER_B;
	return null;
}
//#endregion
//#region ../../packages/game-core/src/game-state.ts
/** Lý do kết thúc riêng của Final Duel trong core v0.2. */
var FinalDuelResultReason = /* @__PURE__ */ function(FinalDuelResultReason) {
	FinalDuelResultReason["VICTORY"] = "FINAL_DUEL";
	FinalDuelResultReason["DRAW"] = "DRAW_FINAL_DUEL";
	return FinalDuelResultReason;
}({});
/** Tạo GameState ban đầu ở Setup, Vòng 1 với hai player đã được khởi tạo. */
function createInitialGameState(gameId, seed, players) {
	const initialPhase = createInitialPhaseMachineState();
	return {
		gameId,
		seed,
		round: initialPhase.round,
		phase: initialPhase.phase,
		players,
		result: null,
		events: []
	};
}
/**
* Áp dụng event lên GameState theo kiểu immutable.
*
* `SETUP_LOCKED` cập nhật player trước và chỉ rời Setup khi cả hai player đã
* khóa. Các event khác được ủy quyền cho phase machine.
*/
function transitionGameState(state, event) {
	if (event.type === "SETUP_LOCKED") {
		if (state.phase.type !== "SETUP") throw new Error(`Không thể khóa Setup khi game đang ở phase ${state.phase.type}.`);
		const player = state.players[event.playerId];
		if (player.setup.status === "LOCKED") throw new Error(`${event.playerId} đã khóa Setup.`);
		const players = {
			...state.players,
			[event.playerId]: {
				...player,
				setup: { status: "LOCKED" }
			}
		};
		const nextState = {
			...state,
			players
		};
		return Object.values(players).every((candidate) => candidate.setup.status === "LOCKED") ? transitionWithPhase(nextState, { type: "SETUP_COMPLETED" }) : nextState;
	}
	if (event.type === "GAME_ENDED") return {
		...transitionWithPhase(state, { type: "GAME_ENDED" }),
		result: event.result
	};
	return transitionWithPhase(state, event);
}
/** Áp dụng phase transition lên GameState mà vẫn bảo toàn các field mở rộng. */
function transitionWithPhase(state, event) {
	const next = transitionPhase({
		round: state.round,
		phase: state.phase
	}, event);
	return {
		...state,
		round: next.round,
		phase: next.phase
	};
}
//#endregion
//#region ../../packages/game-core/src/game-events.ts
/**
* Append một batch event theo đúng thứ tự truyền vào và gán sequence liên tục.
*
* Hàm không thêm timestamp hoặc animation duration. Presentation layer tự ánh
* xạ event domain thành timing/motion phù hợp.
*
* @throws Khi `PRIVATE_INSPECTION_RESULT` không có private visibility.
*/
function appendGameEvents(state, drafts) {
	let sequence = state.events.at(-1)?.sequence ?? 0;
	const appended = drafts.map((draft) => {
		if (draft.type === "PRIVATE_INSPECTION_RESULT" && draft.visibility.type !== "PRIVATE") throw new Error("PRIVATE_INSPECTION_RESULT phải có private visibility.");
		sequence += 1;
		return {
			...draft,
			id: `${state.gameId}:event:${sequence}`,
			sequence,
			round: state.round,
			phase: state.phase.type
		};
	});
	return {
		...state,
		events: [...state.events, ...appended]
	};
}
/** Kiểm tra event có được phép xuất hiện trong view của player hay không. */
function isGameEventVisibleTo(event, playerId) {
	return event.visibility.type === "PUBLIC" || event.visibility.playerId === playerId;
}
//#endregion
//#region ../../packages/game-core/src/player-view.ts
/**
* Serialize master GameState thành snapshot riêng cho `viewerId`.
*
* Hàm không trả master state reference và không đưa opponent submission,
* private intel, hidden role hoặc effect source vào kết quả.
*/
function serializePlayerView(state, viewerId) {
	const opponentId = viewerId === PlayerId.PLAYER_A ? PlayerId.PLAYER_B : PlayerId.PLAYER_A;
	const self = state.players[viewerId];
	const opponent = state.players[opponentId];
	return {
		gameId: state.gameId,
		viewerId,
		round: state.round,
		phase: { ...state.phase },
		activePlayer: getActivePhasePlayer(state.phase),
		self: serializePrivatePlayer(self),
		opponent: serializeOpponentPlayer(opponent),
		result: state.result ? { ...state.result } : null,
		events: state.events.filter((event) => isGameEventVisibleTo(event, viewerId)).map(cloneGameEvent)
	};
}
function cloneGameEvent(event) {
	if (event.type === "CARD_ELIMINATED") return {
		...event,
		visibility: { ...event.visibility },
		cause: { ...event.cause }
	};
	if (event.type === "COUNCIL_ACCUSATION_RESOLVED") return {
		...event,
		visibility: { ...event.visibility },
		voterIds: [...event.voterIds]
	};
	return {
		...event,
		visibility: { ...event.visibility }
	};
}
function serializePrivatePlayer(player) {
	return {
		id: player.id,
		board: player.board.map(serializePrivateCard),
		setup: { ...player.setup },
		submissions: cloneSubmissions(player.submissions),
		specialAbilities: player.specialAbilities.map((ability) => ({ ...ability })),
		privateIntel: player.privateIntel.map((intel) => ({ ...intel }))
	};
}
function serializeOpponentPlayer(player) {
	return {
		id: player.id,
		board: player.board.map(serializePublicCard),
		setupLocked: player.setup.status === "LOCKED",
		submissionLocks: {
			councilAccusation: player.submissions.council.accusation !== null,
			councilReaction: player.submissions.council.reaction !== null,
			night: player.submissions.night !== null,
			defense: player.submissions.defense !== null,
			purge: player.submissions.purge !== null,
			finalGuess: player.submissions.finalGuess !== null
		}
	};
}
function serializePrivateCard(card) {
	return {
		id: card.id,
		instanceId: card.occupant.id,
		position: card.position,
		owner: card.owner,
		state: { ...card.occupant.state },
		role: cloneRoleState(card.occupant.role),
		effects: card.occupant.effects.map(serializeVisibleEffect)
	};
}
function serializePublicCard(card) {
	return {
		id: card.id,
		instanceId: card.occupant.id,
		position: card.position,
		owner: card.owner,
		state: { ...card.occupant.state },
		role: card.occupant.state.visibility === "REVEALED" ? card.occupant.role.id : null,
		effects: card.occupant.effects.map(serializeVisibleEffect)
	};
}
function serializeVisibleEffect(cardEffect) {
	return {
		kind: cardEffect.kind,
		appliedRound: cardEffect.appliedRound,
		expires: { ...cardEffect.expires }
	};
}
function cloneRoleState(role) {
	return {
		id: role.id,
		abilities: role.abilities.map(cloneAbilityState)
	};
}
function cloneAbilityState(ability) {
	if ("lastTarget" in ability) return {
		...ability,
		lastTarget: ability.lastTarget ? { ...ability.lastTarget } : null
	};
	return { ...ability };
}
function cloneSubmissions(submissions) {
	return {
		council: {
			accusation: submissions.council.accusation?.type === "ACCUSE" ? {
				...submissions.council.accusation,
				voterIds: [...submissions.council.accusation.voterIds]
			} : submissions.council.accusation ? { ...submissions.council.accusation } : null,
			reaction: submissions.council.reaction ? { ...submissions.council.reaction } : null
		},
		night: submissions.night ? { ...submissions.night } : null,
		defense: submissions.defense ? { ...submissions.defense } : null,
		purge: submissions.purge ? { ...submissions.purge } : null,
		finalGuess: submissions.finalGuess
	};
}
//#endregion
//#region ../../packages/game-core/src/rule-pipeline.ts
/** Lỗi validation cho action không hợp lệ theo authoritative state hiện tại. */
var RuleValidationError = class extends Error {
	constructor(message) {
		super(message);
		this.name = "RuleValidationError";
	}
};
/**
* Entry point của rule pipeline.
*
* Action luôn được validate trước khi state thay đổi. Khi đủ submission của
* phase đồng thời, pipeline tự resolve, phát event, cleanup và chuyển phase.
*/
function dispatchPlayerAction(state, action) {
	if (state.result || state.phase.type === "ENDED") throw new RuleValidationError("Game đã kết thúc.");
	switch (action.type) {
		case "SETUP_REORDER": return reorderSetupBoard(state, action.playerId, action.order);
		case "SETUP_LOCK":
			assertPhase(state, "SETUP");
			if (state.players[action.playerId].setup.status === "LOCKED") throw new RuleValidationError(`${action.playerId} đã khóa Setup.`);
			return transitionGameState(state, {
				type: "SETUP_LOCKED",
				playerId: action.playerId
			});
		case "DAY_SUBMIT":
			validateDayActor(state, action.playerId);
			return resolveDayAction(state, action.playerId, action.action);
		case "COUNCIL_ACCUSATION_SUBMIT": return submitCouncilAccusation(state, action.playerId, action.order);
		case "COUNCIL_REACTION_SUBMIT": return submitCouncilReaction(state, action.playerId, action.order);
		case "NIGHT_SUBMIT": return submitNightOrder(state, action.playerId, action.order);
		case "DEFENSE_SUBMIT": return submitDefenseOrder(state, action.playerId, action.order);
		case "PURGE_SUBMIT": return submitPurgeOrder(state, action.playerId, action.order);
		case "FINAL_GUESS_SUBMIT": return submitFinalGuess(state, action.playerId, action.guess);
	}
}
function reorderSetupBoard(state, playerId, order) {
	assertPhase(state, "SETUP");
	const player = state.players[playerId];
	if (player.setup.status !== "ARRANGING") throw new RuleValidationError(`${playerId} đã khóa Setup.`);
	const currentIds = player.board.map((card) => card.occupant.id);
	if (order.length !== currentIds.length || new Set(order).size !== currentIds.length || order.some((instanceId) => !currentIds.includes(instanceId))) throw new RuleValidationError("Setup order phải chứa đúng toàn bộ card instance hiện có, không trùng lặp.");
	const occupants = new Map(player.board.map((card) => [card.occupant.id, card.occupant]));
	return updatePlayer(state, playerId, (current) => ({
		...current,
		board: current.board.map((slot, index) => ({
			...slot,
			occupant: occupants.get(order[index])
		}))
	}));
}
function resolveDayAction(state, playerId, action) {
	if (action.type === "PASS") return completeDayAction(state, playerId);
	const source = getOwnedLivingCard(state, playerId, action.sourceId, "Day source");
	const events = [];
	let next = state;
	switch (action.type) {
		case "SHOOT": {
			const ability = requireAvailableAbility(source, AbilityId.SHOOTER_SHOOT);
			const target = getOpponentLivingCard(state, playerId, action.targetId, "Shooter target");
			const opponent = state.players[target.owner];
			if (target.occupant.state.visibility !== "REVEALED") throw new RuleValidationError("Shooter chỉ bắn được target đã lộ.");
			if (opponent.board.filter((card) => card.occupant.state.visibility === "REVEALED").length < 2) throw new RuleValidationError("Shooter cần đối thủ có ít nhất hai role đã lộ.");
			if (ability.remainingUses < 1) throw new RuleValidationError("Shooter đã hết đạn.");
			next = useAndRevealSource(next, source, AbilityId.SHOOTER_SHOOT, target.id, events, false).state;
			const eliminated = eliminateCard(next, target.id, true, {
				type: "ABILITY",
				abilityId: AbilityId.SHOOTER_SHOOT,
				sourceCardId: source.id
			}, events);
			next = eliminated.state;
			next = resolveRevengeChain(next, eliminated.eliminatedIds, true, events);
			break;
		}
		case "MARK": {
			requireAvailableAbility(source, AbilityId.AVENGER_MARK);
			const target = getOpponentLivingCard(state, playerId, action.targetId, "Avenger target");
			next = removeExistingRevengeMark(useAndRevealSource(next, source, AbilityId.AVENGER_MARK, target.id, events).state, source.occupant.id);
			const currentTarget = getCard(next, target.id);
			const mark = {
				id: `revenge:${playerId}:${source.id}:${target.id}:round:${next.round}`,
				kind: CardEffectKind.REVENGE_MARK,
				source: {
					type: "ABILITY",
					abilityId: AbilityId.AVENGER_MARK,
					instanceId: source.occupant.id,
					playerId
				},
				appliedRound: next.round,
				expires: {
					type: "AFTER_PHASE",
					phase: "NIGHT_RESOLUTION",
					round: next.round
				}
			};
			next = replaceCard(next, transitionCard(currentTarget, {
				type: "APPLY_EFFECT",
				effect: mark
			}));
			events.push({
				type: "EFFECT_APPLIED",
				visibility: { type: "PUBLIC" },
				targetCardId: target.id,
				effectKind: CardEffectKind.REVENGE_MARK
			});
			break;
		}
		case "PURIFY": {
			requireAvailableAbility(source, AbilityId.PRIEST_PURIFY);
			const target = getOpponentLivingCard(state, playerId, action.targetId, "Priest target");
			next = useAndRevealSource(next, source, AbilityId.PRIEST_PURIFY, target.id, events).state;
			const victimId = getRoleDefinition(target.occupant.role.id).faction === Faction.WEREWOLF ? target.id : source.id;
			const eliminated = eliminateCard(next, victimId, true, {
				type: "ABILITY",
				abilityId: AbilityId.PRIEST_PURIFY,
				sourceCardId: source.id
			}, events);
			next = eliminated.state;
			next = resolveRevengeChain(next, eliminated.eliminatedIds, true, events);
			break;
		}
		case "REVIVE": {
			requireAvailableAbility(source, AbilityId.WITCH_REVIVE);
			const target = getOwnedCard(state, playerId, action.targetId, "Witch target");
			if (isCardAlive(target)) throw new RuleValidationError("Witch chỉ hồi sinh card đã chết bên mình.");
			next = useAndRevealSource(next, source, AbilityId.WITCH_REVIVE, target.id, events).state;
			const revived = transitionCard(getCard(next, target.id), { type: "REVIVE" });
			next = replaceCard(next, revived);
			events.push({
				type: "CARD_REVIVED",
				visibility: { type: "PUBLIC" },
				cardId: target.id,
				sourceCardId: source.id
			});
			break;
		}
	}
	next = appendGameEvents(next, events);
	return completeDayAction(next, playerId);
}
function completeDayAction(state, playerId) {
	const result = getEliminationResult(state);
	if (result) return transitionGameState(state, {
		type: "GAME_ENDED",
		result
	});
	if (hasFinalDuelBoard(state)) return transitionGameState(state, { type: "FINAL_DUEL_REQUIRED" });
	return transitionGameState(state, {
		type: "DAY_ACTION_COMPLETED",
		playerId
	});
}
function validateDayActor(state, playerId) {
	if ((state.phase.type === "DAY_A" ? PlayerId.PLAYER_A : state.phase.type === "DAY_B" ? PlayerId.PLAYER_B : null) !== playerId) throw new RuleValidationError(`Không phải Day turn của ${playerId}.`);
}
function requireAvailableAbility(source, abilityId) {
	assertCardAbilitySourceAvailable(source);
	const ability = getRoleAbility(source.occupant.role, abilityId);
	if (!ability) throw new RuleValidationError(`${source.id} không sở hữu ${abilityId}.`);
	if ("remainingUses" in ability && ability.remainingUses < 1) throw new RuleValidationError(`${abilityId} đã hết lượt sử dụng.`);
	return ability;
}
function useAndRevealSource(state, source, abilityId, targetId, events, revealSource = true) {
	let next = state;
	let updatedSource = getCard(next, source.id);
	if (revealSource && updatedSource.occupant.state.visibility === "HIDDEN") {
		updatedSource = transitionCard(updatedSource, { type: "REVEAL" });
		events.push({
			type: "CARD_REVEALED",
			visibility: { type: "PUBLIC" },
			cardId: source.id
		});
	}
	updatedSource = {
		...updatedSource,
		occupant: {
			...updatedSource.occupant,
			role: transitionRole(updatedSource.occupant.role, {
				type: "ABILITY_USED",
				abilityId,
				targetInstanceId: getCard(next, targetId).occupant.id,
				round: next.round
			})
		}
	};
	next = replaceCard(next, updatedSource);
	events.push({
		type: "ABILITY_RESOLVED",
		visibility: { type: "PUBLIC" },
		abilityId,
		sourceCardId: source.id,
		targetCardId: targetId
	});
	return {
		state: next,
		source: updatedSource
	};
}
function eliminateCard(state, cardId, revealOnDeath, cause, events) {
	let card = getCard(state, cardId);
	if (!isCardAlive(card)) return {
		state,
		eliminatedIds: []
	};
	let next = state;
	if (revealOnDeath && card.occupant.state.visibility === "HIDDEN") {
		card = transitionCard(card, { type: "REVEAL" });
		next = replaceCard(next, card);
		events.push({
			type: "CARD_REVEALED",
			visibility: { type: "PUBLIC" },
			cardId
		});
	}
	card = transitionCard(card, { type: "ELIMINATE" });
	next = replaceCard(next, card);
	events.push({
		type: "CARD_ELIMINATED",
		visibility: { type: "PUBLIC" },
		cardId,
		cause
	});
	return {
		state: next,
		eliminatedIds: [cardId]
	};
}
function resolveRevengeChain(state, eliminatedIds, revealOnDeath, events) {
	const queue = [...eliminatedIds];
	const resolvedSources = /* @__PURE__ */ new Set();
	let next = state;
	while (queue.length > 0) {
		const sourceId = queue.shift();
		if (!sourceId || resolvedSources.has(sourceId)) continue;
		resolvedSources.add(sourceId);
		const source = getCard(next, sourceId);
		if (!getRoleAbility(source.occupant.role, AbilityId.AVENGER_MARK)) continue;
		const markedTarget = findRevengeTarget(next, source.occupant.id);
		if (!markedTarget || !isCardAlive(markedTarget)) continue;
		const eliminated = eliminateCard(next, markedTarget.id, revealOnDeath, {
			type: "REVENGE",
			sourceCardId: source.id
		}, events);
		next = eliminated.state;
		queue.push(...eliminated.eliminatedIds);
	}
	return next;
}
function findRevengeTarget(state, sourceInstanceId) {
	for (const playerId of PLAYER_ORDER$1) for (const card of state.players[playerId].board) if (card.occupant.effects.some((effect) => effect.kind === CardEffectKind.REVENGE_MARK && effect.source.type === "ABILITY" && effect.source.instanceId === sourceInstanceId)) return card;
	return null;
}
function removeExistingRevengeMark(state, sourceInstanceId) {
	let next = state;
	for (const playerId of PLAYER_ORDER$1) for (const card of next.players[playerId].board) {
		const marks = card.occupant.effects.filter((effect) => effect.kind === CardEffectKind.REVENGE_MARK && effect.source.type === "ABILITY" && effect.source.instanceId === sourceInstanceId);
		let updated = card;
		for (const mark of marks) updated = transitionCard(updated, {
			type: "REMOVE_EFFECT",
			effectId: mark.id
		});
		if (updated !== card) next = replaceCard(next, updated);
	}
	return next;
}
function submitCouncilAccusation(state, playerId, order) {
	assertPhase(state, "COUNCIL_PLAN");
	assertSubmissionOpen(state.players[playerId].submissions.council.accusation, "Council Accusation", playerId);
	validateCouncilAccusation(state, playerId, order);
	return resolveCouncilWhenReady(updatePlayer(state, playerId, (player) => ({
		...player,
		submissions: {
			...player.submissions,
			council: {
				...player.submissions.council,
				accusation: order.type === "ACCUSE" ? {
					...order,
					voterIds: [...order.voterIds]
				} : { ...order }
			}
		}
	})));
}
function validateCouncilAccusation(state, playerId, order) {
	if (order.type === "PASS") return;
	const target = getOpponentLivingCard(state, playerId, order.targetId, "Council target");
	if (target.occupant.state.visibility === "REVEALED") {
		if (order.guessedRole !== null) throw new RuleValidationError("Target đã lộ không cần guessedRole.");
	} else {
		if (order.guessedRole === null) throw new RuleValidationError("Target còn ẩn cần guessedRole.");
		if (!availableCouncilRoleGuesses(state, target.owner).includes(order.guessedRole)) throw new RuleValidationError("Role này không còn trong các khả năng chưa lộ.");
	}
	if (order.voterIds.length !== 3 || new Set(order.voterIds).size !== 3) throw new RuleValidationError("Council cần đúng ba voter khác nhau.");
	for (const voterId of order.voterIds) {
		const voter = getOwnedLivingCard(state, playerId, voterId, "Council voter");
		if (getRoleDefinition(voter.occupant.role.id).faction !== Faction.VILLAGE) throw new RuleValidationError(`${voter.id} không thuộc phe Dân.`);
		if (hasCardEffect(voter, CardEffectKind.COUNCIL_LOCK)) throw new RuleValidationError(`${voter.id} đang bị khóa Council.`);
		if (hasCardEffect(voter, CardEffectKind.PURGE_LOCK)) throw new RuleValidationError(`${voter.id} đang bị Khóa mạch và không thể tham gia Council.`);
	}
}
function availableCouncilRoleGuesses(state, targetPlayerId) {
	const remaining = /* @__PURE__ */ new Map();
	for (const role of STANDARD_DECK) remaining.set(role, (remaining.get(role) ?? 0) + 1);
	for (const card of state.players[targetPlayerId].board) {
		if (card.occupant.state.visibility !== "REVEALED") continue;
		remaining.set(card.occupant.role.id, Math.max(0, (remaining.get(card.occupant.role.id) ?? 0) - 1));
	}
	return Object.values(CardRole).filter((role) => (remaining.get(role) ?? 0) > 0);
}
function submitCouncilReaction(state, playerId, order) {
	assertPhase(state, "COUNCIL_PLAN");
	assertSubmissionOpen(state.players[playerId].submissions.council.reaction, "Council Reaction", playerId);
	validateCouncilReaction(state, playerId, order);
	return resolveCouncilWhenReady(updatePlayer(state, playerId, (player) => ({
		...player,
		submissions: {
			...player.submissions,
			council: {
				...player.submissions.council,
				reaction: { ...order }
			}
		}
	})));
}
function validateCouncilReaction(state, playerId, order) {
	if (order.type === "PASS") return;
	const source = getOwnedLivingCard(state, playerId, order.sourceId, "Wolf Guard source");
	getOwnedLivingCard(state, playerId, order.targetId, "Wolf Guard target");
	requireAvailableAbility(source, AbilityId.WOLF_GUARD_RESCUE);
}
function resolveCouncilWhenReady(state) {
	if (!allCouncilSlotsSubmitted(state)) return state;
	return resolveCouncil(transitionGameState(state, { type: "COUNCIL_ORDERS_LOCKED" }));
}
function allCouncilSlotsSubmitted(state) {
	return PLAYER_ORDER$1.every((playerId) => {
		const council = state.players[playerId].submissions.council;
		return council.accusation !== null && council.reaction !== null;
	});
}
function resolveCouncil(state) {
	const accusationOrders = snapshotCouncilOrders(state, "accusation");
	const reactionOrders = snapshotCouncilOrders(state, "reaction");
	const initialCards = /* @__PURE__ */ new Map();
	for (const playerId of PLAYER_ORDER$1) for (const card of state.players[playerId].board) initialCards.set(card.id, card);
	const events = [];
	const pendingDeaths = /* @__PURE__ */ new Map();
	const failedVoters = [];
	const successfulTargets = /* @__PURE__ */ new Map();
	let next = state;
	for (const playerId of PLAYER_ORDER$1) {
		const accusation = accusationOrders[playerId];
		if (accusation.type === "PASS") {
			events.push({
				type: "COUNCIL_PASSED",
				visibility: { type: "PUBLIC" },
				playerId
			});
			continue;
		}
		for (const voterId of accusation.voterIds) {
			const voter = getCard(next, voterId);
			if (voter.occupant.state.visibility === "HIDDEN") {
				next = replaceCard(next, transitionCard(voter, { type: "REVEAL" }));
				events.push({
					type: "CARD_REVEALED",
					visibility: { type: "PUBLIC" },
					cardId: voter.id
				});
			}
		}
		const originalTarget = initialCards.get(accusation.targetId);
		if (!originalTarget) throw new Error(`Thiếu Council target ${accusation.targetId}.`);
		const correct = accusation.voterIds.reduce((total, voterId) => {
			return total + (initialCards.get(voterId)?.occupant.role.id === CardRole.VILLAGER ? 2 : 1);
		}, 0) >= 3 && isCardAlive(originalTarget) && (originalTarget.occupant.state.visibility === "REVEALED" || originalTarget.occupant.role.id === accusation.guessedRole);
		events.push({
			type: "COUNCIL_ACCUSATION_RESOLVED",
			visibility: { type: "PUBLIC" },
			playerId,
			targetCardId: accusation.targetId,
			voterIds: accusation.voterIds,
			succeeded: correct
		});
		if (correct) successfulTargets.set(playerId, originalTarget.id);
		else failedVoters.push({
			playerId,
			voterIds: accusation.voterIds
		});
	}
	next = clearExpiredCouncilLocks(next);
	for (const failure of failedVoters) for (const voterId of failure.voterIds) {
		const voter = getCard(next, voterId);
		if (!isCardAlive(voter)) continue;
		const lock = {
			id: `council-lock:${failure.playerId}:${voter.id}:round:${next.round}`,
			kind: CardEffectKind.COUNCIL_LOCK,
			source: {
				type: "RULE",
				rule: CardEffectRule.FAILED_COUNCIL
			},
			appliedRound: next.round,
			expires: {
				type: "AFTER_PHASE",
				phase: "COUNCIL_RESOLUTION",
				round: next.round + 1
			}
		};
		next = replaceCard(next, transitionCard(voter, {
			type: "APPLY_EFFECT",
			effect: lock
		}));
		events.push({
			type: "EFFECT_APPLIED",
			visibility: { type: "PUBLIC" },
			targetCardId: voter.id,
			effectKind: CardEffectKind.COUNCIL_LOCK
		});
	}
	for (const [accuserId, targetId] of successfulTargets) {
		const reaction = reactionOrders[getCard(next, targetId).owner];
		if (reaction.type === "WOLF_GUARD_RESCUE" && reaction.targetId === targetId) {
			let source = getCard(next, reaction.sourceId);
			if (source.occupant.state.visibility === "HIDDEN") {
				source = transitionCard(source, { type: "REVEAL" });
				events.push({
					type: "CARD_REVEALED",
					visibility: { type: "PUBLIC" },
					cardId: source.id
				});
			}
			source = {
				...source,
				occupant: {
					...source.occupant,
					role: transitionRole(source.occupant.role, {
						type: "ABILITY_USED",
						abilityId: AbilityId.WOLF_GUARD_RESCUE,
						targetInstanceId: getCard(next, targetId).occupant.id,
						round: next.round
					})
				}
			};
			next = replaceCard(next, source);
			events.push({
				type: "WOLF_GUARD_RESCUED",
				visibility: { type: "PUBLIC" },
				sourceCardId: source.id,
				targetCardId: targetId
			});
			continue;
		}
		pendingDeaths.set(targetId, {
			type: "COUNCIL",
			playerId: accuserId
		});
	}
	const eliminatedIds = [];
	for (const [targetId, cause] of pendingDeaths) {
		const eliminated = eliminateCard(next, targetId, true, cause, events);
		next = eliminated.state;
		eliminatedIds.push(...eliminated.eliminatedIds);
	}
	next = resolveRevengeChain(next, eliminatedIds, true, events);
	next = clearCouncilSubmissions(next);
	next = appendGameEvents(next, events);
	const result = getEliminationResult(next);
	if (result) return transitionGameState(next, {
		type: "GAME_ENDED",
		result
	});
	if (hasFinalDuelBoard(next)) return transitionGameState(next, { type: "FINAL_DUEL_REQUIRED" });
	return transitionGameState(next, { type: "COUNCIL_RESOLVED" });
}
function snapshotCouncilOrders(state, key) {
	const orderA = state.players[PlayerId.PLAYER_A].submissions.council[key];
	const orderB = state.players[PlayerId.PLAYER_B].submissions.council[key];
	if (!orderA || !orderB) throw new Error(`Không đủ Council ${key} để resolve.`);
	return {
		[PlayerId.PLAYER_A]: orderA,
		[PlayerId.PLAYER_B]: orderB
	};
}
function clearExpiredCouncilLocks(state) {
	let next = state;
	for (const playerId of PLAYER_ORDER$1) for (const card of next.players[playerId].board) {
		let updated = card;
		for (const effect of card.occupant.effects) if (effect.kind === CardEffectKind.COUNCIL_LOCK && effect.expires.type === "AFTER_PHASE" && effect.expires.phase === "COUNCIL_RESOLUTION" && effect.expires.round <= state.round) updated = transitionCard(updated, {
			type: "REMOVE_EFFECT",
			effectId: effect.id
		});
		if (updated !== card) next = replaceCard(next, updated);
	}
	return next;
}
function clearCouncilSubmissions(state) {
	let next = state;
	for (const playerId of PLAYER_ORDER$1) next = updatePlayer(next, playerId, (player) => ({
		...player,
		submissions: {
			...player.submissions,
			council: {
				accusation: null,
				reaction: null
			}
		}
	}));
	return next;
}
function submitPurgeOrder(state, playerId, order) {
	assertPhase(state, "PURGE_PLAN");
	assertSubmissionOpen(state.players[playerId].submissions.purge, "Purge", playerId);
	const expectedRule = getPurgeRule(state.round);
	if (order.rule !== expectedRule) throw new RuleValidationError(`Vòng ${state.round} yêu cầu Purge rule ${expectedRule}, không phải ${order.rule}.`);
	validatePurgeOrder(state, playerId, order);
	let next = updatePlayer(state, playerId, (player) => ({
		...player,
		submissions: {
			...player.submissions,
			purge: { ...order }
		}
	}));
	if (!bothPlayersSubmitted(next, "purge")) return next;
	next = transitionGameState(next, { type: "PURGE_ORDERS_LOCKED" });
	return resolvePurge(next);
}
function getPurgeRule(round) {
	if (round < 6) throw new RuleValidationError("Purge chỉ mở từ Vòng 6.");
	return [
		"CUT",
		"SWAP",
		"REVEAL",
		"LOCK"
	][(round - 6) % 4];
}
function validatePurgeOrder(state, playerId, order) {
	if (order.rule === "SWAP") {
		if (order.ownTargetId === null && order.opponentTargetId === null) {
			if (hasValidSwapOption(state, playerId)) throw new RuleValidationError("Purge SWAP vẫn còn cặp lá hợp lệ; không thể bỏ qua.");
			return;
		}
		if (order.ownTargetId === null || order.opponentTargetId === null) throw new RuleValidationError("Purge SWAP cần cả lá bên mình và lá đối thủ.");
		getOwnedLivingCard(state, playerId, order.ownTargetId, "Purge own target");
		getOpponentLivingCard(state, playerId, order.opponentTargetId, "Purge opponent target");
		return;
	}
	if (order.rule === "REVEAL" && order.targetId === null) {
		if (state.players[playerId].board.some((card) => isCardAlive(card) && card.occupant.state.visibility === "HIDDEN")) throw new RuleValidationError("Purge REVEAL cần chọn một card sống còn ẩn.");
		return;
	}
	if (order.targetId === null) throw new RuleValidationError(`Purge ${order.rule} cần target.`);
	const target = getOwnedLivingCard(state, playerId, order.targetId, "Purge target");
	if (order.rule === "REVEAL" && target.occupant.state.visibility === "REVEALED") throw new RuleValidationError("Purge REVEAL cần một card đang ẩn.");
}
/**
* Kiểm tra còn tồn tại một cặp SWAP hợp lệ (không đụng vào cặp đối thủ đã
* khóa, nếu có). Dùng để cho phép bỏ qua SWAP khi mọi cặp đều bị chọn trước.
*/
function hasValidSwapOption(state, playerId) {
	const opponentId = playerId === PlayerId.PLAYER_A ? PlayerId.PLAYER_B : PlayerId.PLAYER_A;
	const submitted = state.players[opponentId].submissions.purge;
	const takenIds = submitted && submitted.rule === "SWAP" ? new Set([submitted.ownTargetId, submitted.opponentTargetId].filter((id) => id !== null)) : null;
	const ownIds = state.players[playerId].board.filter(isCardAlive).map((card) => card.id);
	const opponentIds = state.players[opponentId].board.filter(isCardAlive).map((card) => card.id);
	for (const ownId of ownIds) for (const opponentIdCandidate of opponentIds) {
		if (takenIds && (takenIds.has(ownId) || takenIds.has(opponentIdCandidate))) continue;
		return true;
	}
	return false;
}
function resolvePurge(state) {
	const orders = snapshotOrders(state, "purge");
	const events = [];
	let next = state;
	if (orders[PlayerId.PLAYER_A].rule === "SWAP") {
		const snapshot = /* @__PURE__ */ new Map();
		for (const playerId of PLAYER_ORDER$1) for (const card of state.players[playerId].board) snapshot.set(card.id, card);
		const replacements = /* @__PURE__ */ new Map();
		const usedCardIds = /* @__PURE__ */ new Set();
		for (const playerId of PLAYER_ORDER$1) {
			const order = orders[playerId];
			if (order.rule !== "SWAP") throw new Error("Purge SWAP snapshot không đồng nhất.");
			if (order.ownTargetId === null || order.opponentTargetId === null || usedCardIds.has(order.ownTargetId) || usedCardIds.has(order.opponentTargetId)) {
				events.push({
					type: "PURGE_RESOLVED",
					visibility: { type: "PUBLIC" },
					playerId,
					rule: "SWAP",
					targetCardId: null,
					swapTargetCardId: null
				});
				continue;
			}
			const ownSlot = snapshot.get(order.ownTargetId);
			const opponentSlot = snapshot.get(order.opponentTargetId);
			if (!ownSlot || !opponentSlot) throw new Error("Thiếu card trong Purge SWAP snapshot.");
			usedCardIds.add(order.ownTargetId);
			usedCardIds.add(order.opponentTargetId);
			replacements.set(ownSlot.id, moveCardRuntimeToSlot(opponentSlot, ownSlot));
			replacements.set(opponentSlot.id, moveCardRuntimeToSlot(ownSlot, opponentSlot));
			events.push({
				type: "PURGE_RESOLVED",
				visibility: { type: "PUBLIC" },
				playerId,
				rule: order.rule,
				targetCardId: order.ownTargetId,
				swapTargetCardId: order.opponentTargetId
			});
		}
		for (const replacement of replacements.values()) next = replaceCard(next, replacement);
	} else {
		const pendingCuts = [];
		for (const playerId of PLAYER_ORDER$1) {
			const order = orders[playerId];
			if (order.rule === "SWAP") throw new Error("Purge rule snapshot không đồng nhất.");
			events.push({
				type: "PURGE_RESOLVED",
				visibility: { type: "PUBLIC" },
				playerId,
				rule: order.rule,
				targetCardId: order.targetId,
				swapTargetCardId: null
			});
			if (order.targetId === null) continue;
			if (order.rule === "CUT") pendingCuts.push(order.targetId);
			else if (order.rule === "REVEAL") {
				const target = getCard(next, order.targetId);
				next = replaceCard(next, transitionCard(target, { type: "REVEAL" }));
				events.push({
					type: "CARD_REVEALED",
					visibility: { type: "PUBLIC" },
					cardId: target.id
				});
			} else {
				const target = getCard(next, order.targetId);
				const lock = {
					id: `purge-lock:${playerId}:${target.id}:round:${next.round}`,
					kind: CardEffectKind.PURGE_LOCK,
					source: {
						type: "RULE",
						rule: CardEffectRule.PURGE_LOCK
					},
					appliedRound: next.round,
					expires: {
						type: "AFTER_PHASE",
						phase: "NIGHT_RESOLUTION",
						round: next.round
					}
				};
				next = replaceCard(next, transitionCard(target, {
					type: "APPLY_EFFECT",
					effect: lock
				}));
				events.push({
					type: "EFFECT_APPLIED",
					visibility: { type: "PUBLIC" },
					targetCardId: target.id,
					effectKind: CardEffectKind.PURGE_LOCK
				});
			}
		}
		const eliminatedIds = [];
		for (const targetId of pendingCuts) {
			const eliminated = eliminateCard(next, targetId, true, {
				type: "PURGE",
				rule: "CUT"
			}, events);
			next = eliminated.state;
			eliminatedIds.push(...eliminated.eliminatedIds);
		}
		next = resolveRevengeChain(next, eliminatedIds, true, events);
	}
	next = clearSubmission(next, "purge");
	next = appendGameEvents(next, events);
	const result = getEliminationResult(next);
	if (result) return transitionGameState(next, {
		type: "GAME_ENDED",
		result
	});
	if (hasFinalDuelBoard(next)) return transitionGameState(next, { type: "FINAL_DUEL_REQUIRED" });
	return transitionGameState(next, { type: "PURGE_RESOLVED" });
}
function moveCardRuntimeToSlot(source, slot) {
	return {
		...slot,
		occupant: source.occupant
	};
}
function submitFinalGuess(state, playerId, guess) {
	assertPhase(state, "FINAL_DUEL");
	assertSubmissionOpen(state.players[playerId].submissions.finalGuess, "Final Duel Guess", playerId);
	if (!Object.values(CardRole).includes(guess)) throw new RuleValidationError("Final Duel guess không phải role hợp lệ.");
	if (!hasFinalDuelBoard(state)) throw new RuleValidationError("Final Duel yêu cầu mỗi bên còn đúng một card sống.");
	const next = updatePlayer(state, playerId, (player) => ({
		...player,
		submissions: {
			...player.submissions,
			finalGuess: guess
		}
	}));
	return bothPlayersSubmitted(next, "finalGuess") ? resolveFinalDuel(next) : next;
}
function resolveFinalDuel(state) {
	const guesses = snapshotOrders(state, "finalGuess");
	const cardA = state.players[PlayerId.PLAYER_A].board.find(isCardAlive);
	const cardB = state.players[PlayerId.PLAYER_B].board.find(isCardAlive);
	if (!cardA || !cardB) throw new Error("Final Duel snapshot thiếu card sống.");
	const events = [];
	let next = state;
	for (const card of [cardA, cardB]) {
		if (card.occupant.state.visibility === "REVEALED") continue;
		next = replaceCard(next, transitionCard(card, { type: "REVEAL" }));
		events.push({
			type: "CARD_REVEALED",
			visibility: { type: "PUBLIC" },
			cardId: card.id
		});
	}
	const correctA = guesses[PlayerId.PLAYER_A] === cardB.occupant.role.id;
	const correctB = guesses[PlayerId.PLAYER_B] === cardA.occupant.role.id;
	events.push({
		type: "FINAL_DUEL_RESOLVED",
		visibility: { type: "PUBLIC" },
		cardAId: cardA.id,
		cardBId: cardB.id,
		guessA: guesses[PlayerId.PLAYER_A],
		guessB: guesses[PlayerId.PLAYER_B],
		correctA,
		correctB
	});
	next = clearSubmission(next, "finalGuess");
	next = appendGameEvents(next, events);
	return transitionGameState(next, {
		type: "GAME_ENDED",
		result: {
			winner: correctA === correctB ? null : correctA ? PlayerId.PLAYER_A : PlayerId.PLAYER_B,
			reason: correctA === correctB ? FinalDuelResultReason.DRAW : FinalDuelResultReason.VICTORY
		}
	});
}
function submitNightOrder(state, playerId, order) {
	assertPhase(state, "NIGHT_PLAN");
	assertSubmissionOpen(state.players[playerId].submissions.night, "Night", playerId);
	validateNightOrder(state, playerId, order);
	const next = updatePlayer(state, playerId, (player) => ({
		...player,
		submissions: {
			...player.submissions,
			night: { ...order }
		}
	}));
	return bothPlayersSubmitted(next, "night") ? transitionGameState(next, { type: "NIGHT_ORDERS_LOCKED" }) : next;
}
function validateNightOrder(state, playerId, order) {
	if (order.type === "PASS") return;
	if (order.type === "BLOOD_MOON") {
		const ability = state.players[playerId].specialAbilities.find((candidate) => candidate.abilityId === PlayerSpecialAbilityId.BLOOD_MOON);
		if (!ability) throw new RuleValidationError(`${playerId} không sở hữu Blood Moon.`);
		if (state.round < ability.unlockRound) throw new RuleValidationError(`Blood Moon chỉ mở từ Vòng ${ability.unlockRound}.`);
		if (state.round < ability.readyRound) throw new RuleValidationError(`Blood Moon hồi lại ở Vòng ${ability.readyRound}.`);
		if (getOpponentLivingCard(state, playerId, order.targetId, "Blood Moon target").occupant.state.visibility !== "REVEALED") throw new RuleValidationError("Blood Moon chỉ đánh được role đã lộ.");
		return;
	}
	const source = getOwnedLivingCard(state, playerId, order.sourceId, "Night source");
	const target = getOpponentLivingCard(state, playerId, order.targetId, "Night target");
	assertCardAbilitySourceAvailable(source);
	const ability = getRoleAbility(source.occupant.role, order.abilityId);
	if (!ability) throw new RuleValidationError(`${source.id} không sở hữu ${order.abilityId}.`);
	if ("remainingUses" in ability && ability.remainingUses < 1) throw new RuleValidationError(`${order.abilityId} đã hết lượt sử dụng.`);
	if (order.abilityId === AbilityId.SEER_INSPECT) {
		const known = state.players[playerId].privateIntel.find((intel) => intel.targetInstanceId === target.occupant.id);
		if (known && getRoleDefinition(known.discoveredRole).faction !== Faction.WEREWOLF) throw new RuleValidationError("Không thể soi lại target phe sáng đã biết.");
	}
}
function submitDefenseOrder(state, playerId, order) {
	assertPhase(state, "DUSK_DEFENSE");
	assertSubmissionOpen(state.players[playerId].submissions.defense, "Defense", playerId);
	validateDefenseOrder(state, playerId, order);
	let next = updatePlayer(state, playerId, (player) => ({
		...player,
		submissions: {
			...player.submissions,
			defense: { ...order }
		}
	}));
	if (!bothPlayersSubmitted(next, "defense")) return next;
	next = transitionGameState(next, { type: "DEFENSE_ORDERS_LOCKED" });
	return resolveNight(next);
}
function validateDefenseOrder(state, playerId, order) {
	if (order.type === "PASS") return;
	const source = getOwnedLivingCard(state, playerId, order.sourceId, "Guard source");
	const target = getOwnedLivingCard(state, playerId, order.targetId, "Guard target");
	assertCardAbilitySourceAvailable(source);
	const guard = getRoleAbility(source.occupant.role, AbilityId.GUARD_PROTECT);
	if (!guard) throw new RuleValidationError(`${source.id} không phải Guard hợp lệ.`);
	if (source.id === target.id) throw new RuleValidationError("Guard không được tự bảo vệ.");
	if (guard.lastTarget?.instanceId === target.occupant.id && guard.lastTarget.round >= state.round - 1) throw new RuleValidationError("Không được bảo vệ cùng target ở hai vòng liên tiếp.");
}
function resolveNight(state) {
	const nightOrders = snapshotOrders(state, "night");
	const defenseOrders = snapshotOrders(state, "defense");
	const events = [];
	const pendingDeaths = /* @__PURE__ */ new Map();
	let next = state;
	for (const playerId of PLAYER_ORDER$1) {
		const defense = defenseOrders[playerId];
		if (defense.type !== "PROTECT") {
			events.push({
				type: "DEFENSE_SKIPPED",
				visibility: { type: "PUBLIC" },
				playerId
			});
			continue;
		}
		const source = getCard(next, defense.sourceId);
		const target = getCard(next, defense.targetId);
		const updatedSource = {
			...source,
			occupant: {
				...source.occupant,
				role: transitionRole(source.occupant.role, {
					type: "ABILITY_USED",
					abilityId: AbilityId.GUARD_PROTECT,
					targetInstanceId: target.occupant.id,
					round: next.round
				})
			}
		};
		next = replaceCard(next, updatedSource);
		const protection = {
			id: `protection:${playerId}:${source.id}:${target.id}:round:${next.round}`,
			kind: CardEffectKind.PROTECTION,
			source: {
				type: "ABILITY",
				abilityId: AbilityId.GUARD_PROTECT,
				instanceId: source.occupant.id,
				playerId
			},
			appliedRound: next.round,
			expires: {
				type: "AFTER_PHASE",
				phase: "NIGHT_RESOLUTION",
				round: next.round
			}
		};
		next = replaceCard(next, transitionCard(target, {
			type: "APPLY_EFFECT",
			effect: protection
		}));
		events.push({
			type: "EFFECT_APPLIED",
			visibility: { type: "PUBLIC" },
			targetCardId: target.id,
			effectKind: CardEffectKind.PROTECTION
		});
	}
	for (const playerId of PLAYER_ORDER$1) {
		const order = nightOrders[playerId];
		if (order.type === "PASS") continue;
		if (order.type === "BLOOD_MOON") {
			if (!next.players[playerId].specialAbilities.find((candidate) => candidate.abilityId === PlayerSpecialAbilityId.BLOOD_MOON)) throw new Error(`${playerId} thiếu Blood Moon khi resolve.`);
			const target = getCard(next, order.targetId);
			next = updatePlayer(next, playerId, (player) => ({
				...player,
				specialAbilities: player.specialAbilities.map((candidate) => candidate.abilityId === PlayerSpecialAbilityId.BLOOD_MOON ? {
					...candidate,
					readyRound: state.round + candidate.cooldownRounds
				} : candidate)
			}));
			events.push({
				type: "ABILITY_RESOLVED",
				visibility: { type: "PUBLIC" },
				abilityId: PlayerSpecialAbilityId.BLOOD_MOON,
				sourceCardId: null,
				targetCardId: target.id
			});
			if (hasCardEffect(target, CardEffectKind.PROTECTION)) events.push({
				type: "EFFECT_BLOCKED",
				visibility: { type: "PUBLIC" },
				targetCardId: target.id,
				effectKind: CardEffectKind.PROTECTION
			});
			else pendingDeaths.set(target.id, {
				type: "PLAYER_ABILITY",
				abilityId: PlayerSpecialAbilityId.BLOOD_MOON,
				playerId
			});
			continue;
		}
		let source = getCard(next, order.sourceId);
		const target = getCard(next, order.targetId);
		if (source.occupant.state.visibility === "HIDDEN") {
			source = transitionCard(source, { type: "REVEAL" });
			next = replaceCard(next, source);
			events.push({
				type: "CARD_REVEALED",
				visibility: { type: "PUBLIC" },
				cardId: source.id
			});
		}
		source = {
			...source,
			occupant: {
				...source.occupant,
				role: transitionRole(source.occupant.role, {
					type: "ABILITY_USED",
					abilityId: order.abilityId,
					targetInstanceId: target.occupant.id,
					round: next.round
				})
			}
		};
		next = replaceCard(next, source);
		if (order.abilityId === AbilityId.SEER_INSPECT) {
			const known = next.players[playerId].privateIntel.find((intel) => intel.targetInstanceId === target.occupant.id);
			events.push({
				type: "ABILITY_RESOLVED",
				visibility: { type: "PUBLIC" },
				abilityId: order.abilityId,
				sourceCardId: source.id,
				targetCardId: null
			});
			events.push({
				type: "ABILITY_RESOLVED",
				visibility: {
					type: "PRIVATE",
					playerId
				},
				abilityId: order.abilityId,
				sourceCardId: source.id,
				targetCardId: target.id
			});
			if (known) pendingDeaths.set(target.id, {
				type: "ABILITY",
				abilityId: order.abilityId,
				sourceCardId: source.id
			});
			else {
				const intel = {
					id: `intel:${playerId}:${source.id}:${target.id}:round:${next.round}`,
					sourceAbilityId: AbilityId.SEER_INSPECT,
					sourceInstanceId: source.occupant.id,
					targetInstanceId: target.occupant.id,
					observedAtSlotId: target.id,
					discoveredRole: target.occupant.role.id,
					discoveredRound: next.round
				};
				next = updatePlayer(next, playerId, (player) => ({
					...player,
					privateIntel: [...player.privateIntel, intel]
				}));
				events.push({
					type: "PRIVATE_INSPECTION_RESULT",
					visibility: {
						type: "PRIVATE",
						playerId
					},
					intelId: intel.id,
					targetCardId: target.id,
					discoveredRole: target.occupant.role.id
				});
			}
			continue;
		}
		events.push({
			type: "ABILITY_RESOLVED",
			visibility: { type: "PUBLIC" },
			abilityId: order.abilityId,
			sourceCardId: source.id,
			targetCardId: target.id
		});
		if (hasCardEffect(target, CardEffectKind.PROTECTION)) events.push({
			type: "EFFECT_BLOCKED",
			visibility: { type: "PUBLIC" },
			targetCardId: target.id,
			effectKind: CardEffectKind.PROTECTION
		});
		else pendingDeaths.set(target.id, {
			type: "ABILITY",
			abilityId: order.abilityId,
			sourceCardId: source.id
		});
	}
	const nightEliminatedIds = [];
	for (const [cardId, cause] of pendingDeaths) {
		const eliminated = eliminateCard(next, cardId, false, cause, events);
		next = eliminated.state;
		nightEliminatedIds.push(...eliminated.eliminatedIds);
	}
	next = resolveRevengeChain(next, nightEliminatedIds, false, events);
	next = clearNightEffects(next);
	next = clearSubmission(clearSubmission(next, "night"), "defense");
	next = appendGameEvents(next, events);
	next = transitionGameState(next, { type: "NIGHT_RESOLVED" });
	next = appendGameEvents(next, [{
		type: "DAWN_PRESENTATION_COMPLETED",
		visibility: { type: "PUBLIC" }
	}]);
	const result = getEliminationResult(next);
	if (result) return transitionGameState(next, {
		type: "GAME_ENDED",
		result
	});
	next = transitionGameState(next, { type: "DAWN_COMPLETED" });
	if (hasFinalDuelBoard(next)) return transitionGameState(next, { type: "FINAL_DUEL_REQUIRED" });
	return next;
}
function clearNightEffects(state) {
	let next = state;
	for (const playerId of PLAYER_ORDER$1) for (const card of next.players[playerId].board) {
		let updated = card;
		for (const effect of card.occupant.effects) if (effect.kind === CardEffectKind.PROTECTION || effect.kind === CardEffectKind.REVENGE_MARK || effect.kind === CardEffectKind.PURGE_LOCK) updated = transitionCard(updated, {
			type: "REMOVE_EFFECT",
			effectId: effect.id
		});
		if (updated !== card) next = replaceCard(next, updated);
	}
	return next;
}
function getEliminationResult(state) {
	const aliveA = livingCount(state.players[PlayerId.PLAYER_A]);
	const aliveB = livingCount(state.players[PlayerId.PLAYER_B]);
	if (aliveA > 0 && aliveB > 0) return null;
	return {
		winner: aliveA === aliveB ? null : aliveA > 0 ? PlayerId.PLAYER_A : PlayerId.PLAYER_B,
		reason: WinReason.ELIMINATION
	};
}
function hasFinalDuelBoard(state) {
	return livingCount(state.players[PlayerId.PLAYER_A]) === 1 && livingCount(state.players[PlayerId.PLAYER_B]) === 1;
}
function livingCount(player) {
	return player.board.filter(isCardAlive).length;
}
var PLAYER_ORDER$1 = [PlayerId.PLAYER_A, PlayerId.PLAYER_B];
function bothPlayersSubmitted(state, key) {
	return PLAYER_ORDER$1.every((playerId) => state.players[playerId].submissions[key] !== null);
}
function snapshotOrders(state, key) {
	const orderA = state.players[PlayerId.PLAYER_A].submissions[key];
	const orderB = state.players[PlayerId.PLAYER_B].submissions[key];
	if (!orderA || !orderB) throw new Error(`Không đủ ${key} submission để resolve.`);
	return {
		[PlayerId.PLAYER_A]: orderA,
		[PlayerId.PLAYER_B]: orderB
	};
}
function clearSubmission(state, key) {
	let next = state;
	for (const playerId of PLAYER_ORDER$1) next = updatePlayer(next, playerId, (player) => ({
		...player,
		submissions: {
			...player.submissions,
			[key]: null
		}
	}));
	return next;
}
function assertPhase(state, phase) {
	if (state.phase.type !== phase) throw new RuleValidationError(`Action yêu cầu phase ${phase}, hiện tại là ${state.phase.type}.`);
}
function assertSubmissionOpen(submission, label, playerId) {
	if (submission !== null) throw new RuleValidationError(`${playerId} đã khóa ${label} Order.`);
}
function assertCardAbilitySourceAvailable(source) {
	if (hasCardEffect(source, CardEffectKind.PURGE_LOCK)) throw new RuleValidationError(`${source.id} đang bị Khóa mạch và không thể dùng ability trong vòng này.`);
}
function getOwnedLivingCard(state, playerId, cardId, label) {
	const card = getCard(state, cardId);
	if (card.owner !== playerId || !isCardAlive(card)) throw new RuleValidationError(`${label} ${cardId} không hợp lệ.`);
	return card;
}
function getOwnedCard(state, playerId, cardId, label) {
	const card = getCard(state, cardId);
	if (card.owner !== playerId) throw new RuleValidationError(`${label} ${cardId} không hợp lệ.`);
	return card;
}
function getOpponentLivingCard(state, playerId, cardId, label) {
	const card = getCard(state, cardId);
	if (card.owner === playerId || !isCardAlive(card)) throw new RuleValidationError(`${label} ${cardId} không hợp lệ.`);
	return card;
}
function getCard(state, cardId) {
	for (const playerId of PLAYER_ORDER$1) {
		const card = state.players[playerId].board.find((candidate) => candidate.id === cardId);
		if (card) return card;
	}
	throw new RuleValidationError(`Không tìm thấy card ${cardId}.`);
}
function replaceCard(state, card) {
	return updatePlayer(state, card.owner, (player) => replacePlayerCard(player, card));
}
function updatePlayer(state, playerId, update) {
	return {
		...state,
		players: {
			...state.players,
			[playerId]: update(state.players[playerId])
		}
	};
}
//#endregion
//#region ../../packages/game-core/src/engine.ts
var GameEngine = class {
	state;
	constructor(roomId, defaultRolesA, defaultRolesB) {
		const rolesA = defaultRolesA || this.getDefaultDeck();
		const rolesB = defaultRolesB || this.getDefaultDeck();
		const players = {
			[PlayerId.PLAYER_A]: createInitialPlayerState(PlayerId.PLAYER_A, rolesA.map((role, index) => createInitialCard(PlayerId.PLAYER_A, index + 1, role))),
			[PlayerId.PLAYER_B]: createInitialPlayerState(PlayerId.PLAYER_B, rolesB.map((role, index) => createInitialCard(PlayerId.PLAYER_B, index + 1, role)))
		};
		this.state = createInitialGameState(roomId, roomId, players);
	}
	getDefaultDeck() {
		return [...STANDARD_DECK];
	}
	/**
	* Trả snapshot độc lập để caller không thể mutate authoritative state ngoài
	* `dispatch(PlayerGameAction)`.
	*/
	getState() {
		return structuredClone(this.state);
	}
	/** Tạo player view v0.2 đã lọc theo quyền biết của viewer. */
	getAuthoritativePlayerView(playerId) {
		return serializePlayerView(this.state, playerId);
	}
	/** Gửi player action qua validation/resolution pipeline duy nhất của game. */
	dispatch(action) {
		this.state = dispatchPlayerAction(this.state, action);
	}
};
//#endregion
//#region server/game-room-server.ts
var PLAYER_ORDER = [PlayerId.PLAYER_A, PlayerId.PLAYER_B];
/**
* In-memory authoritative room/session coordinator cho WebSocket vertical slice.
*
* Class chỉ quản lý ownership của connection và fan-out filtered snapshot.
* Mọi gameplay command vẫn được chuyển nguyên vẹn vào `GameEngine.dispatch()`.
*/
var GameRoomServer = class {
	rooms = /* @__PURE__ */ new Map();
	sessions = /* @__PURE__ */ new Map();
	sessionByPeerId = /* @__PURE__ */ new Map();
	createEngine;
	createSessionId;
	constructor(options = {}) {
		this.createEngine = options.createEngine ?? ((roomId) => new GameEngine(roomId));
		this.createSessionId = options.createSessionId ?? (() => crypto.randomUUID());
	}
	/** Nhận một message đã validate từ gateway và dispatch theo session hiện tại. */
	handleMessage(peer, message) {
		switch (message.type) {
			case "JOIN_ROOM":
				this.joinRoom(peer, message.payload);
				return;
			case "PING":
				this.send(peer, {
					type: "PONG",
					payload: message.payload
				});
				return;
			case "SUBMIT_ACTION":
				this.submitAction(peer, message.payload);
				return;
			case "SURRENDER":
			case "REMATCH_REQUEST":
				this.reject(peer, "NOT_IMPLEMENTED", `${message.type} chưa thuộc vertical slice hiện tại.`);
				return;
		}
	}
	/** Tách peer khỏi session nhưng giữ token để client có thể reconnect. */
	disconnect(peerId) {
		const sessionId = this.sessionByPeerId.get(peerId);
		if (!sessionId) return;
		this.sessionByPeerId.delete(peerId);
		const session = this.sessions.get(sessionId);
		if (session?.peer?.id === peerId) session.peer = null;
	}
	/** Số room hiện có, phục vụ diagnostics và deterministic tests. */
	get roomCount() {
		return this.rooms.size;
	}
	joinRoom(peer, payload) {
		if (this.sessionByPeerId.has(peer.id)) {
			this.sendError(peer, "ALREADY_JOINED", "Connection này đã join room.");
			return;
		}
		if (payload.reconnectSessionId) {
			this.reconnect(peer, payload.roomId, payload.reconnectSessionId);
			return;
		}
		const room = this.getOrCreateRoom(payload.roomId);
		const playerId = PLAYER_ORDER.find((candidate) => !room.sessions.has(candidate));
		if (!playerId) {
			this.sendError(peer, "ROOM_FULL", `Room ${payload.roomId} đã đủ hai người chơi.`);
			peer.close(4003, "Room full");
			return;
		}
		const session = {
			id: this.createUniqueSessionId(),
			roomId: room.id,
			playerId,
			playerName: payload.playerName,
			peer
		};
		room.sessions.set(playerId, session);
		this.sessions.set(session.id, session);
		this.sessionByPeerId.set(peer.id, session.id);
		this.acknowledgeJoin(session);
		this.broadcastViews(room);
	}
	reconnect(peer, roomId, sessionId) {
		const session = this.sessions.get(sessionId);
		if (!session || session.roomId !== roomId) {
			this.sendError(peer, "INVALID_SESSION", "Reconnect session không tồn tại trong room này.");
			return;
		}
		if (session.peer && session.peer.id !== peer.id) {
			this.sessionByPeerId.delete(session.peer.id);
			session.peer.close(4001, "Session reconnected from another socket");
		}
		session.peer = peer;
		this.sessionByPeerId.set(peer.id, session.id);
		this.acknowledgeJoin(session);
		this.broadcastViews(this.requireRoom(roomId));
	}
	submitAction(peer, action) {
		const session = this.getSessionForPeer(peer);
		if (!session) {
			this.sendError(peer, "JOIN_REQUIRED", "Phải JOIN_ROOM trước khi gửi action.");
			return;
		}
		if (action.playerId !== session.playerId) {
			this.reject(peer, "PLAYER_MISMATCH", "Action playerId không khớp session hiện tại.");
			return;
		}
		const room = this.requireRoom(session.roomId);
		try {
			room.engine.dispatch(action);
		} catch (error) {
			const message = error instanceof Error ? error.message : "Action không hợp lệ.";
			this.reject(peer, error instanceof RuleValidationError ? "RULE_VALIDATION" : "ACTION_FAILED", message);
			return;
		}
		this.broadcastViews(room);
	}
	getOrCreateRoom(roomId) {
		const current = this.rooms.get(roomId);
		if (current) return current;
		const room = {
			id: roomId,
			engine: this.createEngine(roomId),
			sessions: /* @__PURE__ */ new Map()
		};
		this.rooms.set(roomId, room);
		return room;
	}
	createUniqueSessionId() {
		let sessionId = this.createSessionId();
		while (this.sessions.has(sessionId)) sessionId = this.createSessionId();
		return sessionId;
	}
	getSessionForPeer(peer) {
		const sessionId = this.sessionByPeerId.get(peer.id);
		return sessionId ? this.sessions.get(sessionId) ?? null : null;
	}
	requireRoom(roomId) {
		const room = this.rooms.get(roomId);
		if (!room) throw new Error(`Không tìm thấy room ${roomId}.`);
		return room;
	}
	acknowledgeJoin(session) {
		if (!session.peer) return;
		this.send(session.peer, {
			type: "ROOM_JOINED",
			payload: {
				roomId: session.roomId,
				assignedPlayerId: session.playerId,
				sessionId: session.id
			}
		});
	}
	broadcastViews(room) {
		room.sessions.forEach((session) => {
			if (!session.peer) return;
			this.send(session.peer, {
				type: "GAME_STATE_UPDATE",
				payload: GamePlayerViewV2Schema.parse(room.engine.getAuthoritativePlayerView(session.playerId))
			});
		});
	}
	reject(peer, code, message) {
		this.send(peer, {
			type: "ACTION_REJECTED",
			payload: {
				code,
				message
			}
		});
	}
	sendError(peer, code, message) {
		this.send(peer, {
			type: "ERROR",
			payload: {
				code,
				message
			}
		});
	}
	send(peer, message) {
		peer.send(ServerWsMessageSchema.parse(message));
	}
};
/** Process-local room server; production cần sticky single instance hoặc shared store. */
var gameRoomServer = new GameRoomServer();
function toServerPeer(peer) {
	return {
		id: peer.id,
		send(message) {
			peer.send(JSON.stringify(ServerWsMessageSchema.parse(message)));
		},
		close(code, reason) {
			peer.close(code, reason);
		}
	};
}
function sendProtocolError(peer, message) {
	const response = {
		type: "ERROR",
		payload: {
			code: "INVALID_MESSAGE",
			message
		}
	};
	peer.send(JSON.stringify(ServerWsMessageSchema.parse(response)));
}
function assertGameWebSocketRequest(request) {
	const requestUrl = new URL(request.url);
	if (requestUrl.pathname !== "/api/ws") throw new Response("Not Found", { status: 404 });
	const origin = request.headers.get("origin");
	if (origin) {
		let originHost;
		try {
			originHost = new URL(origin).host;
		} catch {
			throw new Response("WebSocket Origin không hợp lệ.", { status: 403 });
		}
		if (originHost !== requestUrl.host) throw new Response("Cross-origin WebSocket bị từ chối.", { status: 403 });
	}
}
/** Tạo crossws hooks cho Nitro native WebSocket route ở dev và production. */
function createGameWebSocketHooks(roomServer = gameRoomServer) {
	return {
		upgrade(request) {
			assertGameWebSocketRequest(request);
		},
		message(peer, message) {
			let raw;
			try {
				raw = JSON.parse(message.text());
			} catch {
				sendProtocolError(peer, "Message phải là JSON hợp lệ.");
				return;
			}
			const parsed = ClientWsMessageSchema.safeParse(raw);
			if (!parsed.success) {
				sendProtocolError(peer, parsed.error.issues.map((issue) => issue.message).join("; "));
				return;
			}
			roomServer.handleMessage(toServerPeer(peer), parsed.data);
		},
		close(peer) {
			roomServer.disconnect(peer.id);
		}
	};
}
/** Shared hooks instance cho process hiện tại. */
var gameWebSocketHooks = createGameWebSocketHooks();
//#endregion
//#region server/api/ws.ts
/** Native Nitro route dùng chung cho Vite dev và production `/api/ws`. */
var ws_default = defineWebSocketHandler(gameWebSocketHooks);
//#endregion
export { ws_default as default };
