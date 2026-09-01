# 2026-09-01-005 — Fuzz invalid action và atomic rejection P0.7

## Metadata

- Ngày: 01/09/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `b6a345d`
- Commit implementation: Chờ commit
- Conversation/task source: CONV-006 — tiếp tục phase sau P0.6
- Trạng thái: Hoàn thành prototype

## Yêu cầu

Hoàn tất P0.7: fuzz action sai trên các state có thể đạt được và xác minh engine từ chối atomically, không mutation object state do caller giữ.

## Trạng thái trước khi thay đổi

P0.6 chỉ sinh action hợp lệ. `dispatch` có kiến trúc clone-before-transition nhưng chưa có regression chứng minh action malformed, sai phase/seat, rematch sớm hoặc replay submission không làm state đầu vào thay đổi.

## Giả thuyết

Kiểm tra qua public seam `dispatch(state, action)` trên state tạo bởi full-match simulator sẽ chứng minh atomicity độc lập với private validator; corpus theo phase và replay action vừa dùng giúp bao phủ cả rejection trước lẫn sau validation sâu.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Atomic assertion | Không có | Snapshot state trước/sau rejection, giữ `Infinity`/`NaN` | `simulator.mjs` | Bắt mutation ngoài ý muốn |
| Invalid corpus | Không có | Unknown type, wrong phase/seat, malformed payload, early rematch | `simulator.mjs` | Bao phủ validation boundary |
| Replay | Chưa fuzz | Replay mọi valid action trên next state phải reject | `simulator.mjs` | Bắt double-submit/retry |
| Regression | 40 test | Thêm 200 full-match invalid fuzz | `simulator.test.mjs` | Chạy thường xuyên |
| CLI | Chỉ valid fuzz | Thêm `--invalid-count=<n>` | `fuzz.mjs`, README | Audit tái chạy được |

## Thay đổi role/rule

Không có. Engine behavior không cần sửa; phase này khóa contract kỹ thuật của `dispatch`.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Test private validator từng function | Review seam | INCONCLUSIVE | Bỏ | Coupled implementation, không chứng minh caller state |
| Public `dispatch` + reachable state | TDD integration-style | PASS | Giữ | Đúng contract người gọi quan sát |
| JSON snapshot mặc định | Review charge `Infinity` | Thiếu chính xác | Bỏ | JSON đổi `Infinity` thành `null` |
| Snapshot có sentinel số đặc biệt | 200-seed audit | PASS | Giữ | So sánh được state hiện tại |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | TDD red | Import `fuzzInvalidActions` | Capability chưa tồn tại | ESM missing export | PASS red evidence |
| T-002 | Automated integration fuzz | 200 seed `p07-invalid-*` | Reject atomic trên đủ phase | 3/3 simulator test pass | PASS |
| T-003 | Extended invalid audit | 200 seed `p07-audit-*` | Không accepted-invalid/mutation | 76.991 rejection, đủ 12 phase | PASS |
| T-004 | CLI smoke | 20 valid + 20 invalid seed | JSON có invalid summary | 7.881 rejection, đủ 12 phase | PASS |

### Lệnh đã chạy

```bash
node --test apps/spec-reviewer/game-flow-demo/simulator.test.mjs
node --input-type=module -e '<import fuzzInvalidActions và chạy 200 seed>'
npm run fuzz:game --workspace=@twofold/spec-reviewer -- --count=20 --invalid-count=20 --prefix=p07-cli-check
```

### Output quan trọng

```text
Red: SyntaxError — simulator.mjs does not provide export fuzzInvalidActions
Green: simulator tests 3, pass 3, fail 0
Audit: games=200, rejections=76991, phases=12/12
```

## Failure log

### F-001 — Chưa có invalid-action fuzz capability

- Build/commit/seed: `b6a345d`, TDD tracer test.
- Reproduction: import và gọi `fuzzInvalidActions` từ simulator test.
- Expected: chạy corpus action sai qua public dispatch seam.
- Actual: ESM báo missing export.
- Root cause: Xác định — P0.6 chỉ implement valid-action simulation.
- Fix/decision: thêm atomic assertion, mutation corpus và seeded runner; không đổi engine.
- Verify lại: PASS 200 seed/76.991 rejection.
- Commit fix: Chờ commit.

## Quyết định sau implementation

### Đã chốt

- `dispatch` rejection phải không mutation state input.
- Regression thường chạy 200 seed invalid corpus.
- Test chỉ qua public seam, không mock/private-validator assertion.

### Tạm giữ để test thêm

- Corpus hiện là mutation có chủ đích theo phase, chưa phải arbitrary byte/object fuzzing.

### Bị loại/revert

- Không sửa engine khi test xác nhận clone-before-dispatch đã đáp ứng contract.

### Câu hỏi mở

- Event schema multiplayer sẽ trả error code ổn định nào thay vì chỉ message tiếng Việt?

## Ảnh hưởng

- Game design: không đổi.
- UI/UX: không đổi.
- Kỹ thuật: khóa atomic rejection/double-submit contract.
- Data/analytics: CLI chỉ in aggregate.
- Scope/roadmap: QA-01 có thêm validation robustness local; network replay/desync vẫn mở.

## File và artifact liên quan

- Code: `simulator.mjs`, `simulator.test.mjs`, `fuzz.mjs`.
- Docs/ADR: README demo, verification log, task tracker.
- Screenshot/video: Không áp dụng.
- Test report: record này và verification log.
- Commit/PR: Chờ commit.

## Bước tiếp theo

- [ ] P0.8 event replay/deterministic state digest local — Developer — phase kế nếu tiếp tục local hardening.
- [ ] P1 stable validation error codes — Developer — khi tách authoritative engine.

## Giới hạn bằng chứng

Không fuzz object cực lớn, getter/proxy, prototype pollution hoặc process-level resource exhaustion. Không có network concurrency thật; replay hiện là tuần tự trên engine local.
