# ADR-0003: Kiến trúc Tech Stack Web Alpha — TanStack Start, oRPC và All-in-One Realtime

- **Ngày:** 28/08/2026
- **Trạng thái:** Đã chấp nhận
- **Chủ sở hữu:** Developer / Team

---

## 1. Bối cảnh

Để chuẩn bị triển khai Web Alpha cho Twofold (game đối kháng 1v1 theo lượt với cơ chế vai trò ẩn), team cần thống nhất nền tảng công nghệ thỏa mãn các tiêu chí sau:
1. **End-to-End Type Safety:** Hạn chế tối đa lỗi runtime và bảo mật dữ liệu thông tin ẩn (phân tách tuyệt đối giữa Private State và Public State để chống gian lận qua devtools/network inspection).
2. **Đơn giản hóa Triển khai (Single Deployment):** Tối ưu tốc độ phát triển cho team 3 người, tránh việc phải duy trì nhiều pipeline triển khai và dịch vụ độc lập (tách rời Frontend, Backend, Signaling riêng).
3. **Realtime WebSocket Ổn định:** Phục vụ luồng chơi phòng 1v1 (Room-based) với độ trễ thấp và hỗ trợ cửa sổ kết nối lại (Reconnect Window: 20–60 giây).

---

## 2. Quyết định

- **Frontend & App Server Host:** Sử dụng **TanStack Start** (React 19 + TanStack Router + TailwindCSS) chạy trên server runtime do Start cung cấp.
- **Contract-First API:** Sử dụng **oRPC** kết hợp **Zod** để định nghĩa contract API cho các thao tác HTTP/RPC (tạo phòng, tra cứu thông tin phòng, cấu hình trước trận).
- **Multiplayer Transport (All-in-One):** Gộp trực tiếp **WebSocket Server** vào trong `apps/web` bằng `crossws`, lắng nghe kết nối tại `wss://.../api/ws`. Toàn bộ project web client và game server chỉ cần **1 lần deploy duy nhất** (Single Container / Node.js Instance).
- **Core Game Engine:** Tách độc lập tại `packages/game-core` bằng **TypeScript thuần** (Zero runtime dependencies) và kiểm thử với **Vitest**.
- **Shared Schemas:** Đặt toàn bộ Schemas, Enums, DTOs và Contracts tại `packages/shared-types`.

---

## 3. Hệ quả

- **Ưu điểm:**
  - **Zero CORS:** Client và WebSocket/RPC server nằm trên cùng một host/origin.
  - **Single Pipeline:** Chỉ cần deploy 1 Docker container hoặc Node.js process duy nhất trên các nền tảng như Fly.io, Render, Railway, VPS.
  - **Anti-cheat by Design:** Engine chạy authoritative trên server; client chỉ nhận dữ liệu đã được serialize và lọc bỏ thông tin ẩn của đối thủ (`getPlayerView()`).
  - Tối đa hóa khả năng chia sẻ mã nguồn (Data models, State machine logic) giữa client và server trong Monorepo.
- **Đánh đổi:**
  - Không thể triển khai dưới dạng Pure Static CDN thông thường (như GitHub Pages/Vercel standard serverless không hỗ trợ persistent connection) mà cần server runtime có khả năng duy trì WebSocket connection lâu dài.

---

## 4. Cách kiểm chứng / Khi nào xem lại

- **Mốc M1 (07/09/2026):** Hoàn thành POC 2 trình duyệt join cùng room code qua `srvx`/`crossws` và nhận state đồng bộ.
- **Mốc M3 (21/09/2026):** Chạy thử 1 vòng chơi Day $\rightarrow$ Night $\rightarrow$ Dawn.
- **Xem lại khi:** Quy mô vượt quá phạm vi 1 server RAM đơn lẻ hoặc cần mở rộng sang hệ thống Matchmaking tự động phân tán (Multi-region cluster).

### Amendment 01/09/2026

TanStack Start version đang dùng build production trên `srvx`, không phải Nitro.
Implementation giữ nguyên quyết định all-in-one và `crossws`: production gắn
`crossws/server/node` vào custom Start server entry; Vite dev gắn cùng hooks vào
HTTP upgrade event. `/api/ws` và contract không đổi. Room/session hiện in-memory
và chỉ phù hợp single process; reconnect persistence/multi-replica phải được
xem lại trước khi scale.
