# Nhật ký kiểm tra

## 01/09/2026 — P0.5 Final Duel, match result và rematch

- Red 0/3: Day còn 1–1 vẫn sang `day-B`; Final Guess có thể overwrite; match result chưa lộ toàn bộ role/rematch chưa qua engine.
- Fix: gọi Final Duel guard sau Day/Council; khóa một guess/seat; dùng `finishMatch` để reveal toàn bộ; thêm `match.rematch` chỉ từ `ended`.
- Coverage thêm: Final Duel sau Council, ma trận cùng đúng/một đúng/cùng sai, normal elimination reveal và rematch setup.
- Browser `?qa=final-duel`: result không còn card `hidden-role`/`Bí danh`; Chơi lại tạo 20 card sống và nút khóa setup.
- Green cuối: **38/38 pass**.

Giới hạn: prototype local coi BOT tự đồng ý rematch; chưa implement consent hai người, surrender hoặc reconnect.

## 01/09/2026 — P0.4 public/private information boundary

- Red 0/3: public view lộ `shielded`/target; public log ghi `A dùng Tiên tri`; block log phân biệt cắn/độc.
- Fix: public shield luôn masked, private hand giữ `shielded`; log Defense không ghi target; soi thường không có public trace; block dùng outcome chung không lộ loại lệnh.
- Browser red bổ sung: replay BOT từng ghi target `B3`; sau fix replay ghi `Mục tiêu bí mật`, owner vẫn thấy khiên A2, opponent board không có shield badge.
- Dawn presentation bỏ opponent first-inspect; blocked attack/poison được sanitize thành hiệu ứng đêm chung; source night của opponent luôn kín trừ Seer execution.
- Checkpoint sau P0.4: **33/33 pass**.

Giới hạn: không có hai client thật; ranh giới được kiểm tra qua `publicView`/`privateView` và local viewer A.

## 01/09/2026 — P0.3 exhausted, reaction và batch resolution

- Baseline trước P0.3: **24/24 pass**.
- Red test card dùng skill Ban ngày rồi làm voter: 0/1, actual không throw; public view còn `canVote = true`.
- Red test Kẻ Thế Mạng bị Khóa mạch: 0/1, actual `Không còn Kẻ Thế Mạng hợp lệ`.
- Red BOT policy: 0/1, actual `accuse` bằng hai voter `dayExhausted`, expected `pass`.
- Fix: dùng invariant `!dayExhausted` ở engine submit/resolve, BOT, UI và public view; bỏ `purgeLockedRound` khỏi eligibility của death reaction Kẻ Thế Mạng.
- Characterization PASS: hai Night action cùng resolve khi source chết trong batch; Cut hai lá cuối trả hòa; hồi sinh giữ reveal và reaction đã tiêu.
- Browser fixture V9: A4 Kẻ Thế Mạng bị Khóa mạch; A7 dùng Đánh dấu và không còn voter interaction; BOT treo A7; UI vẫn đưa nút **Dùng Kẻ Thế Mạng**; chọn dùng làm A4 chết/lộ, A7 sống, vào Night, không có panel lỗi BOT.
- Green cuối: **30/30 pass**; static check engine/UI/bot PASS.

Giới hạn: chưa có human playtest; priority death reaction của Thợ săn/Cắt bỏ vẫn là câu hỏi design vì Thợ săn không thuộc bộ 10 lá prototype hiện tại.

## 31/08/2026 — P0.1 reveal đêm/Kẻ Thế Mạng và P0.2 Thanh trừng

- P0.1 red-first: suite 15 case có 11 pass, 4 fail do source đêm còn leak, thiếu reveal-on-execution và Council còn preselect Sói Hộ Vệ. Sau fix: **15/15 pass**.
- P0.2 red-first: suite 19 case có 15 pass, 4 fail do Dawn bỏ qua `purge` và dispatcher chưa nhận `purge.submit`. Sau các fix và regression Swap conflict/deadlock, Guard identity, Final Duel và BOT Council policy: **24/24 pass**.
- P0.2 bao phủ V6 Cut, V7 Swap giữ `instanceId`/owner và chuyển knowledge theo card, V8 Reveal, V9 Lock chặn skill/Vote.
- `node --check` cho engine và UI: PASS.
- Browser smoke seed `codex-web-01`: đi từ setup qua các vòng tới Dawn V6; form **Thanh trừng — Cắt bỏ** xuất hiện, hai phía khóa kín, A1/B7 bị loại đồng thời, state vào Day V6; browser console error = 0.
- Browser full-flow cùng seed: V7 Swap resolve đồng thời và vào Day V7; V8 sau Swap cho A chọn đúng các card owner A dù position mang prefix B, Reveal B1 rồi vào Day V8; console error = 0 ở hai phase.
- Browser fixture local `?purgeRound=9`: Lock A1 resolve vào Day V9, có badge `KHÓA MẠCH`, `data-direct-source = null`, không hiện panel lỗi BOT.
- Browser full-flow phát hiện BOT Council retry vô hạn sau khi BOT đã dùng Xạ thủ. Red policy test trả `accuse` thay vì `pass`; sau fix test riêng 1/1 và toàn suite 24/24. UI cũng dừng scheduler và hiện lỗi nếu BOT action tiếp tục throw.
- Full workspace `npm run check` và `git diff --check`: ghi kết quả cuối trong journey `2026-08-31-001`.

Giới hạn: V9 dùng fixture deterministic vì full game thử nghiệm kết thúc hợp lệ trước phase Lock; chưa có human playtest full match hoặc balance data.

## 31/08/2026 — Regression deadlock Swap khi A còn một lá

- Repro tối thiểu: Round 7 Purge, A còn 1 card, B còn 2 card; A khóa card cuối của mình và một target B.
- Trước fix: state giữ ở `purge`; phía B không tồn tại cặp own/enemy không trùng hai vị trí A đã khóa, nên UI tiếp tục schedule bot.
- Red test: 0/1 pass, actual `purge`, expected `day-A`.
- Fix: engine kiểm tra khả năng tồn tại response ngay sau lựa chọn đầu tiên; nếu không có thì auto-fizzle batch và chạy flow kết thúc Purge.
- Green: regression riêng 1/1; toàn suite hiện tại **24/24 pass**.
- Guard test bổ sung: trạng thái mỗi owner còn 1 card tại Dawn đi `final-duel`, không đi Purge.

Giới hạn: xác minh deterministic ở engine seam; chưa tái dựng đúng save/state từ ảnh trong browser.

## 30/08/2026 — Static review reveal đêm và Kẻ Thế Mạng

- `rg` xác nhận ADR, core gameplay, game flow và roles draft cùng dùng rule: skill đêm mặc định không lộ source; Tiên tri lộ khi lệnh kết liễu resolve; Kẻ Thế Mạng chết thay Treo cổ một lần/trận.
- `git diff --check`: PASS.
- `npm run check`: PASS cả 3 workspace; engine suite hiện tại 11/11 pass.

Giới hạn: suite 11 case vẫn chạy behavior prototype cũ, chưa xác minh reveal mới, `COUNCIL_REACTION_CHOICE`, Kẻ Thế Mạng hoặc UI prompt. Kết quả này chỉ chứng minh thay đổi tài liệu không làm hỏng baseline hiện có.

## 30/08/2026 — Clarification ngưỡng phiếu Hội đồng

Regression suite được mở rộng từ 9 lên 11 scenario:

- Dân làng + một role Dân khác: `2 + 1 = 3`, Hội đồng hợp lệ và target bị xử lý khi đoán đúng.
- Chỉ một Dân làng: `2 < 3`, engine từ chối với lý do thiếu phiếu.
- Ba role Dân không có Dân làng: `1 + 1 + 1 = 3`, Hội đồng vẫn hợp lệ.

Feedback loop trước fix clarification được chạy khi suite có 10 case: **8/10 pass**, hai case mới fail vì engine vẫn yêu cầu đúng ba card. Sau khi thêm coverage cho ba voter thường và chạy lại toàn bộ: **11/11 pass**.

Browser interaction cho UI mở target sau hai voter: **Chưa xác minh**.

## 30/08/2026 — Regression suite Hội đồng và role core

### Đối tượng

- `apps/spec-reviewer/game-flow-demo/engine.test.mjs`
- Public API: `createGame`, `dispatch`, `publicView`, `ROLE_DEFS`
- Base trước fix: `75b104c`

### Feedback loop

```bash
node --test apps/spec-reviewer/game-flow-demo/engine.test.mjs
```

Trước fix: **0/8 pass**, xác nhận Council V2, vote weight, Bảo vệ, Tiên tri, Xạ thủ, Phù thủy và Báo thù đều lệch ADR.

Sau fix: **9/9 pass**. Suite bao phủ:

1. Day A/B → Council từ Vòng 2 → Night.
2. Dân làng tạo 2 phiếu trong bộ ba voter.
3. Bảo vệ không giới hạn charge và không tự bảo vệ.
4. Khiên không chặn lần soi đầu.
5. Phe sáng không được soi lại.
6. Phe tối bị kết liễu ở lần soi hai; khiên chặn bước kết liễu.
7. Xạ thủ lộ khi dùng skill Ban ngày.
8. Phù thủy không dùng revive và poison cùng vòng.
9. Khiên chặn death reaction của Kẻ báo thù.

Suite đã được nối vào `apps/spec-reviewer/package.json`, nên `npm run check` chạy các scenario này sau integrity check Role Atlas.

### Giới hạn

- Chưa có browser/e2e test cho UI target selection.
- Chưa bao phủ Thanh trừng, Sói Hộ Vệ, Final Duel hoặc mọi simultaneous-death combination.
- Không chứng minh cân bằng hoặc trải nghiệm người chơi.

## 29/08/2026 — Xác minh state machine tại `b589667`

### Mục tiêu

Kiểm tra behavior hiện có bằng code thay vì suy luận hoàn toàn từ commit message.

### Đối tượng

- Historical blob: `b589667:prototypes/chat-playtest/engine.mjs`
- Working-tree path: `apps/spec-reviewer/game-flow-demo/engine.mjs`
- Blob hash hai file: `040005cc0fb726db05a78624e1107deedb42e911`
- Kết luận: engine đang chạy giống hệt snapshot cuối chuỗi prototype.

### Cách chạy

Dùng Node.js import trực tiếp `createGame`, `dispatch`, `ROLE_DEFS`. Test chỉ gọi public engine API, ngoại trừ một case hồi sinh cần dựng fixture bằng cách đánh dấu một lá đã chết trước action.

### Kết quả

| # | Case | Kết quả |
|---:|---|---|
| 1 | Hai bộ đối xứng có đúng 10 lá và 9 loại role | PASS |
| 2 | Hai vòng đầu không có Hội đồng; Vòng 3 mới mở | PASS |
| 3 | Ba role Dân đang ẩn được vote và tự lộ khi Hội đồng resolve | PASS |
| 4 | Đoán Council sai không giết target và khóa voter | PASS |
| 5 | Khiên chặn đòn cắn ban đêm | PASS |
| 6 | Phù thủy hồi sinh, lộ role và tiêu charge | PASS |
| 7 | Kẻ báo thù chết trước bình minh kéo target chết theo | PASS |
| 8 | Mục sư chọn đúng Sói: Sói chết, Mục sư sống | PASS |
| 9 | Mục sư chọn nhầm Dân: Mục sư chết, target sống | PASS |
| 10 | Huyết Nguyệt bị từ chối trước Vòng 6 | PASS |
| 11 | Huyết Nguyệt dùng Vòng 6, target lộ chết, cooldown tới Vòng 8 | PASS |

Tổng: **11/11 pass**.

### Điều test này không chứng minh

- Không chứng minh game vui.
- Không đo balance hoặc first-player advantage.
- Không kiểm tra UI/animation/timing bằng browser.
- Không kiểm tra multiplayer/reconnect/network.
- Không kiểm tra mọi combination của simultaneous death, revive và Final Duel.
- Không thay thế automated regression suite vì script chưa được commit thành test chính thức.

## 29/08/2026 — Xác minh Role Atlas

### Lệnh

```bash
node apps/spec-reviewer/scripts/check-role-data.mjs
```

### Kết quả

```text
OK: 92 roles, 5 factions, 80 images
```

### Ý nghĩa

- Dataset parse được.
- Có 92 record role.
- Có 5 faction.
- 80 role có image theo checker hiện tại.

### Không chứng minh

- Không xác minh quyền sử dụng từng artwork ngoài thông tin license/source đã ghi.
- Không chứng minh 92 role phù hợp với Twofold.
- Không chứng minh annotation gameplay đã được PO duyệt.

## Historical test evidence còn thiếu

Repo không có:

- log output của các lần chạy prototype ngày 28/08;
- automated test files cho engine;
- biên bản playtest có số người/số ván;
- screenshot comparison cho layout A/B/C;
- danh sách bug/failure ngoài điều có thể tái dựng từ commit.

Do đó journal dùng ngôn ngữ thận trọng:

- commit `fix` hoặc removal = failure signal;
- smoke test 29/08 = logic hiện tại pass các case đã liệt kê;
- mọi tuyên bố về fun/balance vẫn là `chưa xác minh`.

## Đề xuất để lần sau có bằng chứng tốt hơn

1. Chuyển 11 smoke case thành test suite nằm trong `packages/game-core`.
2. Mỗi playtest tạo file `docs/playtests/YYYY-MM-DD-<build>.md`.
3. Ghi commit/build, seed, action log và kết quả từng ván.
4. Với UI experiment, lưu screenshot và tiêu chí chọn/bỏ.
5. Khi test fail, ghi expected/actual/root cause/fix/commit verify.
