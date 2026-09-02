# Twofold Shared Types (`@twofold/shared-types`)

Gói schema và type v0.2 dùng chung cho các ứng dụng và thư viện trong monorepo: phase/action, filtered player view, projected outcome và giao thức WebSocket.

Contract v0.1 đã được xóa; mọi consumer phải dùng `PlayerGameActionSchema`,
`GamePlayerViewV2Schema`, `PublicGameOutcomeSchema` và WebSocket message schema
hiện tại. Authoritative event/cause chỉ thuộc `game-core`, không phải wire contract.
