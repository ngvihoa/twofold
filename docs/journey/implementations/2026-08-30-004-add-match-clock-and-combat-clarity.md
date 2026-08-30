# 2026-08-30-004 — Thêm đồng hồ trận và tín hiệu gameplay

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `main`
- Commit trước khi làm: `e7a11a1`
- Commit implementation: cùng commit với record này
- Conversation/task source: owner yêu cầu đồng hồ thời lượng trận, guide giữa sân, chỉ đỏ Báo thù và card chết xám khi chọn 3 voter
- Trạng thái: Hoàn thành implementation; còn giới hạn human playtest ghi bên dưới

## Yêu cầu

Tăng khả năng theo dõi một ván: hiển thị thời gian từ lúc bắt đầu tới kết quả, đặt hướng dẫn/action giữa hai phe, làm rõ liên kết Kẻ báo thù–mục tiêu, và tránh chọn nhầm card chết trong Hội đồng.

## Trạng thái trước khi thay đổi

- Không có đồng hồ hoặc thời lượng cuối trận.
- Guide/action nằm dưới history trong cột phải.
- Dấu Kẻ báo thù chỉ tồn tại trong state/log; không có liên kết trực quan trên bàn.
- CSS `targeting-active` ghi đè opacity/filter của `.dead`, khiến card chết sáng lại khi chọn voter.

## Giả thuyết

Một đồng hồ tabular cố định, guide đúng vùng thao tác, liên kết không gian giữa source/target và specificity riêng cho card chết sẽ giảm nhu cầu đọc log và tránh lựa chọn nhầm mà không đổi game rule.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Match clock | Không có | Bắt đầu ở CTA Vòng 1, cập nhật mỗi giây, đóng băng khi `state.result`, hiện lại ở kết quả | `ui.mjs`, `ui.css` | Biết thời lượng một ván |
| Guide/action | Cột phải | Overlay giữa hai revealed lane | `ui.mjs`, `ui.css` | Hướng dẫn gần vùng chọn bài |
| History | Chia cột phải với guide | Dùng toàn bộ side rail, scroll khi dài | `ui.mjs`, `ui.css` | Cột phải chuyên cho timeline |
| Báo thù | Log/state | Nhãn mục tiêu + đường đỏ mờ source→target | `ui.mjs`, `ui.css` | Thấy quan hệ mà không đọc log |
| Vote dead state | Có thể bị targeting CSS làm sáng lại | Opacity 0.2, grayscale 1, brightness 0.42 và bỏ pointer | `ui.mjs`, `ui.css` | Không nhầm card chết với voter hợp lệ |
| Cache revision | `two-column-v1` | `play-clarity-v1` | `ui.html` | Nạp asset mới |

## Thay đổi role/rule

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Kẻ báo thù — Prototype UI | Mark lưu trong state tới Bình minh/nguồn chết | Không đổi | Không có cue bền vững | Thêm đường đỏ và nhãn target; logic skill không đổi | Chỉ thay information presentation |

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Dùng combat FX layer cho chỉ đỏ | Static design check | Bỏ trước khi code | Bỏ | Combat animation ghi đè `innerHTML` của layer |
| Layer riêng cho revenge thread | Browser action A7 mark B1 | PASS | Giữ | Thread tồn tại qua render/action khác |
| Chỉ dựa vào `.dead` hiện có | CSS cascade audit | FAIL | Bỏ | `targeting-active` có specificity/order cao hơn |
| Body class `council-selecting` | Static + selector review | PASS | Giữ | Chỉ tăng tương phản trong đúng bước Vote |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Static syntax | `node --check ui.mjs` | Không syntax error | Exit 0 | PASS |
| T-002 | Engine regression | `node --test engine.test.mjs` | Không đổi rule | 6/6 pass | PASS |
| T-003 | Browser interaction | Setup → Bắt đầu V1 → chờ 1.3s | Clock bắt đầu và guide ở center | DOM `THỜI GIAN · 00:01`; guide nằm trong center table | PASS |
| T-004 | Browser interaction + visual | A7 Kẻ báo thù mark B1, chờ presentation | Có cue bền vững | `.revenge-thread` = 1, `.revenge-marked` = 1; visual có chỉ đỏ A7→B1 | PASS |
| T-005 | Static CSS | `council-selecting` + card/lifted dead | Card chết xám rõ và không nhận click | Rule opacity/grayscale/brightness + pointer-events áp dụng | PASS tĩnh |
| T-006 | Workspace integration/build | `npm run check` | Tất cả workspace xanh | 4/4 pass; spec-reviewer 14 test, web build, game-core 11 test | PASS |
| T-007 | Static diff | `git diff --check` | Không whitespace error | Exit 0 | PASS |
| T-008 | End-to-end full match | Chơi tới state `ended` | Clock đóng băng và hiện ở kết quả | Chưa chạy full match | CHƯA XÁC MINH |

### Lệnh đã chạy

```bash
node --check apps/spec-reviewer/game-flow-demo/ui.mjs
node --test apps/spec-reviewer/game-flow-demo/engine.test.mjs
npm run check
git diff --check
```

## Failure log

### F-001 — Chụp chỉ đỏ quá sớm

- Build/commit/seed: local `play-clarity-v1`
- Reproduction: kiểm tra sau 4.2 giây kể từ click target
- Expected: action resolve xong, thread tồn tại
- Actual: presentation source còn chạy; thread count 0
- Root cause: presentation hai stage dài hơn thời điểm kiểm tra
- Fix/decision: chờ thêm 4.2 giây rồi kiểm tra state bền vững
- Verify lại: PASS — thread count 1, marked count 1
- Commit fix: không cần code fix

## Quyết định sau implementation

### Đã chốt

- Timer bắt đầu khi người chơi chủ động mở Vòng 1, không tính thời gian setup.
- Guide/action ở center; side rail chỉ giữ history/private notes.
- Revenge thread dùng layer riêng để không bị combat FX xóa.
- Card chết có treatment mạnh hơn chỉ trong mode chọn voter.

### Tạm giữ để test thêm

- Độ mờ/độ dày của chỉ đỏ khi đồng thời có nhiều role lộ.
- Clock freeze được implement theo `state.result` nhưng cần full human playtest.

### Bị loại/revert

- Dùng chung combat FX layer cho cue Báo thù.

### Câu hỏi mở

- Có cần lưu thời lượng trận vào analytics hoặc match history sau Alpha không?

## Ảnh hưởng

- Game design: không đổi timing/charge/outcome.
- UI/UX: thêm time awareness và cue không gian.
- Kỹ thuật: thêm timer lifecycle cùng một fixed overlay layer riêng.
- Data/analytics: chưa persist thời lượng.
- Scope/roadmap: đủ cho local playtest; analytics để sau.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/ui.mjs`, `ui.css`, `ui.html`
- Docs: `docs/journey/role-evolution.md`, record này
- Screenshot/video: browser visual review trong phiên Codex, không commit artifact
- Commit/PR: cùng commit implementation

## Bước tiếp theo

- [ ] Owner chơi một ván tới kết thúc và xác nhận clock freeze/độ dễ đọc Vote — Owner — sau cập nhật

## Giới hạn bằng chứng

Đã browser-verify clock khởi động, vị trí guide và revenge thread. Chưa chạy full match tới `ended`, nên việc clock đóng băng ở kết quả mới được kiểm tra bằng static control-flow, không được ghi là browser/human verified. Vote dead treatment được kiểm tra tĩnh theo selector, chưa có screenshot deterministic với card chết đúng ở Hội đồng.
