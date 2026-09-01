# 2026-09-01-002 — Bảo vệ ranh giới public/private Ban đêm

## Metadata

- Ngày: 01/09/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: Working tree P0.3
- Commit implementation: `7180595`
- Conversation/task source: CONV-006 — hoàn tất P0.4 trước P0.5
- Trạng thái: Hoàn thành prototype

## Yêu cầu

Audit và sửa ranh giới thông tin public/private cho khiên, action đêm, Tiên tri và timeline Bình minh.

## Trạng thái trước khi thay đổi

`publicView` trả thẳng `shielded`; log Defense công khai target; soi thường ghi tên Tiên tri vào public timeline; block phân biệt cắn/độc. UI replay BOT cũng hiển thị target khiên dù board đã mask.

## Giả thuyết

Public/private phải được tách tại payload và presentation: public chỉ nhận outcome được phép, owner overlay thông tin riêng từ `privateView`.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Shield payload | Public `shielded=true` | Public masked; private hand giữ shield | Engine/UI | Không leak target |
| Defense log/replay | Ghi position cả hai bên | Public chỉ biết đã khóa; BOT target bí mật | Engine/UI | Đúng information map |
| Seer first inspect | Có public log/replay | Chỉ private note | Engine/UI | Soi thường là thông tin riêng |
| Block outcome | Lộ cắn/độc | Chỉ lộ position được cứu | Engine/UI | Không suy ra action kind/source |
| QA | Không có seam nhanh | `?qa=night-privacy` local | UI/README | Browser deterministic |

## Thay đổi role/rule

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Bảo vệ | Chạng vạng | Không đổi | Implementation công khai target | Target private; block chỉ công khai vị trí cứu | Đối thủ không biết khiên trước resolve |
| Tiên tri | Ban đêm | Không đổi | Soi thường để public trace | Không public trace; execution vẫn lộ | Giữ giá trị suy luận |

Trạng thái: **Đã chốt cho prototype**.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Chỉ ẩn CSS shield | Static audit | FAIL | Bỏ | Log/replay vẫn leak |
| Mask payload + private overlay | Automated + browser | PASS | Giữ | Ranh giới rõ cho multiplayer sau này |
| Công khai loại đòn bị chặn | Red test information map | FAIL | Bỏ | Suy ra role/action đối thủ |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Automated red | Guard target trước resolve | Public hidden/private true | Public true | PASS red evidence |
| T-002 | Automated red | First Seer inspect | Không public trace | Log ghi Tiên tri | PASS red evidence |
| T-003 | Automated red | Shield block attack | Không lộ kind | Log ghi cắn | PASS red evidence |
| T-004 | Automated green | Targeted tests | 3 pass | 3/3 | PASS |
| T-005 | Browser | Night privacy fixture | Own shield visible; BOT target hidden | Đúng expected | PASS |

### Lệnh đã chạy

```bash
node --test --test-name-pattern='Guard target stays private|normal Seer inspection leaves no public|successful shield publishes' apps/spec-reviewer/game-flow-demo/engine.test.mjs
node --test apps/spec-reviewer/game-flow-demo/*.test.mjs
```

### Output quan trọng

```text
Red: tests 3, pass 0, fail 3
P0.4 checkpoint: tests 33, pass 33, fail 0
Browser BOT replay: Mục tiêu bí mật; opponent shields = 0; owner A2 shield = 1
```

## Failure log

### F-001 — Night payload và replay lộ thông tin riêng

- Build/commit/seed: Working tree P0.3; `private-guard-target`, `private-seer-inspection`, `private-blocked-night-kind`.
- Reproduction: đặt khiên hoặc soi thường rồi đọc public view/timeline; quan sát BOT Defense replay.
- Expected: target/action/source riêng theo information map.
- Actual: public shield, target, Tiên tri và loại đòn bị lộ.
- Root cause: Xác định — raw state/log dùng chung cho public consumer; presentation không sanitize opponent action.
- Fix/decision: mask public payload, private overlay, sanitize log và dawn/replay.
- Verify lại: PASS automated và browser.
- Commit fix: `7180595`.

## Quyết định sau implementation

### Đã chốt

- Target khiên private cho tới outcome block.
- First inspect không có public trace.
- Block không công bố loại lệnh/source.

### Tạm giữ để test thêm

- Death không bị block vẫn công bố nguyên nhân theo rule Bình minh hiện tại.

### Bị loại/revert

- Dùng `state.log`/raw shield làm public payload không qua sanitize.

### Câu hỏi mở

- Multiplayer event schema sẽ tách public/private envelope ở package nào?

## Ảnh hưởng

- Game design: information map rõ hơn.
- UI/UX: owner vẫn thấy khiên; đối thủ thấy waiting/outcome hợp lệ.
- Kỹ thuật: public/private boundary có regression test.
- Data/analytics: private action không được ghi vào public event stream.
- Scope/roadmap: GD-05 chuyển Playtest/Review.

## File và artifact liên quan

- Code: `engine.mjs`, `engine.test.mjs`, `ui.mjs`, `ui.html`.
- Docs/ADR: core gameplay, game flow, roles draft, README.
- Screenshot/video: Không lưu; DOM evidence trong task.
- Test report: record này và verification log.
- Commit/PR: `7180595`.

## Bước tiếp theo

- [x] P0.5 Final Duel/kết thúc/rematch — Codex — cùng task.
- [ ] Hai-client public/private test — Developer — P1 authoritative multiplayer.

## Giới hạn bằng chứng

Chưa có hai client thật hoặc network payload; browser local chỉ đóng vai viewer A.
