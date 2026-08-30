# 2026-08-30-008 — Đồng bộ trạng thái, timeline và lát bàn giao hiện tại

## Metadata

- Ngày: 30/08/2026
- Owner/Agent: Codex
- Branch: `main`
- Commit trước khi làm: `5d0a5eb`
- Commit implementation: Commit chứa record này
- Conversation/task source: Yêu cầu cập nhật document/timeline, kiểm tra status và chia task vừa đủ cho Dev/UIUX
- Trạng thái: Hoàn thành phần tài liệu; chưa human review

## Yêu cầu

Cập nhật tài liệu và timeline theo những gì prototype đã làm trong các ngày gần đây, kiểm tra trạng thái thật của code, rồi chia các task nhỏ cho Developer và UI/UX Game đúng với điểm hiện tại thay vì mở scope quá rộng.

## Trạng thái trước khi thay đổi

- Roadmap và tracker vẫn phản ánh kế hoạch ban đầu ngày 27/08, trong khi game-flow demo đã có full loop local và nhiều state/motion gameplay.
- Bộ role trong tài liệu phát triển và role draft vẫn là skeleton cũ gồm 2 Dân làng, Thợ săn, Trưởng làng và Kẻ ngụy trang.
- Migration plan mâu thuẫn với prototype/ADR-0004 ở Council Vòng 3, bài chết luôn lộ, khiên chặn Seer và Witch revive luôn công khai.
- `apps/web` đã có route graybox nhưng Play vẫn dùng mock/random; `game-core` có model nền nhưng card chết đang bị ép `REVEALED`.
- Chưa có record human playtest cho 3–5 trận trên build hiện tại.

## Giả thuyết

Một lát bàn giao nhỏ, có dependency và acceptance criteria cụ thể, sẽ giúp Dev/UIUX tiếp tục từ prototype mà không vô tình port rule cũ hoặc mở thêm Home/Lobby/role mới trước khi core gameplay được kiểm chứng.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Roadmap | Chỉ có kế hoạch gốc | Có snapshot 30/08, trạng thái milestone và lát 30/08–07/09 | `docs/project-management/roadmap.md` | Timeline phản ánh bằng chứng thật |
| Task tracker | Task rộng, trạng thái cũ | Có status audit và task GD/Dev/UIUX nhỏ theo thứ tự | `docs/project-management/task-tracker.md` | Bàn giao vừa đủ theo tiến độ hiện tại |
| Role draft | Skeleton cũ 2 Dân | Bộ prototype 10 lá v0.2 và giới hạn hiện hành | `docs/game-design/roles-draft.md` | Tránh Dev/UI triển khai role đã bị thay thế |
| Development plan | Mọi foundation task đều chưa làm | Tách phần đã scaffold khỏi phần v0.2 còn thiếu | `docs/development/development-plan.md` | Không báo xong quá mức, cũng không bỏ qua code đã có |
| Migration plan | Rule cũ mâu thuẫn ADR/demo | Correction cho Council Vòng 2, dead-hidden, Seer/Guard, revive và Purge | `docs/development/ruleset-v0.2-migration-plan.md` | Tạo đầu vào an toàn cho DEV-02A–D |
| Game-flow hypothesis | Còn hỏi về Tai họa Vòng 7 | Hỏi đúng rủi ro Thanh trừng/Blood Moon từ Vòng 6 | `docs/game-design/game-flow-v0.1.md` | Đồng bộ câu hỏi playtest với flow hiện hành |

## Thay đổi role/rule

Không triển khai rule mới. Tài liệu được đồng bộ với rule prototype/ADR hiện tại:

| Role/Rule | Timing cũ trong docs | Timing mới trong docs | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Hội đồng | Vòng 3 ở migration plan | Vòng 2 sau Day B, trước Night | Treo cổ cũ | 3 voter; target lộ không cần đoán | `Chốt tạm theo prototype`, chờ GD-08 |
| Bài chết còn ẩn | Chết luôn lộ | Life và visibility độc lập | Eliminate/revive tự lộ | Giữ visibility hiện có | `Đã chốt cho prototype` qua ADR-0004 |
| Bảo vệ/Tiên tri | Khiên chặn inspect | Khiên không chặn inspect | Shield matrix sai | Chặn attack/poison/Blood Moon | `Chốt tạm theo prototype` |
| Late game | Chỉ Blood Moon hoặc Calamity Vòng 7 | Prototype có Purge và Blood Moon từ Vòng 6 | Kế hoạch tự đề xuất xóa Calamity | Chờ 3–5 trận trước quyết định giữ/bỏ | `Prototype`, chưa cân bằng |

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Tạo backlog đầy đủ tới Alpha | Đối chiếu roadmap cũ | INCONCLUSIVE | Bỏ ở lát hiện tại | Trái yêu cầu không mở quá rộng |
| Chỉ cập nhật tracker | So với các tài liệu rule/dev | FAIL | Bỏ | Dev vẫn nhận nguồn luật mâu thuẫn |
| Đồng bộ nguồn thật rồi chia lát nhỏ | Đọc code, ADR, flow và docs liên quan | PASS ở mức static review | Giữ | Task có dependency và acceptance rõ |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Static review | `git status`, log và đọc code route/core/contracts | Status không suy diễn quá code hiện có | Phân biệt được prototype, scaffold và authoritative core còn thiếu | PASS |
| T-002 | Static docs | `git diff --check` | Không có whitespace error | Không có output lỗi | PASS |
| T-003 | Cross-reference scan | `rg` các rule cũ trong tài liệu đã sửa | Không còn mâu thuẫn vận hành chưa được gắn nhãn lịch sử/backlog | Các kết quả còn lại là baseline cũ hoặc role explore có nhãn | PASS |
| T-004 | Automated workspace check | `npm run check` | Toàn bộ workspace check pass | 4/4 workspace pass; spec-reviewer 16 test, game-core 14 test, web typecheck/build pass | PASS |
| T-005 | Human review/playtest | Chưa chạy | Team xác nhận task và 3–5 trận có record | Chưa xác minh | Chưa xác minh |

### Lệnh đã chạy

```bash
git status --short --branch
git log --oneline --decorate -12
sed -n '...' <các tài liệu và source liên quan>
rg -n '<các rule cũ>' <các tài liệu đã sửa>
git diff --check
npm run check
```

### Output quan trọng

```text
main đồng bộ origin/main tại 5d0a5eb trước khi sửa.
apps/web Play còn mock state và Math.random().
game-core CardRuntimeState trước sửa code chỉ cho DEAD + REVEALED.
Không có human playtest record cho build hiện tại.
```

## Failure log

### F-001 — Pattern scan đầu tiên bị shell diễn giải backtick

- Build/commit/seed: `5d0a5eb`, tài liệu chưa commit
- Reproduction: truyền pattern có backtick trong chuỗi shell double-quoted
- Expected: `rg` đọc pattern nguyên văn
- Actual: zsh thử chạy từ nằm trong backtick và in `command not found`; các workspace check sau đó vẫn chạy
- Root cause: Xác định — quoting của lệnh kiểm tra
- Fix/decision: Chạy lại `rg` bằng pattern single-quoted, không dùng backtick
- Verify lại: PASS
- Commit fix: Chưa commit

## Quyết định sau implementation

### Đã chốt

- Task hiện tại được giới hạn ở GD-07–08, DEV-02A–D và UX-02A/04A/03A/04B.
- DEV-02A (dead-hidden state) đứng trước phase spine và serializer.
- Không xóa engine prototype trước khi parity test pass.

### Tạm giữ để test thêm

- Council từ Vòng 2, Thanh trừng/Blood Moon từ Vòng 6 và balance bộ 10 lá.
- Exact timing/motion token cho presentation.

### Bị loại/revert

- Không tạo task role mới, full branding, Home/Lobby redesign, analytics, audio hoặc deployment trong lát hiện tại.

### Câu hỏi mở

- Giữ cả Thanh trừng và Blood Moon hay chỉ một cơ chế ép late-game?
- Exact resolution của Phù thủy khi hai skill có thể dùng cùng một vòng.
- Hội đồng Vòng 2 có tạo snowball thông tin quá sớm sau 3–5 trận không?

## Ảnh hưởng

- Game design: Bộ 10 lá và ba rule quan trọng được ghi đúng trạng thái prototype/chờ test.
- UI/UX: Có đầu việc rõ cho state inventory, information hierarchy, motion spec và usability review.
- Kỹ thuật: Có thứ tự migration từ state → phase → serializer → events.
- Data/analytics: Chưa thay đổi; GD-07 yêu cầu ghi dữ liệu thủ công tối thiểu.
- Scope/roadmap: M1/M2 phản ánh phần đã có và phần chưa có bằng chứng.

## File và artifact liên quan

- Code: `apps/spec-reviewer/game-flow-demo`, `apps/web`, `packages/game-core`, `packages/shared-types`
- Docs/ADR: roadmap, task tracker, development plan, migration plan, roles draft, ADR-0004
- Screenshot/video: Không tạo mới
- Test report: Test log trong record này
- Commit/PR: Commit chứa record này

## Bước tiếp theo

- [ ] GD-07 — Game Designer/PO — trước khi chốt GD-08
- [ ] DEV-02A — Developer — lát hiện tại
- [ ] UX-02A — UI/UX Game — lát hiện tại
- [ ] Team review trạng thái/task trong buổi sync gần nhất

## Giới hạn bằng chứng

Static review không chứng minh gameplay cân bằng, người chơi hiểu UX, multiplayer hoạt động hoặc phase/event contract mới đã được implement. Các task mới chỉ là kế hoạch bàn giao, chưa phải feature hoàn thành.
