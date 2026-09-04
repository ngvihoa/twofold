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
| [2026-09-04-004](2026-09-04-004-build-guided-first-day-turn.md) | 04/09/2026 | Nối Match Intro với guided Day A action và Day B handoff | Hoàn thành; full check 4/4 + browser journey pass | `0e97723` |
| [2026-09-04-003](2026-09-04-003-build-room-setup-countdown-intro-flow.md) | 04/09/2026 | Build opponent arrival, setup reorder, ready, countdown và Match Intro | Hoàn thành; full check 4/4 + browser interaction pass | `0e97723` |
| [2026-09-04-002](2026-09-04-002-build-website-entry-flow.md) | 04/09/2026 | Build Home, create/join intent, Room waiting và setup preview | Hoàn thành; 66/66 web test | `0e97723` |
| [2026-09-04-001](2026-09-04-001-realign-gameflow-ux-scope.md) | 04/09/2026 | Chốt scope gameflow/UX và screen inventory end-to-end | Hoàn thành; chờ UX review | `0e97723` |
| [2026-09-02-004](2026-09-02-004-migrate-outcome-command-contract.md) | 02/09/2026 | MIG-02 outcome projection và command idempotency | Hoàn thành; full check 4/4 | `20581b2` |
| [2026-09-02-003](2026-09-02-003-add-typed-public-outcomes.md) | 02/09/2026 | Thêm typed public outcomes và đóng P0.10 | Hoàn thành; 200 trận/11.125 outcome, leak 0 | `c75a3c6` |
| [2026-09-02-002](2026-09-02-002-project-recipient-transcripts.md) | 02/09/2026 | Project recipient transcript và digest P0.9 | Hoàn thành; 200 trận/11.190 hidden action, leak 0 | `48eb3f5` |
| [2026-09-02-001](2026-09-02-001-add-deterministic-event-replay.md) | 02/09/2026 | Thêm deterministic event replay và state digest P0.8 | Hoàn thành; 200 trận/15.665 event không divergence | `d548a63` |
| [2026-09-01-005](2026-09-01-005-fuzz-invalid-actions-atomically.md) | 01/09/2026 | Fuzz invalid action và atomic rejection P0.7 | Hoàn thành; 200 seed/76.991 rejection pass | `a861d6f` |
| [2026-09-01-004](2026-09-01-004-add-seeded-full-match-fuzzing.md) | 01/09/2026 | Thêm seeded full-match fuzzing P0.6 | Hoàn thành; 500 regression + 5.000 audit pass | `63c2a19` |
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
