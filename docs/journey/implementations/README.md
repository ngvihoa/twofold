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
| [2026-09-01-003](2026-09-01-003-final-duel-match-result-rematch.md) | 01/09/2026 | Hoàn tất Final Duel, reveal kết quả và rematch local | Hoàn thành prototype; suite 38/38 + browser pass | `7180595` |
| [2026-09-01-002](2026-09-01-002-protect-public-private-boundary.md) | 01/09/2026 | Bảo vệ ranh giới public/private Ban đêm | Hoàn thành prototype; suite checkpoint 33/33 + browser pass | `7180595` |
| [2026-09-01-001](2026-09-01-001-harden-exhausted-reaction-batches.md) | 01/09/2026 | Harden exhausted voter, Khóa mạch reaction và batch resolution | Hoàn thành prototype; suite 30/30 + browser V9 pass | `7180595` |
| [2026-08-31-001](2026-08-31-001-reimplement-purge-with-stable-ownership.md) | 31/08/2026 | Implement lại Thanh trừng với ownership ổn định | Hoàn thành prototype; suite 24/24 + browser V6–V9 pass | `7180595` |
| [2026-08-30-003](2026-08-30-003-specify-hidden-night-and-substitute.md) | 30/08/2026 | Chốt reveal đêm, Tiên tri và Kẻ Thế Mạng | Hoàn thành; prototype 15/15 pass | `7180595` |
| [2026-08-30-002](2026-08-30-002-use-weighted-council-threshold.md) | 30/08/2026 | Dùng ngưỡng trọng số cho Hội đồng | Hoàn thành, automated test 11/11 pass | `7180595` |
| [2026-08-30-001](2026-08-30-001-align-council-core-role-rules.md) | 30/08/2026 | Đồng bộ Hội đồng và role core với ADR v0.1 | Hoàn thành P0.1, automated test 9/9 pass | `7180595` |
| [2026-08-29-003](2026-08-29-003-implement-purge-role-loop.md) | 29/08/2026 | Implement Thanh trừng và role loop | Hoàn thành prototype, browser smoke pass | Chưa có |
| [2026-08-29-002](2026-08-29-002-specify-vote-roles-and-purge.md) | 29/08/2026 | Chốt nhịp Vote, role và Thanh trừng prototype | Hoàn thành thay đổi tài liệu; chưa chỉnh code | Chưa có |
| [2026-08-29-001](2026-08-29-001-establish-journey-policy.md) | 29/08/2026 | Thiết lập journey bắt buộc cho mọi implementation | Hoàn thành trên working tree, chờ commit | Chưa có do conflict |

Khi thêm record mới, cập nhật bảng này trong cùng thay đổi.
