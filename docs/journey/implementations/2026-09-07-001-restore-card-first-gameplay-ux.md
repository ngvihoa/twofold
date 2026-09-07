# 2026-09-07-001 — Khôi phục gameplay UX chọn lá trước

## Metadata

- Ngày: 07/09/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `53748be`
- Commit implementation: Chưa commit
- Conversation/task source: CONV-012
- Trạng thái: Hoàn thành trên working tree

## Yêu cầu

Sau khi tự chơi guided Day A trên web, PO phản hồi UX chọn skill toàn cục trước rồi mới chọn source không thể chơi được và yêu cầu quay lại interaction cũ. Outcome cần giữ là chọn trực tiếp lá có skill khả dụng, sau đó chọn mục tiêu.

## Trạng thái trước khi thay đổi

- Tất cả card đều bị khóa khi phase bắt đầu.
- Khu lệnh hiển thị một nút cho từng skill; người chơi phải chọn skill, chọn source rồi mới chọn target.
- Guided copy cũng dạy luồng skill → source → target.
- Kiểm tra Git xác nhận behavior này đã tồn tại ở runtime baseline trước commit nối Room vào first-turn preview; không có bằng chứng merge conflict đã đổi riêng interaction.

## Giả thuyết

Nếu card có action hợp lệ tự phát sáng và click card tự suy ra skill theo role/phase, người chơi sẽ bắt đầu action ngay trên vật thể trung tâm của game, giảm một bước chọn dư và khớp mental model của prototype đã được PO chấp nhận.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Day action | Chọn nút skill → source → target | Chọn card source đang sáng → target | `-Prototype.GameActionPanel.tsx` | Khôi phục card-first interaction |
| Night action | Chọn nút Ma sói/Tiên tri/Phù thủy → source → target | Chọn card role đang sáng → target | `-Prototype.GameActionPanel.tsx` | Giữ cùng interaction grammar xuyên phase |
| Defense action | Chọn nút Đặt khiên → Bảo vệ → target | Chọn Bảo vệ đang sáng → target | `-Prototype.GameActionPanel.tsx` | Bỏ bước CTA trùng ý nghĩa với card |
| Action không có source | Nằm cùng skill picker | Huyết Nguyệt và pass vẫn ở khu lệnh | `-Prototype.GameActionPanel.tsx` | Không ép action đặc biệt vào card không tồn tại |
| Guided copy | Dạy skill → source → target | Dạy card → target | `-FirstTurnPreview.tsx` | Copy và interaction thực tế phải thống nhất |
| Regression coverage | Khóa CTA skill khả dụng/không khả dụng | Khóa card source khả dụng và cấm skill picker quay lại | First-turn/board tests | Giữ behavior qua các lần đồng bộ sau |

## Thay đổi role/rule

Không có. Ability eligibility, target rule, resource, reveal/privacy, command contract và engine resolution không đổi. Đây chỉ là thay đổi interaction ở `apps/web`.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Rollback toàn commit guided first turn | So sánh lịch sử Git và phạm vi commit | INCONCLUSIVE về UX, rủi ro mất Room handoff/fixture | Bỏ | Skill-first đã có ở baseline; rollback không khôi phục đúng UX |
| Sửa interaction có mục tiêu | Chuyển IDLE card set thành source hợp lệ và suy ra action từ card | PASS | Giữ | Không chạm core/server/MIG-02 |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Red regression | SSR `FirstTurnPreview` seat A | A8/A9 bật, A7 khóa, không có nút skill toàn cục | Test fail trước fix vì prompt/card state còn skill-first | PASS làm bằng chứng red |
| T-002 | Focused automated | First-turn test sau fix | 2 case pass | 2/2 pass | PASS |
| T-003 | Web suite | `pnpm --filter @twofold/web test` | Không regression | 17 files, 72/72 pass | PASS |
| T-004 | TypeScript | `pnpm --filter @twofold/web typecheck` | Route generation và typecheck pass | PASS | PASS |
| T-005 | Browser interaction | Day A, A8 → B3 | A8/A9 sáng; A8 mở 10 target; B3 submit và sang Day B | Đúng expected | PASS |
| T-006 | Full workspace | `pnpm tf check` | 4/4 workspace pass | spec-reviewer 51, web 72, game-core 84, CLI pass | PASS |

### Lệnh đã chạy

```bash
pnpm --filter @twofold/web exec vitest run 'app/routes/play.$id/-FirstTurnPreview.test.tsx'
pnpm --filter @twofold/web typecheck
pnpm --filter @twofold/web test
pnpm tf check
```

### Output quan trọng

```text
Focused: 1 file, 2/2 tests passed
Web: 17 files, 72/72 tests passed
Typecheck: PASS
Browser: A8 selected → B3 selected → Day B
Full workspace: 4/4 PASS
```

## Failure log

### F-001 — Runtime mở bằng skill picker thay vì card-first

- Build/commit/seed: `53748be`, first-turn preview seat A.
- Reproduction: mở `/play/87E4QW?name=haha&preview=FIRST_TURN&seat=A`.
- Expected: card A8/A9 sáng và click được ngay.
- Actual: toàn bộ card bị disabled; khu lệnh bắt chọn nút Đánh dấu báo thù hoặc Thanh tẩy trước.
- Root cause: Xác định; state `IDLE` trả selectable set rỗng và chỉ CTA skill mới chuyển sang `DAY_SOURCE`.
- Fix/decision: `IDLE` tự xác định source card theo phase và click source chuyển thẳng sang target state.
- Verify lại: PASS bằng SSR regression, web suite, typecheck và browser click-through.
- Commit fix: Chưa commit.

## Quyết định sau implementation

### Đã chốt

- Skill gắn với role card dùng card-first interaction ở Day, Night và Defense.
- Khu lệnh chỉ giữ hướng dẫn, pass và action đặc biệt không có source card.
- Chỉ card có cả source và target hợp lệ mới phát sáng.

### Tạm giữ để test thêm

- Độ mạnh của ring/hover và việc có cần hiện tên skill ngay trên card.

### Bị loại/revert

- Skill picker toàn cục cho Day/Night/Defense.
- Rollback toàn commit guided first turn.

### Câu hỏi mở

- Nếu một card có nhiều skill cùng phase trong tương lai, picker nhỏ nên xuất hiện cạnh card hay trong battlefield?

## Ảnh hưởng

- Game design: Không đổi.
- UI/UX: Giảm source selection từ ba bước còn hai bước; card trở lại là điểm bắt đầu action.
- Kỹ thuật: Thay state derivation/presentation trong runtime web, không chạm engine/shared/server.
- Data/analytics: Chưa có.
- Scope/roadmap: UX-03 giữ hướng card-first cho các phase tiếp theo.

## File và artifact liên quan

- Code: `apps/web/app/routes/play.$id/-Prototype.GameActionPanel.tsx`, `-FirstTurnPreview.tsx` và test liên quan.
- Docs/ADR: Record này, journey index, conversation index, verification log và task tracker.
- Screenshot/video: Trang local được kiểm tra trực tiếp trong in-app browser.
- Test report: full workspace 4/4; 72/72 web test; typecheck pass; browser interaction pass.
- Commit/PR: Chưa có.

## Bước tiếp theo

- [ ] Human playtest lại Day A bằng A8 và A9 — PO — khi review trên browser đang mở.
- [ ] Áp dụng card-first trong fixture Night/Defense/Dawn tiếp theo — UI/UX Game — lát UX-03 kế tiếp.

## Giới hạn bằng chứng

Browser test mới xác minh fixture Day A bằng một client. Night và Defense đã dùng cùng state derivation nhưng chưa có click-through fixture; chưa có keyboard-only, screen-reader hoặc human comprehension test.
