# 2026-09-04-001 — Chốt phạm vi gameflow/UX và screen inventory end-to-end

## Metadata

- Ngày: 04/09/2026
- Owner/Agent: Codex + Product Owner
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `a723c1f`
- Commit implementation: `0e97723`
- Conversation/task source: CONV-008 — làm rõ room/matchmaking backend do Developer phụ trách
- Trạng thái: Hoàn thành trên working tree

## Yêu cầu

Giới hạn track hiện tại vào gameflow và UX flow của người chơi từ lúc vào game, setup, chơi, kết thúc, rematch hoặc tạo room mới. Không triển khai room creation, matchmaking, realtime reliability hoặc session backend vì Developer sẽ làm các phần đó.

## Trạng thái trước khi thay đổi

- `game-flow-v0.1.md` đã mô tả end-to-end flow và một inventory tối thiểu, nhưng chưa đủ chi tiết để UI/UX dựng từng screen/state và biến thể.
- Một lát P2.1 command reliability từng được bắt đầu trên working tree trong turn hiện tại, vượt quá ranh giới Product/UX vừa được người dùng xác nhận.
- Tracker vẫn để UX-02 ở `Tuần này` và chưa có artifact đáp ứng acceptance criteria.
- Repo yêu cầu đọc `AGENT.md`, nhưng file này không tồn tại; `AGENTS.md` hiện hữu đã được dùng làm nguồn quy tắc repository.

## Giả thuyết

Một journey + screen/state inventory độc lập, dùng intent/outcome thay vì protocol, sẽ giúp UI/UX tiếp tục prototype ngay bằng dữ liệu giả mà không chồng lấn với room/matchmaking backend của Developer.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Phạm vi | Product/UX và reliability backend bị trộn | Product/UX sở hữu journey/screen; Developer sở hữu room/match/realtime internals | `development-plan.md`, tài liệu UX mới | Tránh hai track triển khai chồng nhau |
| Screen inventory | 14 dòng tối thiểu | Journey end-to-end với mục tiêu, CTA, state, error, privacy và transition | `player-journey-and-screen-inventory-v0.1.md` | Đủ đầu vào cho prototype/review |
| Result/rematch | Mô tả luật mức cao | Bao phủ request, receive, cancel, accept, decline, opponent left và create new room intent | tài liệu UX mới | Loại dead-end sau trận |
| Handoff | Chưa có ranh giới theo dữ liệu | UI phát intent/hiển thị outcome; Developer quyết định API, protocol và lifecycle | tài liệu UX mới | Giữ đúng ownership |
| Tracker | UX-02 `Tuần này` | UX-02 `Playtest/Review`, link artifact và tiêu chí review | `task-tracker.md` | Phản ánh artifact đã có |

Lát P2.1 backend reliability đã được bỏ hoàn toàn trước khi tạo record này. Các thay đổi MIG-02 Phase 1 có trước vẫn được giữ nguyên và không thuộc lần revert phạm vi này.

## Thay đổi role/rule

Không có. Tài liệu UX chỉ phản ánh các luật đã có, gồm ngưỡng Hội đồng theo trọng số, privacy skill đêm, Kẻ Thế Mạng, Thanh trừng và Final Duel.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Tiếp tục P2.1 command reliability | Bắt đầu thêm command ID/state version/idempotency vào runtime room | INCONCLUSIVE | Bỏ | Ngoài ownership người dùng giao cho track này |
| Tách UX journey khỏi backend protocol | Đặc tả screen bằng intent/outcome và state hiển thị | PASS qua static review phạm vi | Giữ | UI/UX có thể prototype độc lập với backend |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Static scope review | Tìm diff ở session/server/shared event contract | Không còn thay đổi P2.1 ngoài phạm vi | Không còn diff ở các file backend P2.1 | PASS |
| T-002 | Static document review | Đối chiếu Game Flow mục 2–10 với inventory mới | Có state từ Home đến Result/rematch/create room | Bao phủ toàn bộ state và nhánh sau trận | PASS |
| T-003 | Automated workspace check | `pnpm tf check` | 4/4 workspace pass | Spec-reviewer 51, web 63, game-core 88; 4/4 workspace pass | PASS |
| T-004 | Static diff | `git diff --check` | Không whitespace error | Không có output | PASS |

### Lệnh đã chạy

```bash
git status --short
rg -n "commandId|stateVersion|idempotent|P2\.1|NET-02|0006-version" docs apps packages
git diff -- apps/web/app/features/game/session/game-session-machine.ts \
  apps/web/server/game-room-server.ts apps/web/server/game-websocket.ts \
  packages/shared-types/src/events.ts
pnpm tf check
git diff --check
```

### Output quan trọng

```text
Không còn diff trong bốn vùng backend P2.1 đã kiểm tra.
Các reference commandId/stateVersion còn lại thuộc tài liệu lịch sử/game-flow cho Developer,
không phải implementation của track UI/UX.
All 4 workspace checks passed: spec-reviewer 51, web 63, game-core 88.
```

## Failure log

### F-001 — Lát implementation đi ngoài phạm vi ownership

- Build/commit/seed: working tree, chưa commit
- Reproduction: bắt đầu P2.1 command reliability sau MIG-02
- Expected: tiếp tục gameflow/UX Phase 1
- Actual: chạm session machine, room server, WebSocket và shared event contract
- Root cause: Xác định — diễn giải “phase tiếp theo” theo technical migration thay vì ownership Product/UX
- Fix/decision: revert riêng toàn bộ thay đổi P2.1, giữ MIG-02 và chốt scope trong artifact
- Verify lại: PASS bằng diff review và full workspace check 4/4
- Commit fix: Chưa commit

## Quyết định sau implementation

### Đã chốt

- Track này chỉ làm gameflow và UX flow end-to-end.
- Tạo/vào phòng và rematch được mô tả ở mức trải nghiệm, intent và state hiển thị.
- Room allocation, matchmaking, realtime, reconnect internals, retry/version/idempotency và persistence do Developer phụ trách.
- UX prototype được phép chạy hoàn toàn bằng fixture/mock data.

### Tạm giữ để test thêm

- Thứ tự ưu tiên Tạo phòng/Vào bằng mã trên Home.
- Bình minh tự chuyển hay cần người chơi xác nhận đã đọc.
- Rematch giữ seat A/B hay luân phiên người đi trước.

### Bị loại/revert

- P2.1 command reliability do track hiện tại triển khai.

### Câu hỏi mở

- Có nickname trong Alpha không?
- `Đối thủ khác` ở Alpha chỉ quay Home hay cần matchmaking về sau?

## Ảnh hưởng

- Game design: Không đổi luật; flow nguồn được liên kết với inventory chi tiết.
- UI/UX: Có artifact end-to-end để dựng graybox/prototype và review state.
- Kỹ thuật: Không thêm runtime/backend behavior; ownership Developer được ghi rõ.
- Data/analytics: Chưa thêm event analytics.
- Scope/roadmap: UX-02 chuyển sang Playtest/Review; UX-03 là bước hợp lý tiếp theo.

## File và artifact liên quan

- Code: Không có code mới trong scope correction/UX inventory.
- Docs/ADR: `docs/game-design/player-journey-and-screen-inventory-v0.1.md`, `docs/game-design/game-flow-v0.1.md`, tracker và journey indexes.
- Screenshot/video: Chưa có.
- Test report: `docs/journey/verification-log.md`.
- Commit/PR: `0e97723`.

## Bước tiếp theo

- [ ] Dựng prototype click-through các state cốt lõi bằng fixture/mock data — UI/UX Game — UX-03.
- [ ] Review 10 scenario UX và ghi điểm người chơi phải hỏi — UI/UX + PO — trước khi chốt UX-02.
- [ ] Nối room/realtime backend vào các intent/outcome đã mô tả — Developer — theo DEV-01/DEV-02/DEV-03.

## Giới hạn bằng chứng

Static document review không chứng minh người chơi hiểu flow, visual hierarchy đủ tốt, timing không leak thông tin hoặc hai client đồng bộ. Chưa có prototype interaction, visual review hoặc human playtest cho artifact mới.
