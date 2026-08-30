# 2026-08-30-007 — Thêm hoạt cảnh chia bài đối xứng khi vào ván

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `main`
- Commit trước khi làm: `46d0039`
- Commit implementation: cùng commit với record này
- Conversation/task source: owner yêu cầu lúc mới vào có hiệu ứng xếp bài như chia bài; tay đối thủ phải chạy theo góc nhìn ngược lại
- Trạng thái: Hoàn thành implementation; cần owner cảm nhận tốc độ trên máy thật

## Yêu cầu

Tạo một nhịp mở màn có cảm giác dealer chia bài: tay người chơi xuất hiện từ trái sang phải, tay đối thủ xuất hiện theo chiều ngược lại trên màn hình. Motion phải đẹp nhưng không che hướng dẫn, không lặp lại khi gameplay render và Reset phải phát lại được.

## Trạng thái trước khi thay đổi

- Cả 20 lá xuất hiện đồng thời ngay khi trang render.
- Không có tín hiệu không gian cho hai góc nhìn đối diện.
- Reset tạo deck mới nhưng không có transition mở ván.

## Giả thuyết

Chia xen kẽ hai phe với stagger ngắn, hướng trượt/nghiêng đối xứng và spring landing nhẹ sẽ tạo cảm giác bắt đầu một ván bài mà không làm chậm setup. Giới hạn motion dưới 2 giây giữ được tiết tấu nhanh.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Thứ tự chia A | Tất cả hiện cùng lúc | A1 → A10, trái sang phải | `ui.mjs`, `ui.css` | Đúng hướng đọc của người chơi |
| Thứ tự chia B | Tất cả hiện cùng lúc | B10 → B1, phải sang trái trên màn hình | `ui.mjs`, `ui.css` | Mô phỏng góc nhìn đối diện |
| Nhịp hai phe | Không có | Xen kẽ lệch 55ms, mỗi bước cách 110ms | `ui.css` | Giống dealer chia qua lại thay vì hai hàng fade đồng thời |
| Quỹ đạo | Không có | A đi từ trái/dưới; B đi từ phải/trên; nghiêng đối xứng và đáp nhẹ | `ui.css` | Có hướng, trọng lượng và chiều sâu |
| Interaction | Có thể thao tác ngay | Arena tạm khóa 1.95 giây rồi tự mở | `ui.mjs`, `ui.css` | Tránh click/drag nhầm giữa motion |
| Lifecycle | Không có | Chỉ chạy khi load/reset; body class được gỡ không cần rerender | `ui.mjs` | Không replay khi đổi state gameplay |
| Accessibility | Không có motion riêng | Bỏ hẳn deal animation/pointer lock khi `prefers-reduced-motion` bật | `ui.mjs`, `ui.css` | Không tạo 1.95 giây chờ vô hình cho người giảm chuyển động |
| Cache revision | `hidden-night-death-v1` / `table-lanes-v1` | `opening-deal-v1` | `ui.html` | Nạp JS/CSS mới |

## Thay đổi role/rule

Không có. Motion không thay đổi deck order, setup state, timing game hoặc thông tin công khai.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Hai bên fade đồng thời | Design audit trước code | Không thử | Bỏ | Không truyền đạt hướng chia và góc nhìn |
| Hai bên chia xen kẽ, đối xứng | Browser DOM + screenshot giữa chuỗi | PASS | Giữ | A8/B3 cùng trong transition theo hai hướng ngược |
| Nhãn nổi “Đang chia bài” giữa sân | Browser visual giữa chuỗi | FAIL UX | Bỏ | Che nút khóa và cạnh tranh với motion; bản thân card đã đủ kể trạng thái |
| Chạy lại trên mọi render | Lifecycle review | Không thử | Bỏ | Sẽ gây giật khi đổi state hoặc sắp xếp card |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Static syntax | `node --check ui.mjs` | Không syntax error | Exit 0 | PASS |
| T-002 | Engine regression | `node --test engine.test.mjs` | Motion không đổi rule | 8/8 pass | PASS |
| T-003 | Browser DOM | 180ms sau load | A index 0→9; B index 9→0; hai keyframe khác nhau | A1=0…A10=9; B1=9…B10=0; own/opponent animation đúng | PASS |
| T-004 | Browser visual | 620ms sau Reset | Hai phe đang được chia xen kẽ theo hướng đối xứng | A6 và B5/B4 ở giữa quỹ đạo; các lá trước đã đáp xuống | PASS |
| T-005 | Browser lifecycle | Sau 2.3 giây | Arena mở lại, animation không chạy tiếp | body bỏ `dealing-cards`; animation-name về `none`; lock enabled | PASS |
| T-006 | Browser reset | Click Reset | Deal animation phát lại đúng một lần | Screenshot giữa chuỗi có motion mới | PASS |
| T-007 | Workspace integration/build | `npm run check` | 4 workspace xanh | 4/4 pass; spec-reviewer 16 test, web typecheck/build, game-core 11 test | PASS |
| T-008 | Static diff | `git diff --check` | Không whitespace error | Exit 0 | PASS |
| T-009 | Human UX | Owner xem animation trên máy thật | Nhịp “hay” nhưng không chậm | Chưa owner playtest | CHƯA XÁC MINH |

### Lệnh đã chạy

```bash
node --check apps/spec-reviewer/game-flow-demo/ui.mjs
node --test apps/spec-reviewer/game-flow-demo/engine.test.mjs
git diff --check
```

### Output quan trọng

```text
Own deal index: A1=0 ... A10=9
Opponent deal index: B1=9 ... B10=0
Animation: deal-card-own / deal-card-opponent
After 1.95s: body no longer has dealing-cards
```

## Failure log

### F-001 — Nhãn trạng thái che CTA setup

- Build/commit/seed: local `opening-deal-v1`, setup mặc định
- Reproduction: Reset, chụp screenshot ở 620ms
- Expected: motion chia bài là focus chính; CTA vẫn đọc được
- Actual: hộp “Đang chia bài” nằm trực tiếp trên nút “Khóa thứ tự 10 lá”
- Root cause: status dùng fixed center trong khi setup panel cũng đặt CTA ở tâm
- Fix/decision: xóa status box; giữ arena pointer lock và motion card làm tín hiệu duy nhất
- Verify lại: PASS — screenshot 620ms không còn vật thể che setup panel
- Commit fix: cùng commit với record này

## Quyết định sau implementation

### Đã chốt

- Người chơi được chia trái → phải; đối thủ được chia phải → trái trên màn hình.
- Hai phe chia xen kẽ thay vì đồng thời.
- Motion mở ván dưới 2 giây và chỉ chạy khi load/reset.
- Không thêm overlay hoặc modal giải thích motion.

### Tạm giữ để test thêm

- Stagger 110ms, lệch hai phe 55ms và duration 720ms.
- Arena lock 1.95 giây.

### Bị loại/revert

- Nhãn “Đang chia bài” ở giữa sân.

### Câu hỏi mở

- Có nên thêm âm thanh lá bài rất nhẹ sau khi owner chốt visual motion không?

## Ảnh hưởng

- Game design: không đổi.
- UI/UX: thêm nhịp mở màn và biểu đạt góc nhìn hai phe.
- Kỹ thuật: thêm một lifecycle flag/timer và CSS transform/opacity animations.
- Data/analytics: không đổi.
- Scope/roadmap: polish cho local playtest; chưa phải animation production cuối.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/ui.mjs`, `ui.css`, `ui.html`
- Docs/ADR: record này; không cần ADR vì không đổi luật/architecture
- Screenshot/video: browser visual review ở 620ms, không commit artifact
- Test report: engine regression và workspace check ghi trong record
- Commit/PR: cùng commit implementation

## Bước tiếp theo

- [ ] Owner xác nhận tốc độ/độ nảy sau khi xem trực tiếp — Owner — sau cập nhật

## Giới hạn bằng chứng

Đã kiểm tra desktop viewport và lifecycle load/reset. Chưa kiểm tra cảm nhận trên thiết bị chậm, mobile overflow hoặc human playtest có bật `prefers-reduced-motion`.
