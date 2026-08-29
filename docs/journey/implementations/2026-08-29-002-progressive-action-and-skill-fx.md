# 2026-08-29-002 — Trình diễn hành động tuần tự và hiệu ứng kỹ năng

## Metadata

- Ngày: 29/08/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `9b6bc4b`
- Commit implementation: Commit chứa record này
- Conversation/task source: Chuỗi feedback trực tiếp trên local playtest về nhịp Bình minh, lượt A/B, reveal và hiệu ứng kỹ năng
- Trạng thái: Hoàn thành implementation, chuẩn bị deploy

## Yêu cầu

Làm các hành động Ngày, Đêm và Bình minh diễn ra tuần tự, đủ chậm để người chơi hiểu lá nào đang hành động, nhắm vào đâu, vì sao bị lộ hoặc chết. Card mới lộ phải di chuyển lên sân thay vì đổi vị trí tức thời. Tiên tri, Bảo vệ, Mục sư, Xạ thủ và Hội đồng cần hiệu ứng riêng, có thể hiểu mà không phụ thuộc hoàn toàn vào log.

## Trạng thái trước khi thay đổi

- Bình minh áp dụng nhiều thay đổi state gần như cùng lúc, khiến reveal, chết và lý do chết xuất hiện bất ngờ.
- Lượt của hai bên có thể chồng animation hoặc chuyển pha trước khi người chơi đọc xong.
- Card reveal được render ở vị trí mới ngay lập tức; người chơi không thấy đường đi từ tay lên sân.
- Combat có feedback chung nhưng soi, bảo vệ, thanh tẩy, bắn và treo cổ chưa có ngôn ngữ hình ảnh riêng đủ rõ.

## Giả thuyết

Một presentation queue chỉ thay đổi phần hiển thị, áp state thật sau từng nhịp A → B, kết hợp card ghost di chuyển giữa hai tọa độ và effect riêng theo loại kỹ năng, sẽ làm nguyên nhân–kết quả dễ đọc hơn mà không đổi luật engine.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Trình diễn lượt | Dispatch rồi render kết quả gần như tức thời | Lưu `beforeState`/`resolvedState`, trình diễn source rồi outcome, khóa thao tác trong lúc chạy | `apps/spec-reviewer/game-flow-demo/ui.mjs` | Tách rõ lựa chọn và kết quả |
| Thứ tự hai bên | A/B có thể xuất hiện sát hoặc chồng nhau | Action Ngày, staging Đêm và Hội đồng chạy tuần tự A → B | `ui.mjs` | Người chơi theo dõi được bên nào vừa đi |
| Bình minh | Một overlay chung rồi áp nhiều kết quả | Có opening, từng step reveal/result và trạng thái complete “Trời đã sáng” | `ui.mjs`, `ui.css` | Báo trước lúc game đang công bố và chưa cho action |
| Card reveal | Card biến mất ở vị trí cũ và xuất hiện trên sân | Clone card thành ghost, vẽ đường đi và animate tới đúng slot trên sân | `ui.mjs`, `ui.css` | Làm chuyển trạng thái không còn instant |
| Hiệu ứng kỹ năng | Chủ yếu dùng combat trail chung | Thêm soi/scan, khiên, thánh ấn, muzzle flash, phán quyết/treo cổ và trạng thái target tương ứng | `ui.mjs`, `ui.css` | Mỗi kỹ năng có feedback dễ nhận biết |
| Cache revision | `setup-guidance-v1` | `skill-fx-v2` | `ui.html` | Trình duyệt tải đúng JS/CSS mới |

## Thay đổi role/rule

Không thay đổi rule, charge, timing engine hoặc target hợp lệ của role. Đây là thay đổi **Prototype UI/UX** cho cách trình diễn các action hiện có.

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Tiên tri | Kết quả soi hiện nhanh | Có beam, lens và scan trước kết quả | Không đổi | Không đổi | Dễ nhận ra nguồn và target soi |
| Bảo vệ | Khiên được ghi nhận bằng state/log | Có dome/ripple trên target | Không đổi | Không đổi | Dễ thấy target đang được bảo hộ |
| Mục sư | Thanh tẩy dùng feedback combat chung | Có holy sigil và lý do phản tác dụng | Không đổi | Không đổi | Làm rõ trường hợp chọn nhầm phe Dân |
| Xạ thủ | Bắn dùng projectile chung | Có muzzle flash và đường đạn riêng | Không đổi | Không đổi | Dễ phân biệt với cắn/độc |
| Hội đồng | Voter và verdict có thể xuất hiện sát nhau | Từng voter lộ lần lượt, sau đó mới hiện treo cổ/phán quyết | Không đổi | Không đổi | Tăng khả năng đọc tiến trình vote |

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Chỉ kéo dài delay giữa các phase | Tăng timeout nhưng giữ render state cuối | FAIL | Bỏ | Card vẫn “teleport”; delay không giải thích được diễn biến |
| Animation trực tiếp trên card sau render | Render destination rồi animate class tại chỗ | INCONCLUSIVE | Bỏ làm cách chính | Không thể hiện rõ card đi từ slot cũ tới slot mới |
| Ghost card + đo origin/destination | Clone node trước render, đo hai rect rồi chạy fixed-position ghost | PASS | Giữ | Quan sát được card đang ở giữa đường |
| Hiệu ứng dùng chung cho mọi skill | Dùng combat trail/projectile | INCONCLUSIVE | Giữ làm fallback | Không đủ ngữ nghĩa cho soi, khiên và treo cổ |
| Effect riêng theo `lastMove.kind` | Render lớp FX tương ứng inspect/defend/purify/shoot/accuse | PASS một phần | Giữ | Bảo vệ được xác minh trực quan; các effect còn lại cần playtest đầy đủ |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Static syntax | `node --check apps/spec-reviewer/game-flow-demo/ui.mjs` | Module hợp lệ | Không có lỗi syntax | PASS |
| T-002 | Automated workspace check | `npm run check` | Tất cả workspace check qua | 3/3 package qua; spec reviewer báo 92 roles, 5 factions, 80 images | PASS |
| T-003 | Formatting/static diff | `git diff --check -- ...` | Không có whitespace error | Không có output lỗi | PASS |
| T-004 | Browser interaction | Local server, người A đấu bot B | Khi reveal, card hiện ghost đang di chuyển từ slot cũ tới sân | Ghost và path tồn tại ở giữa animation; ảnh chụp cho thấy card giữa đường | PASS |
| T-005 | Browser interaction + visual review | Chọn Bảo vệ, target A5 | Target có khiên rõ ràng, source/target được highlight | `.shield-dome`, `.fx-guard-source`, `.fx-defended` cùng xuất hiện; visual đúng | PASS |
| T-006 | Browser interaction | Chạy chuỗi Bình minh | Thao tác bị khóa, step công bố tuần tự, kết thúc bằng “Trời đã sáng” | State presentation chuyển tuần tự và mở lại thao tác sau complete | PASS |
| T-007 | Visual review | Bắt timing hiệu ứng Tiên tri/Mục sư | Chụp được effect đang chạy | Automation trượt qua cửa sổ effect ở lần thử | INCONCLUSIVE |
| T-008 | Human playtest | Feedback trực tiếp của owner | Nhịp đủ dễ theo dõi | Bản mới rõ hơn nhưng owner đánh giá tổng thời lượng hiện tại quá chậm | FAIL về calibration |

### Lệnh đã chạy

```bash
node --check apps/spec-reviewer/game-flow-demo/ui.mjs
npm run check
git diff --check -- apps/spec-reviewer/game-flow-demo/ui.css apps/spec-reviewer/game-flow-demo/ui.html apps/spec-reviewer/game-flow-demo/ui.mjs
```

### Output quan trọng

```text
OK: 92 roles, 5 factions, 80 images
[spec-reviewer] OK
[cli] OK
[game-core] OK
All 3 workspace checks passed!
```

## Failure log

### F-001 — Nhịp trình diễn hiện tại chậm hơn mong muốn

- Build/commit/seed: working tree `skill-fx-v2`
- Reproduction: chơi một action có source reveal, theo dõi card travel và effect outcome
- Expected: toàn bộ nhịp chính khoảng 3 giây theo feedback mới nhất
- Actual: card travel đang dùng 4,2 giây; một số presentation timeout còn dài hơn để chờ effect
- Root cause: timing được tăng mạnh để chứng minh card thực sự di chuyển và effect không bị chồng
- Fix/decision: Giữ nguyên cho lần deploy “trước”; tạo bước tiếp theo để scale timing về khoảng 3 giây
- Verify lại: Chưa chạy vì owner yêu cầu deploy trước
- Commit fix: Chưa có

### F-002 — Automation bỏ lỡ cửa sổ effect Tiên tri/Mục sư

- Build/commit/seed: local browser, bot timing tự động
- Reproduction: chờ theo timeout cố định rồi query DOM effect
- Expected: query đúng lúc `.seer-*`/`.holy-sigil` còn tồn tại
- Actual: query xảy ra sau khi presentation đã sang step kế tiếp
- Root cause: Test dựa trên wall-clock, chưa có hook deterministic cho presentation queue
- Fix/decision: Ghi `Chưa xác minh` thay vì suy diễn PASS; thêm debug/test hook nếu prototype tiếp tục phát triển
- Verify lại: Chưa chạy
- Commit fix: Chưa có

## Quyết định sau implementation

### Đã chốt

- Presentation phải tuần tự và tách source khỏi outcome.
- Reveal card cần có chuyển động từ vị trí cũ lên sân.
- Bình minh phải báo đang hé lộ, khóa action, rồi xác nhận “Trời đã sáng”.
- Skill khác loại cần feedback hình ảnh khác nhau.

### Tạm giữ để test thêm

- Ghost travel 4,2 giây và các timeout dài đang là baseline kỹ thuật, không phải timing cuối.
- Presentation queue vẫn thuộc UI prototype, chưa chuyển vào engine.

### Bị loại/revert

- Delay dài nhưng state vẫn đổi tức thời.
- Một combat effect chung cho mọi loại kỹ năng.

### Câu hỏi mở

- Scale toàn bộ presentation về 3 giây nên áp cho từng step hay cho cả source + outcome?
- Có cần nút bỏ qua/nhấn để tiếp tục sau khi người chơi đã quen animation?
- Test hook nào phù hợp để browser test có thể chờ đúng presentation stage thay vì timeout cố định?

## Ảnh hưởng

- Game design: Không đổi luật; làm rõ thứ tự công bố đang được prototype sử dụng.
- UI/UX: Motion và feedback kỹ năng trở thành phần chính của cách đọc trận đấu.
- Kỹ thuật: Thêm presentation state/queue ở UI, nhiều timer và DOM overlay.
- Data/analytics: Chưa có telemetry về thời gian đọc hoặc skip animation.
- Scope/roadmap: Cần một vòng calibration về khoảng 3 giây trước khi coi timing ổn định.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/ui.mjs`
- Style: `apps/spec-reviewer/game-flow-demo/ui.css`
- Entry/cache revision: `apps/spec-reviewer/game-flow-demo/ui.html`
- Docs: record này
- Screenshot/video: Có screenshot local trong phiên Codex, chưa lưu vào repo
- Test report: Bảng test trong record này
- Commit/PR: Commit chứa record này; PR/merge deploy sẽ bổ sung qua Git history

## Bước tiếp theo

- [ ] Rút nhịp trình diễn chính về khoảng 3 giây — Codex — sau lần deploy này
- [ ] Browser-verify deterministic Tiên tri, Mục sư, Xạ thủ và Hội đồng — Codex — sau khi calibration
- [ ] Human playtest lại một vòng Ngày → Đêm → Bình minh — Owner — sau bản timing 3 giây

## Giới hạn bằng chứng

Static/workspace check không chứng minh animation dễ hiểu hoặc cân bằng. Visual review mới xác minh trực tiếp card travel và Bảo vệ; Tiên tri, Mục sư, Xạ thủ và Hội đồng chưa được review đầy đủ trên một ván deterministic. Feedback “quá chậm” là đánh giá của owner trong phiên, chưa có đo thời lượng hoàn thành ván hay dữ liệu nhiều người chơi.
