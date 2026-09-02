# 2026-09-02-001 — Thêm deterministic event replay và state digest P0.8

## Metadata

- Ngày: 02/09/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `d2678dc`
- Commit implementation: `d548a63`
- Conversation/task source: CONV-006 — tiếp tục phase sau P0.7
- Trạng thái: Hoàn thành prototype

## Yêu cầu

Hoàn tất P0.8: record action stream của full match, replay deterministic từ cùng seed và phát hiện state divergence tại đúng event bằng canonical digest.

## Trạng thái trước khi thay đổi

P0.6 có deterministic policy và P0.7 có atomic rejection, nhưng simulator chỉ giữ 20 trace gần nhất. Không có transcript đầy đủ, state digest hoặc replay verifier để chứng minh cùng seed + cùng action tạo cùng state qua từng transition.

## Giả thuyết

Nếu mỗi accepted action được ghi cùng digest của full authoritative state ngay sau transition, replay có thể dừng ở event đầu tiên bị lệch thay vì chỉ so kết quả cuối trận.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Transcript | Trace cuối 20 event | Toàn bộ accepted action + post-state digest | `simulator.mjs` | Replay đầy đủ |
| Canonical state | JSON thường | Sort object key, type-tag và giữ `Infinity`/`NaN` | `stateDigest` | Digest ổn định local |
| Digest | Không có | FNV-1a 64-bit hex | `simulator.mjs` | So sánh gọn, deterministic |
| Replay | Không có | `replayGame(seed, events)` qua public `dispatch` | `simulator.mjs` | Kiểm tra event stream |
| Divergence | Chỉ biết final state khác | Báo event index, expected và actual digest | `replayGame` | Khoanh vùng desync |
| Audit/CLI | Không có | 200 replay regression; `--replay-count` | Test/CLI/README | Tái chạy được |

## Thay đổi role/rule

Không có. Đây là contract kỹ thuật local cho deterministic state transition; chưa định nghĩa wire protocol multiplayer.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Chỉ so final result/winner | Review P0.6 | Không đủ | Bỏ | Có thể lệch giữa trận rồi hội tụ kết quả |
| Digest `JSON.stringify` trực tiếp | Review object/number | Không canonical | Bỏ | Phụ thuộc key order, mất số đặc biệt |
| Canonical serialize + digest mỗi event | Round-trip/divergence tests | PASS | Giữ | Xác định event đầu tiên lệch |
| Cryptographic hash | Scope review | Chưa cần | Tạm bỏ | Digest dùng phát hiện lỗi, không dùng security/signature |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | TDD red | Import replay/digest | Capability chưa tồn tại | ESM missing `replayGame` | PASS red evidence |
| T-002 | TDD green | `p08-replay` | Replay final digest trùng record/state | Trùng | PASS |
| T-003 | TDD red | Sửa digest giữa transcript | Throw đúng event | Không throw | PASS red evidence |
| T-004 | TDD green | Thêm per-event check | Báo index/expected/actual | Đúng expected | PASS |
| T-005 | TDD red | Import `fuzzReplays` | Audit capability chưa có | ESM missing export | PASS red evidence |
| T-006 | Replay audit | 200 seed `p08-audit-*` | Không divergence | 15.665 event, divergence 0 | PASS |
| T-007 | CLI smoke | 20 valid + 20 replay seed | JSON replay summary | 1.497 event, divergence 0 | PASS |

### Lệnh đã chạy

```bash
node --test --test-name-pattern='recorded action stream' apps/spec-reviewer/game-flow-demo/simulator.test.mjs
node --test --test-name-pattern='replay reports' apps/spec-reviewer/game-flow-demo/simulator.test.mjs
node --test --test-name-pattern='200 recorded matches' apps/spec-reviewer/game-flow-demo/simulator.test.mjs
node --input-type=module -e '<import fuzzReplays và chạy 200 seed>'
npm run fuzz:game --workspace=@twofold/spec-reviewer -- --count=20 --replay-count=20 --prefix=p08-cli-check
```

### Output quan trọng

```text
Red 1: simulator.mjs does not provide export replayGame
Red 2: Missing expected exception at changed event 34
Red 3: simulator.mjs does not provide export fuzzReplays
Audit: games=200, events=15665, maxEvents=132, divergences=0
```

## Failure log

### F-001 — Replay capability chưa tồn tại

- Build/commit/seed: `d2678dc`, `p08-replay`.
- Reproduction: import `replayGame`/`stateDigest` từ simulator test.
- Expected: record và replay action stream.
- Actual: ESM missing export.
- Root cause: Xác định — P0.6 chỉ lưu trace ngắn để debug.
- Fix/decision: lưu full transcript và thêm canonical digest/replay.
- Verify lại: PASS round-trip.
- Commit fix: `d548a63`.

### F-002 — Replay không kiểm tra digest kỳ vọng

- Build/commit/seed: working tree P0.8 slice 1, `p08-divergence`.
- Reproduction: sửa digest event giữa transcript thành zero digest rồi replay.
- Expected: throw tại event bị đổi.
- Actual: replay hoàn tất không báo lỗi.
- Root cause: Xác định — slice đầu chỉ dispatch lại action, chưa so digest từng event.
- Fix/decision: so actual/expected digest sau mỗi transition và dừng tại lệch đầu tiên.
- Verify lại: PASS, báo đúng event 34.
- Commit fix: `d548a63`.

## Quyết định sau implementation

### Đã chốt

- Transcript local gồm seed và chuỗi `{ action, digest }`.
- Digest bao phủ full engine state, kể cả private notes/log/charges.
- Replay fail-fast ở event divergence đầu tiên.
- Regression thường replay 200 trận.

### Tạm giữ để test thêm

- FNV-1a 64-bit đủ cho bug detection prototype, không phải bảo đảm chống collision.

### Bị loại/revert

- Không chỉ so final winner/result.

### Câu hỏi mở

- Multiplayer digest nên bao phủ authoritative full state hay tách public/private digest theo recipient?

## Ảnh hưởng

- Game design: không đổi.
- UI/UX: không đổi.
- Kỹ thuật: có nền tảng event replay/desync localization local.
- Data/analytics: transcript hiện chỉ ở memory; chưa lưu user data.
- Scope/roadmap: QA-01 hoàn thành local replay/digest; còn transport và hai client thật.

## File và artifact liên quan

- Code: `simulator.mjs`, `simulator.test.mjs`, `fuzz.mjs`.
- Docs/ADR: README demo, verification log, task tracker.
- Screenshot/video: Không áp dụng.
- Test report: record này và verification log.
- Commit/PR: `d548a63`.

## Bước tiếp theo

- [ ] P0.9 public/private digest và transcript redaction — Developer — phase kế nếu tiếp tục local hardening.
- [ ] P1 serialize/persist authoritative event envelope — Developer — khi dựng room/state sync.

## Giới hạn bằng chứng

Replay chạy cùng runtime/code version và không chứng minh backward compatibility qua deploy. Digest không phải chữ ký bảo mật. Chưa có persistence, packet reorder/duplication hoặc hai process/client thật.
