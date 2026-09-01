# 2026-08-30-005 — Tách dải sân và ghim tay bài xuống đáy

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `main`
- Commit trước khi làm: `bafc53d`
- Commit implementation: cùng commit với record này
- Conversation/task source: owner phản hồi guide giữa sân đang che bài, tay bài phe mình chiếm không gian giữa và bài đã lên bàn chưa đủ rõ
- Trạng thái: Hoàn thành implementation; còn giới hạn human playtest ghi bên dưới

## Yêu cầu

Giữ layout gameplay hai cột nhưng tổ chức lại cột game: tay đối thủ ở trên, sân công khai có vùng rõ ràng, tay người chơi nằm sát đáy màn hình. Hướng dẫn và diễn biến vẫn ở giữa hai phe nhưng không được phủ lên card trên bàn.

## Trạng thái trước khi thay đổi

- `.command-dock` dùng `position: absolute` tại tâm `.center-table`, nên có thể che card công khai và khiến vùng giữa khó đọc.
- `.arena` chỉ có `height: 100%`, không có các hàng layout cố định; tay người chơi không được ghim xuống đáy.
- Hai revealed lane chia đôi sân nhưng không dành chỗ thật trong flow cho hướng dẫn/action.

## Giả thuyết

Ba dải layout thật — phe B, diễn biến, phe A — sẽ làm trạng thái trên bàn dễ đọc hơn overlay. Grid ba hàng ở cấp arena sẽ dùng hết chiều cao gameplay và ghim tay người chơi xuống đáy mà không cần phóng to card.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Sân công khai | 2 hàng, guide phủ tuyệt đối ở tâm | 3 hàng: lane B, guide/action, lane A | `ui.css` | Card trên bàn luôn có vùng riêng |
| Guide/action | `position: absolute` và translate | Grid item trong flow, rộng tối đa 520px | `ui.css` | Không che card công khai |
| Arena dọc | Không phân hàng | `auto / minmax(250px, 1fr) / auto` | `ui.css` | Tay B ở đầu, bàn co giãn giữa, tay A sát đáy |
| Empty/setup state | Dựa trên cấu trúc hai hàng cũ | Empty dùng ba hàng; setup giữ cấu trúc hai hàng riêng | `ui.css` | Không làm hỏng bước chuẩn bị |
| Mobile fallback | Arena thừa hưởng grid desktop | Trở lại `display: block` dưới 900px | `ui.css` | Tránh ép viewport nhỏ vào layout desktop |
| Cache revision | `play-clarity-v1` | `table-lanes-v1` | `ui.html` | Nạp CSS mới |

## Thay đổi role/rule

Không đổi role, timing, target, charge hoặc kết quả game. Đây chỉ là thay đổi presentation/layout.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Guide overlay tuyệt đối giữa sân | Browser visual ở implementation 004 | FAIL UX | Bỏ | Che/ép vùng card công khai và khó hiểu thứ bậc |
| Ba dải grid có guide trong flow | Browser setup → Vòng 1 → A7 tác động B1 | PASS | Giữ | A7 hiện ở lane dưới, guide ở lane giữa, không chồng nhau |
| Phóng to card để tăng độ rõ | Đánh giá phạm vi | Không thử | Bỏ | Owner yêu cầu không zoom thumbnail; vấn đề là layout, không phải kích thước card |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Static syntax | `node --check ui.mjs` | Không syntax error | Exit 0 | PASS |
| T-002 | Engine regression | `node --test engine.test.mjs` | Không đổi rule | 6/6 pass | PASS |
| T-003 | Browser interaction + visual | Viewport 1440×800, setup → Bắt đầu V1 | Tay A sát đáy; guide giữa sân không che hai lane | Tay A ở đáy; guide có dải riêng giữa lane B/A | PASS |
| T-004 | Browser interaction + visual | A7 Kẻ báo thù chọn B1, chờ presentation | Card lộ trên bàn rõ, không bị guide che | A7 nằm trong lane A phía dưới; guide/action nằm ở hàng giữa | PASS |
| T-005 | Static diff | `git diff --check` | Không whitespace error | Exit 0 | PASS |
| T-006 | Workspace integration/build | `npm run check` | Tất cả workspace xanh | 4/4 pass; spec-reviewer 14 test, web typecheck/build, game-core 11 test | PASS |
| T-007 | Late-game density | Nhiều card đồng thời lộ ở cả hai phe | Không chồng/overflow | Chưa chơi tới late game | CHƯA XÁC MINH |

### Lệnh đã chạy

```bash
node --check apps/spec-reviewer/game-flow-demo/ui.mjs
node --test apps/spec-reviewer/game-flow-demo/engine.test.mjs
npm run check
git diff --check
```

## Failure log

### F-001 — Guide ở giữa nhưng vẫn che sân

- Build/commit/seed: `bafc53d`, `play-clarity-v1`
- Reproduction: vào gameplay ở viewport desktop và quan sát guide tuyệt đối trên `.center-table`
- Expected: hướng dẫn gần hành động nhưng card công khai vẫn có vùng đọc rõ
- Actual: guide phủ trực tiếp lên khoảng giữa hai revealed lane; tay A không nằm sát đáy
- Root cause: giải pháp trước chỉ di chuyển guide bằng absolute positioning, chưa thay cấu trúc layout của arena
- Fix/decision: biến sân thành grid ba dải và arena thành grid ba hàng
- Verify lại: PASS ở browser với A7 đã lộ trong lane dưới
- Commit fix: cùng commit với record này

## Quyết định sau implementation

### Đã chốt

- Hướng dẫn/diễn biến là một dải thật trong flow, không phải overlay lên card.
- Phe B công khai ở dải trên; phe A công khai ở dải dưới.
- Tay người chơi ở sát đáy viewport desktop.
- Không thay đổi kích thước thumbnail/card trong iteration này.

### Tạm giữ để test thêm

- Chiều cao tối thiểu 330px của center table.
- Chiều rộng tối đa 520px của guide/action.

### Bị loại/revert

- Overlay tuyệt đối cho guide giữa sân.

### Câu hỏi mở

- Khi 5–10 card cùng lộ, mỗi lane nên cuộn ngang, co card hay chuyển sang hai hàng?

## Ảnh hưởng

- Game design: không đổi.
- UI/UX: tăng phân cấp không gian giữa tay bài, diễn biến và card công khai.
- Kỹ thuật: chỉ thay CSS layout và cache revision.
- Data/analytics: không đổi.
- Scope/roadmap: cần human playtest ở late game để chốt mật độ card.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/ui.css`, `ui.html`
- Docs: record 004 và record này
- Screenshot/video: browser visual review trong phiên Codex, không commit artifact
- Commit/PR: cùng commit implementation

## Bước tiếp theo

- [ ] Owner chơi tới late game và xác nhận mật độ card ở hai lane — Owner — sau cập nhật

## Giới hạn bằng chứng

Đã browser-verify viewport desktop, setup, bắt đầu Vòng 1 và một card A7 được đưa lên lane công khai. Chưa browser-verify mobile hoặc trạng thái late game với nhiều card lộ đồng thời.
