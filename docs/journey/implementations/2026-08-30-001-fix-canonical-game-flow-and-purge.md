# 2026-08-30-001 — Sửa canonical game flow và Thanh trừng

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `main`
- Commit trước khi làm: `3aed7f2`
- Commit implementation: cùng commit với record này
- Conversation/task source: owner yêu cầu xem lại các thay đổi từ Claude, sửa lỗi game, QA và push đúng lên `main`
- Trạng thái: Hoàn thành implementation; chờ owner human playtest

## Yêu cầu

Đưa những thay đổi gameplay có giá trị vào đúng app được deploy (`apps/spec-reviewer/game-flow-demo`), sửa lỗi phase/rule đã phát hiện, giữ nhịp trình bày bí mật của đêm, bổ sung Thanh trừng từ Vòng 6, QA toàn monorepo rồi push `main`. Không nhập nguyên thư mục prototype trùng ở root vì nó không thuộc đường deploy.

## Trạng thái trước khi thay đổi

- Vòng 2 đi `Hội đồng → Ban ngày` và lặp, không tới Đêm.
- Quyền loại bỏ Ban ngày làm khóa cả lệnh loại bỏ Ban đêm.
- Khiên chặn Tiên tri, trái với rule prototype mới.
- Nguồn lệnh đêm lộ trước Bình minh.
- Cờ Khóa mạch tồn tại ở ý tưởng nhưng không chặn skill/Vote.
- Engine có state `match-intro` nhưng UI không có CTA bắt đầu, khiến ván có thể đứng sau setup.
- Chưa có implementation Thanh trừng tuần tự từ Vòng 6 trong canonical app.
- CLI check chạy raw script qua shell nên không nạp workspace `.bin`; `vitest` bị báo thiếu dù dependency đã cài.

## Giả thuyết

Một state machine có transition đơn hướng `Ngày → Hội đồng → Đêm → Bình minh → Thanh trừng (V6+) → Ngày`, budget loại bỏ riêng theo phase và invariant được khóa bằng regression test sẽ loại các vòng lặp/soft-lock. Giữ nguồn và target đêm kín tới Bình minh sẽ làm presentation đúng nhịp đã thống nhất.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Canonical location | Thay đổi Claude nằm ở prototype root trùng | Port có chọn lọc vào app deploy | `apps/spec-reviewer/game-flow-demo/*` | Tránh deploy nhầm artifact |
| Phase loop | Hội đồng quay về `day-A` | Hội đồng kết thúc ở `night-plan`; Bình minh sang Thanh trừng hoặc Ngày | `engine.mjs` | Xóa loop Vòng 2 |
| Elimination budget | Dùng chung Ngày/Đêm | Reset khi vào Đêm | `engine.mjs` | Mỗi phase có một main order hợp lệ |
| Match intro | Có state nhưng không có CTA | Có nút “Bắt đầu Vòng 1” và event `round.begin` | `engine.mjs`, `ui.mjs`, `cli.mjs` | Không soft-lock sau setup |
| Information timing | Source đêm lộ ở Chạng vạng | Source/target lộ ở Bình minh; chỉ vị trí khiên công khai trước | `engine.mjs`, `ui.mjs` | Giảm bất ngờ và đúng hidden order |
| Thanh trừng | Chưa có trong canonical engine | Chu kỳ 4 luật từ V6, chọn kín hai bên, resolve đồng thời | `engine.mjs`, `ui.mjs`, `ui.css`, `cli.mjs` | Tạo áp lực late game |
| QA runner | Chạy raw script với `sh -c` | Chạy `pnpm run <script>` trong từng workspace | `packages/cli/src/commands/check.mjs` | Nạp đúng local binary và bỏ false failure |
| Tài liệu | Game flow/role draft mô tả rule cũ | Đồng bộ Hội đồng, hidden Night, Guard/Seer và Thanh trừng | `docs/game-design/*`, `docs/journey/role-evolution.md` | Nguồn sự thật không lệch code |

## Thay đổi role/rule

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Hội đồng — Prototype | Từ V3 và quay lại Ban ngày | Từ V2, sau hai lượt Ngày, rồi tới Đêm | 3 voter = 3 phiếu | Đúng 3 voter; Dân làng 2 phiếu, voter khác 1 | Voter ẩn tự lộ; target lộ không cần đoán |
| Tiên tri — Prototype | 3 charge, bị khiên chặn | Không giới hạn tổng charge, resolve ở Bình minh | Soi lặp bình thường | Lần đầu đánh dấu sáng/tối; lần hai chỉ kết liễu phe tối đã soi | Khiên không chặn; phe sáng không thể soi lại |
| Bảo vệ — Prototype | 3 charge; khóa theo vị trí | Không giới hạn tổng charge; khóa theo `instanceId` | Có thể tự bảo vệ; khiên chặn soi | Không tự bảo vệ, không cùng lá hai đêm; không chặn Tiên tri | Chặn nguồn loại bỏ, công khai vị trí khiên |
| Khóa mạch — Prototype | Chỉ ghi cờ | Có hiệu lực đúng vòng | Chưa enforce | Chặn skill và Vote | Có thể làm giảm vote power |
| Thanh trừng — Prototype | Chưa chạy | Bắt đầu trước Ngày V6+ | — | Cắt bỏ → Đảo chiến tuyến → Ép lộ diện → Khóa mạch | Chọn kín, resolve đồng thời |

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Merge nguyên prototype root của Claude | So sánh cấu trúc và đường deploy Vercel | INCONCLUSIVE về nội dung, FAIL về vị trí deploy | Bỏ | Tạo app trùng và không được route deploy dùng |
| Port có chọn lọc vào canonical app | So sánh engine/UI/docs, thêm regression | PASS | Giữ | Một nguồn code chạy và deploy |
| Chạy monorepo check bằng raw script | `npm run check` sau install | FAIL | Bỏ | CLI không thêm workspace `.bin` vào PATH |
| Chạy workspace scripts bằng pnpm | Sửa runner và chạy lại | PASS | Giữ | Dùng đúng package manager/lockfile |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Regression, red | 4 case mới trên engine cũ | Case tái hiện lỗi phải fail | 4/4 fail: budget, loop V2, Guard/Seer/hidden source, Purge lock | PASS (red) |
| T-002 | Automated unit/regression | `node --test .../engine.test.mjs` | Tất cả flow invariant xanh | 6 test pass, gồm full loop tới V10 và V8 không còn lá ẩn | PASS |
| T-003 | Static syntax | `node --check` trên engine/UI/CLI/check runner | Không syntax error | Exit 0 | PASS |
| T-004 | Workspace integration/build | `npm run check` sau `pnpm install --frozen-lockfile`, chạy lại sau rebase `a659f5f` | Tất cả workspace xanh | 4/4 workspace pass; spec-reviewer 14 test, web typecheck/build, CLI check, game-core 11 test | PASS |
| T-005 | Static diff | `git diff --check` | Không whitespace error | Exit 0 | PASS |
| T-006 | Browser smoke | local server 4174, setup → start → Ngày → Đêm → Bình minh → Vòng 2 Hội đồng | Không soft-lock, không lộ source đêm, không console error | CTA bắt đầu xuất hiện; tới Hội đồng V2; staged badge = 0; console errors = 0 | PASS |
| T-007 | Human playtest | Owner sẽ test sau khi push | Cảm nhận nhịp, animation, cân bằng dễ hiểu | Chưa chạy theo yêu cầu owner | CHƯA XÁC MINH |

### Lệnh đã chạy

```bash
node --check apps/spec-reviewer/game-flow-demo/engine.mjs
node --check apps/spec-reviewer/game-flow-demo/ui.mjs
node --check apps/spec-reviewer/game-flow-demo/cli.mjs
node --test apps/spec-reviewer/game-flow-demo/engine.test.mjs
pnpm install --frozen-lockfile
npm run check
git diff --check
```

### Output quan trọng

```text
engine regression: tests 6, pass 6, fail 0
spec-reviewer: tests 14, pass 14, fail 0
web: typecheck PASS, production build PASS
game-core: test files 2 passed, tests 11 passed
All 4 workspace checks passed!
```

## Failure log

### F-001 — Vòng 2 lặp Hội đồng/Ban ngày

- Build/commit/seed: `3aed7f2`, deterministic engine fixture
- Reproduction: hoàn tất Day A/B V2 rồi cả hai submit Hội đồng
- Expected: `night-plan`
- Actual: `day-A`
- Root cause: `resolveCouncil` và `resolveNight` cùng trỏ phase sai
- Fix/decision: Hội đồng sang Đêm; Bình minh mới sang Thanh trừng/Ngày
- Verify lại: PASS — T-002
- Commit fix: cùng commit implementation

### F-002 — Monorepo check báo thiếu vitest giả

- Build/commit/seed: worktree `main`, dependency cài theo lockfile
- Reproduction: `npm run check`
- Expected: game-core dùng local `vitest`
- Actual: `sh: vitest: command not found`
- Root cause: CLI gọi raw nội dung script bằng `sh -c`, không qua pnpm nên PATH thiếu workspace `.bin`
- Fix/decision: `spawnSync("pnpm", ["run", checkKey])`
- Verify lại: PASS — 4/4 workspace
- Commit fix: cùng commit implementation

## Quyết định sau implementation

### Đã chốt

- `apps/spec-reviewer/game-flow-demo` là canonical prototype được deploy.
- Không merge nguyên thư mục prototype root trùng.
- Regression test là gate cho phase loop, hidden information, Purge lock và Thanh trừng.

### Tạm giữ để test thêm

- Chu kỳ Thanh trừng và sức mạnh Tiên tri/Bảo vệ vẫn là balance hypothesis.
- Thời lượng và độ rõ của animation cần owner human playtest.

### Bị loại/revert

- Flow Hội đồng quay lại Ban ngày.
- Lộ source Night trước Bình minh.
- QA runner chạy raw package script bằng shell.

### Câu hỏi mở

- Khi board còn quá ít lá, Khóa mạch có tạo soft-lock chiến thuật không?

## Ảnh hưởng

- Game design: Hội đồng V2, Guard/Seer và Thanh trừng được đồng bộ.
- UI/UX: có match-intro CTA, scene Thanh trừng, hidden Night và wording rõ hơn.
- Kỹ thuật: state có `instanceId`, Purge data, regression tests và QA runner đúng.
- Data/analytics: chưa thêm telemetry.
- Scope/roadmap: human playtest vẫn là bước tiếp theo.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo/*`, `packages/cli/src/commands/check.mjs`
- Docs/ADR: `docs/game-design/game-flow-v0.1.md`, `docs/game-design/roles-draft.md`, `docs/journey/role-evolution.md`
- Screenshot/video: browser smoke trong phiên Codex, không commit artifact
- Test report: output T-001 đến T-006 trong phiên
- Commit/PR: cùng commit implementation trên `main`

## Bước tiếp theo

- [ ] Chơi một ván tới Vòng 8 và đánh giá nhịp animation/Thanh trừng — Owner — sau deploy
- [x] Ép lộ diện khi không còn lá ẩn xác nhận không mục tiêu và tiếp tục, có regression test — Codex — 30/08/2026

## Giới hạn bằng chứng

Automated test chứng minh state transition và invariant đã nêu, không chứng minh cân bằng hoặc cảm nhận UI. Browser smoke mới đi tới Hội đồng V2; chưa tương tác trực tiếp Thanh trừng V6–V9. Theo yêu cầu owner, phần human playtest được để lại sau push và không được ghi là đã xác minh.
