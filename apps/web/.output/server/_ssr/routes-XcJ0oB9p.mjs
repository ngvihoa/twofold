import { i as __toESM } from "../_runtime.mjs";
import { f as useNavigate, g as require_react, h as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { h as LogIn, i as Swords, o as Sparkles, p as Plus } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-XcJ0oB9p.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function HomeComponent() {
	const navigate = useNavigate();
	const [hostName, setHostName] = import_react.useState("Chủ phòng");
	const [joinName, setJoinName] = import_react.useState("Người chơi");
	const [roomCode, setRoomCode] = import_react.useState("");
	const [isCreating, setIsCreating] = import_react.useState(false);
	const handleCreateRoom = (e) => {
		e.preventDefault();
		setIsCreating(true);
		const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
		setTimeout(() => {
			navigate({
				to: "/room/$id",
				params: { id: generatedCode },
				search: {
					role: "HOST",
					name: hostName
				}
			});
		}, 400);
	};
	const handleJoinRoom = (e) => {
		e.preventDefault();
		if (!roomCode.trim()) return;
		navigate({
			to: "/room/$id",
			params: { id: roomCode.trim().toUpperCase() },
			search: {
				role: "GUEST",
				name: joinName
			}
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex-1 flex flex-col items-center justify-center p-4 sm:p-8 max-w-5xl mx-auto w-full",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center space-y-4 mb-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "w-3.5 h-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Chiến thuật 1v1 • Vai trò ẩn • Ma Sói cải tiến" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "text-4xl sm:text-6xl font-black tracking-tight text-slate-100",
						children: [
							"Đọc vị & Đánh lừa ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-purple-300 to-rose-400",
								children: "Trong Từng Nước Đi"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-slate-400 max-w-xl mx-auto text-sm sm:text-base",
						children: "Mỗi người chơi sở hữu 10 lá bài ẩn. Kích hoạt kỹ năng mang lại sức mạnh nhưng sẽ làm lộ vai trò thật. Bạn sẽ chọn ẩn mình hay tấn công quyết định?"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-surface/80 border border-indigo-500/20 hover:border-indigo-500/40 transition-all rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 mb-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Swords, { className: "w-6 h-6" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xl font-bold text-slate-100",
								children: "Tạo Phòng Mới"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-slate-400 text-xs leading-relaxed",
								children: "Khởi tạo phòng đấu 1v1, nhận mã phòng để gửi cho bạn bè và trở thành Người chơi A (đi trước)."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleCreateRoom,
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-slate-400 mb-1.5",
							children: "Tên hiển thị của bạn"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: hostName,
							onChange: (e) => setHostName(e.target.value),
							maxLength: 20,
							required: true,
							className: "w-full bg-surface-highlight/50 border border-slate-700/60 rounded-lg px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors",
							placeholder: "Nhập tên..."
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "submit",
							disabled: isCreating,
							className: "w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg text-sm shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: isCreating ? "Đang tạo phòng..." : "Tạo phòng ngay" })]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-surface/80 border border-rose-500/20 hover:border-rose-500/40 transition-all rounded-2xl p-6 shadow-xl backdrop-blur-sm flex flex-col justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3 mb-6",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "w-12 h-12 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, { className: "w-6 h-6" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "text-xl font-bold text-slate-100",
								children: "Vào Phòng Đấu"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-slate-400 text-xs leading-relaxed",
								children: "Nhập mã phòng 6 ký tự do đối thủ gửi để tham gia trận đấu với vai trò Người chơi B."
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
						onSubmit: handleJoinRoom,
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-slate-400 mb-1.5",
								children: "Tên của bạn"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: joinName,
								onChange: (e) => setJoinName(e.target.value),
								maxLength: 20,
								required: true,
								className: "w-full bg-surface-highlight/50 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-rose-500 transition-colors",
								placeholder: "Tên bạn..."
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-slate-400 mb-1.5",
								children: "Mã phòng"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: roomCode,
								onChange: (e) => setRoomCode(e.target.value.toUpperCase()),
								maxLength: 10,
								required: true,
								className: "w-full bg-surface-highlight/50 border border-slate-700/60 rounded-lg px-3 py-2.5 text-sm text-slate-100 font-mono tracking-widest uppercase focus:outline-none focus:border-rose-500 transition-colors text-center",
								placeholder: "ABCD12"
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "submit",
							className: "w-full bg-rose-600 hover:bg-rose-500 text-white font-semibold py-3 rounded-lg text-sm shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogIn, { className: "w-4 h-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Tham gia phòng" })]
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12 w-full max-w-3xl text-left",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-surface/40 border border-slate-800 p-4 rounded-xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-indigo-400 font-semibold text-xs mb-1",
							children: "10 Vị Trí Ẩn"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-slate-400 text-xs",
							children: "Tự do bố trí vị trí các vai trò trước khi vào trận để tạo thế trận đánh lừa."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-surface/40 border border-slate-800 p-4 rounded-xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-rose-400 font-semibold text-xs mb-1",
							children: "Cơ chế Treo Cổ"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-slate-400 text-xs",
							children: "Đoán chính xác vai trò đối thủ vào Ban ngày để loại bỏ lá đó ngay lập tức."
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "bg-surface/40 border border-slate-800 p-4 rounded-xl",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-amber-400 font-semibold text-xs mb-1",
							children: "Tai Họa Vòng 7"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-slate-400 text-xs",
							children: "Từ sau Vòng 6, bàn chơi thu hẹp nhanh hơn để quyết định thắng bại dứt khoát."
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { HomeComponent as component };
