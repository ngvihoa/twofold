# MIG-02 — Outcome projection và command idempotency

## Migration contract

- Ngày: 02/09/2026
- Spec source freeze: integrated commit `4b96da9`; `docs/game-design/game-flow-v0.1.md`; prototype P0.8–P0.10
- Runtime baseline: `a3ef53b`
- Owner: Developer
- Trạng thái: Hoàn thành trên working tree, chờ commit/review
- Scope: information boundary của event/outcome; state version; WebSocket
  command envelope; server dedupe/stale rejection; XState reconnect retry;
  presentation/history consumer.
- Out of scope: role, deck, phase và resolution rule; persistence/event store;
  full-state digest; raw authoritative transcript qua network; UI redesign.

## Known differences trước migration

1. `GamePlayerViewV2.events` gửi domain event đã filter visibility nhưng vẫn
   dùng cùng payload với authoritative history.
2. `PURGE_RESOLVED` công khai player và target đã chọn, trái P0.10 chỉ cho phép
   `rule` + batch `status`.
3. `CARD_ELIMINATED` mang structured cause và `EFFECT_BLOCKED` mang effect kind
   trên wire thay vì outcome tối thiểu.
4. `SUBMIT_ACTION` chỉ có raw action; snapshot không có revision; server không
   dedupe retry hoặc reject command dựa trên state cũ.

## Contract changes

- `GameState` thêm monotonic `version` và public `outcomes`; authoritative
  `events` vẫn giữ nguyên cho core/replay.
- `GamePlayerViewV2` thay `events` bằng `outcomes` và `privateEvents`;
  `ABILITY_RESOLVED` giữ source/target chỉ cho đúng owner theo P0.9.
- Public allowlist gồm `CARD_REVEALED`, `CARD_ELIMINATED`, `CARD_SAVED`,
  `CARD_REVIVED`, `COUNCIL_RESOLVED`, `COUNCIL_PASSED`, `PURGE_RESOLVED` và
  `MATCH_ENDED`.
- Night elimination chưa reveal dùng `role: null`, `faction: null`; không làm
  thay đổi rule visibility đã migrate ở MIG-01.
- `SUBMIT_ACTION.payload` thành `{ commandId, expectedVersion, action }`.
- `ACTION_REJECTED` trả `commandId` và `currentVersion` để client reconcile.

## Resolution và retry semantics

1. `GameEngine` chỉ tăng version sau action qua validation thành công.
2. Room cache kết quả theo session + command ID. Retry cùng ID/payload không
   dispatch lần hai; cùng ID nhưng payload khác bị `COMMAND_ID_CONFLICT`.
3. Command mới có version cũ bị `STALE_STATE` và nhận snapshot hiện tại.
4. Session actor giữ pending command khi transport rớt. Sau reconnect, snapshot
   cùng version khiến actor gửi lại đúng ID; snapshot version đã tiến sẽ thay
   baseline và kết thúc pending.

## Backward compatibility và rollout

- Đây là breaking wire-contract change trong vertical slice chưa phát hành;
  server và web được migrate atomically, không giữ dual schema.
- Không có persisted match cần data migration. Rollback là revert toàn bộ
  MIG-02; không rollback riêng shared-types vì consumer sẽ không parse được.

## Test plan và acceptance

- Unit: public projection không chứa source/cause/effect kind/Purge target.
- Player view: hai recipient nhận cùng public outcomes; Seer intel chỉ nằm trong
  `privateEvents` của đúng seat.
- Engine: version tăng đúng một lần khi accepted và không tăng khi validation fail.
- Server: accepted command dedupe; stale command bị reject mà state không đổi.
- XState/web: command envelope đúng; reconnect retry giữ nguyên command ID;
  presentation/history dùng projected timeline.
- Workspace: game-core tests, web tests/typecheck/build và spec boundary check
  đều phải pass trước khi đóng migration.

## Khác biệt cố ý còn lại

- P0.8 full authoritative action transcript và canonical full-state digest chưa
  được port; chúng cần quyết định persistence/event store ở P1.
- Runtime giữ `phase` và stable `id` trong outcome envelope để presentation
  machine phân lane/dedupe; đây là metadata runtime, không chứa hidden payload.
- `engine.mjs` và `engine.test.mjs` tiếp tục là PO reference, không bị xóa hoặc
  import vào runtime.

## Verification

- `pnpm tf check`: PASS — 4/4 workspace.
- Spec reviewer: 5/5 test group, boundary reviewer↔runtime PASS.
- Game core: 84/84 tests PASS.
- Web: 60/60 tests, TypeScript và production client/SSR/Nitro build PASS.
- `git diff --check`: PASS.
