# 2026-09-01-001 — Harden exhausted voter, reaction và batch resolution

## Metadata

- Ngày: 01/09/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: Working tree P0.2.1, base lịch sử `75b104c`
- Commit implementation: Chưa có
- Conversation/task source: CONV-006 — tiếp tục P0.3
- Trạng thái: Hoàn thành prototype; chờ human playtest

## Yêu cầu

Tiếp tục phase P0.3 để harden thứ tự resolve và các edge case giữa skill, Vote, Khóa mạch, death reaction, hồi sinh và win check.

## Trạng thái trước khi thay đổi

Suite P0.2.1 có 24 case và đã bao phủ flow chính V6–V9. Tuy nhiên Hội đồng không chặn card vừa dùng skill Ban ngày làm voter. Kẻ Thế Mạng bị Khóa mạch cũng mất reaction vì selector tái dùng bộ lọc active skill. Public view và BOT lặp lại các điều kiện thiếu này.

## Giả thuyết

`dayExhausted` phải là invariant chung của mọi đường tạo voter. `purgeLockedRound` chỉ thuộc active-skill/Vote eligibility, không thuộc death-reaction eligibility. Batch tests deterministic sẽ phân biệt bug invariant với câu hỏi balance chưa chốt.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Council voter | Chỉ xét alive/faction/cooldown/lock | Thêm `!dayExhausted` ở submit và resolve | `engine.mjs` | Một card không dùng skill và Vote cùng vòng |
| BOT/UI voter | Có thể đề xuất/hiển thị card exhausted | Cùng invariant với engine và public view | `bot-policy.mjs`, `ui.mjs`, `engine.mjs` | Tránh UI nói một đằng, server xử lý một nẻo |
| Kẻ Thế Mạng + Lock | Khóa mạch vô hiệu reaction | Reaction vẫn hợp lệ nếu sống, còn charge và không tự cứu | Engine/UI/BOT | Lock chỉ khóa active skill + Vote |
| Batch coverage | Chưa khóa bằng test | Thêm simultaneous Night draw, final Cut draw, revive spent passive | `engine.test.mjs` | Bảo vệ thứ tự resolve/win check |
| Cache | Module query P0.2.1 | Bump `p03-v1` | `ui.html`, `ui.mjs` | Browser nhận đúng invariant mới |

## Thay đổi role/rule

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Hội đồng | Sau Day B | Không đổi | Card đã dùng skill vẫn lọt voter | Card exhausted không được Vote cùng vòng | UI/BOT/public view đồng bộ |
| Kẻ Thế Mạng | Reaction Hội đồng | Không đổi | Bị Khóa mạch vô hiệu | Khóa mạch không chặn reaction | Vẫn bị giới hạn 1 lần/trận và không tự cứu |
| Khóa mạch | V9 | Không đổi | Implementation khóa cả reaction Kẻ Thế Mạng | Chỉ active skill + Vote | Passive/death reaction còn hoạt động |

Trạng thái: **Đã chốt cho prototype**, chưa có bằng chứng balance.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Chỉ sửa submit validation | Red test engine | Chưa đủ vì BOT/UI/public vẫn sai | Bỏ | Invariant có nhiều consumer |
| Dùng một predicate nhất quán theo consumer | Engine + policy + browser | PASS | Giữ | UI và server cùng behavior |
| Áp Khóa mạch lên mọi behavior | Regression reaction | FAIL design | Bỏ | Rule chỉ ghi active skill + Vote |
| Characterization batch không đổi engine | Ba automated case | PASS | Giữ | Xác nhận behavior hiện tại đúng trước khi refactor sâu |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Automated red | Day A dùng Avenger rồi chọn A7 làm voter | Reject | Không throw | PASS red evidence |
| T-002 | Automated red | V9, A4 Substitute bị Lock, ally bị treo | Reaction dùng được | `Không còn Kẻ Thế Mạng hợp lệ` | PASS red evidence |
| T-003 | Automated red | Mọi voter BOT `dayExhausted` | BOT pass | BOT accuse bằng B1/B2 | PASS red evidence |
| T-004 | Automated green | Toàn `*.test.mjs` | Tất cả pass | 30/30 pass | PASS |
| T-005 | Static JavaScript | Engine/UI/BOT | Không syntax error | Exit 0 | PASS |
| T-006 | Browser interaction | Local V9, khóa A4; A7 mark; BOT treo A7 | A7 không vote; A4 vẫn chết thay | Đúng expected; sang Night; không BOT error | PASS |

### Lệnh đã chạy

```bash
node --test --test-name-pattern='used a Day skill|Lock does not disable' apps/spec-reviewer/game-flow-demo/engine.test.mjs
node --test --test-name-pattern='Day-exhausted' apps/spec-reviewer/game-flow-demo/bot-policy.test.mjs
node --test apps/spec-reviewer/game-flow-demo/*.test.mjs
node --check apps/spec-reviewer/game-flow-demo/engine.mjs
node --check apps/spec-reviewer/game-flow-demo/ui.mjs
node --check apps/spec-reviewer/game-flow-demo/bot-policy.mjs
```

### Output quan trọng

```text
Red engine: tests 2, pass 0, fail 2
Red bot: tests 1, pass 0, fail 1
Green: tests 30, pass 30, fail 0
Browser: A7 data-direct-source = null; A4 KHÓA MẠCH vẫn có nút Dùng Kẻ Thế Mạng
After reaction: A4 ĐÃ CHẾT, A7 sống, VÒNG 9 · KHÓA LỆNH ĐÊM
```

## Failure log

### F-001 — Card dùng skill Ban ngày vẫn Vote cùng vòng

- Build/commit/seed: working tree P0.2.1; `day-skill-then-council-vote`.
- Reproduction: A7 Đánh dấu, sau Day B chọn A7 cùng Dân làng làm voter.
- Expected: Engine reject và UI không đề xuất A7.
- Actual: Engine nhận action; public card báo `canVote = true`; BOT cũng có thể tái dùng card exhausted.
- Root cause: Xác định — thiếu `dayExhausted` ở bốn consumer của voter eligibility.
- Fix/decision: thêm invariant ở submit, resolve, policy, UI và public view.
- Verify lại: PASS test riêng, browser và suite 30/30.
- Commit fix: Chưa có.

### F-002 — Khóa mạch vô hiệu nhầm death reaction Kẻ Thế Mạng

- Build/commit/seed: working tree P0.2.1; `lock-keeps-substitute-reaction`.
- Reproduction: V9 khóa Kẻ Thế Mạng rồi tạo án treo hợp lệ lên ally.
- Expected: Reaction vẫn dùng được vì không phải active skill/Vote.
- Actual: `Không còn Kẻ Thế Mạng hợp lệ`.
- Root cause: Xác định — selector reaction dùng chung điều kiện `purgeLockedRound` của active source.
- Fix/decision: reaction selector riêng chỉ xét alive, role và charge; vẫn cấm tự cứu.
- Verify lại: PASS automated và browser V9.
- Commit fix: Chưa có.

## Quyết định sau implementation

### Đã chốt

- Card đã dùng skill Ban ngày không được Vote trong cùng vòng.
- Khóa mạch không vô hiệu death reaction/passive.
- Win check chỉ chạy sau batch action/reaction hiện tại; simultaneous empty boards trả hòa.

### Tạm giữ để test thêm

- `eliminate()` recursive vẫn được giữ cho bộ 10 lá hiện tại vì characterization batch pass.

### Bị loại/revert

- Dùng một bộ lọc active source cho Kẻ Thế Mạng reaction.
- Chỉ sửa UI mà không bảo vệ invariant ở engine.

### Câu hỏi mở

- Priority Thợ săn/Cắt bỏ nếu Thợ săn được đưa vào deck là gì?
- Có nên tách queue reaction khỏi `eliminate()` trước multiplayer authoritative engine?

## Ảnh hưởng

- Game design: làm rõ exhausted và phạm vi Khóa mạch.
- UI/UX: nhãn/action voter không còn mâu thuẫn; reaction bị Lock vẫn hiển thị đúng.
- Kỹ thuật: cùng invariant được bảo vệ ở commit, resolve, policy và view.
- Data/analytics: chưa thêm event mới.
- Scope/roadmap: GD-06 vẫn đang làm vì priority Thợ săn chưa chốt.

## File và artifact liên quan

- Code: `engine.mjs`, `engine.test.mjs`, `bot-policy.mjs`, `bot-policy.test.mjs`, `ui.mjs`, `ui.html`.
- Docs/ADR: core gameplay, game flow, roles draft, role evolution, verification log, task tracker.
- Screenshot/video: Không lưu; DOM evidence trong task.
- Test report: record này và `docs/journey/verification-log.md`.
- Commit/PR: Chưa có.

## Bước tiếp theo

- [ ] Chốt priority Thợ săn/Cắt bỏ hoặc xác nhận Thợ săn ngoài scope Alpha — Game Designer/PO — trước refactor reaction queue.
- [ ] Human playtest ít nhất 3 ván có V9 Lock + Hội đồng — Game Designer/PO — trước chốt balance.
- [ ] P0.4 audit information/public-private state — Developer — lượt tiếp theo.

## Giới hạn bằng chứng

Automated/browser tests chứng minh behavior deterministic của prototype local, không chứng minh multiplayer ordering, reconnect, idempotency, balance hoặc comprehension. Thợ săn chưa nằm trong bộ 10 lá nên priority reaction của role này chưa được implement.
