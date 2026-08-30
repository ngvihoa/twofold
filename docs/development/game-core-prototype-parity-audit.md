# Game Core ↔ Prototype Parity Audit

- **Ngày audit:** 30/08/2026
- **Prototype tham chiếu:** `apps/spec-reviewer/game-flow-demo/engine.mjs`
- **Target:** `packages/game-core`
- **Phạm vi:** rule/state/resolution; không so animation, bot local hoặc timing UI

## Kết luận hiện tại

Core TypeScript đã có full-match deterministic từ Setup tới Final Duel/Ended và
đã port toàn bộ vertical slice chính: Day, Council, Night/Defense, Blood Moon,
Purge và Final Duel. Smoke parity tự động hiện so sánh Blood Moon và Final Duel
trực tiếp với prototype.

Ba mismatch về Shooter và identity qua Purge SWAP đã được xử lý theo prototype:
Shooter không reveal source; Guard memory và Seer intel theo immutable card
instance thay vì slot. `GameEngine` cũng đã loại các action method v0.1 và chỉ
dispatch gameplay action qua rule pipeline. Tuy nhiên, chưa thể tuyên bố parity
hoàn toàn vì vẫn còn thiếu normalized full-match trace và contract v0.2 trong
`shared-types`.

## Automated evidence

| Bằng chứng | File | Trạng thái |
|---|---|---|
| Setup → Night simultaneous death → Final Duel → Ended | `packages/game-core/src/full-match.test.ts` | Pass |
| Setup → Night → elimination → Ended | `packages/game-core/src/full-match.test.ts` | Pass |
| Blood Moon kill/cooldown so với prototype | `packages/game-core/src/prototype-parity.test.ts` | Pass |
| Final Duel cả hai đoán đúng so với prototype | `packages/game-core/src/prototype-parity.test.ts` | Pass |
| Day/Council/Night/Purge đều có thể mở Final Duel | `packages/game-core/src/rule-pipeline.test.ts` | Pass |

## Parity matrix

| Khu vực | Prototype | Game core | Đánh giá |
|---|---|---|---|
| Deck/role | 10 role: 1 Villager, 2 Wolf và 7 role chức năng | Cùng composition | Khớp |
| Setup | Local tuần tự A rồi B | Hai player khóa độc lập | Intentional divergence cho multiplayer |
| Phase spine | Day → Council V2+ → Night → Defense → Dawn → Purge V6+ | Cùng spine bằng discriminated phase state | Khớp |
| Day budget | `eliminationSpent` và một action mỗi turn | Một `DAY_SUBMIT` do phase machine quản lý | Tương đương outcome; intentional state divergence |
| Seer usage | Không giới hạn tổng lượt; không soi lại phe sáng đã biết | Ability không có `remainingUses`; cùng restriction | Đã sửa parity trong audit này |
| Seer second dark inspect | Lần hai giết target phe tối đã biết | Cùng rule qua private intel | Khớp |
| Guard usage | Không charge; cấm cùng card hai đêm liên tiếp | `lastTarget` trỏ immutable instance | Khớp, kể cả qua SWAP |
| Night shield | Chặn attack, poison, Blood Moon; không chặn inspect | Cùng shield matrix | Khớp |
| Night visibility | Source role action lộ; hidden victim giữ ẩn | Cùng lifecycle/visibility rule | Khớp |
| Council | Một slot độc quyền accuse/protect/pass | Accusation và reaction độc lập; chờ đủ bốn slot | Intentional divergence đã chốt tạm RULE-001 |
| Council failure | Voter bị khóa Council kế tiếp | `COUNCIL_LOCK` hết hạn sau Council kế tiếp | Khớp |
| Wolf Guard | Chỉ consume/reveal khi cứu đúng | Cùng rule | Khớp |
| Blood Moon | V6+, target đã lộ, cooldown 2, shield chặn | Cùng rule; player-owned ability | Khớp; có smoke parity |
| Purge CUT | Hai bên tự cắt card, victim reveal | Snapshot simultaneous deaths | Khớp outcome |
| Purge REVEAL | Null target nếu không còn card ẩn | Cùng rule | Khớp |
| Purge LOCK | Chặn active skill và Vote trong round | `PURGE_LOCK` chặn ability source/Council, hết hạn sau Night | Khớp |
| Purge SWAP | Card instance di chuyển, slot ID giữ nguyên | Hoán đổi `occupant`; slot ID/owner giữ nguyên | Khớp |
| Day reveal | Shooter ẩn; Avenger/Priest/Witch lộ khi dùng | Cùng policy theo từng ability | Khớp |
| Final Duel | Hai guess kín; một đúng thắng, cùng đúng/sai hòa | Cùng rule và public result event | Khớp; có smoke parity |
| Presentation | Log string + client animation state | Structured deterministic events | Intentional architecture divergence |

## Intentional divergences đã chấp nhận

1. Setup production khóa đồng thời thay vì flow local `setup-A → setup-B`.
2. Council có hai submission độc lập để player vừa accuse vừa reaction.
3. Core không giữ `eliminationSpent`; budget được biểu diễn bằng phase/action slot.
4. Core không dùng `Infinity` trong serialized state. Ability không giới hạn được
   biểu diễn bằng variant không có `remainingUses`.
5. Core tự resolve Night sau đủ Defense order; client không gửi `night.resolve`.
6. Structured event không chứa delay/animation timing.
7. `MasterGameState.logs` chỉ là compatibility field v0.1, không authoritative
   và không được derive từ structured events. `GameState.events` là history duy
   nhất cho reconnect, replay, sync và audit.

## Mismatch và notable cần xử lý

| ID | Vấn đề | Ảnh hưởng | Khuyến nghị |
|---|---|---|---|
| ID-01 | Guard memory phải theo card vật lý qua Purge SWAP. | Rule Guard sau V7+ | **Đã xử lý:** `lastTarget.instanceId`; test xác nhận memory đi cùng occupant. |
| ID-02 | Seer intel phải tiếp tục nhận diện đúng card sau SWAP. | Private knowledge và lần soi thứ hai | **Đã xử lý:** `targetInstanceId` + historical `observedAtSlotId`; test xác nhận mapping sau SWAP. |
| RULE-11 | Prototype Shooter không reveal source khi bắn. | Public information/balance | **Đã xử lý:** SHOOT consume resource nhưng không phát `CARD_REVEALED` cho source. |
| ARCH-01 | Gameplay mutation của `GameEngine` phải đi qua authoritative pipeline. | Tránh bypass validation/resolution. | **Đã xử lý:** bỏ action helper v0.1 và public phase-event sender; `dispatch(PlayerGameAction)` gọi `dispatchPlayerAction`. |
| CONTRACT-01 | `shared-types` chưa có phase/action/event/result reason v0.2. | Legacy view phải hạ Final Duel reason thành `null`; legacy logs không đầy đủ. | Migrate contract ở PR riêng; xóa `MasterGameState.logs`, `getPlayerView()` và legacy projection khi hoàn tất. |
| LEGACY-LOG-01 | Có nên derive `EventLogEntry[]` từ structured events không? | Có nguy cơ tạo hai event history và đưa presentation wording vào core. | **Đã chốt:** không derive. `GameState.events` authoritative; `logs` chỉ giữ để schema v0.1 parse được và sẽ bị xóa cùng legacy contract. |
| TEST-01 | Smoke parity mới bao phủ Blood Moon và Final Duel, chưa replay cùng một standard-deck action trace cho toàn trận. | Chưa đủ bằng chứng xóa prototype engine | Thêm normalized trace harness. |

## Điều kiện để tuyên bố parity và xóa prototype engine

- Có ít nhất một standard-deck trace chạy qua Council, Night, một Purge cycle và
  Final Duel/elimination ở cả hai engine, rồi so normalized public outcome.
- Player-view parity không rò hidden role, Night order, Council reaction hoặc
  private Seer intel.
- Spec reviewer chuyển sang import `game-core`; sau đó mới xóa `engine.mjs`.
