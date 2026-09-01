# 2026-08-30-002 — Dùng ngưỡng trọng số cho Hội đồng

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: Working tree sau `2026-08-30-001`, base `75b104c`
- Commit implementation: `7180595`
- Conversation/task source: Owner làm rõ “Dân làng tính 2 phiếu thì khi chọn không cần phải 3 nhân vật”
- Trạng thái: Hoàn thành implementation; chờ browser review

## Yêu cầu

Hội đồng phải xét tổng trọng số thay vì bắt buộc đúng ba voter. Dân làng + một role Dân khác phải đủ ngưỡng 3 phiếu.

## Trạng thái trước khi thay đổi

Engine đã tính Dân làng là 2 phiếu nhưng vẫn validate `voters.length === 3`; UI cũng chỉ cho chọn mục tiêu khi đủ ba card. Luật vì vậy tự mâu thuẫn và lợi thế 2 phiếu của Dân làng không làm giảm số nhân vật cần lộ.

## Giả thuyết

Nếu validation và UI gate cùng chuyển từ cardinality sang `votePower >= 3`, Dân làng + một role Dân khác sẽ resolve được, trong khi một Dân làng đơn lẻ vẫn bị từ chối.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Engine validation | Đúng 3 voter | 1–3 voter, tổng trọng số ít nhất 3 | `engine.mjs` | Trọng số có tác dụng thật |
| Council resolution | `validVotes.length === 3` | `votePower >= 3` | `engine.mjs` | Resolve theo cùng rule validate |
| Direct UI | Mở target ở 3 card | Mở target khi đủ 3 phiếu | `ui.mjs` | Dân làng + 1 role dùng được |
| Bot | Luôn lấy 3 voter | Ưu tiên Dân làng và dừng khi đủ 3 phiếu | `ui.mjs` | Bot tuân cùng rule |
| Presentation | Cố định “3 người” | Hiển thị số nhân vật và tổng phiếu thực | `ui.mjs` | Nguyên nhân–kết quả rõ |
| Source of truth | “Đúng 3 lá” + Dân làng 2 phiếu | Tối đa 3 lá, ngưỡng ít nhất 3 phiếu | ADR, game-design, README | Xóa mâu thuẫn |

## Thay đổi role/rule

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Dân làng/Hội đồng | Vòng 2+, sau Day B | Không đổi | Bắt buộc 3 voter dù Dân làng = 2 | Đủ 3 phiếu; Dân làng + 1 role Dân khác hợp lệ | Ít lộ bài hơn khi dùng Dân làng; Dân làng đơn lẻ vẫn thiếu phiếu |

Trạng thái: **Đã chốt theo clarification trực tiếp của owner**.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Giữ đúng 3 card, chỉ hiển thị 4 phiếu | Regression test 3 voter | FAIL về semantics | Bỏ | Trọng số 2 không giảm reveal cost |
| Ngưỡng 3 phiếu, tối đa 3 card | Test 2-card và insufficient-power | PASS | Giữ | Khớp clarification và giữ cap UI |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Regression pre-fix | Dân làng + 1 role Dân | Đạt 3 phiếu và treo đúng | Engine từ chối vì không đủ 3 card | FAIL xác nhận repro |
| T-002 | Automated engine | Cùng seed sau fix | Hai voter resolve, log 3 phiếu | Đúng | PASS |
| T-003 | Automated negative | Chỉ một Dân làng | Bị từ chối vì chỉ 2 phiếu | Lỗi “Cần đủ 3 phiếu” | PASS |
| T-004 | Full engine suite | 11 scenario | Hai voter có Dân làng và ba voter thường đều hợp lệ | 11/11 pass | PASS |
| T-005 | Browser interaction | UI Council | Target mở sau Dân làng + 1 role | Chưa chạy | Chưa xác minh |

### Lệnh đã chạy

```bash
node --test apps/spec-reviewer/game-flow-demo/engine.test.mjs
node --check apps/spec-reviewer/game-flow-demo/ui.mjs
```

### Output quan trọng

```text
Pre-fix clarification loop: tests 10, pass 8, fail 2
Post-fix final: tests 11, pass 11, fail 0
```

## Failure log

### F-001 — Vote weight không ảnh hưởng số voter

- Build/commit/seed: Working tree sau P0.1, seed `villager-vote`
- Reproduction: Chọn Dân làng + một role Dân khác
- Expected: 2 + 1 = 3 phiếu, được chọn target
- Actual: Engine yêu cầu đúng ba voter
- Root cause: Xác định — validation dùng cardinality thay vì tổng trọng số
- Fix/decision: Validate và resolve bằng `votePower >= 3`, cap tối đa ba voter
- Verify lại: PASS
- Commit fix: `7180595`

## Quyết định sau implementation

### Đã chốt

- Hội đồng cần ít nhất 3 phiếu, không bắt buộc 3 nhân vật.
- Dân làng = 2; role Dân khác = 1.
- Tối đa ba voter; UI dừng nhận thêm voter khi đã đủ phiếu.

### Tạm giữ để test thêm

- Reveal economy của Dân làng + một role cần human playtest.

### Bị loại/revert

- “Đúng 3 voter” trong implementation P0.1.

### Câu hỏi mở

- Có cho phép tổng 4 phiếu khi người chơi cố tình chọn ba card gồm Dân làng hay UI nên luôn dừng tại ngưỡng? Direct UI hiện dừng khi đủ 3; engine vẫn chấp nhận tối đa ba card có tổng lớn hơn 3.

## Ảnh hưởng

- Game design: Hội đồng chuyển từ cardinality sang weighted threshold.
- UI/UX: Có thể chỉ lộ hai voter khi một voter là Dân làng.
- Kỹ thuật: Regression suite thêm case positive/negative cho trọng số.
- Data/analytics: Chưa có.
- Scope/roadmap: Sửa clarification trước khi tiếp tục P0.2 Thanh trừng.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/engine.mjs`, `ui.mjs`
- Test: `apps/spec-reviewer/game-flow-demo/engine.test.mjs`
- Docs: `docs/decisions/0001-core-rules-v0.1.md`, `docs/game-design/core-gameplay-v0.1.md`, `docs/game-design/game-flow-v0.1.md`
- Screenshot/video: Chưa có
- Commit/PR: `7180595`

## Bước tiếp theo

- [ ] Browser smoke Hội đồng với Dân làng + 1 role — Codex — sau P0.2 hoặc trước handoff build
- [ ] P0.2 Thanh trừng V6–V9 — Codex — nhịp tiếp theo

## Giới hạn bằng chứng

Automated test xác minh engine rule; chưa có browser interaction, visual review hoặc human playtest để đo reveal cost và balance.
