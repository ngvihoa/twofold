# Implementation Journey Records

Mỗi implementation có một record riêng để lưu chính xác thay đổi, thử nghiệm, failure và quyết định.

## Quy tắc đặt tên

```text
YYYY-MM-DD-NNN-<slug>.md
```

Ví dụ:

```text
2026-08-29-001-add-game-state-events.md
2026-08-29-002-rebalance-witch-poison.md
```

- `NNN` tăng dần trong cùng ngày.
- `slug` dùng tiếng Anh hoặc tiếng Việt không dấu, ngắn và mô tả outcome.
- Dùng `../implementation-template.md` làm mẫu.

## Index

| ID | Ngày | Implementation | Trạng thái | Commit/PR |
|---|---:|---|---|---|
| [2026-08-29-002](2026-08-29-002-specify-vote-roles-and-purge.md) | 29/08/2026 | Chốt nhịp Vote, role và Thanh trừng prototype | Hoàn thành thay đổi tài liệu; chưa chỉnh code | Chưa có |
| [2026-08-29-001](2026-08-29-001-establish-journey-policy.md) | 29/08/2026 | Thiết lập journey bắt buộc cho mọi implementation | Hoàn thành trên working tree, chờ commit | Chưa có do conflict |

Khi thêm record mới, cập nhật bảng này trong cùng thay đổi.
