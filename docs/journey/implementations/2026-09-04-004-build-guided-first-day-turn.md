# 2026-09-04-004 — Build guided first Day turn

## Metadata

- Ngày: 04/09/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `a723c1f`
- Commit implementation: `0e97723`
- Conversation/task source: CONV-011
- Trạng thái: Hoàn thành trên working tree

## Yêu cầu

Tiếp tục player journey sau Match Intro bằng một gameplay shell có thể tương tác ở lượt Ban ngày đầu tiên. Sau khi hoàn tất lát này, commit và push toàn bộ thay đổi đang chờ trên nhánh hiện tại. Room, matchmaking và realtime backend vẫn nằm ngoài phạm vi.

## Trạng thái trước khi thay đổi

- Match Intro chuyển tới `/play/$id`, nhưng không có seam UX mock nên môi trường chưa có backend chỉ hiện màn chờ authoritative snapshot.
- Bàn gameplay đã render từ player view, nhưng chưa hướng dẫn người chơi mới theo chuỗi skill → source → target.
- Xạ thủ và Hồi sinh đầu trận có source nhưng không có target hợp lệ; CTA vẫn có thể trông khả dụng và dẫn tới picker rỗng.
- Card state dùng mã tiếng Anh như `ALIVE`, `HIDDEN`, `PROTECTION`.

## Giả thuyết

Nếu màn đầu trận chỉ mở những action có thể hoàn tất, đồng thời giải thích đúng ba bước chọn và xác nhận chuyển lượt, người chơi sẽ hiểu interaction grammar mà không cần đọc toàn bộ luật trước.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Route seam | `/play/$id` luôn mở session runtime | `preview=FIRST_TURN&seat=A|B` mở fixture player view; đường production vẫn giữ runtime cũ | `play.$id/route.tsx` | Cho UX flow chạy độc lập backend mà không sửa transport |
| Room handoff | Intro chỉ gửi tên | Intro gửi thêm seat và first-turn preview intent | `room.$id.tsx` | Giữ đúng vai A/B và nối flow liền mạch |
| First-turn fixture | Chưa có | Snapshot hợp lệ sau khi cả hai setup lock, Day A Vòng 1, role đối thủ masked | `features/game/preview/first-turn-preview.ts` | Tái dùng game-core thay vì tự chế state sai contract |
| Guided action | Chưa có | Coach notice, pending confirmation, Day B handoff và reset thử lại | `-FirstTurnPreview.tsx`, `-Prototype.GameBoard.tsx` | Dạy interaction grammar ngay trên bàn |
| Action eligibility | Chỉ kiểm source | Kiểm cả source và target trước khi bật Day skill | `game-action-model.ts`, `-Prototype.GameActionPanel.tsx` | Không cho người chơi đi vào nhánh chọn không thể hoàn tất |
| Presentation | Card state và pending copy còn technical | Dùng copy tiếng Việt; CTA/selection thống nhất rose accent | `-Prototype.GameCard.tsx`, `-Prototype.GameActionPanel.tsx`, `-Prototype.GameBoard.tsx` | Tăng khả năng đọc và giữ visual language pre-match |

## Thay đổi role/rule

Không có. Rule engine, ability eligibility authoritative, reveal/private boundary và phase transition không đổi. UI chỉ dùng thông tin target đã có trong filtered player view để vô hiệu CTA không thể hoàn tất.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Tiếp tục gọi session runtime khi chưa có backend | Theo flow cũ từ Intro | FAIL | Bỏ trong UX preview | Người review bị dừng ở authoritative snapshot, không tới gameplay |
| Cấm mọi chuỗi “Ma sói” trong SSR để test leak | Integration test đầu tiên | FAIL | Bỏ | Own board phải hiển thị role; assertion đã kiểm sai phạm vi |
| Kiểm mask theo card đối thủ cụ thể | Assert B1 có `Vai trò ẩn`, không có label role thật | PASS | Giữ | Khóa đúng privacy boundary mà vẫn cho self thấy role |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Automated unit | First-turn fixture | Day A, setup locked, viewer giữ nguyên, opponent role masked | 3 helper case pass | PASS |
| T-002 | Automated unit | Initial Day action eligibility | Shoot/Revive khóa; Mark/Purify mở | Kết quả đúng đủ bốn action | PASS |
| T-003 | SSR integration | `FirstTurnPreview` seat A/B | 20 card, guide đúng seat, impossible CTA disabled, B thấy observation state | 2 case pass | PASS |
| T-004 | Browser interaction | Seat A, chọn Đánh dấu báo thù → A8 → B3 | Chỉ A8 sáng ở source; 10 target B hợp lệ; xác nhận và sang Day B | Đúng expected; reset về guide Day A | PASS |
| T-005 | Browser journey | Room host mock → ready → countdown → intro → play | URL giữ room/name/seat và mở guide Day A | Tới `/play/ABC123?name=Minh&preview=FIRST_TURN&seat=A`, 20 card | PASS |
| T-006 | Responsive browser | Mobile viewport override | Không document overflow, action panel và guide nằm trong viewport | `innerWidth=433`, `scrollWidth=428`, panel 379px | PASS |
| T-007 | Full workspace sau rebase `28ebf7a` | `pnpm tf check` | 4/4 workspace pass | spec-reviewer 51, web 72 + typecheck/build, game-core 84, CLI pass | PASS |

### Lệnh đã chạy

```bash
pnpm --filter @twofold/web test
pnpm --filter @twofold/web typecheck
git diff --check
pnpm tf check
```

### Output quan trọng

```text
Web: 17 files, 72/72 tests passed
Typecheck: PASS
Full workspace: 4/4 PASS
spec-reviewer: 51 tests passed
game-core: 11 files, 84/84 tests passed
First action: A8 Kẻ báo thù → B3
Next phase: Ban ngày · Người chơi B hành động
Room handoff URL: /play/ABC123?name=Minh&preview=FIRST_TURN&seat=A
```

## Failure log

### F-001 — Privacy integration assertion cấm cả own role

- Build/commit/seed: working tree trước full check.
- Reproduction: chạy `pnpm --filter @twofold/web test` với assertion `html.not.toContain('Ma sói</strong>')`.
- Expected: test chứng minh role đối thủ không bị lộ.
- Actual: FAIL vì own board hợp lệ hiển thị hai role Ma sói.
- Root cause: Xác định; assertion quét toàn document thay vì opponent card boundary.
- Fix/decision: Assert `B1 · Vai trò ẩn` tồn tại và `B1 · Ma sói` không tồn tại.
- Verify lại trước rebase: PASS; web suite 17 files, 75/75. Sau khi chọn MIG-02 remote làm nguồn chuẩn và bỏ ba test migration local bị trùng, suite tích hợp còn 72/72 và vẫn PASS.
- Commit fix: Chưa commit.

### F-002 — Push bị từ chối vì remote đã có MIG-02 mới

- Reproduction: `git push` khi local còn dựa trên `a723c1f` nhưng remote đã tiến tới `28ebf7a`.
- Expected: fast-forward hai commit UX lên nhánh hiện tại.
- Actual: FAIL với `fetch first`; MIG-02 local chồng lên MIG-02 chính thức `20581b2` ở core, session, server và shared contract.
- Root cause: Xác định; Developer đã merge implementation outcome projection và command idempotency trong lúc UX đang được build.
- Fix/decision: Rebase lên `28ebf7a`, giữ MIG-02 remote làm nguồn chuẩn, bỏ replay/test/journey migration local bị trùng và chỉ chuyển UX/gameflow lên trên.
- Verify lại: PASS; không còn conflict marker, diff UX không chạm core/server/session/shared event contract và `pnpm tf check` đạt 4/4.
- Commit sau rebase: `0e97723`.

## Quyết định sau implementation

### Đã chốt

- UX preview dùng snapshot được tạo qua public game-core API và filtered player view.
- CTA Day skill chỉ mở khi có cả source và target hợp lệ.
- Người chơi A được hướng dẫn skill → source → target; sau submit UI xác nhận rồi chuyển sang trạng thái chờ Day B.
- Seat B thấy trạng thái quan sát, không được thao tác khi A đang active.
- Preview route không thay thế authoritative runtime và không thay đổi backend contract.

### Tạm giữ để test thêm

- Pending feedback 650ms và mức density của board cần human playtest.
- Mobile giữ hai dải card cuộn ngang để không làm card nhỏ hơn nữa.

### Bị loại/revert

- Assertion privacy trên toàn HTML.
- Cho phép mở một Day action khi target set rỗng.

### Câu hỏi mở

- Có nên tự động mô phỏng xong lượt A cho người vào bằng seat B để họ thử lượt của mình?
- Onboarding này chỉ hiện trận đầu hay có tùy chọn mở lại trong menu trợ giúp?

## Ảnh hưởng

- Game design: Không đổi rule.
- UI/UX: Player journey chạy được từ Home/Room tới thao tác Day A đầu tiên và trạng thái Day B.
- Kỹ thuật: Thêm fixture/presentation seam trong web; không chạm session machine, server, WebSocket hoặc shared event schema.
- Data/analytics: Chưa có event tracking.
- Scope/roadmap: UX-03 còn hoàn tất một vòng qua Night/Dawn, Result và rematch/create-new-room intent.

## File và artifact liên quan

- Code: `apps/web/app/features/game/preview/first-turn-preview.ts`, `apps/web/app/routes/play.$id/-FirstTurnPreview.tsx`, game action model/panel/board/card và route handoff.
- Docs/ADR: record này; journey index, conversation index, verification log và task tracker.
- Screenshot/video: browser screenshot của Day A desktop và mobile trong phiên QA.
- Test report sau rebase: full workspace 4/4; web 72/72; game-core 84/84; browser click-through PASS trước rebase và không thay đổi code UX trong lúc resolve.
- Commit/PR: `0e97723`.

## Bước tiếp theo

- [ ] Mở rộng fixture qua Day B → Night plan → Defense → Dawn Vòng 2 — UI/UX Game — lát kế tiếp.
- [ ] Nối UX state vào authoritative room/session — Developer — khi backend contract sẵn sàng.

## Giới hạn bằng chứng

Browser test dùng một fixture local và không resolve role action qua authoritative engine. Chưa có hai client thật, network/reconnect, keyboard-only/screen-reader audit hoặc human comprehension playtest. `AGENT.md` không tồn tại; implementation tuân theo `AGENTS.md` và các journey instructions hiện có.
