# Kế hoạch đồng bộ Ruleset v0.2 từ Game Flow Demo

- **Trạng thái:** Đang đồng bộ; rule correction 30/08/2026 cần được port theo task DEV-02A–D
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

### 1.1. Frontend state machine

Frontend sẽ sử dụng `@xstate/react` để điều phối workflow và presentation state. XState phía client không phải authoritative rules engine và không được tự quyết định kết quả game.

Phân chia responsibility:

- `packages/game-core`: validate action, resolve rule, chuyển authoritative game phase và tạo kết quả.
- Server/WebSocket layer: giữ room state, gọi `game-core` và gửi player-specific snapshot/event.
- `@xstate/react`: điều phối trạng thái UI như đang chọn action, đã submit, chờ đối thủ, reveal animation, Dawn presentation, modal và retry/error.
- React components: render từ snapshot của server kết hợp presentation state của XState.

Frontend machine phải reconcile được với server snapshot sau reconnect hoặc khi nhận state mới. Không giả định client transition luôn thành công trước khi server xác nhận.

## 2. Tóm tắt khác biệt với v0.1

| Nhóm | Ruleset demo v0.2 | Trạng thái v0.1 hiện tại | Mức ảnh hưởng |
|---|---|---|---|
| Deck | 1 Dân, 2 Sói, Tiên tri, Bảo vệ, Phù thủy, Xạ thủ, Báo thù, Mục sư, Sói Hộ Vệ | 2 Dân, 2 Sói, Tiên tri, Bảo vệ, Phù thủy, Thợ săn, Trưởng làng, Ngụy trang | Blocker |
| Phase | Setup, Day A/B, Night plan, Defense, Resolution, Dawn, Council, Final Duel | Setup, Countdown, Day, Night, Dawn, Calamity, Ended | Blocker |
| Hội đồng | Từ Vòng 2, sau Day B; ba role phe Dân, xử lý đồng thời, có Wolf Guard rescue | Treo cổ trực tiếp trong Day action | Blocker |
| Action | Action riêng theo từng phase và ability | `USE_SKILL`, `HANG`, `PASS`, `HUNTER_REVENGE` | Blocker |
| Card state | Alive, revealed, shielded và resource độc lập | Một `CardStatus` và ba field `skillUsed*` | Blocker |
| Late game | Blood Moon từ Vòng 6 và Final Duel khi còn 1–1 | Calamity từ Vòng 7, thắng khi đối thủ hết bài | Rule conflict |
| Web | Flow demo tương đối đầy đủ | Local mock, treo cổ dùng kết quả ngẫu nhiên | Chưa tích hợp |

### 2.1. Rule correction sau prototype ngày 30/08/2026

Các điểm dưới đây thay thế mô tả cũ trong bản kế hoạch ngày 29/08:

- Hội đồng bắt đầu từ **Vòng 2**, sau Day B và trước Night plan.
- Cái chết và lộ danh tính là hai transition độc lập; bài úp chết trong đêm vẫn úp theo ADR-0004.
- Source và target lệnh đêm giữ kín trong lúc chọn; source chỉ lộ tuần tự ở Bình minh theo rule kỹ năng.
- Khiên chặn attack, poison và Blood Moon; **không chặn Seer inspect**.
- Hồi sinh giữ visibility trước khi chết.
- Prototype hiện có cả Blood Moon và chu kỳ Thanh trừng từ Vòng 6. Việc giữ cả hai là giả thuyết playtest, chưa được phép xóa một cơ chế chỉ dựa trên migration plan.

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

Runtime state được khởi tạo riêng cho từng card instance, nhưng ownership nằm dưới role:

```ts
interface RoleState {
  id: RoleId;
  abilities: AbilityState[];
}
```

Không lưu runtime ability state trong `ROLE_DEFINITIONS`, vì hai card cùng role phải có state độc lập.

Web không tự suy luận faction hoặc khả năng hành động từ tên role.

### 3.3. Ability state

Thay `skillUsedDay`, `skillUsedNight`, `skillUsedTotal` bằng state riêng theo từng ability. Ability có giới hạn dùng giữ `remainingUses`; ability có memory giữ state chuyên biệt thay vì ép mọi ability thành một con số.

```ts
type AbilityState =
  | {
      abilityId: 'GUARD_PROTECT';
      lastTarget: { cardId: CardId; round: number } | null;
    }
  | { abilityId: 'SEER_INSPECT'; remainingUses: number }
  | { abilityId: 'WITCH_REVIVE'; remainingUses: number }
  | { abilityId: 'WEREWOLF_ATTACK' }
  | { abilityId: 'AVENGER_MARK' }
  // Các ability state còn lại...
```

| Ability | Giới hạn/state ban đầu |
|---|---|
| Guard | Không giới hạn lượt; `lastTarget: null` |
| Seer inspect | 3 |
| Witch revive | 1 |
| Witch poison | 1 |
| Shooter bullet | 1 |
| Priest holy water | 1 |
| Wolf Guard rescue | 1 |
| Werewolf attack | Không giới hạn |
| Avenger mark | Không giới hạn, chỉ một mark đang hoạt động |

Guard chỉ bị cấm chọn cùng target ở hai vòng liên tiếp. State lưu cả target và round của lần dùng gần nhất; nếu Guard pass hoặc không đặt khiên một vòng thì record tự trở nên cũ và target trước có thể được chọn lại mà không cần reset command.

---

## 4. Card State

> **Tiến độ:** Đã triển khai model nội bộ trong `packages/game-core` ngày 29/08/2026; tổng quát hóa effect source/Council lock và chuyển runtime ability state về dưới `RoleState` ngày 30/08/2026. DEV-02A hoàn thành ngày 30/08: lifecycle/visibility độc lập, eliminate/revive giữ visibility và reveal giữ lifecycle. Guard hiện không có charge, chỉ giữ target/round gần nhất. Chưa migrate `packages/shared-types` hoặc `apps/web`; core đang giữ legacy projection tạm thời cho contract v0.1.

### 4.1. Runtime state

Runtime state chỉ chứa lifecycle và visibility. Hai trục này độc lập để biểu diễn được bài úp đã chết.

```ts
type CardRuntimeState =
  | { life: 'ALIVE'; visibility: 'HIDDEN' | 'REVEALED' }
  | { life: 'DEAD'; visibility: 'HIDDEN' | 'REVEALED' };

interface GameCard {
  id: CardId;
  position: number;
  owner: PlayerId;
  role: RoleState;

  state: CardRuntimeState;
  effects: CardEffectState[];
}
```

Card và role có hai transition layer độc lập:

```ts
transitionCard(card, cardCommand);
transitionRole(role, {
  type: 'ABILITY_USED',
  abilityId,
  targetId,
  round,
});
```

Card command chỉ gồm `REVEAL`, `ELIMINATE`, `REVIVE`, `APPLY_EFFECT`, `REMOVE_EFFECT`, `CLEAR_EFFECTS`; không chứa command riêng cho Guard hoặc role khác. `ELIMINATE` và `REVIVE` không tự đổi visibility. `ABILITY_USED` làm giảm `remainingUses` đối với ability hữu hạn, hoặc ghi `lastTarget` đối với Guard.

Event log mô tả kết quả đã xảy ra sẽ dùng past-tense wording riêng ở lớp resolution, ví dụ `CARD_REVEALED` hoặc `EFFECT_APPLIED`.

### 4.2. Active effects

Protection không thuộc `CardRuntimeState`. Đây là effect do ability khác tạo ra và được lưu cùng các effect đang tác động lên target card.

```ts
interface CardEffectState {
  id: string;
  kind: CardEffectKind;
  source:
    | {
        type: 'ABILITY';
        abilityId: AbilityId;
        cardId: CardId;
        playerId: PlayerId;
      }
    | {
        type: 'RULE';
        rule: 'FAILED_COUNCIL';
      };
  appliedRound: number;
  expires:
    | {
        type: 'AFTER_PHASE';
        phase: 'NIGHT_RESOLUTION' | 'COUNCIL_RESOLUTION';
        round: number;
      }
    | { type: 'WHEN_TRIGGERED' }
    | { type: 'PERMANENT' };
}
```

Một card có thể chứa nhiều effect đồng thời, kể cả nhiều effect cùng loại nếu có ID khác nhau. `source` giữ provenance từ ability/resource hoặc từ game rule. Khi thêm effect mới, mở rộng `CardEffectKind` hoặc union effect thay vì thêm field mới vào card.

`councilCooldown` không còn là field riêng. Một lần buộc tội sai áp dụng effect `COUNCIL_LOCK` có source rule `FAILED_COUNCIL` và expiry `AFTER_PHASE/COUNCIL_RESOLUTION` cho ba voter liên quan. Khiên và dấu Báo thù dùng `AFTER_PHASE/NIGHT_RESOLUTION`, nên effect vẫn tồn tại trong lúc resolve đêm rồi mới được cleanup.

### 4.3. Card identity

Chuẩn hóa ID theo prototype:

```text
A1…A10
B1…B10
```

- `position` có giá trị 1–10.
- Sau khi setup khóa, ID không được đổi trong suốt trận.
- Không dùng song song format `A_0` và `A1`.

### 4.4. State không thuộc card

Ownership đã chốt:

- Guard target memory nằm trong `GUARD_PROTECT` ability state dưới `RoleState` của source card.
- Revenge target được biểu diễn bằng `REVENGE_MARK` effect trên target card.
- Blood Moon không thuộc board card; unlock/cooldown nằm trong player special-ability state.
- Pending Council, Night, Defense và Purge order nằm trong player submission của game phase.
- Private Seer intel là knowledge của player và vẫn tồn tại nếu Seer chết.

---

## 5. Player State

```ts
interface PlayerState {
  id: PlayerId;
  board: GameCard[];
  setup: { status: 'ARRANGING' } | { status: 'LOCKED' };
  submissions: {
    council: CouncilOrder | null;
    night: NightOrder | null;
    defense: DefenseOrder | null;
    purge: PurgeOrder | null;
    finalGuess: RoleId | null;
  };
  specialAbilities: PlayerSpecialAbilityState[];
  privateIntel: PrivateIntelEntry[];
}
```

Đã triển khai model nội bộ tại `packages/game-core/src/players.ts`:

- `PlayerState` là owner duy nhất của board; `MasterGameState` không còn giữ `cardsA/cardsB` song song.
- Setup dùng discriminated state `ARRANGING | LOCKED`, không dùng boolean `setupLocked`.
- Các order đồng thời được gom dưới `submissions`; `null` nghĩa là player chưa khóa order của phase đó.
- `PurgeOrder` lưu cả rule và target đã khóa để snapshot tự mô tả được resolution từ Vòng 6.
- Không thêm `dayActionSubmitted`: Day là lượt tuần tự do phase machine quản lý và resolve ngay.
- Blood Moon là `PlayerSpecialAbilityState` với `unlockRound`, `cooldownRounds`, `readyRound`.
- Seer intel nằm trong `privateIntel`, tách khỏi card để knowledge vẫn tồn tại nếu source Seer chết.
- Payload order hiện chỉ là contract tối thiểu. Validation/resolution thuộc phần Rule Flow và Action Contract.

Bỏ `eliminationSpent`. Budget được mô hình hóa trực tiếp theo phase:

- một Day Main Action;
- một Night Main Order;
- Council và Defense là action phụ tại phase riêng.

---

## 6. Game State

> **Tiến độ:** Đã triển khai `GameState` và phase machine thuần TypeScript trong
> `packages/game-core` ngày 30/08/2026. State machine dùng discriminated union,
> từ chối transition sai phase và có deterministic test đi từ Setup tới Purge
> Vòng 6. `pendingResolution` và structured presentation events thuộc DEV-02D,
> chưa được thêm vào state ở bước này.

```ts
interface GameState {
  gameId: string;
  seed: string;
  round: number;
  phase: GamePhaseState;

  players: Record<PlayerId, PlayerState>;
  result: GameResult | null;
}
```

`pendingResolution` và `events` sẽ được thêm khi triển khai resolution pipeline
và structured presentation events, không tạo placeholder chưa có hành vi.

Không đưa WebSocket connection, reconnect timer hoặc countdown animation vào authoritative game state. Chúng thuộc room/session state.

---

## 7. Rule Flow

### 7.1. Phase chuẩn đề xuất

```ts
type GamePhaseState =
  | { type: 'SETUP' }
  | { type: 'DAY_A' }
  | { type: 'DAY_B' }
  | { type: 'COUNCIL_PLAN' }
  | { type: 'COUNCIL_RESOLUTION' }
  | { type: 'NIGHT_PLAN' }
  | { type: 'DUSK_DEFENSE' }
  | { type: 'NIGHT_RESOLUTION' }
  | { type: 'DAWN' }
  | { type: 'PURGE_PLAN' }
  | { type: 'PURGE_RESOLUTION' }
  | { type: 'FINAL_DUEL' }
  | { type: 'ENDED' };
```

```text
SETUP
  → DAY_A
  → DAY_B
      ├─ round = 1 → NIGHT_PLAN
      └─ round ≥ 2 → COUNCIL_PLAN → COUNCIL_RESOLUTION → NIGHT_PLAN
  → NIGHT_PLAN
  → DUSK_DEFENSE
  → NIGHT_RESOLUTION
  → DAWN
      ├─ vòng kế < 6 → DAY_A
      ├─ vòng kế ≥ 6 → PURGE_PLAN → PURGE_RESOLUTION → DAY_A
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

### 7.4. Night plan và Defense

Hai bên khóa Night Order đồng thời và bí mật. Sau khi cả hai khóa:

1. Không công khai source, target hoặc loại action ở thời điểm khóa lệnh.
2. `bloodmoon` không có card source.
3. Chuyển sang Defense.
4. Hai bên bí mật chọn khiên hoặc pass.
5. Khi cả hai khóa, công khai vị trí khiên; role Bảo vệ và role mục tiêu vẫn ẩn nếu chưa có rule lộ khác.
6. Server resolve và tạo event cho Bình minh trình bày tuần tự A → B; source chỉ lộ khi event/rule của kỹ năng yêu cầu.

Client không gửi `night.resolve`. Action này trong prototype chỉ phục vụ animation. Server sinh event sequence và timestamp để web trình bày.

### 7.5. Dawn

Dawn công bố và cleanup:

- source kỹ năng cần lộ, effect và nguyên nhân theo event sequence;
- card chết; role chỉ công khai nếu card đã lộ trước đó hoặc có rule lộ riêng;
- effect bị shield chặn;
- revenge chain;
- reset shield;
- hết hạn Avenger mark;
- tăng round;
- kiểm tra win hoặc Final Duel;
- mở Thanh trừng từ Vòng 6 trước Day A.

### 7.6. Council

Council là action phụ từ Vòng 2, diễn ra sau Day B và trước Night plan, đồng thời cho hai bên.

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
3. Consume `remainingUses` nếu ability có giới hạn.
4. Kiểm tra shield.
5. Sinh effect/result.
6. Gom pending deaths.
7. Apply deaths đồng thời.
8. Resolve Avenger chain.
9. Giữ visibility hiện có của card chết; chỉ apply `REVEAL` khi có rule/event riêng.
10. Kiểm tra kết quả.
11. Cleanup round state.

Rule lấy từ prototype:

- Khiên chặn attack, poison và Blood Moon; không chặn Seer inspect.
- `remainingUses` vẫn bị trừ nếu effect bị khiên chặn; Guard không có charge để trừ.
- Source vẫn thực hiện action nếu chết trong cùng resolution.
- Hai board cùng hết bài tạo kết quả hòa.
- Witch revive giữ visibility target có trước khi chết.
- Blood Moon mở từ Vòng 6, cooldown hai vòng.
- Thanh trừng mở từ Vòng 6 theo chu kỳ prototype; balance của việc tồn tại cùng Blood Moon chưa xác minh.

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

Không tự loại Thanh trừng/Calamity khỏi v0.2 trong lúc migration. Prototype hiện dùng chu kỳ Thanh trừng từ Vòng 6 đồng thời với Blood Moon; GD-08 phải chốt sau playtest trước khi Dev port sâu hơn phase spine.

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

`alive: false` không suy ra `revealed: true`. Khi `revealed: false`, `role` bắt buộc là `null` kể cả card đã chết.

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
- `DAWN_PRESENTATION_COMPLETED`
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

### 13.1. XState integration

Web dùng `@xstate/react` làm state machine layer cho frontend. Dự kiến tách ít nhất hai machine:

1. `gameSessionMachine`: connection, reconnect, snapshot synchronization, submit action và server rejection.
2. `gamePresentationMachine`: selection flow, Council/Dusk/Dawn sequence, animation lock và modal state.

Authoritative `GamePhase` từ server là input để machine reconcile, không phải state do frontend tự tăng. Khi refresh hoặc reconnect, machine phải có thể khởi tạo lại hoàn toàn từ `PlayerGameView` gần nhất.

Không đưa vào XState phía frontend:

- kiểm tra target có hợp lệ theo role;
- tính hit, shield hoặc death;
- consume resource;
- chọn winner;
- tự động chuyển authoritative round/phase.

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
- Shield matrix với attack, poison và Blood Moon; test riêng chứng minh inspect không bị chặn.
- Eliminate/revive cho cả bài ẩn và bài đã lộ, không tự đổi visibility.
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
- [ ] Migrate Card State contract để hỗ trợ `DEAD + HIDDEN` theo ADR-0004.
- [ ] Phase mới.
- [ ] Action union mới.
- [ ] Public/private view.
- [ ] Structured events.
- [ ] Adapter tạm cho contract v0.1 nếu room/session còn cần.

### PR 2 — Game core v0.2

- [x] Card runtime state và active-effect collection nội bộ.
- [x] Hỗ trợ `DEAD + HIDDEN`; eliminate/revive không tự reveal và Treo cổ dùng reveal rule riêng.
- [x] Role-owned ability state và generic `ABILITY_USED` transition.
- [x] Legacy projection để chưa tác động frontend web.
- [ ] Port engine prototype sang TypeScript.
- [ ] Tách role definition, validation và resolution.
- [ ] Server-owned night resolution.
- [ ] Sửa Final Duel ở mọi death boundary.
- [x] Guard không giới hạn charge; chỉ khóa target vừa bảo vệ liên tiếp.
- [ ] Thêm unit, transition và information-leak tests.

### PR 3 — Spec reviewer adapter

- [ ] Cho demo import `game-core`.
- [ ] Bot chỉ sử dụng public view và private view của chính nó.
- [ ] Giữ animation/presentation hiện tại.
- [ ] Chạy parity tests.
- [ ] Xóa engine `.mjs` trùng lặp sau khi parity pass.

### PR 4 — Web integration

- [ ] Cài và cấu hình `xstate` cùng `@xstate/react`.
- [ ] Tạo `gameSessionMachine` và `gamePresentationMachine`.
- [ ] Reconcile machine từ authoritative `PlayerGameView` sau reconnect/state update.
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
| RULE-002 | Pass một vòng có gỡ hạn chế guard cùng target không? | Có; Guard không có charge, lưu target/round gần nhất và chỉ cấm cùng target ở hai vòng liên tiếp, không cần reset command | Đã chốt 30/08/2026 |
| RULE-003 | Final Duel có kích hoạt sau mọi resolution tạo trạng thái 1–1 không? | Có | Chưa chốt |
| RULE-004 | Giữ cả Thanh trừng và Blood Moon từ Vòng 6 hay chỉ một cơ chế? | Giữ đúng prototype cho phase spine, chưa port balance sâu trước playtest | Chờ GD-08 |
| RULE-005 | Card source chết trong cùng Night resolution có còn resolve action không? | Có, resolve từ snapshot order | Chưa chốt |
| RULE-006 | Charge có bị tiêu khi effect bị shield chặn không? | Có | Chưa chốt |
| RULE-007 | Có giữ format wire `PLAYER_A/B` hay đổi thành `A/B` không? | Giữ `PLAYER_A/B`; chỉ Card ID dùng `A1/B1` | Chưa chốt |
| RULE-008 | Council bắt đầu từ vòng nào? | Vòng 2, sau Day B và trước Night plan | Chốt tạm theo prototype 30/08/2026 |
| RULE-009 | Bài úp chết trong đêm có lộ role không? | Không; lifecycle và visibility độc lập | Đã chốt cho prototype qua ADR-0004 |
| RULE-010 | Khiên có chặn Seer inspect không? | Không | Chốt tạm theo prototype 30/08/2026 |

Khi một quyết định được chốt, cập nhật bảng này và tạo ADR trong `docs/decisions` nếu quyết định ảnh hưởng lớn đến contract hoặc state machine.

## 17. Definition of Done cho migration

- Chỉ còn một authoritative engine trong `packages/game-core`.
- `spec-reviewer` và `web` dùng cùng `shared-types` và `game-core` behavior.
- Không có rule resolution trong React hoặc UI script.
- Mọi phase/action của flow demo có schema và test.
- Public/private view vượt qua information-leak tests.
- Full match từ setup đến Final Duel hoặc elimination chạy được bằng deterministic test sequence.
- Tài liệu ruleset v0.2 và decision log phản ánh đúng implementation.
