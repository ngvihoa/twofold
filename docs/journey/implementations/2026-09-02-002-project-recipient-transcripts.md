# 2026-09-02-002 — Project recipient transcript và digest P0.9

## Metadata

- Ngày: 02/09/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `2422665`
- Commit implementation: Chờ commit
- Conversation/task source: CONV-006 — tiếp tục phase sau P0.8
- Trạng thái: Hoàn thành prototype

## Yêu cầu

Hoàn tất P0.9: tách transcript/digest authoritative khỏi payload dành cho public, A và B; không để action commit kín hoặc raw state hash làm lộ thông tin đối thủ.

## Trạng thái trước khi thay đổi

P0.8 lưu full action và digest của toàn authoritative state cho từng event. Format này phù hợp server-side replay nhưng nếu gửi thẳng tới client sẽ lộ setup order, Purge/Council/reaction, Night, Defense, Final guess, seed và hash của hidden state.

## Giả thuyết

Project từ `publicView` và `privateView` hiện có sẽ tái sử dụng đúng information boundary đã kiểm chứng ở P0.4. Action projector deny-by-default ngăn action type mới tự động trở thành public vì quên thêm blacklist.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Digest | Chỉ full state | Public digest; A/B digest = public + private của seat | `recipientStateDigest` | Không hash hidden opponent state |
| Action envelope | Full action cho replay | Owner full; Day public; seat-bound action khác chỉ committed envelope | `projectActionForRecipient` | Deny-by-default |
| Transcript | Seed + full action/digest nội bộ | Output không seed/full digest; projected action + recipient/public digest | `projectTranscript` | Payload client-safe |
| Audit | Chỉ replay equality | 50-seed regression + 200-seed extended recipient audit | Test/simulator | Bắt leak qua phase |
| CLI | Valid/invalid/replay | Thêm `--recipient-count` | `fuzz.mjs`, README | QA tái chạy |

## Thay đổi role/rule

Không đổi role hoặc luật resolve. Chốt contract information projection ở mức **prototype local**; public resolved outcome event schema vẫn là bước tiếp theo.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Gửi full P0.8 transcript | Static threat review | FAIL | Bỏ | Lộ action, seed và hidden-state digest |
| Blacklist từng action kín | Review khả năng mở rộng | Rủi ro | Bỏ | Action type mới có thể leak mặc định |
| Deny-by-default seat action | Table-driven test | PASS | Giữ | Chỉ Day được allow public payload |
| Hash raw state rồi gửi hash | Review state space nhỏ | Rủi ro | Bỏ | Digest có thể làm oracle cho hidden state |
| Hash đúng view recipient | Cross-seed test | PASS | Giữ | Cùng public state cho cùng public digest |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | TDD red | Import `recipientStateDigest` | Capability chưa có | ESM missing export | PASS red evidence |
| T-002 | Digest boundary | Hai seed, public state giống/role A khác | Public digest bằng; A digest khác | Đúng expected | PASS |
| T-003 | TDD red | Import action projector | Capability chưa có | ESM missing export | PASS red evidence |
| T-004 | Envelope table | 7 loại hidden commit | Owner full; opponent/public committed-only | Đúng expected | PASS |
| T-005 | TDD red | Import transcript projector | Capability chưa có | ESM missing export | PASS red evidence |
| T-006 | Transcript boundary | `p09-transcript` | Night B kín với A/public, full với B; digest đúng view | Đúng expected | PASS |
| T-007 | TDD red | Import recipient fuzz | Capability chưa có | ESM missing export | PASS red evidence |
| T-008 | Regression | 50 full match | ≥1.000 hidden action, leak 0 | PASS | PASS |
| T-009 | Extended audit | 200 seed `p09-audit-*` | Không leak | 15.581 event; 11.190 hidden; leak 0 | PASS |
| T-010 | CLI smoke | 20 valid + 20 recipient | Có summary | 1.623 event; 1.168 hidden; leak 0 | PASS |

### Lệnh đã chạy

```bash
node --test --test-name-pattern='recipient digest excludes' apps/spec-reviewer/game-flow-demo/simulator.test.mjs
node --test --test-name-pattern='hidden commit envelopes' apps/spec-reviewer/game-flow-demo/simulator.test.mjs
node --test --test-name-pattern='projected transcript carries' apps/spec-reviewer/game-flow-demo/simulator.test.mjs
node --test --test-name-pattern='50 full matches' apps/spec-reviewer/game-flow-demo/simulator.test.mjs
node --input-type=module -e '<import fuzzRecipientTranscripts và chạy 200 seed>'
npm run fuzz:game --workspace=@twofold/spec-reviewer -- --count=20 --recipient-count=20 --prefix=p09-cli-check
```

### Output quan trọng

```text
Four red slices: missing recipientStateDigest/projectActionForRecipient/projectTranscript/fuzzRecipientTranscripts
Audit: games=200, events=15581, hiddenActions=11190, leaks=0
CLI: games=20, events=1623, hiddenActions=1168, leaks=0
```

## Failure log

### F-001 — Full replay transcript không an toàn cho recipient

- Build/commit/seed: `2422665`, static threat review + TDD slices P0.9.
- Reproduction: xem P0.8 event `{action,digest}` và seed cần để replay.
- Expected: recipient chỉ nhận dữ liệu được phép biết.
- Actual: full action/digest có thể tiết lộ hidden commits/state.
- Root cause: Xác định — P0.8 transcript được thiết kế cho authoritative replay, chưa có projection layer.
- Fix/decision: tách view digest, deny-by-default action envelope và transcript không seed/full digest.
- Verify lại: PASS 200 seed/11.190 hidden action, leak 0.
- Commit fix: Chờ commit.

## Quyết định sau implementation

### Đã chốt

- Authoritative replay transcript chỉ ở server/internal tooling.
- Public digest chỉ hash `publicView`; seat digest chỉ thêm đúng `privateView` của seat đó.
- Seed và authoritative digest không có trong recipient transcript.
- Seat-bound action mặc định kín; chỉ action Day hiện được allow full payload công khai.

### Tạm giữ để test thêm

- `committed: true` là envelope prototype, chưa phải stable network event schema.

### Bị loại/revert

- Không dùng full-state digest làm client-visible checksum.

### Câu hỏi mở

- Council guess/result và Dawn outcome sẽ có resolved public event schema nào tách khỏi commit envelope?

## Ảnh hưởng

- Game design: không đổi resolve; làm rõ commit kín khác resolved outcome công khai.
- UI/UX: chưa nối projector vào UI local.
- Kỹ thuật: có projection boundary cho public/A/B và digest không dùng hidden opponent state.
- Data/analytics: không persist transcript; không thêm user data.
- Scope/roadmap: GD-05/QA-01 tiến gần multiplayer information map; event transport/schema còn mở.

## File và artifact liên quan

- Code: `simulator.mjs`, `simulator.test.mjs`, `fuzz.mjs`.
- Docs/ADR: game flow, README demo, verification log, task tracker.
- Screenshot/video: Không áp dụng.
- Test report: record này và verification log.
- Commit/PR: Chờ commit.

## Bước tiếp theo

- [ ] P0.10 resolved public outcome event schema — Developer + Game Designer — phase kế.
- [ ] P1 commandId/state version/event persistence — Developer — authoritative room POC.

## Giới hạn bằng chứng

Projection chạy local và chưa qua serialization/network. Audit kiểm field boundary, không chứng minh chống side-channel timing, traffic size hoặc brute-force digest. Outcome công khai hiện vẫn chủ yếu nằm trong `publicView.log`, chưa có stable typed event envelope.
