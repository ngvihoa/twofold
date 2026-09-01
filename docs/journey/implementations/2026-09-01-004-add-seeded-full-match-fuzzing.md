# 2026-09-01-004 — Thêm seeded full-match fuzzing P0.6

## Metadata

- Ngày: 01/09/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `e9cd1bb`
- Commit implementation: Chờ commit
- Conversation/task source: CONV-006 — tiếp tục phase sau P0.5
- Trạng thái: Hoàn thành prototype

## Yêu cầu

Hoàn tất P0.6 bằng full-match simulation theo seed để phát hiện action BOT bất hợp lệ, state invariant bị phá, loop/deadlock và ván không thể kết thúc.

## Trạng thái trước khi thay đổi

Suite 38 scenario kiểm tra các rule/edge case cố định nhưng chưa có harness chạy trọn ván trên nhiều deck seed. Việc kiểm tra full flow chủ yếu dựa vào một số browser fixture và seed thủ công.

## Giả thuyết

Một policy deterministic có thể tạo action hợp lệ cho cả hai seat ở mọi phase; chạy hàng trăm đến hàng nghìn seed với invariant sau mỗi transition sẽ bắt được nhánh hiếm mà example-based test bỏ sót, đồng thời giữ seed/trace để tái hiện.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Full-match runner | Không có | `simulateGame(seed)` chạy setup → ended | `simulator.mjs` | Test toàn flow |
| Policy | Action thủ công/UI BOT B | Policy deterministic cho cả A/B và mọi phase | `simulator.mjs` | Seed tái hiện được |
| Invariant | Nằm rải trong scenario | 20 identity/position, ownership, charge, alive, Final Duel, reveal result | `simulator.mjs` | Phát hiện state corruption sớm |
| Regression | 38 scenario cố định | Thêm deterministic test và 500-seed fuzz | `simulator.test.mjs` | Chạy trong workspace check |
| CLI | Không có | `npm run fuzz:game ...` và JSON coverage | `fuzz.mjs`, package/README | Audit lớn theo nhu cầu |

## Thay đổi role/rule

Không có. Policy simulation dùng luật hiện hành để tạo traffic kiểm tra; không phải quyết định balance hoặc BOT production.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Chỉ thêm vài full-match fixture cố định | So với coverage hiện có | INCONCLUSIVE | Bỏ | Không mở rộng state space đáng kể |
| Seeded policy + invariant mỗi transition | 500 regression + 5.000 audit | PASS | Giữ | Tái hiện và mở rộng được |
| Chạy 5.000 seed trong mọi `npm run check` | Đo thời gian khoảng 28 giây | PASS nhưng chậm | Bỏ | Giữ 500 seed khoảng 3 giây; audit lớn qua CLI |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Automated deterministic | `p06-deterministic` chạy hai lần | Cùng step/round/result/trace | Trùng hoàn toàn | PASS |
| T-002 | Automated fuzz regression | 500 seed `p06-regression-*` | Tất cả ended ≤250 transition, invariant giữ | Tất cả pass | PASS |
| T-003 | CLI smoke | 500 seed `p06-cli-check-*` | Có coverage mọi phase/skill | Max 109 step, V11; đủ coverage | PASS |
| T-004 | Extended audit | 5.000 seed `p06-audit-*` | Không throw/deadlock/invariant violation | Max 137 step, V13; 5.000/5.000 ended | PASS |

### Lệnh đã chạy

```bash
node --test apps/spec-reviewer/game-flow-demo/simulator.test.mjs
npm run fuzz:game --workspace=@twofold/spec-reviewer -- --count=500 --prefix=p06-cli-check
node --input-type=module -e '<import fuzzGames và chạy 5000 seed>'
```

### Output quan trọng

```text
Regression: tests 2, pass 2, fail 0
CLI 500: maxSteps=109, maxRound=11, coverage đủ 12 phase và 18 action-kind
Audit 5000: maxSteps=137, maxRound=13, winners B=2197 A=2278 draw=525
```

## Failure log

Không có failure được quan sát trong 5.000 seed audit. Đây là bằng chứng âm trong phạm vi policy/invariant đã định nghĩa, không chứng minh engine không còn lỗi.

## Quyết định sau implementation

### Đã chốt

- Giữ 500 seed trong suite thường để thời gian check hợp lý.
- Dùng CLI với count lớn trước release hoặc sau thay đổi state machine lớn.
- Failure phải in seed, step, round, phase, action và 20 transition gần nhất.

### Tạm giữ để test thêm

- Ngưỡng 250 transition là guard kỹ thuật cho bộ 10 lá/rule hiện tại.

### Bị loại/revert

- Không đưa audit 5.000 seed vào every-check vì tăng khoảng 28 giây.

### Câu hỏi mở

- Khi có authoritative multiplayer, invariant/event replay nào phải chạy ở server và hai client để bắt desync?

## Ảnh hưởng

- Game design: không đổi luật; cho thêm dữ liệu về khả năng hoàn thành flow.
- UI/UX: không đổi.
- Kỹ thuật: full-match deterministic fuzzing trở thành regression suite.
- Data/analytics: CLI chỉ in aggregate, không lưu telemetry người dùng.
- Scope/roadmap: QA-01 hoàn thành phần deterministic local; desync hai client còn mở.

## File và artifact liên quan

- Code: `simulator.mjs`, `simulator.test.mjs`, `fuzz.mjs`, package script.
- Docs/ADR: README demo, verification log, task tracker.
- Screenshot/video: Không áp dụng.
- Test report: record này và verification log.
- Commit/PR: Chờ commit.

## Bước tiếp theo

- [ ] P0.7 invalid-action/state mutation fuzzing — Developer — phase kế nếu tiếp tục hardening local engine.
- [ ] P1 authoritative two-client event replay/desync test — Developer — sau room/state sync POC.

## Giới hạn bằng chứng

Simulation dùng policy synthetic có quyền đọc full state để sinh action hợp lệ; không đo độ mạnh, độ tự nhiên hoặc lỗi presentation của UI BOT. Không có browser/human playtest trong phase này và chưa kiểm tra network/desync/reconnect.
