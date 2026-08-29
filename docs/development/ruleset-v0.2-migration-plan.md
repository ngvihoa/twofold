# Kế hoạch đồng bộ Ruleset v0.2 từ Game Flow Demo

- **Trạng thái:** Draft để review và triển khai dần
- **Ngày tạo:** 29/08/2026
- **Nguồn tham chiếu hành vi:** `apps/spec-reviewer/game-flow-demo`
- **Phạm vi ảnh hưởng:** `packages/shared-types`, `packages/game-core`, `apps/web`, `apps/spec-reviewer`

---

## 1. Mục tiêu và phân định nguồn sự thật

Game flow trong `apps/spec-reviewer/game-flow-demo` được chọn làm nguồn tham chiếu cho ruleset mới v0.2. Trong giai đoạn migration, hành vi của prototype được dùng để xác định rule mong muốn, nhưng không copy nguyên trạng các chi tiết chỉ phục vụ demo như bot local, setup tuần tự A rồi B, delay animation hoặc client chủ động gọi `night.resolve`.

Sau migration, thứ tự nguồn sự thật cần là:

1. Tài liệu ruleset v0.2: mô tả luật đã được review.
2. `packages/game-core`: executable ruleset và authoritative state machine.
3. `packages/shared-types`: contract giữa core, server và web.
4. `apps/web` và `apps/spec-reviewer`: render player view và gửi action, không tự xử lý rule.

`spec-reviewer` nên import `game-core` sau khi port hoàn tất để tránh duy trì hai engine độc lập.

## 2. Tóm tắt khác biệt với v0.1

| Nhóm | Ruleset demo v0.2 | Trạng thái v0.1 hiện tại | Mức ảnh hưởng |
|---|---|---|---|
| Deck | 1 Dân, 2 Sói, Tiên tri, Bảo vệ, Phù thủy, Xạ thủ, Báo thù, Mục sư, Sói Hộ Vệ | 2 Dân, 2 Sói, Tiên tri, Bảo vệ, Phù thủy, Thợ săn, Trưởng làng, Ngụy trang | Blocker |
| Phase | Setup, Day A/B, Night plan, Defense, Resolution, Dawn, Council, Final Duel | Setup, Countdown, Day, Night, Dawn, Calamity, Ended | Blocker |
| Hội đồng | Từ Vòng 3, ba role phe Dân, xử lý đồng thời, có Wolf Guard rescue | Treo cổ trực tiếp trong Day action | Blocker |
| Action | Action riêng theo từng phase và ability | `USE_SKILL`, `HANG`, `PASS`, `HUNTER_REVENGE` | Blocker |
| Card state | Alive, revealed, shielded và resource độc lập | Một `CardStatus` và ba field `skillUsed*` | Blocker |
| Late game | Blood Moon từ Vòng 6 và Final Duel khi còn 1–1 | Calamity từ Vòng 7, thắng khi đối thủ hết bài | Rule conflict |
| Web | Flow demo tương đối đầy đủ | Local mock, treo cổ dùng kết quả ngẫu nhiên | Chưa tích hợp |

---

## 3. Roles và Deck

> **Tiến độ:** Đã triển khai phần role ID, ability ID, role definition và standard deck ngày 29/08/2026. Resource state và action behavior vẫn thuộc các phần migration sau.

### 3.1. Bộ bài chuẩn đề xuất

```text
1 × VILLAGER
2 × WEREWOLF
1 × SEER
1 × GUARD
1 × WITCH
1 × SHOOTER
1 × AVENGER
1 × PRIEST
1 × WOLF_GUARD
```

Role bị loại khỏi ruleset v0.2:

- `HUNTER`
- `MAYOR`
- `DISGUISER`
- Bản sao `VILLAGER` thứ hai

Role thêm mới:

- `SHOOTER`
- `AVENGER`
- `PRIEST`
- `WOLF_GUARD`

Không map `SHOOTER` hoặc `AVENGER` sang `HUNTER`, vì behavior không tương đương.

### 3.2. Phân chia responsibility

`shared-types` chỉ giữ ID và schema dùng chung:

```ts
type RoleId =
  | 'VILLAGER'
  | 'WEREWOLF'
  | 'SEER'
  | 'GUARD'
  | 'WITCH'
  | 'SHOOTER'
  | 'AVENGER'
  | 'PRIEST'
  | 'WOLF_GUARD';

type Faction = 'VILLAGE' | 'WEREWOLF';
```

`game-core` giữ metadata và behavior:

```ts
interface RoleDefinition {
  id: RoleId;
  faction: Faction;
  abilities: AbilityId[];
}
```

Web không tự suy luận faction hoặc khả năng hành động từ tên role.

### 3.3. Resource kỹ năng

Thay `skillUsedDay`, `skillUsedNight`, `skillUsedTotal` bằng charge theo ability:

```ts
type AbilityResources = Partial<Record<AbilityId, number>>;
```

| Ability | Charge ban đầu |
|---|---:|
| Guard | 3 |
| Seer inspect | 3 |
| Witch revive | 1 |
| Witch poison | 1 |
| Shooter bullet | 1 |
| Priest holy water | 1 |
| Wolf Guard rescue | 1 |
| Werewolf attack | Không giới hạn |
| Avenger mark | Không giới hạn, chỉ một mark đang hoạt động |

---

## 4. Card State

### 4.1. Trạng thái trực giao

Không dùng một enum duy nhất để biểu diễn toàn bộ trạng thái. Một lá có thể vừa lộ, vừa sống và vừa được bảo vệ.

```ts
interface CardState {
  id: CardId;
  position: number;
  owner: PlayerId;
  role: RoleId;

  alive: boolean;
  revealed: boolean;
  shielded: boolean;

  resources: AbilityResources;
  councilCooldown: number;
}
```

Nếu UI cần `HIDDEN`, `REVEALED` hoặc `DEAD`, giá trị này được derive từ state thay vì lưu trong master state.

Rule bắt buộc: card chết luôn được công khai role.

### 4.2. Card identity

Chuẩn hóa ID theo prototype:

```text
A1…A10
B1…B10
```

- `position` có giá trị 1–10.
- Sau khi setup khóa, ID không được đổi trong suốt trận.
- Không dùng song song format `A_0` và `A1`.

### 4.3. State không thuộc card

Các trạng thái sau đặt ở player hoặc round state:

- `lastGuardTarget`
- `revengeTarget`
- `bloodMoonReadyRound`
- pending Council, Night và Defense order
- private Seer intel

---

## 5. Player State

```ts
interface PlayerGameState {
  id: PlayerId;
  board: CardState[];

  setupLocked: boolean;

  councilOrder: CouncilOrder | null;
  councilReactionOrder: CouncilReactionOrder | null;
  dayActionSubmitted: boolean;
  nightOrder: NightOrder | null;
  defenseOrder: DefenseOrder | null;
  finalGuess: RoleId | null;

  lastGuardTarget: CardId | null;
  revengeTarget: CardId | null;
  bloodMoonReadyRound: number;

  privateIntel: PrivateIntelEntry[];
}
```

Đề xuất bỏ `eliminationSpent`. Budget được mô hình hóa trực tiếp theo phase:

- một Day Main Action;
- một Night Main Order;
- Council và Defense là action phụ tại phase riêng.

---

## 6. Game State

```ts
interface GameState {
  gameId: string;
  seed: string;
  round: number;
  phase: GamePhase;

  players: Record<PlayerId, PlayerGameState>;

  pendingResolution: PendingResolution | null;
  result: GameResult | null;
  events: GameEvent[];
}
```

Không đưa WebSocket connection, reconnect timer hoặc countdown animation vào authoritative game state. Chúng thuộc room/session state.

---

## 7. Rule Flow

### 7.1. Phase chuẩn đề xuất

```ts
type GamePhase =
  | 'SETUP'
  | 'DAY_A'
  | 'DAY_B'
  | 'NIGHT_PLAN'
  | 'DUSK_REVEAL'
  | 'DUSK_DEFENSE'
  | 'NIGHT_RESOLUTION'
  | 'DAWN'
  | 'COUNCIL_PLAN'
  | 'COUNCIL_RESOLUTION'
  | 'FINAL_DUEL'
  | 'ENDED';
```

```text
SETUP
  → DAY_A
  → DAY_B
  → NIGHT_PLAN
  → DUSK_REVEAL
  → DUSK_DEFENSE
  → NIGHT_RESOLUTION
  → DAWN
      ├─ round < 3 → DAY_A
      ├─ round ≥ 3 → COUNCIL_PLAN → COUNCIL_RESOLUTION → DAY_A
      ├─ còn 1–1 → FINAL_DUEL
      └─ một bên hết bài → ENDED
```

### 7.2. Setup

Prototype dùng `setup-A → setup-B` vì chạy local một người. Production dùng setup đồng thời:

1. Hai bên bí mật sắp xếp.
2. Mỗi bên gửi `SETUP_LOCK`.
3. Khi cả hai đã khóa, chuyển sang `DAY_A`.

Đếm ngược ba giây là presentation/session behavior, không phải game rule.

### 7.3. Day

Thứ tự Day vẫn là A rồi B. Mỗi bên chọn đúng một:

- pass;
- Shooter shoot;
- Avenger mark;
- Priest purify;
- Witch revive.

Hội đồng không tiêu Day Main Action.

Sau mọi action có thể gây chết:

1. Resolve death và reaction.
2. Kiểm tra board trống.
3. Kiểm tra trạng thái 1–1.
4. Nếu chưa kết thúc mới chuyển lượt.

### 7.4. Night plan, reveal và Defense

Hai bên khóa Night Order đồng thời và bí mật. Sau khi cả hai khóa:

1. Công khai source của `attack`, `inspect`, `poison`.
2. Không công khai target.
3. `bloodmoon` không có card source.
4. Chuyển sang Defense.
5. Hai bên bí mật chọn khiên hoặc pass.
6. Khi cả hai khóa, công khai vị trí khiên.
7. Server tự resolve.

Client không gửi `night.resolve`. Action này trong prototype chỉ phục vụ animation. Server sinh event sequence và timestamp để web trình bày.

### 7.5. Dawn

Dawn công bố và cleanup:

- card chết và role thật;
- effect bị shield chặn;
- revenge chain;
- reset shield;
- hết hạn Avenger mark;
- tăng round;
- kiểm tra win hoặc Final Duel;
- mở Council từ Vòng 3.

### 7.6. Council

Council là action phụ, đồng thời cho hai bên.

Accusation yêu cầu:

- đúng ba card phe Dân còn sống;
- card đang cooldown không được tham gia;
- voter có thể đang ẩn và sẽ lộ khi resolution;
- mục tiêu đã lộ thì không cần đoán;
- mục tiêu còn ẩn chỉ được đoán role còn khả thi trong deck.

Nếu đoán sai, ba voter bị khóa khỏi Council kế tiếp. Nếu đoán đúng, target chết trừ khi Wolf Guard rescue thành công.

Đề xuất Wolf Guard protection là một `CouncilReactionOrder` độc lập, để một bên có thể vừa accusation vừa bí mật bảo kê. Đây là quyết định còn cần review.

---

## 8. Action Contract

Thay `USE_SKILL` chung bằng discriminated union cụ thể:

```ts
type GameAction =
  | SetupLockAction
  | CouncilAccuseAction
  | CouncilProtectAction
  | CouncilPassAction
  | DayAction
  | NightOrderAction
  | DefenseOrderAction
  | FinalGuessAction
  | SurrenderAction;
```

Ví dụ Day action:

```ts
type DayAction =
  | { type: 'DAY_SUBMIT'; kind: 'PASS' }
  | { type: 'DAY_SUBMIT'; kind: 'SHOOT'; sourceId: CardId; targetId: CardId }
  | { type: 'DAY_SUBMIT'; kind: 'MARK'; sourceId: CardId; targetId: CardId }
  | { type: 'DAY_SUBMIT'; kind: 'PURIFY'; sourceId: CardId; targetId: CardId }
  | { type: 'DAY_SUBMIT'; kind: 'REVIVE'; sourceId: CardId; targetId: CardId };
```

Actor không nằm trong payload nếu server có thể lấy từ authenticated session.

---

## 9. Resolution Rules

Night resolution dùng pipeline xác định:

1. Snapshot mọi order đã khóa.
2. Validate lại source và target.
3. Consume charge.
4. Kiểm tra shield.
5. Sinh effect/result.
6. Gom pending deaths.
7. Apply deaths đồng thời.
8. Resolve Avenger chain.
9. Reveal mọi card chết.
10. Kiểm tra kết quả.
11. Cleanup round state.

Rule lấy từ prototype:

- Khiên chặn attack, poison, inspect và Blood Moon.
- Charge vẫn bị trừ nếu effect bị khiên chặn.
- Source vẫn thực hiện action nếu chết trong cùng resolution.
- Hai board cùng hết bài tạo kết quả hòa.
- Witch revive giữ target ở trạng thái công khai.
- Blood Moon mở từ Vòng 6, cooldown hai vòng.

---

## 10. End Game

Thứ tự kiểm tra:

```text
Một hoặc hai board hết bài
  → Win hoặc Draw

Nếu cả hai còn đúng một card
  → Final Duel

Các trường hợp khác
  → Tiếp tục game
```

Final Duel phải được kiểm tra sau Council, Day và Night, không chỉ sau Night.

`WinReason` cần hỗ trợ:

```ts
type WinReason =
  | 'ELIMINATION'
  | 'FINAL_DUEL'
  | 'SURRENDER'
  | 'TIMEOUT'
  | 'DRAW_MUTUAL_ELIMINATION'
  | 'DRAW_FINAL_DUEL';
```

Đề xuất loại `CALAMITY` khỏi v0.2 và dùng Blood Moon làm cơ chế ép late-game duy nhất.

---

## 11. Public và Private View

Không gửi master state trực tiếp cho client.

### 11.1. Public card

```ts
interface PublicCardView {
  id: CardId;
  position: number;
  alive: boolean;
  revealed: boolean;
  role: RoleId | null;
  shielded: boolean;
  stagedAsSource: boolean;
  councilEligible: boolean;
}
```

### 11.2. Private player view

Player view bổ sung:

- role toàn bộ card của mình;
- resource còn lại;
- kết quả Seer;
- order chính mình đã khóa;
- Blood Moon cooldown;
- target restriction và action hợp lệ.

Không gửi cho đối thủ:

- target Night Order;
- Wolf Guard protection;
- Seer result;
- role card chưa lộ.

---

## 12. Events và Log

Core sinh structured event thay vì chuỗi tiếng Việt:

```ts
interface GameEvent {
  id: string;
  round: number;
  phase: GamePhase;
  type: GameEventType;
  visibility: 'PUBLIC' | PlayerId;
  payload: unknown;
}
```

Các event chính:

- `NIGHT_SOURCE_REVEALED`
- `SHIELD_PLACED`
- `EFFECT_BLOCKED`
- `CARD_ELIMINATED`
- `CARD_REVIVED`
- `COUNCIL_FAILED`
- `WOLF_GUARD_RESCUED`
- `PRIVATE_INSPECTION_RESULT`

Web chịu trách nhiệm dịch event thành nội dung và animation. Structured event cũng phục vụ reconnect, replay và audit rule.

---

## 13. Web Responsibilities

`apps/web` chuyển từ local mock sang flow:

```text
PlayerGameView
  → phase presenter
  → valid action controls
  → submit action
  → nhận state/event mới
```

Web không được:

- dùng random để quyết định kết quả;
- tự chuyển authoritative phase;
- tự tính role đúng hoặc sai;
- tự loại hoặc hồi sinh card;
- tự quyết định target hợp lệ.

Layout và animation từ demo có thể tái sử dụng, nhưng presentation state phải tách khỏi authoritative game state.

---

## 14. Test Strategy

### Shared types

- Parse từng action variant.
- Reject payload thiếu source, target hoặc voters.
- Parse public/private view mà không lộ hidden role.

### Game core

- State transition table cho toàn bộ phase.
- Mỗi role có validation và resolution test riêng.
- Council đúng, sai, cooldown và Wolf Guard rescue.
- Shield matrix với attack, poison, inspect và Blood Moon.
- Simultaneous deaths và Avenger chain.
- Final Duel sau Day, Council và Night.
- Resource/cooldown reset theo vòng.

### Information security

- Snapshot Player A và Player B sau mỗi phase.
- Assert target/action kín không xuất hiện trong view đối thủ.
- Assert private Seer intel chỉ xuất hiện cho owner.

### Parity

- Dùng cùng seed và action sequence cho prototype và core TypeScript.
- So sánh public outcome, private intel và result trước khi xóa engine prototype.

---

## 15. Kế hoạch triển khai theo PR

### PR 1 — Shared types v0.2

- [x] Role và deck mới.
- [ ] Card state trực giao.
- [ ] Phase mới.
- [ ] Action union mới.
- [ ] Public/private view.
- [ ] Structured events.
- [ ] Adapter tạm cho contract v0.1 nếu room/session còn cần.

### PR 2 — Game core v0.2

- [ ] Port engine prototype sang TypeScript.
- [ ] Tách role definition, validation và resolution.
- [ ] Server-owned night resolution.
- [ ] Sửa Final Duel ở mọi death boundary.
- [ ] Sửa consecutive guard behavior theo quyết định đã chốt.
- [ ] Thêm unit, transition và information-leak tests.

### PR 3 — Spec reviewer adapter

- [ ] Cho demo import `game-core`.
- [ ] Bot chỉ sử dụng public view và private view của chính nó.
- [ ] Giữ animation/presentation hiện tại.
- [ ] Chạy parity tests.
- [ ] Xóa engine `.mjs` trùng lặp sau khi parity pass.

### PR 4 — Web integration

- [ ] Setup reorder thật.
- [ ] Render player view mới.
- [ ] Action panel theo phase.
- [ ] Event-driven Council, Dusk và Dawn presentation.
- [ ] Loại bỏ toàn bộ mock rule và random outcome.

### PR 5 — Cleanup và documentation

- [ ] Đánh dấu tài liệu v0.1 là archived.
- [ ] Tạo tài liệu game rules v0.2 chính thức.
- [ ] Xóa `CALAMITY`, role cũ và compatibility adapter không còn dùng.
- [ ] Ghi lại các quyết định rule trong `docs/decisions`.

---

## 16. Decision Log cần review

| ID | Câu hỏi | Khuyến nghị hiện tại | Trạng thái |
|---|---|---|---|
| RULE-001 | Wolf Guard protection có độc lập với accusation không? | Có, dùng reaction order riêng | Chưa chốt |
| RULE-002 | Pass một vòng có reset hạn chế không guard cùng target liên tiếp không? | Có reset; chỉ cấm đúng hai vòng guard liên tiếp | Chưa chốt |
| RULE-003 | Final Duel có kích hoạt sau mọi resolution tạo trạng thái 1–1 không? | Có | Chưa chốt |
| RULE-004 | Có bỏ hoàn toàn Calamity để chỉ giữ Blood Moon không? | Có trong v0.2 | Chưa chốt |
| RULE-005 | Card source chết trong cùng Night resolution có còn resolve action không? | Có, resolve từ snapshot order | Chưa chốt |
| RULE-006 | Charge có bị tiêu khi effect bị shield chặn không? | Có | Chưa chốt |
| RULE-007 | Có giữ format wire `PLAYER_A/B` hay đổi thành `A/B` không? | Giữ `PLAYER_A/B`; chỉ Card ID dùng `A1/B1` | Chưa chốt |

Khi một quyết định được chốt, cập nhật bảng này và tạo ADR trong `docs/decisions` nếu quyết định ảnh hưởng lớn đến contract hoặc state machine.

## 17. Definition of Done cho migration

- Chỉ còn một authoritative engine trong `packages/game-core`.
- `spec-reviewer` và `web` dùng cùng `shared-types` và `game-core` behavior.
- Không có rule resolution trong React hoặc UI script.
- Mọi phase/action của flow demo có schema và test.
- Public/private view vượt qua information-leak tests.
- Full match từ setup đến Final Duel hoặc elimination chạy được bằng deterministic test sequence.
- Tài liệu ruleset v0.2 và decision log phản ánh đúng implementation.
