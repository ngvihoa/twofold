# 2026-08-30-002 — Nới chiều rộng sân gameplay

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `main`
- Commit trước khi làm: `51f454d`
- Commit implementation: cùng commit với record này
- Conversation/task source: owner phản hồi sân giữa quá chật theo chiều rộng và khối thông tin không nên chiếm một hàng dưới cùng
- Trạng thái: Bị thay thế bởi `2026-08-30-003-restore-two-column-gameplay.md` theo phản hồi trực tiếp của owner

## Yêu cầu

Cho gameplay tận dụng bề ngang màn hình, giữ sân giữa rộng ngay cả khi chưa có role lộ và không dành nguyên một hàng phía dưới cho hướng dẫn/lệnh hiện tại.

## Trạng thái trước khi thay đổi

- `.center-table.center-empty` bị co còn `88px`, khiến trung tâm giống một khe hẹp.
- `command-dock` là một hàng riêng rộng tối đa `760px` dưới arena, lấy chiều cao nhưng không hỗ trợ bố cục bàn.
- Hàng role đã lộ dùng 10 cột cố định tối đa `82px`, nên tụ lại ở giữa thay vì bám theo toàn chiều rộng.

## Giả thuyết

Giữ center table là vùng co giãn chính của CSS Grid, đưa command thành HUD nổi trong sân và cho revealed lane dùng cột `1fr` sẽ tạo cảm giác bàn đấu rộng mà không thay đổi gameplay state hay tương tác.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Arena layout | Block/flex, center empty co 88px | Grid 3 hàng, center `minmax(230px,1fr)` | `ui.css` | Sân giữa nhận toàn bộ không gian còn lại |
| Command HUD | Hàng riêng dưới arena, max 760px | HUD 390px nổi ở góc phải trong center table | `ui.css`, `ui.mjs` | Không chiếm một hàng gameplay |
| Revealed cards | Cột 62–82px, căn giữa | 10 cột `minmax(72px,1fr)` trải ngang | `ui.css` | Role trên sân dùng đúng bề rộng |
| Cache revision | `purge-flow-fix-v1` | `wide-arena-v1` | `ui.html` | Trình duyệt nhận CSS/JS mới |
| Responsive | Command luôn là dock dưới | Dưới 900px HUD quay về static | `ui.css` | Tránh overlay trên màn hình hẹp |

## Thay đổi role/rule

Không có. Đây là thay đổi layout/UI thuần túy.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Chỉ tăng width command dock | Static inspection | INCONCLUSIVE | Bỏ | Không giải quyết center table 88px và hàng riêng phía dưới |
| Center grid + HUD trong sân | Browser visual review ở trạng thái Ban ngày V1 | PASS | Giữ | Bàn giữa mở rộng, HUD không đẩy arena |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Static syntax | `node --check ui.mjs` | Không syntax error | Exit 0 | PASS |
| T-002 | Engine regression | `node --test game-flow-demo/engine.test.mjs` | Layout không ảnh hưởng rule | 6/6 pass | PASS |
| T-003 | Workspace integration/build | `npm run check` | Tất cả workspace xanh | 4/4 pass; spec-reviewer 14 test, web build, game-core 11 test | PASS |
| T-004 | Browser interaction | Setup → Bắt đầu Vòng 1 tại 1440×800 | Center arena rộng, command không còn ở hàng dưới | Center table chiếm gần toàn viewport ngang; HUD nằm trong sân bên phải | PASS |
| T-005 | Visual review | Screenshot trước/sau cùng viewport | Bố cục sau ít khoảng trống vô nghĩa | Sân giữa cao/rộng hơn; tay A/B giữ đủ 10 card | PASS |
| T-006 | Static diff | `git diff --check` | Không whitespace error | Exit 0 | PASS |

### Lệnh đã chạy

```bash
node --check apps/spec-reviewer/game-flow-demo/ui.mjs
node --test apps/spec-reviewer/game-flow-demo/engine.test.mjs
npm run check
git diff --check
```

## Failure log

Không có failure được quan sát trong phạm vi test đã chạy.

## Quyết định sau implementation

### Đã chốt

- Center table không được co thành khe mỏng khi chưa có role lộ.
- HUD hướng dẫn/lệnh không tạo một hàng layout riêng trên desktop.
- Role lộ dùng grid co giãn toàn chiều rộng.

### Tạm giữ để test thêm

- Vị trí HUD góc phải cần kiểm tra thêm khi Vòng muộn có nhiều role lộ đồng thời.

### Bị loại/revert

- Command dock rộng 760px nằm dưới arena.
- Revealed lane giới hạn card tối đa 82px và căn giữa.

### Câu hỏi mở

- Có cần cho HUD thu gọn thủ công khi người chơi muốn quan sát toàn sân không?

## Ảnh hưởng

- Game design: không đổi.
- UI/UX: sân rộng hơn, hierarchy chuyển từ “form dưới bàn” sang “HUD trên sân”.
- Kỹ thuật: chỉ thay markup vị trí command và CSS layout; state/event không đổi.
- Data/analytics: không đổi.
- Scope/roadmap: cần owner playtest ở ván có nhiều role lộ.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/ui.css`, `ui.mjs`, `ui.html`
- Docs/ADR: record này
- Screenshot/video: browser visual review trong phiên Codex, không commit artifact
- Test report: output T-001–T-006 trong phiên
- Commit/PR: cùng commit implementation

## Bước tiếp theo

- [ ] Owner chơi tới vòng có nhiều role lộ để đánh giá HUD có che card không — Owner — sau cập nhật

## Giới hạn bằng chứng

Visual review xác minh desktop 1440×800 ở setup và Ban ngày V1. Chưa human-playtest ở Vòng muộn và chưa visual-review trên thiết bị thật dưới 900px; responsive behavior mới được kiểm tra tĩnh qua CSS.

## Kết quả sau review owner

Owner không chọn phương án full-width/HUD nổi vì muốn quay lại bố cục hai cột và giữ thumbnail card nhỏ, ổn định. Implementation này được giữ làm bằng chứng phương án đã thử, nhưng CSS/markup của nó bị thay thế ngay ở record `003`.
