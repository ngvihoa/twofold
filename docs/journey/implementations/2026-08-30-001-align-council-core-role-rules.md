# 2026-08-30-001 — Đồng bộ Hội đồng và role core với ADR v0.1

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `75b104c`
- Commit implementation: `7180595`
- Conversation/task source: Audit gameplay ngày 30/08/2026 và yêu cầu xử lý từng phần, bắt đầu từ P0
- Trạng thái: Hoàn thành phần P0.1; giả định “đúng 3 voter” được thay thế ngay sau đó bởi `2026-08-30-002`

## Yêu cầu

Sửa từng phần các sai lệch gameplay đã xác nhận. Nhịp đầu tiên phải đồng bộ Hội đồng và các role core với `ADR-0001`, đồng thời tạo regression suite chạy được trong workspace check.

## Trạng thái trước khi thay đổi

- Hội đồng mở trước Ban ngày từ Vòng 3, thay vì sau hai lượt Ban ngày từ Vòng 2.
- Dân làng chỉ tạo 1 phiếu.
- Bảo vệ có 3 charge, tự bảo vệ được và chặn cả soi Tiên tri.
- Tiên tri có 3 lượt soi full role, không lưu state sáng/tối và cho soi lại phe sáng.
- Xạ thủ dùng skill Ban ngày nhưng không lộ source.
- Phù thủy có thể hồi sinh rồi đầu độc trong cùng vòng.
- Death reaction Kẻ báo thù xuyên khiên.
- Repo chưa có automated regression test cho engine prototype.

## Giả thuyết

Bản engine cũ được giữ lại khi chuyển prototype vào monorepo, trong khi thay đổi luật chỉ tồn tại ở ADR/game-design/journey. Vì không có regression suite, các sai lệch này không làm workspace check fail.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Council flow | V3+, trước Day | V2+, sau Day A/B, resolve xong sang Night | `engine.mjs`, `ui.mjs` | Khớp game-flow và ADR |
| Vote weight | Mọi voter = 1 | Dân làng = 2, role Dân khác = 1; bản đầu vẫn yêu cầu 3 card | `engine.mjs`, `ui.mjs` | Giả định cardinality này bị thay thế bởi ngưỡng 3 phiếu trong record kế tiếp |
| Bảo vệ | 3 charge, cho self-target, chặn soi | Không giới hạn, cấm self-target, không chặn lần soi đầu | `engine.mjs`, `ui.mjs` | Khớp counter rule |
| Tiên tri | 3 charge, repeat mọi target | Không countdown; lần đầu gắn sáng/tối; sáng bị khóa; tối soi lần hai để kết liễu | `engine.mjs`, `ui.mjs` | Khớp role loop đã chốt |
| Xạ thủ | Source có thể giữ ẩn | Source lộ ngay khi skill Ban ngày resolve | `engine.mjs` | Khớp luật thông tin Ban ngày |
| Skill mỗi vòng | `dayExhausted` không được set | Day skill set state; Phù thủy bị chặn dùng độc cùng vòng sau hồi sinh | `engine.mjs` | Khớp giới hạn một lần/vòng |
| Báo thù | Death reaction bỏ qua khiên | Khiên đang hiệu lực chặn death reaction | `engine.mjs` | Khớp phạm vi Protection |
| Regression suite | Không có | 9 test deterministic, chạy trong package `check` | `engine.test.mjs`, `package.json` | Ngăn rule drift tái diễn |

## Thay đổi role/rule

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Hội đồng | V3+, trước Day | V2+, sau Day B | 3 voter, mỗi card 1 phiếu | Bản đầu: 3 voter, Dân làng 2 phiếu | Ngưỡng voter được sửa tiếp trong `2026-08-30-002` |
| Bảo vệ | Chạng vạng | Không đổi | 3 charge; self-target; chặn soi | Không giới hạn; cấm self-target; soi đầu xuyên khiên | Vẫn chặn kill, poison, Huyết Nguyệt, kết liễu Tiên tri và Báo thù |
| Tiên tri | Night main order | Không đổi | 3 soi full role | Soi đầu gắn sáng/tối; tối soi lần hai để kill | Khiên chỉ chặn bước kết liễu |
| Phù thủy | Ngày + Đêm | Không đổi | Có thể dùng cả hai skill cùng vòng | Tối đa một skill mỗi vòng | Giữ charge 1 revive + 1 poison |
| Xạ thủ | Ban ngày | Không đổi | Bắn khi source còn ẩn | Source lộ khi bắn | Tạo đúng reveal cost |
| Kẻ báo thù | Reaction khi chết | Không đổi | Kéo target xuyên khiên | Khiên chặn reaction | Protection nhất quán |

Trạng thái: **Đã chốt cho prototype theo ADR-0001**. Đây là đồng bộ implementation, không phải quyết định balance mới.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Chỉ sửa các dòng bị audit | Smoke snippet gọi `dispatch` | FAIL về độ phủ | Bỏ | Không ngăn regression và bỏ sót flow nối tiếp |
| Port nguyên engine cũ từ commit `3cac131` | So sánh blob lịch sử | INCONCLUSIVE | Bỏ | Bản cũ vẫn sai vote weight và swap Purge đụng ownership model |
| Test public engine API rồi sửa theo ADR | `node --test engine.test.mjs` | PASS | Giữ | Feedback loop 70–80ms, deterministic |
| Gộp Thanh trừng vào cùng patch | Review state shape swap/ownership | INCONCLUSIVE | Tách | Cần seam riêng để không làm rộng P0.1 |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Regression pre-fix | 8 scenario engine | Các rule ADR được giữ | 0/8 pass | FAIL xác nhận repro |
| T-002 | Automated engine | 9 scenario sau fix | Council/role rule đúng | 9/9 pass | PASS |
| T-003 | Static syntax | `node --check` engine/UI | Không lỗi syntax | Không lỗi | PASS |
| T-004 | Workspace check | `npm run check` | Tất cả workspace pass | Spec reviewer gồm 9 test; 3/3 workspace pass | PASS |
| T-005 | Formatting/static diff | `git diff --check` | Không whitespace error | Không output lỗi | PASS |
| T-006 | Browser interaction/visual | Local UI | Flow và target state đúng trực quan | Chưa chạy | Chưa xác minh |

### Lệnh đã chạy

```bash
node --test apps/spec-reviewer/game-flow-demo/engine.test.mjs
node --check apps/spec-reviewer/game-flow-demo/engine.mjs
node --check apps/spec-reviewer/game-flow-demo/ui.mjs
npm run check
git diff --check
```

### Output quan trọng

```text
Pre-fix: tests 8, pass 0, fail 8
Post-fix: tests 9, pass 9, fail 0
OK: 92 roles, 5 factions, 80 images
All 3 workspace checks passed!
```

## Failure log

### F-001 — Engine trong monorepo lệch ADR/game-design

- Build/commit/seed: `75b104c`, các seed cố định trong `engine.test.mjs`
- Reproduction: Chạy test suite mới trước fix
- Expected: Council V2, vote weight 2, role/counter theo ADR
- Actual: 8/8 scenario fail
- Root cause: Xác định — state machine cũ được giữ khi chuyển path; không có regression test trong package check
- Fix/decision: Sửa tại public engine seam và nối suite vào workspace check
- Verify lại: PASS 9/9
- Commit fix: `7180595`

## Quyết định sau implementation

### Đã chốt

- Hội đồng diễn ra sau Day B từ Vòng 2, rồi mới vào Night.
- Quyết định ban đầu “Dân làng có trọng số 2 nhưng vẫn yêu cầu đúng ba card” đã bị thay thế: Hội đồng nay cần đủ 3 phiếu, không bắt buộc 3 card.
- Bảo vệ không tự bảo vệ và không chặn lần soi đầu.
- Tiên tri dùng state sáng/tối; khiên chặn bước kết liễu.
- Automated engine test là một phần của `npm run check`.

### Tạm giữ để test thêm

- `dayExhausted` vẫn là tên field cũ dù nay mang nghĩa “đã dùng skill trong vòng”; có thể đổi tên khi deepening state model.
- `Infinity` biểu diễn charge không giới hạn trong prototype in-memory; cần thay khi state được serialize qua network.

### Bị loại/revert

- Port nguyên blob lịch sử mà không kiểm tra lại.
- Gộp Thanh trừng/swap ownership vào patch role core.

### Câu hỏi mở

- Council có dùng chung `eliminationSpent` với Night kill hay không sẽ được xử lý ở vòng balance P2.
- Thanh trừng Đảo chiến tuyến cần representation nào để card đổi vị trí nhưng ownership không đổi?

## Ảnh hưởng

- Game design: Không đổi ADR; implementation khớp lại nguồn sự thật.
- UI/UX: Target Bảo vệ/Tiên tri không hợp lệ bị loại khỏi lựa chọn; Hội đồng hiển thị cả số người và số phiếu.
- Kỹ thuật: Có regression suite chạy bằng Node test runner.
- Data/analytics: Không đổi.
- Scope/roadmap: Hoàn thành P0.1; P0.2 Thanh trừng còn lại.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/engine.mjs`, `ui.mjs`
- Test: `apps/spec-reviewer/game-flow-demo/engine.test.mjs`
- Docs: `apps/spec-reviewer/game-flow-demo/README.md`, record này
- ADR: `docs/decisions/0001-core-rules-v0.1.md`
- Screenshot/video: Chưa có
- Commit/PR: `7180595`

## Bước tiếp theo

- [ ] P0.2 — Implement và test Thanh trừng V6–V9, giải quyết ownership khi Đảo chiến tuyến — Codex — nhịp tiếp theo
- [ ] Browser smoke Council V2, Guard target và Seer target lock — Codex — sau khi P0.2 ổn định
- [ ] P1 — Rút timing và bổ sung missing FX/state — sau P0

## Giới hạn bằng chứng

Automated test xác minh engine transition và role rules ở chín scenario cố định. Chưa có browser interaction, visual review hoặc human playtest; kết quả không chứng minh balance, fun hay nhịp trận.
