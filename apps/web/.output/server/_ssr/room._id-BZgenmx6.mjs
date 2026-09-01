import { i as __toESM } from "../_runtime.mjs";
import { f as useNavigate, g as require_react, h as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as Route } from "./router-CPeOJWfG.mjs";
import { i as Faction, n as CardRole, o as PlayerId, t as AbilityId } from "./src-BW_uq4Lw.mjs";
import { C as Check, S as Copy, i as Swords, l as Shield, o as Sparkles } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/room._id-BZgenmx6.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
CardRole.VILLAGER, CardRole.VILLAGER, Faction.VILLAGE, CardRole.WEREWOLF, CardRole.WEREWOLF, Faction.WEREWOLF, AbilityId.WEREWOLF_ATTACK, CardRole.SEER, CardRole.SEER, Faction.VILLAGE, AbilityId.SEER_INSPECT, CardRole.GUARD, CardRole.GUARD, Faction.VILLAGE, AbilityId.GUARD_PROTECT, CardRole.WITCH, CardRole.WITCH, Faction.VILLAGE, AbilityId.WITCH_REVIVE, AbilityId.WITCH_POISON, CardRole.SHOOTER, CardRole.SHOOTER, Faction.VILLAGE, AbilityId.SHOOTER_SHOOT, CardRole.AVENGER, CardRole.AVENGER, Faction.VILLAGE, AbilityId.AVENGER_MARK, CardRole.PRIEST, CardRole.PRIEST, Faction.VILLAGE, AbilityId.PRIEST_PURIFY, CardRole.WOLF_GUARD, CardRole.WOLF_GUARD, Faction.WEREWOLF, AbilityId.WOLF_GUARD_RESCUE;
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
PlayerId.PLAYER_A, PlayerId.PLAYER_B;
PlayerId.PLAYER_A, PlayerId.PLAYER_B;
function RoomLobbyComponent() {
	const { id: roomId } = Route.useParams();
	const { name } = Route.useSearch();
	const navigate = useNavigate();
	const [copied, setCopied] = import_react.useState(false);
	const [myDeck] = import_react.useState(() => [...STANDARD_DECK]);
	const [isReady, setIsReady] = import_react.useState(false);
	const [countdown, setCountdown] = import_react.useState(null);
	const copyRoomCode = () => {
		navigator.clipboard.writeText(roomId);
		setCopied(true);
		setTimeout(() => setCopied(false), 2e3);
	};
	const handleToggleReady = () => {
		const nextReady = !isReady;
		setIsReady(nextReady);
		if (nextReady) setCountdown(3);
		else setCountdown(null);
	};
	import_react.useEffect(() => {
		if (countdown === null) return;
		if (countdown === 0) {
			navigate({
				to: "/play/$id",
				params: { id: roomId },
				search: {
					name,
					reconnectSessionId: void 0
				}
			});
			return;
		}
		const timer = setTimeout(() => {
			setCountdown(countdown - 1);
		}, 1e3);
		return () => clearTimeout(timer);
	}, [
		countdown,
		name,
		navigate,
		roomId
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex-1 max-w-6xl mx-auto w-full p-4 sm:p-8 flex flex-col gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/80 border border-slate-800 p-4 sm:p-6 rounded-2xl backdrop-blur-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs uppercase tracking-widest text-indigo-400 font-semibold mb-1",
					children: "Phòng Đấu 1v1"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-mono text-2xl sm:text-3xl font-black text-slate-100 tracking-wider",
						children: roomId
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: copyRoomCode,
						className: "p-2 rounded-lg bg-surface-highlight/70 hover:bg-surface-highlight text-slate-300 hover:text-white transition-colors border border-slate-700/50",
						title: "Sao chép mã phòng",
						children: copied ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "w-4 h-4 text-emerald-400" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, { className: "w-4 h-4" })
					})]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 bg-surface-highlight/40 px-3 py-2 rounded-xl border border-slate-700/50",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold text-slate-200",
							children: "Bạn (Người chơi A)"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 bg-surface-highlight/20 px-3 py-2 rounded-xl border border-slate-800 text-slate-400",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-2.5 h-2.5 rounded-full bg-amber-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium",
							children: "Đối thủ (Đang kết nối...)"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-surface/60 border border-slate-800/80 rounded-2xl p-6 flex flex-col gap-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-lg font-bold text-slate-100 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "w-5 h-5 text-indigo-400" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Bố trí 10 Lá Bài Ban Đầu" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-slate-400 mt-0.5",
						children: "Đối thủ sẽ chỉ nhìn thấy các vị trí úp bài. Hãy sắp xếp vị trí để tối ưu chiến thuật đánh lừa."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs font-medium bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg self-start sm:self-auto",
						children: "Bộ bài Alpha Skeleton (10 lá chuẩn)"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 sm:grid-cols-5 gap-3",
					children: myDeck.map((role, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-surface-highlight/40 border border-slate-700/60 hover:border-indigo-500/50 transition-all rounded-xl p-3.5 flex flex-col items-center justify-center gap-2 min-h-[140px] text-center group cursor-pointer",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-6 h-6 rounded-full bg-slate-800 text-slate-400 font-mono text-xs flex items-center justify-center font-bold",
								children: index + 1
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-bold text-sm text-slate-200 group-hover:text-indigo-300 transition-colors",
								children: role
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[10px] text-slate-400 bg-surface/80 px-2 py-0.5 rounded border border-slate-800",
								children: ["Vị trí ", index + 1]
							})
						]
					}, index))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-end items-center gap-4",
				children: [countdown !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-amber-400 font-bold text-sm animate-bounce flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Trận đấu bắt đầu sau ",
						countdown,
						"s..."
					] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: handleToggleReady,
					className: `px-8 py-3.5 rounded-xl font-bold text-sm shadow-xl flex items-center gap-2 transition-all active:scale-[0.99] ${isReady ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25"}`,
					children: isReady ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Hủy Sẵn Sàng" }) }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swords, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sẵn Sàng Vào Trận" })] })
				})]
			})
		]
	});
}
//#endregion
export { RoomLobbyComponent as component };
