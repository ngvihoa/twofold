# 2026-08-31-001 — Implement lại Thanh trừng với ownership ổn định

## Metadata

- Ngày: 31/08/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: Working tree sau implementation P0.1, base `75b104c`
- Commit implementation: `7180595`
- Conversation/task source: CONV-006 — kiểm tra P hiện tại rồi sửa P tiếp theo
- Trạng thái: Hoàn thành prototype; chờ human playtest

## Yêu cầu

Xác minh P0.1 còn đúng, sau đó tiếp tục P0.2: pha Thanh trừng bắt buộc từ Vòng 6 với bốn luật V6–V9, có engine, UI/bot và bằng chứng kiểm tra.

## Trạng thái trước khi thay đổi

Engine hiện tại đi thẳng từ Bình minh vào `day-A`, không có dispatcher/state Thanh trừng. Một implementation lịch sử từng đổi toàn bộ card object giữa hai board và gán lại ID, làm ownership thực tế đổi theo vị trí vì validation dựa vào prefix A/B. UI hiện tại không có form Thanh trừng.

## Giả thuyết

Tách identity, owner và position sẽ giúp Đảo chiến tuyến chỉ đổi vị trí như design: `instanceId` và `owner` bất biến, `id` là vị trí có thể đổi. Mọi validation phải dựa trên `owner`, còn public board phải group theo prefix vị trí hiện tại.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Card model | `id` vừa là identity, owner và position | `instanceId` bất biến, `owner` bất biến, `id` là position | `engine.mjs` | Tránh đổi chủ khi Swap |
| Flow V6+ | Dawn → Day | Dawn → Purge → Win/Final check → Day | `engine.mjs` | Đúng game flow |
| Cắt bỏ | Chưa có | Hai owner chọn kín, loại đồng thời | Engine/UI/bot | Luật V6 |
| Đảo chiến tuyến | Chưa có trong current engine | Bốn vị trí đổi đồng thời; owner/identity/role giữ nguyên; conflict làm cả batch fizzle | Engine/UI/bot | Luật V7 và tránh leak/reselect |
| Ép lộ diện | Chưa có | Mỗi bên lộ một lá ẩn; cho phép lựa chọn rỗng chỉ khi hết lá ẩn | Engine/UI/bot | Luật V8 |
| Khóa mạch | Chưa có | Khóa skill và Vote trong vòng hiện tại | Engine/UI/bot/public view | Luật V9 |
| Knowledge/cooldown | Gắn vào position ID | Ghi chú Tiên tri đi theo card sau Swap; Guard cooldown dùng `instanceId` | Engine/UI | Không làm sai thông tin khi card di chuyển |
| Presentation | Không có | Form bắt buộc, nhãn luật theo vòng, waiting state kín, badge Khóa mạch | `ui.mjs` | Có thể playtest thật |
| BOT Council | Policy luôn thử accuse nếu tìm được voter/target | Pass khi đã tiêu quyền loại trực tiếp trong vòng; lỗi BOT hiện thành panel thay vì retry vô hạn | `bot-policy.mjs`, `ui.mjs` | Chặn spinner vô hạn ngoài Thanh trừng được browser full-flow phát hiện |
| QA browser | Phải chơi từ Vòng 1 | Query local-only `?purgeRound=6..9` mở thẳng phase cần kiểm tra | `ui.mjs`, `ui.html`, `README.md` | Xác minh V9 deterministic mà không biến fixture thành production state |

## Thay đổi role/rule

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Thanh trừng | Không tồn tại trong current runtime | Sau Dawn, trước Day từ V6 | — | Chu kỳ Cut/Swap/Reveal/Lock | Resolve kín, đồng thời, không Pass |
| Bảo vệ | Cooldown theo position ID | Không đổi timing | Cấm lặp ID vị trí | Cấm lặp cùng `instanceId` | Swap không reset cooldown |
| Khóa mạch | — | Vòng 9 và mỗi chu kỳ sau | — | Target mất skill + Vote trong đúng vòng | Không vô hiệu passive ngoài phạm vi đã chốt |

Trạng thái: **Prototype đã implement; balance và cảm nhận vẫn đang thử**.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Port implementation lịch sử, chuyển card object giữa board | Static audit commit lịch sử | Ownership bị suy ra từ vị trí; lệch rule | Bỏ | Swap phải giữ owner |
| Owner collection cố định, chỉ đổi `id` position | Regression test identity/owner | Ổn định qua Swap | Giữ | Tách đúng ba khái niệm |
| Conflict yêu cầu chọn lại | Threat-model information leak | Có thể lộ lựa chọn đối thủ | Bỏ | Phá lựa chọn kín |
| Bốn target trùng nhau làm batch fizzle | Deterministic resolution | Không leak, không cần prompt giữa batch | Giữ | Dễ log và replay |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Automated regression, red | 4 case V6–V9 mới | Current runtime phải fail trước fix | 15 pass, 4 fail: không có phase/dispatcher Purge | PASS red evidence |
| T-002 | Automated regression, green | `node --test .../*.test.mjs` | Toàn bộ case pass | 24/24 pass sau khi thêm Swap deadlock, Final Duel guard và BOT Council policy | PASS |
| T-003 | Static JavaScript | `node --check engine.mjs`, `node --check ui.mjs`, `node --check bot-policy.mjs` | Không syntax error | Exit 0 | PASS |
| T-004 | Browser smoke | Seed `codex-web-01`, thao tác setup rồi pass tới V6 | Dawn V6 mở Cut; submit A/B kín; loại hai card; vào Day V6 | Đúng expected; history ghi A1 và B7 bị Cắt bỏ | PASS |
| T-005 | Browser console | Cùng session T-004 | Không runtime error | 0 error | PASS |
| T-006 | Browser interaction | Seed `codex-web-01`, full flow V7 | Swap kín resolve; identity/owner giữ nguyên; vào Day V7 | History báo bốn card đổi vị trí; phase Day V7; console error = 0 | PASS |
| T-007 | Browser interaction | Cùng game, full flow V8 sau Swap | Danh sách own dựa trên owner, không prefix position; Reveal resolve | UI cho A chọn các position B1/B8 đang thuộc A; B1 lộ Tiên tri; vào Day V8; console error = 0 | PASS |
| T-008 | Browser interaction | Local fixture `?purgeRound=9&rev=p021-v2` | Lock resolve; badge hiện; target không còn nguồn action trực tiếp | A1 có `KHÓA MẠCH`, vào Day V9, `data-direct-source = null`, không hiện lỗi BOT | PASS |
| T-009 | Automated regression, BOT | `node --test .../bot-policy.test.mjs` | BOT pass Council nếu `eliminationSpent = true` | Red 0/1 (actual accuse), green 1/1 (pass) | PASS |
| T-010 | Human playtest | Ít nhất 3 full match V6–V9 | Đánh giá dễ hiểu và balance | Chưa chạy | Chưa xác minh |

### Lệnh đã chạy

```bash
node --check apps/spec-reviewer/game-flow-demo/engine.mjs
node --check apps/spec-reviewer/game-flow-demo/ui.mjs
node --check apps/spec-reviewer/game-flow-demo/bot-policy.mjs
node --test apps/spec-reviewer/game-flow-demo/*.test.mjs
npm run check
git diff --check
```

### Output quan trọng

```text
P0.2 red: tests 19, pass 15, fail 4
P0.2.1 green cuối: tests 24, pass 24, fail 0
Browser: VÒNG 6 · THANH TRỪNG — CẮT BỎ
After resolve: VÒNG 6 · BAN NGÀY — LƯỢT CỦA BẠN
Browser V7: Swap resolve, vào Day V7; console errors: []
Browser V8: owner A chọn được position B1/B8 sau Swap; B1 Reveal; console errors: []
Browser V9 fixture: A1 có KHÓA MẠCH; data-direct-source = null; vào Day V9
```

## Failure log

### F-001 — Current engine bỏ qua Thanh trừng

- Build/commit/seed: working tree trước P0.2; fixture round 5 night resolution.
- Reproduction: resolve Dawn V6 rồi gửi `purge.submit`.
- Expected: phase `purge` và dispatcher nhận action.
- Actual: phase `day-A`; `Action type không hợp lệ`.
- Root cause: Xác định — transition hard-code `day-A`, thiếu state/dispatcher.
- Fix/decision: thêm `purgeRule`, state, submit/resolve và transition.
- Verify lại: PASS 24/24 ở suite hiện tại.
- Commit fix: `7180595`.

### F-002 — Smoke automation click sớm trong animation

- Build/commit/seed: browser local `codex-web-01`.
- Reproduction: phase chip đã đổi sang Chạng vạng nhưng nút chưa render do presentation đang khóa.
- Expected: click Bỏ lượt.
- Actual: locator chưa có match.
- Root cause: Xác định — phase label và action availability không đổi cùng một frame presentation.
- Fix/decision: smoke runner kiểm tra locator tồn tại rồi mới click; không thay game code.
- Verify lại: PASS tới V6.
- Commit fix: Không áp dụng.

### F-003 — BOT chờ vô hạn khi không còn response Swap không xung đột

- Build/commit/seed: fixture `purge-swap-last-card-deadlock`; ảnh playtest người dùng ngày 31/08/2026.
- Reproduction: Round 7, A còn 1 card, B còn 2; A khóa card cuối và một card B.
- Expected: nếu không tồn tại cặp response không xung đột, batch tự fizzle và vào Day.
- Actual: state giữ ở `purge`; UI tiếp tục schedule BOT.
- Root cause: Xác định — engine chỉ phát hiện conflict sau hai submission, nhưng không phát hiện submission thứ hai là bất khả thi.
- Fix/decision: kiểm tra existence của response ngay sau lựa chọn đầu tiên; thiếu một trong hai pool còn lại thì auto-fizzle.
- Verify lại: PASS test riêng và 24/24 suite.
- Commit fix: `7180595`.

### F-004 — BOT Council retry vô hạn sau khi đã dùng Xạ thủ

- Build/commit/seed: browser full-flow P0.2.1; A hồi sinh A2, BOT dùng Xạ thủ loại A2, A bỏ Hội đồng.
- Reproduction: chờ lượt Council của BOT sau khi `players.B.eliminationSpent = true`.
- Expected: BOT bỏ lượt vì không còn quyền loại trực tiếp trong vòng.
- Actual: policy tiếp tục tạo `accuse`; engine từ chối; catch render lại và scheduler lặp vô hạn ở “BOT B đang cân nhắc”.
- Root cause: Xác định — bot policy không xét `eliminationSpent`, UI không chặn retry sau exception.
- Fix/decision: tách `chooseBotCouncilAction`; trả `pass` ngay khi đã tiêu quyền; lưu/hiện `botError` và không schedule lại vô hạn nếu còn lỗi.
- Verify lại: red test 0/1 với actual `accuse`; green test 1/1 với `pass`; toàn suite 24/24.
- Commit fix: `7180595`.

## Quyết định sau implementation

### Đã chốt

- `instanceId` và `owner` bất biến; `id` là vị trí có thể đổi.
- Swap conflict làm toàn batch fizzle, không reselect giữa batch.
- Guard cooldown và knowledge Tiên tri đi theo card identity qua Swap.
- Thanh trừng chạy Win/Final check trước khi vào Day.

### Tạm giữ để test thêm

- Chu kỳ V6–V9 lặp modulo 4 từ V10.
- Lock chỉ khóa active skill và Vote; passive/death reaction chưa bị khóa.

### Bị loại/revert

- Port cách chuyển card object giữa owner board của implementation lịch sử.
- Dùng prefix ID làm ownership validation sau V7.

### Câu hỏi mở

- Có cần animation riêng cho Swap và màu đỏ mạnh hơn cho toàn pha không?
- Conflict Swap nên fizzle cả batch hay chỉ cặp conflict sau human playtest?
- Chu kỳ có thật sự lặp từ V10 hay sẽ có luật mới?

## Ảnh hưởng

- Game design: cụ thể hóa conflict và identity semantics của Thanh trừng.
- UI/UX: thêm phase/form/waiting/badge bắt buộc; browser interaction V6–V9 pass, chưa có visual review chuyên sâu.
- Kỹ thuật: mọi lookup theo position tìm toàn bộ card; ownership validation theo field.
- Data/analytics: nên log lựa chọn rule, conflict và tỷ lệ target role/faction.
- Scope/roadmap: đưa WEB-07 prototype sang Playtest/Review, chưa phải multiplayer Web Alpha.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/engine.mjs`, `ui.mjs`, `ui.html`, `bot-policy.mjs`, `engine.test.mjs`, `bot-policy.test.mjs`.
- Docs/ADR: core gameplay, game flow, role evolution, verification log, task tracker.
- Screenshot/video: Không lưu; browser smoke có DOM/history evidence trong task.
- Test report: record này và `docs/journey/verification-log.md`.
- Commit/PR: `7180595`.

## Bước tiếp theo

- [ ] Human playtest ít nhất 3 ván đi tới V9 — Game Designer/PO — trước khi chốt cycle.
- [ ] P0.3: audit/fix phần tiếp theo theo thứ tự ưu tiên — Developer — lượt tiếp theo.
- [ ] Visual polish animation Swap/Lock sau khi flow được giữ — UI/UX — sau playtest comprehension.

## Giới hạn bằng chứng

Browser interaction đã bao phủ Cut V6, Swap V7 và Reveal V8 qua full flow; Lock V9 dùng fixture local deterministic vì full game kết thúc hợp lệ ở Dawn V9 trước Thanh trừng. Đây chưa phải một human playtest full match đi qua đủ V6–V9. Không có multiplayer, reconnect hoặc số liệu balance.
