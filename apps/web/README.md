# Twofold Web Alpha Client (`@twofold/web`)

Ứng dụng web client chính thức của trò chơi Twofold phục vụ giai đoạn Web Alpha 2026.

## Infrastructure

- TanStack Start + TanStack Router file-based routing.
- Vite cho development; Nitro đóng gói SSR build cho production/Vercel.
- TypeScript strict; route tree được generate bằng `tsr`.
- Node.js `>=22.12.0`, pnpm `>=10.0.0`.

```bash
# Development server: HTTP và WebSocket cùng chạy trên port 3000
pnpm --filter @twofold/web dev

# Chỉ cần override khi game server chạy ở origin khác
VITE_GAME_WS_URL=ws://127.0.0.1:4000/api/ws pnpm --filter @twofold/web dev

# Generate app/routeTree.gen.ts
pnpm tf routes

# Typecheck + production build
pnpm tf check web

# Chạy production bundle sau khi build
pnpm --filter @twofold/web start
```

Gameplay client mặc định kết nối same-origin `/api/ws`; `VITE_GAME_WS_URL` chỉ
là override cho topology tách server. Nitro native WebSocket route dùng cùng
một gateway cho Vite dev và production. Room store gọi `game-core` rồi gửi
`GamePlayerViewV2` đã lọc riêng cho từng player; frontend không resolve rule.

Room và reconnect session hiện được giữ trong memory của một process. Restart
server sẽ mất room; multi-replica cần sticky routing hoặc shared store. Client
lưu reconnect token theo room trong `sessionStorage`, nên refresh cùng tab giữ
đúng seat; token không được đưa vào URL. `SURRENDER` và `REMATCH_REQUEST` hiện
trả `NOT_IMPLEMENTED`.

## Mục tiêu phát hành

- **Mốc gần nhất**: 07/09/2026
- **Mục tiêu**: Phát hành Web Alpha nội bộ trước 30/10/2026

## Phạm vi tính năng Web Alpha

- Chơi online 1v1 trên trình duyệt desktop (chế độ Guest).
- Tạo phòng / vào phòng bằng mã PIN.
- Gán 10 lá và chọn vai trò trước trận.
- Vòng lặp pha chơi: Ban ngày → Ban đêm → Bình minh / Công bố kết quả.
- Cơ chế Tai họa xuất hiện từ Vòng 6.
- Màn hình kết quả trận đấu, lịch sử nhật ký trận phục vụ playtest.
