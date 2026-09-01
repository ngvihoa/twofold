# ADR-0005: Tách spec-reviewer khỏi runtime core

- Ngày: 01/09/2026
- Trạng thái: Đã chấp nhận
- Chủ sở hữu: Product Owner / Developer

## Bối cảnh

`spec-reviewer` thay đổi nhanh để thử rule, còn `game-core`, `shared-types` và web cần contract ổn định hơn. Adapter và parity test import source xuyên workspace khiến hai nhịp phát triển tạo conflict ngay cả khi chưa có chủ đích đồng bộ rule.

## Quyết định

- `apps/spec-reviewer` không phụ thuộc `@twofold/game-core` hoặc `@twofold/shared-types`.
- `packages/game-core` không import engine hoặc fixture từ `apps/spec-reviewer`.
- Game-flow demo giữ engine và test độc lập để playtest spec.
- Rule mới chỉ được chuyển sang web/game core qua một task migration riêng sau một khoảng ổn định; task phải chỉ rõ ADR/spec nguồn và bổ sung test tại đích.
- Sói Hộ Vệ tiếp tục tồn tại trong catalog role với trạng thái `Chưa dùng`. Kẻ Thế Mạng chỉ thay vị trí của role này trong bộ 10 lá của phase prototype hiện tại.

## Hệ quả

- Merge giữa nhánh spec và nhánh runtime ít conflict hơn.
- Hai implementation có thể lệch tạm thời; tài liệu và task migration phải ghi rõ phiên bản rule đang áp dụng.
- Không còn parity test chạy trực tiếp giữa source của hai workspace. Việc đồng bộ được kiểm chứng bằng test contract được viết tại workspace đích trong từng đợt migration.

## Cách kiểm chứng / Khi nào xem lại

- `pnpm --filter @twofold/spec-reviewer check` chạy mà không build `game-core` hoặc `shared-types`.
- Tìm kiếm source không còn import xuyên biên giữa `apps/spec-reviewer` và `packages/game-core`.
- Xem lại quyết định nếu team cần phát hành spec và web đồng thời ở mỗi commit.
