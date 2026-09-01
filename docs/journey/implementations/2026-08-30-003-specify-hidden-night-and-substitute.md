# 2026-08-30-003 — Chốt reveal đêm và Kẻ Thế Mạng

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: Working tree sau `2026-08-30-002`, base `75b104c`
- Commit implementation: Chưa có
- Conversation/task source: CONV-006 — brainstorm cân bằng Tiên tri và thay Sói Hộ Vệ
- Trạng thái: Hoàn thành; prototype đã implement và regression test

## Yêu cầu

Ghi rõ bộ 10 lá hiện tại; chốt skill Ban đêm không tự làm lộ role, Tiên tri chỉ lộ khi chuyển từ soi sang kết liễu, và thay Sói Hộ Vệ bằng một role Phe Hắc Ám chết thay khi Treo cổ.

## Trạng thái trước khi thay đổi

ADR và game-flow dùng rule lộ theo ngưỡng chung, trong khi prototype stage source đêm trước khi đặt khiên. Tiên tri bị lộ khi soi. Sói Hộ Vệ phải chọn trước một target để bảo kê, rồi chỉ cứu nếu đối thủ Treo cổ đúng target đó.

## Giả thuyết

Giữ kín source của skill đêm sẽ bảo toàn suy luận vị trí; buộc Tiên tri lộ khi ra lệnh kết liễu tạo chi phí cho khả năng vừa điều tra vừa loại bỏ. Chuyển Sói Hộ Vệ thành reaction chết thay làm counter Hội đồng dễ hiểu hơn mà Hội đồng vẫn loại đúng một lá.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Reveal đêm | Giữ kín tới Bình minh rồi có thể lộ theo ngưỡng chung | Mặc định không lộ source; ngoại lệ theo action | ADR, core gameplay, game flow | Khóa information economy |
| Tiên tri | Soi làm lộ; soi lần hai kết liễu | Soi kín; lệnh kết liễu làm lộ tại Bình minh dù bị chặn | ADR, game design | Giữ intel kín nhưng trả giá khi gây sát thương |
| Sói Hộ Vệ | Chọn trước target để bảo kê | Thay bằng Kẻ Thế Mạng, reaction Có/Không khi Treo cổ hợp lệ | ADR, game design | Bỏ preselection và tách khỏi cơ chế khiên |
| Bộ 10 lá | Nằm rải rác giữa prototype và journey | Một bảng thống nhất 10 lá, timing, charge và reveal | `roles-draft.md` | Dễ review/playtest |
| Thuật ngữ | “Bảo kê”, “chết thay”, “kết liễu” dễ dùng lẫn | Khóa glossary miền | `CONTEXT.md` | Giữ model nhất quán |

## Thay đổi role/rule

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Tiên tri | Ban đêm; source lộ khi stage | Ban đêm; soi kín, kết liễu lộ ở Bình minh | Soi không countdown; soi hai lá tối để giết | Không đổi nhịp/target; tách `inspect` và `execute` bằng reveal rule | Bảo vệ không chặn soi, chặn kết liễu; attempt vẫn làm lộ |
| Kẻ Thế Mạng | Sói Hộ Vệ chọn target trong Hội đồng | Reaction sau án Treo hợp lệ, trước loại target/Win Check | 1 lần bảo kê target chọn trước | 1 lần Có/Không, chết thay cho lá khác bên mình | Không chặn nguồn kill khác; chết và lộ khi dùng |
| Skill đêm | Lộ theo ngưỡng chung | Mặc định không lộ source | `revealOnUseNumber` | `revealRule` theo action | Cần private/public payload đúng |

Trạng thái: **Đã chốt và đã đồng bộ vào prototype**.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Tiên tri soi và kết liễu đều luôn ẩn | Balance reasoning | Tiên tri có intel vĩnh viễn + kill không trả giá | Bỏ | Quá ít counter/risk |
| Chỉ lộ khi target chết thành công | Edge-case review với Bảo vệ | Khiên cho phép Tiên tri retry kín nhiều lần | Bỏ | Attempt gần như miễn phí |
| Lộ khi lệnh kết liễu resolve, dù bị chặn | Edge-case review | Chi phí được commit cùng lệnh | Giữ | Quyết định rõ và deterministic |
| Sói Hộ Vệ chọn target trước | Review flow Hội đồng | Tạo action phụ và trùng ngôn ngữ Bảo vệ | Bỏ | Reaction chết thay trực tiếp hơn |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Static documentation review | `rg` ADR/game-design/journey + `git diff --check` | Luật mới có timing, reveal, charge, target và edge case; diff sạch | Các nguồn mới đồng bộ; không có whitespace error | PASS |
| T-002 | Existing automated suite | `npm run check` | Không làm hỏng baseline hiện có | 3 workspace pass; engine 11/11 pass trên behavior cũ | PASS baseline; luật mới chưa được bao phủ |
| T-003 | Human playtest | Bộ 10 lá đối xứng | Đo được sức mạnh Tiên tri và Kẻ Thế Mạng | Chưa chạy | Chưa xác minh |
| T-004 | Automated regression | `node --test apps/spec-reviewer/game-flow-demo/engine.test.mjs` | Source đêm không leak; Tiên tri chỉ lộ khi kết liễu; Kẻ Thế Mạng dùng/không dùng đúng reaction | Suite tăng từ 11 lên 15 case, 15/15 pass | PASS |
| T-005 | Static UI check | `node --check apps/spec-reviewer/game-flow-demo/ui.mjs` | UI/bot dùng reaction mới và không còn preselect bảo kê | Exit 0 | PASS |

### Lệnh đã chạy

```bash
rg -n "Kẻ Thế Mạng|Sói Hộ Vệ|revealOnUseNumber|revealRule|kết liễu" CONTEXT.md docs apps/spec-reviewer/game-flow-demo
git diff --check
```

### Output quan trọng

```text
OK: 92 roles, 5 factions, 80 images
engine tests 15, pass 15, fail 0 sau implementation P0.1
All 3 workspace checks passed
git diff --check: exit 0
```

## Failure log

Feedback loop trước fix có **11/15 pass**: bốn regression mới fail vì `stageNight`/public payload còn leak source, Tiên tri chưa có reveal-on-execution và Hội đồng vẫn dùng preselection Sói Hộ Vệ. Sau fix: **15/15 pass**.

## Quyết định sau implementation

### Đã chốt

- Skill Ban đêm mặc định không tự làm lộ source.
- Tiên tri soi thường giữ kín; lệnh kết liễu làm lộ Tiên tri tại Bình minh kể cả khi bị chặn.
- Sói Hộ Vệ được thay bằng Kẻ Thế Mạng thuộc Phe Hắc Ám.
- Kẻ Thế Mạng chỉ phản ứng với Treo cổ hợp lệ, chỉ cứu lá khác bên mình và dùng một lần/trận.
- Target được chết thay vẫn lộ role vì án Treo cổ đã xác nhận đúng; reaction chỉ cứu mạng, không hoàn tác thông tin.
- Mọi án Treo hợp lệ dùng reaction window public giống nhau; chỉ người có Kẻ Thế Mạng hợp lệ mới thấy prompt riêng, tránh leak role qua timing.
- Hai reaction trong cùng Hội đồng được khóa kín trước rồi resolve cùng batch.

### Tạm giữ để test thêm

- Tiên tri không giới hạn lượt soi.
- Kẻ Thế Mạng được quyền từ chối mà không tiêu charge.

### Bị loại/revert

- Lộ source mọi skill đêm ở stage night.
- Sói Hộ Vệ chọn target bảo kê trước.
- Tiên tri chỉ lộ khi target chết thành công.

### Câu hỏi mở

- Khi prototype được sửa, reaction prompt cần timeout bao lâu và mặc định chọn Không hay không?
- Đối thủ nên thấy “đang chờ phản ứng” trung tính trong bao lâu để không suy ra Kẻ Thế Mạng?

## Ảnh hưởng

- Game design: information economy và hai role thay đổi.
- UI/UX: cần private reaction prompt và waiting state trung tính.
- Kỹ thuật: cần event `COUNCIL_REACTION_CHOICE`, reveal rule theo action và test mới.
- Data/analytics: nên đo số lần Tiên tri chọn kết liễu và tỷ lệ Kẻ Thế Mạng được dùng/từ chối.
- Scope/roadmap: thuộc GD-04, GD-05 và GD-06.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/engine.mjs`, `ui.mjs`, `engine.test.mjs`, `README.md`.
- Docs/ADR: `CONTEXT.md`, ADR-0001, core gameplay, game flow, roles draft, role evolution.
- Screenshot/video: Chưa có.
- Test report: Static review trong record này.
- Commit/PR: Chưa có.

## Bước tiếp theo

- [x] Implement reveal đêm và Tiên tri mới trong prototype — Developer — 30/08/2026.
- [x] Implement reaction Kẻ Thế Mạng và regression test — Developer — 30/08/2026.
- [ ] Human playtest bộ 10 lá — Game Designer/PO — sau browser smoke.

## Giới hạn bằng chứng

Automated test chứng minh state transition trong các case đã viết, chưa chứng minh balance hoặc trải nghiệm qua nhiều ván. Browser E2E riêng cho reaction Kẻ Thế Mạng chưa chạy.
