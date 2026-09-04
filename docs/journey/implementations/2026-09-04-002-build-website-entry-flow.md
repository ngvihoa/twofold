# 2026-09-04-002 - Build website entry flow

## Metadata

- Ngày: 04/09/2026
- Owner/Agent: Codex + UI/UX Game
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `a723c1f`
- Commit implementation: `0e97723`
- Conversation/task source: CONV-009 - bắt đầu build flow khi người chơi vào website
- Trạng thái: Hoàn thành lát entry đầu tiên trên working tree

## Yêu cầu

Build lát UX đầu tiên từ khi người chơi mở website: hiểu game, chọn tạo phòng hoặc vào bằng mã, nhận phản hồi validation/loading và chuyển sang trạng thái Room phù hợp. Room/matchmaking backend vẫn do Developer sở hữu.

## Trạng thái trước khi thay đổi

- Home dùng hai card Create/Join ngang cấp và thêm ba feature card giống nhau, nên quyết định chính chưa rõ.
- Copy còn nhắc “Tai Họa Vòng 7”, lệch flow Thanh trừng bắt đầu từ Vòng 6.
- Form bỏ qua tên/mã không hợp lệ mà không giải thích, loading chỉ có nhãn nút.
- Room luôn ghi người hiện tại là A, kể cả guest; màn setup xuất hiện khi đối thủ vẫn đang kết nối và countdown có thể chạy khi chưa đủ hai người.
- Home tải Google Fonts bên ngoài và header còn badge version không cần thiết.

## Giả thuyết

Một split entry rõ hierarchy, dùng artwork role thật và tách Room thành waiting/setup state sẽ giúp người mới biết hành động đầu tiên, hiểu mình đang chờ gì và không nhầm mock UI với gameplay đã bắt đầu.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Home hierarchy | Hai action card ngang nhau | Hero bất đối xứng + form create mặc định + đường chuyển join | `routes/index.tsx` | Một primary path rõ ràng |
| Visual | Gradient chữ và feature cards | Artwork Tiên tri/Ma sói/Bảo vệ có sẵn, một accent rose | Home + `app.css` | Khớp game, tránh fake visual |
| Input | Không có inline error | Chuẩn hóa tên/mã, helper, error, aria-invalid và loading | `features/entry/entry-flow.ts`, Home | Phản hồi đầy đủ và test được |
| Room state | Setup luôn hiện | Host vào waiting; guest thấy đủ hai seat rồi setup | `routes/room.$id.tsx` | Flow đúng thứ tự |
| Seat | Luôn ghi A | HOST=A, GUEST=B; vị trí card theo seat | Room route | Không sai identity trong UX |
| Header/font | Google Inter, gradient logo, Alpha badge | System font, single-accent wordmark, nav gọn | `__root.tsx`, `tailwind.config.js` | Giảm external dependency và nhiễu |

Mã room vẫn được sinh local để nối mock flow. Đây là fixture presentation, không phải room service hay matchmaking implementation.

## Thay đổi role/rule

Không có. Copy Home được sửa để không mô tả sai Thanh trừng; bộ 10 lá và gameplay runtime không đổi.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Hai create/join card ngang nhau | Audit Home cũ | INCONCLUSIVE | Bỏ | Không có primary path rõ |
| Entry split + form có state | Render desktop/mobile và đi route trực tiếp | PASS sau fix mobile | Giữ | CTA, form và visual cùng nằm trong viewport desktop |
| Ba cột metric trên mobile | Screenshot 390x844 lần đầu | FAIL | Bỏ | Cột thứ ba và headline bị cắt |
| Hai cột + dòng thứ ba full width | Screenshot lại 390x844 | PASS | Giữ | Không còn overflow quan sát được |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Automated unit | `pnpm --filter @twofold/web test` | Name/code normalization và existing suite pass | 14 files, 66/66 pass | PASS |
| T-002 | Static type | `pnpm --filter @twofold/web typecheck` | Không lỗi TypeScript/route | Exit 0 | PASS |
| T-003 | Visual desktop | Chrome 1440x1000 `/` | Hero/form rõ, không overflow | Đúng hierarchy, CTA/form trên viewport | PASS |
| T-004 | Visual mobile lần đầu | Chrome 390x844 `/` | Không cắt nội dung | Headline và metric thứ ba bị cắt | FAIL |
| T-005 | Visual mobile sau fix | Chrome 390x844 `/` | Không cắt nội dung | Headline, CTA và metric nằm trong viewport width | PASS |
| T-006 | Visual Room host | Chrome 1440x1000 `/room/ABC123?role=HOST&name=Minh` | Waiting state rõ | Có code, hai seat, copy CTA và trạng thái chờ | PASS |
| T-007 | Visual Room guest | Chrome 1440x1000 `/room/ABC123?role=GUEST&name=Lan` | Setup state đúng seat B | Hai seat và 10 card B1-B10 hiển thị đúng | PASS |
| T-008 | Full workspace | `pnpm tf check` | 4/4 workspace pass | Spec-reviewer 51, web 66, game-core 88; 4/4 pass | PASS |
| T-009 | Static diff | `git diff --check` | Không whitespace error | Không có output | PASS |

### Lệnh đã chạy

```bash
pnpm --filter @twofold/web test
pnpm --filter @twofold/web typecheck
git diff --check
npm run dev -- --host 127.0.0.1
Google Chrome --headless --window-size=1440,1000 --screenshot=... http://127.0.0.1:3000/
Google Chrome --headless --window-size=390,844 --screenshot=... http://127.0.0.1:3000/
pnpm tf check
```

### Output quan trọng

```text
Test Files 14 passed (14)
Tests 66 passed (66)
Typecheck exit 0
All 4 workspace checks passed
```

## Failure log

### F-001 - Home mobile overflow

- Build/commit/seed: working tree tại 04/09/2026
- Reproduction: mở `/` ở 390x844
- Expected: headline và ba metric nằm trong viewport width
- Actual: cuối headline và metric `8-15 phút` bị cắt
- Root cause: Xác định - font mobile quá lớn và grid ba cột quá chặt
- Fix/decision: giảm type scale/letter spacing mobile; metric dùng hai cột, mục thứ ba span full width
- Verify lại: PASS bằng screenshot 390x844
- Commit fix: Chưa commit

## Quyết định sau implementation

### Đã chốt

- Home mặc định ưu tiên tạo phòng; vào bằng mã là secondary path.
- Host vào waiting state, guest vào setup state khi đối thủ đã hiện diện trong mock flow.
- Validation local và UX state được implement; backend outcome vẫn là Developer handoff.
- Dùng một accent rose trên entry/room slice và artwork role hiện có.

### Tạm giữ để test thêm

- Nickname có tiếp tục tồn tại trong Alpha hay thay bằng profile.
- Host waiting sẽ nhận opponent state qua backend nào.
- Setup card trong Room hiện chỉ preview; reorder authoritative dùng runtime setup ở bước sau.

### Bị loại/revert

- Home hai card ngang hàng và ba feature card đồng dạng.
- Copy “Tai Họa Vòng 7”.

### Câu hỏi mở

- Có cần nút hướng dẫn luật ngắn ngay trên Home hay Role Atlas là đủ?
- Khi Developer nối room thật, error code nào được map thành message cho người chơi?

## Ảnh hưởng

- Game design: Không đổi luật.
- UI/UX: Có entry, validation, waiting và setup preview có thể review trực tiếp.
- Kỹ thuật: Thêm pure entry helpers/tests; không thêm API, WebSocket, room store hoặc matchmaking.
- Data/analytics: Chưa thêm analytics event.
- Scope/roadmap: UX-03 chuyển sang Đang làm; lát entry đã hoàn thành, gameplay/result còn tiếp tục.

## File và artifact liên quan

- Code: `apps/web/app/routes/index.tsx`, `room.$id.tsx`, `__root.tsx`, `features/entry/`, `styles/app.css`, `tailwind.config.js`.
- Docs/ADR: Player Journey & Screen/State Inventory v0.1; record này.
- Screenshot/video: `/private/tmp/twofold-entry-desktop.png`, `/private/tmp/twofold-entry-mobile-fixed.png`, `/private/tmp/twofold-room-host.png`, `/private/tmp/twofold-room-guest.png`.
- Test report: `docs/journey/verification-log.md`.
- Commit/PR: `0e97723`.

## Bước tiếp theo

- [ ] Nối opponent-present fixture vào transition Lobby → setup có thể click review — UI/UX Game.
- [ ] Hợp nhất setup preview với `GameSetupPanel` runtime mà không port room backend — UI/UX + Developer.
- [ ] Build countdown + Match Intro presentation state — UI/UX Game.

## Giới hạn bằng chứng

Screenshot chỉ chứng minh layout tại các viewport đã chụp. Chưa có browser automation click form, keyboard-only audit, screen-reader audit, Lighthouse hoặc human comprehension playtest. Host/opponent presence và room code vẫn là mock state.
