# 2026-08-30-006 — Giữ bài chết trong đêm ở trạng thái ẩn trên tay

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `main`
- Commit trước khi làm: `1baed0e`
- Commit implementation: cùng commit với record này
- Conversation/task source: owner chốt sau thảo luận information economy rằng bài úp bị tấn công trong đêm nên chết tại vị trí trên tay và không tự lộ phe/role
- Trạng thái: Hoàn thành implementation; cần human playtest về mức phản hồi và khả năng suy luận

## Yêu cầu

Tách “bị loại” khỏi “lộ danh tính”. Lá còn úp bị giết trong đêm phải chết trực tiếp trên tay, không bay lên lane công khai; đối thủ biết vị trí và nguyên nhân chết nhưng không được biết phe hoặc role. Lá đã công khai vẫn giữ thông tin công khai khi chết.

## Trạng thái trước khi thay đổi

- `eliminate()` luôn gọi `reveal(card)` nên mọi nguyên nhân chết đều mở role.
- Public log luôn ghi tên role của thi thể.
- Dawn presentation tìm card mới lộ và làm target di chuyển từ hand lên revealed lane trước combat effect.
- Hồi sinh mặc định mô tả role hồi sinh là công khai.

## Giả thuyết

Giữ thi thể úp sẽ làm Ban đêm mạnh về sát thương nhưng không đồng thời trở thành công cụ điều tra miễn phí. Người chơi vẫn nhận được phản hồi rõ qua vị trí chết, badge nguyên nhân và animation đòn đánh, trong khi Hội đồng/Tiên tri giữ giá trị thông tin riêng.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Elimination API | Luôn reveal khi chết | Có option `revealOnDeath`; mặc định giữ behavior cũ | `engine.mjs` | Tách state chết và lộ |
| Night resolution | Mọi target chết đều lộ | Resolve death với `revealOnDeath: false` | `engine.mjs` | Giữ phe/role của bài úp |
| Revenge chain | Luôn lộ mục tiêu chết theo | Kế thừa disclosure policy của cái chết nguồn | `engine.mjs` | Không rò thông tin qua phản ứng |
| Public log | Luôn ghi tên role | Chỉ ghi role nếu card đã lộ; nếu chưa thì “Danh tính vẫn ẩn” | `engine.mjs` | Không leak qua history |
| Hồi sinh | Wording nói role vẫn công khai | Giữ nguyên trạng thái công khai trước đó | `engine.mjs` | Hợp với hidden corpse |
| Dawn combat | Chỉ hoãn combat khi target di chuyển | Hoãn combat nếu source hoặc target đang di chuyển | `ui.mjs` | Nguồn lộ bước lên xong mới đánh; target úp chết tại chỗ |
| Browser cache | UI dùng `table-lanes-v1`, engine vẫn mang `purge-flow-fix-v1` | `hidden-night-death-v1` cho cả module UI và engine import | `ui.html`, `ui.mjs` | Bản deploy không giữ engine cũ trong cache |

## Thay đổi role/rule

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Cái chết trong đêm — Prototype | Bình minh: target chết rồi tự lộ toàn bộ | Bình minh: target chết tại vị trí hiện tại; chỉ giữ thông tin đã công khai trước đó | Không đổi charge/target; mọi death gọi chung `eliminate()` | Night death không tự reveal | Tiên tri và Hội đồng giữ giá trị thông tin; giảm snowball của attack |
| Hồi sinh — Prototype | Thi thể luôn đã lộ nên hồi sinh công khai | Thi thể ẩn hồi sinh vẫn ẩn; thi thể lộ vẫn lộ | Không đổi charge/target | Giữ disclosure state | Phù thủy không vô tình công khai đồng minh |

Trạng thái: `Prototype`, được ghi tại ADR-0004 và cần playtest trước khi chốt Alpha.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Mọi thi thể lộ toàn bộ role | Behavior cũ + phân tích information economy | FAIL UX/game rule | Bỏ cho night death | Đòn mù nhận cả kill và thông tin |
| Thi thể chỉ lộ phe | Thảo luận rule | Không implement | Tạm bỏ | Vẫn chỉ thưởng thêm thông tin cho attacker; có thể A/B test sau |
| Night death giữ úp, hiện nguyên nhân | Engine test + browser B2 | PASS | Giữ | B2 chết rõ tại hand, không vào lane và không lộ phe/role |
| Mục tiêu B1 trong browser smoke đầu | Browser action A2 → B1 | INCONCLUSIVE | Bỏ làm bằng chứng | B1 đồng thời là source Ma sói của bot nên đã tự lộ trước khi chết |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Static syntax | `node --check engine.mjs` và `ui.mjs` | Không syntax error | Exit 0 | PASS |
| T-002 | Engine unit/regression | `node --test engine.test.mjs` | Hidden night target chết nhưng `revealed=false`; public role/faction `?` | 8/8 pass, gồm 2 case disclosure mới | PASS |
| T-003 | Engine rule | Target đã reveal trước night kill | Role/faction vẫn public sau death | Case mới pass | PASS |
| T-004 | Browser interaction | Default local setup, V1: A bỏ ngày, A2 Sói đánh B2, bỏ Defense, chờ Bình minh | B2 chết trong hand, không ở lane | `targetInHand=true`, `targetInLane=false`, `targetCount=1` | PASS |
| T-005 | Browser DOM/privacy | Cùng setup T-004 | B2 không lộ identity | class `dead hidden-role`; text chỉ “Bí danh”, `TF`, cause; lane B không chứa B2 | PASS |
| T-006 | Visual review | Screenshot ở trạng thái “Trời đã sáng” sau T-004 | Thi thể B2 dễ phân biệt nhưng vẫn úp | B2 xám, giữ mặt sau và có badge “Bị Ma sói cắn” | PASS |
| T-007 | Workspace integration/build | `npm run check` | 4 workspace xanh | 4/4 pass; spec-reviewer 16 test, web typecheck/build, game-core 11 test | PASS |
| T-008 | Static diff | `git diff --check` | Không whitespace error | Exit 0 | PASS |
| T-009 | Human playtest | Chơi trọn nhiều ván | Nhịp rõ và không quá thiếu feedback | Chưa thực hiện | CHƯA XÁC MINH |

### Lệnh đã chạy

```bash
node --check apps/spec-reviewer/game-flow-demo/engine.mjs
node --check apps/spec-reviewer/game-flow-demo/ui.mjs
node --test apps/spec-reviewer/game-flow-demo/engine.test.mjs
npm run check
git diff --check
```

### Output quan trọng

```text
tests 8
pass 8
fail 0

Browser B2:
targetInHand: true
targetInLane: false
targetClasses: role-card faction-unknown phase-hidden dead hidden-role
revealedLaneIds: B6, B10
```

## Failure log

### F-001 — Smoke target đã tự lộ vì đồng thời là nguồn hành động

- Build/commit/seed: local `hidden-night-death-v1`, setup mặc định
- Reproduction: A2 đánh B1; bot cũng dùng B1 Ma sói làm nguồn lệnh đêm
- Expected: B1 là hidden target để kiểm tra chết tại hand
- Actual: B1 tự lộ và đi lên lane do dùng kỹ năng, sau đó chết hợp lệ trên lane
- Root cause: chọn trúng một card có hành động công khai trong cùng resolution
- Fix/decision: chạy lại cùng flow với B2, không phải source của bot
- Verify lại: PASS — B2 chết tại hand và vẫn `hidden-role`
- Commit fix: không có code fix; đây là lỗi setup kiểm tra

## Quyết định sau implementation

### Đã chốt

- Death và reveal là hai transition độc lập.
- Night death không tự công khai phe/role.
- Card chết được render tại vị trí tương ứng với disclosure state hiện tại.
- Public history không được tiết lộ tên role của hidden corpse.

### Tạm giữ để test thêm

- Badge nguyên nhân cụ thể trên mặt sau thi thể.
- Recap cuối trận mở toàn bộ thi thể.

### Bị loại/revert

- Tự động lộ toàn bộ role khi mọi loại death xảy ra.

### Câu hỏi mở

- Có nên A/B test biến thể chỉ lộ phe tại Bình minh?
- Khi hồi sinh một hidden corpse, đối thủ cần cue nào để hiểu lá sống lại nhưng vẫn không biết role?

## Ảnh hưởng

- Game design: thêm information rule có hiệu lực cho prototype.
- UI/UX: hidden corpse ở hand; revealed corpse ở lane; cause vẫn rõ.
- Kỹ thuật: `eliminate()` có disclosure policy, public log không leak.
- Data/analytics: chưa có event đo comprehension hoặc snowball.
- Scope/roadmap: đóng một phần GD-05 nhưng information map toàn game vẫn chưa hoàn tất.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/engine.mjs`, `engine.test.mjs`, `ui.mjs`, `ui.html`
- Docs/ADR: `docs/decisions/0004-hidden-night-death-information.md`, decision index, `core-gameplay-v0.1.md`, `game-flow-v0.1.md`, `role-evolution.md`, record này
- Screenshot/video: browser visual review trong phiên Codex, không commit artifact
- Test report: engine Node test và workspace check ghi trong record
- Commit/PR: cùng commit implementation

## Bước tiếp theo

- [ ] Owner chơi 5–10 ván và đánh giá hidden corpse có đủ rõ nhưng vẫn giữ được suy luận — Owner — sau cập nhật
- [ ] Thiết kế post-match recap mở toàn bộ role — Game Designer/UX — sau khi chốt flow kết thúc trận

## Giới hạn bằng chứng

Đã kiểm tra engine và một browser flow deterministic đến Bình minh với B2 chết ẩn. Chưa human-playtest nhiều ván, chưa kiểm tra mobile, hồi sinh hidden corpse, revenge chain trong browser hoặc post-match reveal.
