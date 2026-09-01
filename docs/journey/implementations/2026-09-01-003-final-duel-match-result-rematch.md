# 2026-09-01-003 — Final Duel, match result và rematch local

## Metadata

- Ngày: 01/09/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: Working tree P0.4
- Commit implementation: Chờ commit
- Conversation/task source: CONV-006 — hoàn tất P0.5 rồi commit/push
- Trạng thái: Hoàn thành prototype

## Yêu cầu

Hoàn tất P0.5: Final Duel sau mọi resolution, kết quả/reveal toàn bộ và Chơi lại về setup; sau đó kiểm tra, commit và push.

## Trạng thái trước khi thay đổi

Final Duel chỉ được check sau Night/Purge; Day 1–1 vẫn sang lượt B. Guess có thể overwrite. Kết thúc thường không reveal board bên thắng. Chơi lại gọi Reset UI và không có engine action.

## Giả thuyết

Một `finishMatch` chung và Final Duel guard ở mọi exit resolution sẽ loại các nhánh kết thúc không nhất quán; rematch cần là transition engine chỉ hợp lệ từ `ended`.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Final Duel entry | Night/Purge | Day/Council/Night/Purge | Engine | 1–1 luôn cùng rule |
| Guess | Có thể overwrite | Một guess/seat | Engine | Lựa chọn kín bất biến |
| Match finalizer | Phân tán | `finishMatch`, reveal all | Engine | Result nhất quán |
| Rematch | UI Reset | `match.rematch` từ ended | Engine/UI | Transition testable |
| QA | Chơi full match | `?qa=final-duel` local | UI/README | Browser deterministic |

## Thay đổi role/rule

Không đổi skill/charge role. Chốt rule Final Duel và disclosure sau trận cho prototype.

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Final Duel | Check không đầy đủ | Sau mọi resolution tạo 1–1 | Guess có thể đổi | Khóa một guess; outcome matrix rõ | Bỏ các lượt còn lại |
| Match result | Một phần role còn ẩn | Reveal toàn bộ | — | Giải thích toàn trận | Không còn hidden info sau game |

Trạng thái: **Đã chốt cho prototype local**; consent rematch multiplayer chưa implement.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Chèn reveal ở từng nhánh | Static audit | Rủi ro bỏ sót | Bỏ | Nhiều exit path |
| Finalizer chung | Regression matrix | PASS | Giữ | Một nguồn kết thúc |
| Chơi lại bằng reload/reset | Browser | Không testable ở engine | Bỏ | QA fixture có thể bị áp lại |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Automated red | Day kill còn 1–1 | Final Duel | `day-B` | PASS red evidence |
| T-002 | Automated red | A submit Final hai lần | Reject lần hai | Overwrite | PASS red evidence |
| T-003 | Automated red | Normal end/rematch | Reveal all + setup | Hidden roles | PASS red evidence |
| T-004 | Automated green | Full suite | Tất cả pass | 38/38 | PASS |
| T-005 | Browser | Final Duel fixture | End reveal all; rematch setup | Đúng expected | PASS |

### Lệnh đã chạy

```bash
node --test --test-name-pattern='Day elimination that leaves|Final Duel guesses lock|normal match end reveals' apps/spec-reviewer/game-flow-demo/engine.test.mjs
node --test apps/spec-reviewer/game-flow-demo/*.test.mjs
npm run check
git diff --check
```

### Output quan trọng

```text
Red: tests 3, pass 0, fail 3
Green: tests 38, pass 38, fail 0
Browser ended: hiddenCards=0, aliases=0, botError=false
Browser rematch: livingCards=20, setupButton=Khóa thứ tự 10 lá
```

## Failure log

### F-001 — Final Duel/kết thúc không dùng chung invariant

- Build/commit/seed: Working tree P0.4; ba fixture Final Duel/end/rematch.
- Reproduction: Day kill còn 1–1; submit guess hai lần; kết thúc bằng kill thường.
- Expected: Final Duel, immutable guess, reveal all.
- Actual: sang Day B, overwrite guess, role bên thắng còn ẩn.
- Root cause: Xác định — guard/finalization phân tán và ended dispatch chặn rematch.
- Fix/decision: guard sau Day/Council; finalizer chung; rematch special action.
- Verify lại: PASS 38/38 + browser.
- Commit fix: Chờ commit.

## Quyết định sau implementation

### Đã chốt

- 1–1 vào Final Duel trước phase kế.
- Guess khóa một lần; outcome matrix đúng ADR.
- Match result reveal toàn bộ role.
- Local BOT rematch tạo setup mới ngay.

### Tạm giữ để test thêm

- Full multiplayer cần hai consent cho rematch.

### Bị loại/revert

- Dùng Reset UI thay rematch transition.

### Câu hỏi mở

- Final Duel có nên giới hạn danh sách guess theo role còn khả năng thay vì toàn bộ deck?

## Ảnh hưởng

- Game design: chốt Final Duel prototype.
- UI/UX: kết quả giải thích đầy đủ và Chơi lại đúng state.
- Kỹ thuật: finalizer/rematch testable.
- Data/analytics: result reason ổn định hơn; chưa thêm schema.
- Scope/roadmap: WEB-06 hoàn thành phần local, còn surrender/reconnect/multiplayer consent.

## File và artifact liên quan

- Code: `engine.mjs`, `engine.test.mjs`, `ui.mjs`, `ui.html`.
- Docs/ADR: ADR-0001, core gameplay, game flow, README.
- Screenshot/video: Không lưu; DOM evidence trong task.
- Test report: record này và verification log.
- Commit/PR: Chờ commit.

## Bước tiếp theo

- [ ] P0.6 BOT/state seed fuzzing — Developer — phase tiếp theo.
- [ ] Surrender/reconnect/rematch consent — Developer — P1 multiplayer.

## Giới hạn bằng chứng

Không chứng minh balance Final Duel, fairness danh sách role guess, multiplayer consent, surrender hoặc reconnect.
