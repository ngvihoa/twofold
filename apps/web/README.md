# Twofold Web Alpha Client (`@twofold/web`)

Ứng dụng web client chính thức của trò chơi Twofold phục vụ giai đoạn Web Alpha 2026.

## Infrastructure

- TanStack Start + TanStack Router file-based routing.
- Vite cho development, client build và SSR build.
- TypeScript strict; route tree được generate bằng `tsr`.
- Node.js `>=22.12.0`, pnpm `>=10.0.0`.

```bash
# Development server
VITE_GAME_WS_URL=ws://127.0.0.1:3000/game pnpm --filter @twofold/web dev

# Hoặc chỉ chạy UI; route gameplay sẽ báo endpoint chưa được cấu hình
pnpm --filter @twofold/web dev

# Generate app/routeTree.gen.ts
pnpm tf routes

# Typecheck + production build
pnpm tf check web
```

Gameplay client dùng `VITE_GAME_WS_URL` làm endpoint cho WebSocket contract v0.2.
Frontend không chạy `game-core` để thay authoritative server; nếu biến môi trường
không tồn tại, `/play/$id` hiển thị trạng thái cấu hình thay vì dùng kết quả
ngẫu nhiên. Setup, player board và action panel đều đọc contract v0.2; action
panel chỉ gửi command và chờ snapshot authoritative từ server.

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
