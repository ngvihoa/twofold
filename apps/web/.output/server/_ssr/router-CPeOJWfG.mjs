import "../_runtime.mjs";
import { a as HeadContent, c as Outlet, d as createRootRoute, g as require_react, h as require_jsx_runtime, i as Scripts, l as lazyRouteComponent, s as createRouter, u as createFileRoute } from "../_libs/@tanstack/react-router+[...].mjs";
require_react();
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
var app_default = "/assets/app-BeoDL_1q.css";
var Route$3 = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			},
			{ title: "Twofold — 1v1 Turn-Based Strategy Web Alpha" },
			{
				name: "description",
				content: "Game đối kháng chiến thuật 1v1 theo lượt với vai trò ẩn lấy cảm hứng từ Ma Sói."
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: app_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
			}
		]
	}),
	component: RootComponent
});
function RootComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "vi",
		className: "dark",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", {
			className: "bg-background text-slate-100 min-h-screen flex flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
					className: "border-b border-surface-highlight/40 bg-surface/50 backdrop-blur-md sticky top-0 z-50",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "max-w-7xl mx-auto px-4 h-14 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: "/",
							className: "flex items-center gap-2 group",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-rose-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform",
									children: "TF"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-extrabold text-lg tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-indigo-200 via-slate-100 to-rose-200",
									children: "TWOFOLD"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] uppercase font-bold tracking-widest bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded",
									children: "Alpha v0.1"
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 text-xs font-medium text-slate-400",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: "1v1 Turn-based Strategy"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "/spec-reviewer",
								target: "_blank",
								rel: "noreferrer",
								className: "hover:text-indigo-400 transition-colors bg-surface-highlight/50 px-2.5 py-1 rounded border border-slate-700/50",
								children: "Role Atlas ↗"
							})]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("main", {
					className: "flex-1 flex flex-col",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})
			]
		})]
	});
}
var $$splitComponentImporter$2 = () => import("./routes-XcJ0oB9p.mjs");
var Route$2 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
var $$splitComponentImporter$1 = () => import("./route-DQTXvpuu.mjs");
var Route$1 = createFileRoute("/play/$id")({
	validateSearch: (search) => ({
		name: typeof search.name === "string" ? search.name : "Người chơi",
		reconnectSessionId: typeof search.reconnectSessionId === "string" ? search.reconnectSessionId : void 0
	}),
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
/** Compose route params, transport và authoritative game actor runtime. */
var $$splitComponentImporter = () => import("./room._id-BZgenmx6.mjs");
var Route = createFileRoute("/room/$id")({
	validateSearch: (search) => ({
		role: search.role === "HOST" ? "HOST" : "GUEST",
		name: typeof search.name === "string" ? search.name : "Người chơi"
	}),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
var rootRouteChildren = {
	IndexRoute: Route$2.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$3
	}),
	PlayIdRouteRoute: Route$1.update({
		id: "/play/$id",
		path: "/play/$id",
		getParentRoute: () => Route$3
	}),
	RoomIdRoute: Route.update({
		id: "/room/$id",
		path: "/room/$id",
		getParentRoute: () => Route$3
	})
};
var routeTree = Route$3._addFileChildren(rootRouteChildren)._addFileTypes();
var router_exports = /* @__PURE__ */ __exportAll({ getRouter: () => getRouter });
function getRouter() {
	return createRouter({
		routeTree,
		defaultPreload: "intent",
		scrollRestoration: true
	});
}
//#endregion
export { Route as n, Route$1 as r, router_exports as t };
