# 2026-09-04-003 — Build Room setup, countdown và Match Intro

## Metadata

- Ngày: 04/09/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `a723c1f`
- Commit implementation: `0e97723`
- Conversation/task source: CONV-010
- Trạng thái: Hoàn thành trên working tree

## Yêu cầu

Tiếp tục player journey sau lát Home/Room đầu tiên, chỉ xây gameflow và UX từ lúc hai người có mặt đến khi vào bàn chơi. Không triển khai room service, matchmaking, realtime transport hoặc user matching vì phần đó thuộc Developer.

## Trạng thái trước khi thay đổi

- Host chỉ có màn chờ tĩnh; guest thấy setup preview tĩnh.
- Người chơi chưa thể đổi vị trí 10 lá trong setup.
- Nút sẵn sàng chưa mô hình hóa trạng thái của cả hai người.
- Không có countdown có thể hủy hoặc Match Intro trước khi sang `/play/$id`.

## Giả thuyết

Một chuỗi state ngắn `WAITING → SETUP → COUNTDOWN → INTRO` cùng phản hồi trực tiếp trên từng thao tác sẽ giúp người chơi hiểu mình đang chờ ai, khi nào đội hình bị khóa và ai đi trước, mà không cần phụ thuộc backend room.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Room state | Host chờ tĩnh, guest setup tĩnh | Mock đối thủ xuất hiện, chuẩn bị và sẵn sàng theo timer có kiểm soát | `apps/web/app/routes/room.$id.tsx` | Prototype đầy đủ state UX mà không giả làm backend |
| Setup đội hình | 10 lá chỉ để xem | Chọn hai lá để đổi vị trí, giữ identity, có reset và khóa đội hình | `room.$id.tsx`, `features/entry/room-flow.ts` | Kiểm chứng tương tác setup cốt lõi |
| Ready coordination | Chưa có | Hiển thị ready từng seat; chỉ vào countdown khi cả hai đã ready | `room.$id.tsx` | Làm rõ điều kiện chuyển state |
| Countdown | Chưa có | Countdown 3 giây, có thể hủy để quay lại setup | `room.$id.tsx`, `room-flow.ts` | Cho người chơi một điểm quay lại trước khi khóa trận |
| Match Intro | Chưa có | Hiện seat, quyền đi trước và nhắc role đối thủ vẫn kín trước khi sang bàn chơi | `room.$id.tsx` | Nối lobby với gameplay bằng ngữ cảnh rõ ràng |
| Motion và responsive | Chưa có state transition | Transition ngắn, hỗ trợ reduced motion; seat cards xếp một cột ở mobile | `apps/web/app/styles/app.css`, `room.$id.tsx` | Dùng motion cho thay đổi state và tránh tràn ngang |
| QA fixture | Chưa có | Search param `preview=WAITING|SETUP|COUNTDOWN|INTRO` | `room.$id.tsx` | Chụp và review từng state ổn định |

## Thay đổi role/rule

Không có. Bộ bài, skill, reveal rule, timing gameplay và authoritative state không đổi. Đây là UX mock trước trận.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Hai seat card cùng hàng ở mobile | Chrome headless 390x844 | INCONCLUSIVE | Bỏ ở mobile | Ảnh headless trên màn Retina dùng viewport CSS sai và cắt khung; một cột vẫn dễ đọc hơn trên màn hẹp |
| Ép width bằng utility `w-full` + padding | Visual review | FAIL | Bỏ | Tín hiệu ảnh headless khó phân biệt overflow thật với device scaling |
| Viewport override trong in-app browser | Đo `innerWidth`/`scrollWidth`, chụp và tương tác | PASS | Giữ làm bằng chứng | Cho số đo DOM và breakpoint đáng tin cậy; `scrollWidth` không vượt viewport |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Automated unit | `room-flow.test.ts` | ID ổn định, swap bất biến input, invalid swap no-op, countdown 3→2→1→null | 4 case mới pass; web suite 69/69 | PASS |
| T-002 | Static/type | Web typecheck + `git diff --check` | Không lỗi TypeScript hoặc whitespace | Không lỗi | PASS |
| T-003 | Visual desktop | 1440x1000, fixture SETUP và INTRO | Hierarchy rõ, đủ 10 lá, intro nêu seat/quyền đi trước | Screenshot đạt tiêu chí | PASS |
| T-004 | Responsive browser | Viewport override mobile; COUNTDOWN | Không overflow; hai seat và toàn bộ copy nhìn thấy | `innerWidth=433`, `document.scrollWidth=428`; screenshot đạt tiêu chí | PASS |
| T-005 | Browser interaction | SETUP guest, đổi B1↔B4, ready, cancel | Identity đổi vị trí; vào countdown; hủy quay lại setup | B1 giữ `Lá B4`, B4 giữ `Lá B1`; hai transition đúng | PASS |
| T-006 | Full workspace | `pnpm tf check` | 4/4 workspace pass | Spec reviewer 51, web 69 + typecheck/build, CLI và game-core 88 đều pass | PASS |

### Lệnh đã chạy

```bash
pnpm --filter @twofold/web test
pnpm --filter @twofold/web typecheck
git diff --check
pnpm tf check
```

### Output quan trọng

```text
Web: 15 files, 69/69 tests passed
Typecheck: PASS
Responsive: innerWidth 433, document scrollWidth 428
Swap: B1 = Lá B4; B4 = Lá B1
Ready → countdown: true; cancel → setup: true
Full workspace: All 4 workspace checks passed
```

## Failure log

### F-001 — Ảnh mobile headless bị cắt sai tỷ lệ

- Build/commit/seed: working tree `a723c1f` + implementation hiện tại.
- Reproduction: Chrome headless `--window-size=390,844` trên màn Retina.
- Expected: viewport CSS 390px và toàn bộ UI nằm trong ảnh.
- Actual: ảnh 390px nhưng layout bị crop như đang dùng viewport CSS rộng hơn; screenshot lặp lại bất kể width container đổi.
- Root cause: Xác định ở mức công cụ: viewport/device scaling của Chrome headless trên host không khớp kích thước file ảnh; không phải overflow DOM của trang.
- Fix/decision: Dùng browser viewport override, đo `innerWidth`/`scrollWidth`, đồng thời giữ seat cards một cột dưới breakpoint `sm`.
- Verify lại: PASS; scroll width 428 nhỏ hơn inner width 433 và visual không bị cắt.
- Commit fix: Chưa commit.

## Quyết định sau implementation

### Đã chốt

- Setup dùng thao tác chọn hai lá để đổi chỗ; identity lá không đổi theo vị trí.
- Chỉ chuyển countdown khi cả hai seat đã ready; người chơi có thể hủy trước khi countdown kết thúc.
- Match Intro nói rõ seat và quyền đi trước, không lộ đội hình đối thủ.
- State đối thủ trong lát này chỉ là mock UX; contract realtime vẫn thuộc Developer.

### Tạm giữ để test thêm

- Timer mock 1,4–1,8 giây và countdown 3 giây cần human playtest về cảm giác nhịp.
- Transition tự động từ Intro sang bàn chơi giữ ở mức prototype.

### Bị loại/revert

- Hai seat card bắt buộc nằm cùng hàng trên màn hẹp.

### Câu hỏi mở

- Có cần cho host chỉnh luật/bộ bài trước khi ready ở Alpha hay dùng một preset duy nhất?
- Khi backend nối vào, trạng thái hủy ready trong những mili giây cuối countdown sẽ resolve theo server ra sao?

## Ảnh hưởng

- Game design: Không đổi luật.
- UI/UX: Hoàn tất phần pre-match từ đối thủ xuất hiện đến Match Intro.
- Kỹ thuật: Thêm pure helper/test; không chạm session runtime, WebSocket hoặc shared event contract.
- Data/analytics: Chưa có tracking.
- Scope/roadmap: UX-03 còn gameplay một vòng, Result và rematch/create-new-room intent.

## File và artifact liên quan

- Code: `apps/web/app/routes/room.$id.tsx`, `apps/web/app/features/entry/room-flow.ts`, `apps/web/app/features/entry/room-flow.test.ts`, `apps/web/app/styles/app.css`.
- Docs/ADR: record này; task tracker, conversation index và verification log được đồng bộ cùng implementation.
- Screenshot/video: `/private/tmp/twofold-setup-v2.png`, `/private/tmp/twofold-match-intro.png`; responsive browser screenshot trong phiên QA.
- Test report: output lệnh và browser metrics trong record này.
- Commit/PR: `0e97723`.

## Bước tiếp theo

- [ ] Build gameplay shell đầu trận và hướng dẫn hành động đầu tiên ở Day A — UI/UX Game — lát kế tiếp.
- [ ] Thay mock room state bằng authoritative room/realtime contract — Developer — khi backend sẵn sàng.

## Giới hạn bằng chứng

Automated test chỉ bao phủ helper thuần; browser interaction là một luồng guest fixture. Chưa có keyboard-only/screen-reader audit, hai browser thật, latency/reconnect, analytics hoặc human playtest. Visual review không chứng minh game dễ hiểu hoặc nhịp chờ phù hợp.

Repository không có `AGENT.md` tại thời điểm làm; implementation tuân theo `AGENTS.md`, journey README, working method và entry liên quan gần nhất.
