# 2026-08-30-003 — Khôi phục gameplay hai cột

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `main`
- Commit trước khi làm: `c5ffb98`
- Commit implementation: cùng commit với record này
- Conversation/task source: owner yêu cầu quay lại layout hai cột giống ban đầu; trái là game, phải là hướng dẫn và lịch sử; không phóng thumbnail
- Trạng thái: Hoàn thành

## Yêu cầu

Thay phương án full-width/HUD nổi bằng layout desktop hai cột rõ ràng. Game nằm bên trái; lịch sử công khai và hướng dẫn/thao tác nằm bên phải. Card thumbnail phải giữ kích thước nhỏ cố định.

## Trạng thái trước khi thay đổi

- Arena chiếm toàn viewport và command HUD nổi trong center table.
- Card hàng tay và hàng role lộ dùng cột `1fr`, nên tự phóng theo chiều rộng.
- History panel tồn tại trong code nhưng không được render.

## Giả thuyết

Khôi phục seam hai cột từ lịch sử prototype sẽ cho hierarchy dễ hiểu hơn: board là vùng chơi ổn định, side rail là vùng thông tin. Giới hạn card ở `82px` ngăn thumbnail bị zoom khi viewport rộng.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Desktop grid | Một cột full-width | `minmax(0,1fr) 300px` | `ui.css` | Tách game và thông tin |
| Card sizing | 10 cột `1fr` | 10 cột `62–82px`, căn giữa | `ui.css` | Không zoom thumbnail |
| Side rail | Không render | History trên, command/hướng dẫn dưới | `ui.mjs`, `ui.css` | Đúng mental model cũ |
| Move replay | Không nằm trong command dock | Trở lại cùng action stack bên phải | `ui.mjs` | Hành động được trình bày tại vùng thông tin |
| Responsive | Desktop HUD overlay | Dưới 900px side rail xếp dọc, command lên trước history | `ui.css` | Không ép cột 300px trên mobile |
| Cache revision | `wide-arena-v1` | `two-column-v1` | `ui.html` | Tránh cache layout cũ |

## Thay đổi role/rule

Không có.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Full-width + HUD nổi | Visual review và owner feedback | FAIL theo preference owner | Bỏ | Không đúng layout mong muốn; thumbnail bị kéo lớn |
| Hai cột từ lịch sử code | Khôi phục có chọn lọc, giữ logic game mới | PASS | Giữ | Đúng cấu trúc game trái, info phải |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Static syntax | `node --check ui.mjs` | Không syntax error | Exit 0 | PASS |
| T-002 | Engine regression | `node --test engine.test.mjs` | Không ảnh hưởng game rule | 6/6 pass | PASS |
| T-003 | Browser interaction | Setup → Bắt đầu Vòng 1, desktop 1440×800 | Game trái; history + guide phải | Đúng hai cột; cả 10 card hiển thị; nút Bỏ lượt ở guide | PASS |
| T-004 | Visual review | Screenshot Ban ngày V1 | Thumbnail không stretch | Card giữ max 82px, không zoom | PASS |
| T-005 | Workspace integration/build | `npm run check` | Tất cả workspace xanh | 4/4 pass; spec-reviewer 14 test, web typecheck/build, game-core 11 test | PASS |
| T-006 | Static diff | `git diff --check` | Không whitespace error | Exit 0 | PASS |

## Failure log

Không có failure code được quan sát; phương án `002` bị loại do không khớp preference layout của owner.

## Quyết định sau implementation

### Đã chốt

- Desktop dùng hai cột: game trái, thông tin phải.
- Card thumbnail không co giãn vượt `82px`.
- History luôn hiện trên guide trong side rail.

### Tạm giữ để test thêm

- Tỷ lệ 300px của side rail có thể tinh chỉnh sau human playtest, nhưng không đổi card size.

### Bị loại/revert

- Full-width arena với HUD nổi.
- Card grid dùng `1fr` làm thumbnail phóng to.

### Câu hỏi mở

- Không có trong phạm vi layout này.

## Ảnh hưởng

- Game design: không đổi.
- UI/UX: hierarchy quay lại bố cục game/info hai cột.
- Kỹ thuật: render lại `historyMarkup()` và `moveReplayMarkup()`; state không đổi.
- Data/analytics: không đổi.
- Scope/roadmap: owner có thể tiếp tục playtest trên layout quen thuộc.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/ui.css`, `ui.mjs`, `ui.html`
- Docs/ADR: record `002` và `003`
- Screenshot/video: browser visual review trong phiên Codex, không commit artifact
- Commit/PR: cùng commit implementation

## Bước tiếp theo

- [ ] Owner tiếp tục playtest game flow trên layout hai cột — Owner — sau cập nhật

## Giới hạn bằng chứng

Browser review mới xác minh desktop 1440×800 ở Ban ngày V1. Chưa visual-review trạng thái Vòng muộn có lịch sử dài, nhiều role lộ hoặc màn hình dưới 900px.
