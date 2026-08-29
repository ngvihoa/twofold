# Twofold Web Alpha Client (`@twofold/web`)

Ứng dụng web client chính thức của trò chơi Twofold phục vụ giai đoạn Web Alpha 2026.

## Infrastructure

- TanStack Start + TanStack Router file-based routing.
- Vite cho development, client build và SSR build.
- TypeScript strict; route tree được generate bằng `tsr`.
- Node.js `>=22.12.0`, pnpm `>=10.0.0`.

```bash
# Development server
pnpm --filter @twofold/web dev

# Generate app/routeTree.gen.ts
pnpm tf routes

# Typecheck + production build
pnpm tf check web
```

RPC, WebSocket, persistence và game-core integration chưa nằm trong scaffold này; sẽ được chọn khi contract game được chốt.

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
