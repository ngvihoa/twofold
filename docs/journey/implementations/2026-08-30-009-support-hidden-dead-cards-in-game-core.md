# 2026-08-30-009 — Hỗ trợ bài chết nhưng còn ẩn trong game-core

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `main`
- Commit trước khi làm: `7842b33`
- Commit implementation: Commit chứa record này
- Conversation/task source: Người dùng yêu cầu tiếp tục sau khi chốt lát bàn giao DEV-02A–D
- Trạng thái: Hoàn thành

## Yêu cầu

Tiếp tục task DEV-02A: cho authoritative card model biểu diễn bài đã chết nhưng vẫn úp theo ADR-0004, đồng thời giữ đúng visibility khi hồi sinh.

## Trạng thái trước khi thay đổi

- `CardRuntimeState` cấm `DEAD + HIDDEN` ở type level.
- `ELIMINATE` luôn đổi visibility thành `REVEALED`.
- `REVIVE` luôn trả card về `ALIVE + REVEALED`.
- `REVEAL` luôn tạo `ALIVE + REVEALED`, nên reveal một xác chết có thể hồi sinh ngoài ý muốn.
- `handleHangAction` dựa vào side effect tự reveal của `ELIMINATE` để công khai target đoán đúng.

## Giả thuyết

Tách lifecycle khỏi visibility và buộc các rule cần công khai gọi `REVEAL` rõ ràng sẽ bảo vệ information economy, tránh các transition vô tình lộ role hoặc hồi sinh card.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Runtime state | Union cấm `DEAD + HIDDEN` | `life` và `visibility` là hai trục độc lập | `packages/game-core/src/cards.ts` | Thực thi ADR-0004 |
| Eliminate | Luôn reveal | Giữ visibility, dọn effects | `packages/game-core/src/cards.ts` | Cái chết không đồng nghĩa công khai role |
| Revive | Luôn public | Giữ visibility, dọn effects | `packages/game-core/src/cards.ts` | Hồi sinh không phải nguồn intel miễn phí |
| Reveal | Ép card thành alive | Chỉ đổi visibility, giữ lifecycle | `packages/game-core/src/cards.ts` | Tránh hồi sinh ngoài ý muốn |
| Treo cổ đúng | Chỉ gọi eliminate | Gọi reveal rồi eliminate | `packages/game-core/src/engine.ts` | Treo cổ có rule công khai riêng |
| Unit tests | Chỉ test dead/revive public | Test hidden, public và reveal xác chết | `packages/game-core/src/cards.test.ts` | Khóa ba invariant mới |

## Thay đổi role/rule

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Cái chết bài úp | Eliminate tự lộ | Eliminate giữ visibility | Không phân biệt nguyên nhân | Rule công khai phải gửi `REVEAL` riêng | Giữ thông tin ẩn theo ADR-0004 |
| Hồi sinh | Tự lộ target | Giữ visibility trước khi chết | Witch revive cung cấp intel | Không thay đổi information state | Phù thủy không làm lộ bài úp |
| Treo cổ đúng | Lộ gián tiếp qua eliminate | Reveal rõ ràng rồi eliminate | Kết quả giống nhau nhưng phụ thuộc side effect | Rule lộ được encode rõ | Không đổi UX hiện tại |

Trạng thái: `Đã chốt cho prototype` theo ADR-0004; production serializer v0.2 vẫn chưa triển khai.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Chỉ mở union cho `DEAD + HIDDEN` | Xem transition hiện tại | FAIL | Bỏ | Eliminate/revive/reveal vẫn phá invariant |
| Thêm flag vào `ELIMINATE` | Đối chiếu deep-module boundary | INCONCLUSIVE | Bỏ | Trộn lifecycle command với disclosure rule |
| Giữ transition orthogonal, compose `REVEAL` ở rule Treo cổ | Unit test card và legacy engine | PASS | Giữ | Transition nhỏ, rõ và tái sử dụng được |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Unit, red | Game-core trước implementation | Hidden card bị eliminate vẫn hidden | Nhận `DEAD + REVEALED` | FAIL — expected |
| T-002 | Unit, green | Game-core sau implementation | Hidden/public lifecycle giữ visibility; reveal corpse giữ dead | 16/16 test pass | PASS |
| T-003 | Automated workspace check | `npm run check` | Toàn monorepo pass | 4/4 workspace pass; spec-reviewer 16 test, game-core 16 test, web typecheck/build pass | PASS |

### Lệnh đã chạy

```bash
npm run test --workspace @twofold/game-core
npm run check
```

### Output quan trọng

```text
Test Files  3 passed (3)
Tests       16 passed (16)
All 4 workspace checks passed!
```

## Failure log

### F-001 — Hidden elimination vẫn reveal ở test đỏ

- Build/commit/seed: `7842b33`
- Reproduction: eliminate một card khởi tạo `ALIVE + HIDDEN`
- Expected: `DEAD + HIDDEN`
- Actual: `DEAD + REVEALED`
- Root cause: Xác định — `ELIMINATE` hard-code visibility `REVEALED`
- Fix/decision: Giữ visibility hiện tại trong eliminate/revive và tách `REVEAL`
- Verify lại: PASS, 16/16 game-core tests
- Commit fix: Commit chứa record này

## Quyết định sau implementation

### Đã chốt

- Lifecycle event không được tự thay đổi visibility.
- Disclosure phải được encode bằng `REVEAL` ở rule layer.
- Treo cổ đoán đúng vẫn công khai role qua explicit composition.

### Tạm giữ để test thêm

- Legacy shared-types vẫn dùng `CardStatus.DEAD`; serializer v0.2 sẽ tách `alive` và `revealed` ở DEV-02C.

### Bị loại/revert

- Không thêm flag reveal vào `ELIMINATE`.

### Câu hỏi mở

- Event contract nào sẽ diễn đạt nguyên nhân chết công khai mà không lộ role? Thuộc DEV-02D.

## Ảnh hưởng

- Game design: Thực thi information rule đã chấp nhận, không thêm rule mới.
- UI/UX: Có thể render dead-hidden khi serializer v0.2 được nối.
- Kỹ thuật: Card transition orthogonal; engine legacy vẫn giữ Treo cổ công khai.
- Data/analytics: Không thay đổi.
- Scope/roadmap: DEV-02A hoàn thành; DEV-02B còn phụ thuộc GD-08.

## File và artifact liên quan

- Code: `packages/game-core/src/cards.ts`, `packages/game-core/src/engine.ts`
- Docs/ADR: ADR-0004, migration plan, development plan, task tracker
- Screenshot/video: Không có
- Test report: `packages/game-core/src/cards.test.ts`
- Commit/PR: Commit chứa record này

## Bước tiếp theo

- [ ] GD-08 — Game Designer/PO — chốt tạm phase timing sau 3–5 trận
- [ ] DEV-02B — Developer — phase spine sau GD-08
- [ ] DEV-02C — Developer — player-view serializer có thể bắt đầu sau DEV-02A

## Giới hạn bằng chứng

Unit test chứng minh card transition và legacy Treo cổ, nhưng chưa chứng minh public/private serializer, UI render dead-hidden, full Night resolution hoặc human comprehension.
