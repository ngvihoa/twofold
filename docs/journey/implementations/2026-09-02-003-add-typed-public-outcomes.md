# 2026-09-02-003 — Thêm typed public outcomes P0.10

## Metadata

- Ngày: 02/09/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `189eaeb`
- Commit implementation: `c75a3c6`
- Conversation/task source: CONV-006 — hoàn tất toàn bộ Phase 0 rồi commit/push
- Trạng thái: Hoàn thành prototype, chờ liên kết commit

## Yêu cầu

Hoàn tất P0.10 và đóng Phase 0: thay public outcome đang phải suy từ log bằng event có kiểu, đưa event vào transcript theo recipient mà không làm lộ hidden command, kiểm bằng regression/fuzz rồi ghi exit record.

## Trạng thái trước khi thay đổi

P0.9 đã tách authoritative transcript khỏi payload `public`/`A`/`B`, nhưng chỉ có projected action và digest. Client vẫn phải đọc log tự do để hiểu Council, reveal, chết, được cứu, hồi sinh, Thanh trừng và kết quả trận; chưa có allowlist schema để fuzz information leak.

## Giả thuyết

Nếu engine phát outcome tại đúng resolution seam, còn transcript chỉ lấy delta từ transition vừa dispatch, cả ba recipient sẽ nhận cùng kết quả công khai trong khi hidden command vẫn giữ committed envelope. Schema allowlist field sẽ bắt event mới hoặc field nhạy cảm bị thêm ngoài chủ đích.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Public outcome state | Chỉ log tự do | `publicEvents` có sequence/round/type | `engine.mjs` | Nguồn sự thật typed từ engine |
| Card lifecycle | UI suy reveal/death/save/revive | Bốn nhóm event card tương ứng | `engine.mjs` | Không parse log |
| Hidden batch | Council/Purge chỉ có log | Outcome chỉ phát sau lock/resolve hoặc fizzle | `engine.mjs` | Không leak lựa chọn đầu tiên |
| Match terminal | Chỉ result + log | `match.ended` | `engine.mjs` | Terminal event rõ ràng |
| Recipient transcript | Action + digest | Thêm `outcomes` delta giống nhau cho public/A/B | `simulator.mjs` | Vận chuyển kết quả công khai riêng command |
| Audit | Chưa có event schema | Allowlist 8 type, exact field, sequence và cross-recipient equality | simulator/tests | Bắt schema drift và leak |

## Thay đổi role/rule

Không đổi role, charge, target hoặc thứ tự resolve. Đây là contract thông tin **Prototype**: outcome công khai vốn đã tồn tại trong rule được biểu diễn có kiểu. `card.saved` chủ đích không công bố role, source hay loại lệnh đêm.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Client parse `publicView.log` | Review P0.9 seam | Rủi ro | Bỏ | Text thay đổi dễ vỡ và khó khóa privacy |
| Phát raw command thành event | Threat review | FAIL | Bỏ | Council/Purge/Night commit chứa payload kín |
| Phát typed outcome tại resolve | TDD + fuzz | PASS | Giữ | Tách command kín khỏi kết quả công khai |
| Gắn toàn bộ event history vào mỗi transcript step | Review payload | Không cần thiết | Bỏ | Lặp dữ liệu và khó consume |
| Gắn event delta theo transition | Cross-recipient test | PASS | Giữ | Có thứ tự, không lặp |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | TDD red/green | Council hai commit | Không event sau commit đầu; typed result sau commit hai | Red thiếu event; green đúng boundary | PASS |
| T-002 | TDD red/green | Xạ thủ Day | reveal rồi eliminate typed | Red events rỗng; green đúng thứ tự | PASS |
| T-003 | TDD red/green privacy | Guard block attack | saved position, không source/kind/role | Red thiếu event; green đúng allowlist | PASS |
| T-004 | TDD red/green | Witch revive | typed revived sau reveal Witch | Red thiếu event; green đúng payload | PASS |
| T-005 | TDD red/green | Round 7 Swap conflict | Chỉ một `purge.resolved` sau batch | Red thiếu event; green `fizzled` | PASS |
| T-006 | Integration | Toàn bộ engine/simulator suite | Không regression | 54/54 pass | PASS |
| T-007 | Extended fuzz | 200 seed `p10-outcome-audit` | Schema/recipient leak 0 | 15.306 transition; 11.125 outcome; leak 0 | PASS |
| T-008 | Static/workspace trước fetch | `node --check`, `npm run check`, `git diff --check` | Không lỗi | 3/3 workspace pass; static/diff pass | PASS |
| T-009 | Integrated remote workspace | Remote `1045182` + 6 commit Phase 0, `pnpm tf check` | Spec/runtime boundary và mọi workspace xanh | 4/4 workspace pass; spec 51, web 62, game-core 83 test pass | PASS |

### Lệnh đã chạy

```bash
node --test --test-name-pattern='Witch revival publishes' apps/spec-reviewer/game-flow-demo/engine.test.mjs
node --test --test-name-pattern='Purge publishes one typed' apps/spec-reviewer/game-flow-demo/engine.test.mjs
node --test --test-name-pattern='projected transcripts carry identical typed' apps/spec-reviewer/game-flow-demo/simulator.test.mjs
node --test apps/spec-reviewer/game-flow-demo/*.test.mjs
node apps/spec-reviewer/game-flow-demo/fuzz.mjs --count=1 --recipient-count=200 --prefix=p10-outcome-audit
node --check apps/spec-reviewer/game-flow-demo/engine.mjs
node --check apps/spec-reviewer/game-flow-demo/simulator.mjs
node --check apps/spec-reviewer/game-flow-demo/fuzz.mjs
npm run check
git diff --check
pnpm install --frozen-lockfile
pnpm tf check
```

### Output quan trọng

```text
tests 54; pass 54; fail 0
recipient audit: games=200, events=15306, outcomes=11125, hiddenActions=10995, leaks=0
All 3 workspace checks passed
Integrated remote: All 4 workspace checks passed
```

## Failure log

### F-001 — Council sequence giả định outcome là event đầu tiên

- Build/commit/seed: working tree P0.10, `typed-council-outcome`.
- Reproduction: chạy full suite sau khi mọi reveal đều phát typed event.
- Expected: `council.resolved.sequence = 0` theo test ban đầu.
- Actual: hai voter reveal chiếm sequence 0–1; Council result ở sequence 2.
- Root cause: Xác định — test khóa nhầm số sequence tuyệt đối thay vì chỉ khóa thứ tự/boundary.
- Fix/decision: giữ sequence engine đúng và cho assertion dùng sequence thực; outcome vẫn chỉ xuất hiện sau cả hai commit.
- Verify lại: PASS trong suite 54/54.
- Commit fix: `c75a3c6`.

### F-002 — Full remote check thiếu dependencies trong worktree tạm

- Build/commit/seed: remote `1045182` + cherry-pick P0.8–P0.10 trong worktree tạm.
- Reproduction: chạy `pnpm tf check` trước khi install lockfile.
- Expected: chạy toàn bộ 4 workspace.
- Actual: spec notes thiếu `@neondatabase/serverless`; web/game-core thiếu `vitest`.
- Root cause: Xác định — worktree tạm chưa có `node_modules`, không phải regression code.
- Fix/decision: `pnpm install --frozen-lockfile`, không sửa dependency manifest/lockfile.
- Verify lại: PASS — 4/4 workspace, spec 51 test, web 62 test + typecheck/build, game-core 83 test.
- Commit fix: Không áp dụng; chỉ là setup local.

## Quyết định sau implementation

### Đã chốt

- P0.10 là điểm kết thúc Phase 0.
- Public outcome do engine tạo; client không parse log và không biến raw hidden command thành public event.
- Recipient transcript nhận outcome delta giống nhau; seed/full digest vẫn server-only.
- Schema prototype có 8 event type và exact field allowlist.

### Tạm giữ để test thêm

- Tên field/event chưa là wire contract versioned; P1 sẽ quyết định persistence và serialization.

### Bị loại/revert

- Không tạo P0.11 chỉ để mở rộng Phase 0; issue mới không chặn regression chuyển sang P1/backlog.

### Câu hỏi mở

- P1 dùng event store/transport nào và version schema ra sao?
- `commandId`, state version, reconnect/resume và idempotency được ghép vào room authority thế nào?

## Ảnh hưởng

- Game design: không đổi resolve; information map có typed outcome catalog.
- UI/UX: chưa nối UI local sang event consumer; log vẫn tồn tại cho presentation.
- Kỹ thuật: có producer, recipient delta projection, invariant và leak audit.
- Data/analytics: event chỉ in-memory, không persistence.
- Scope/roadmap: Phase 0 của spec reviewer kết thúc; runtime track hiện có cần migration audit riêng, không được suy ra parity từ P0.10.

## File và artifact liên quan

- Code: `engine.mjs`, `simulator.mjs` và test tương ứng.
- Docs/ADR: demo README, game flow, verification log, task tracker, Phase 0 closure.
- Screenshot/video: Không áp dụng; không đổi UI.
- Test report: record này và `docs/journey/verification-log.md`.
- Commit/PR: `c75a3c6`.

## Bước tiếp theo

- [ ] Freeze `c75a3c6`/commit tích hợp làm spec candidate và lập migration audit với runtime baseline — Developer + Game Designer.
- [ ] Tiếp tục command envelope/persistence/transport trên runtime track theo task đã được phê duyệt — Developer.
- [ ] Human playtest/balance vẫn đi theo TEST-01/PT-01, không được suy ra từ fuzz.

## Giới hạn bằng chứng

Audit chạy local trong cùng runtime và cùng code version. Chưa chứng minh network ordering, serialization compatibility, reconnect, retry idempotency, hai browser đồng bộ, timing/traffic side-channel, trải nghiệm UI hoặc cân bằng gameplay.
