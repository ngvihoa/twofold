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
      lastTarget: { instanceId: CardInstanceId; round: number } | null;
    }
  | { abilityId: 'SEER_INSPECT' }
  | { abilityId: 'WITCH_REVIVE'; remainingUses: number }
  | { abilityId: 'WEREWOLF_ATTACK' }
  | { abilityId: 'AVENGER_MARK' }
  // Các ability state còn lại...
```

| Ability | Giới hạn/state ban đầu |
|---|---|
| Guard | Không giới hạn lượt; `lastTarget: null` |
| Seer inspect | Không giới hạn tổng lượt; phe sáng đã biết không được soi lại |
| Witch revive | 1 |
| Witch poison | 1 |
| Shooter bullet | 1 |
| Priest holy water | 1 |
| Wolf Guard rescue | 1 |
| Werewolf attack | Không giới hạn |
| Avenger mark | Không giới hạn, chỉ một mark đang hoạt động |

Guard chỉ bị cấm chọn cùng card vật lý ở hai vòng liên tiếp. State lưu
`CardInstanceId` và round của lần dùng gần nhất; nếu Guard pass hoặc không đặt
khiên một vòng thì record tự trở nên cũ. Việc target đổi slot qua `SWAP` không
làm mất restriction này.

---

## 4. Card State

> **Tiến độ:** Đã triển khai model nội bộ trong `packages/game-core` ngày 29/08/2026; tổng quát hóa effect source/Council lock và chuyển runtime ability state về dưới `RoleState` ngày 30/08/2026. DEV-02A hoàn thành ngày 30/08: lifecycle/visibility độc lập, eliminate/revive giữ visibility và reveal giữ lifecycle. Ngày 30/08, core tách slot `CardId` khỏi `CardInstanceId` bất biến để role/runtime/effect/memory đi theo card vật lý qua Purge SWAP. Contract Zod v0.2 đã được bổ sung trong `packages/shared-types`; `apps/web` chưa migrate và core vẫn giữ legacy projection tạm thời.

### 4.1. Runtime state

Runtime state chỉ chứa lifecycle và visibility. Hai trục này độc lập để biểu diễn được bài úp đã chết.

```ts
type CardRuntimeState =
  | { life: 'ALIVE'; visibility: 'HIDDEN' | 'REVEALED' }
  | { life: 'DEAD'; visibility: 'HIDDEN' | 'REVEALED' };

interface CardInstanceState {
  id: CardInstanceId;
  role: RoleState;
  state: CardRuntimeState;
  effects: CardEffectState[];
}

interface GameCard {
  id: CardId;
  position: number;
  owner: PlayerId;
  occupant: CardInstanceState;
}
```

Card và role có hai transition layer độc lập:

```ts
transitionCard(card, cardCommand);
transitionRole(role, {
  type: 'ABILITY_USED',
  abilityId,
  targetInstanceId,
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
        instanceId: CardInstanceId;
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

### 4.3. Slot và card-instance identity

Chuẩn hóa slot ID theo prototype:

```text
A1…A10
B1…B10
```

- `CardId` (`A1…B10`) và `position` thuộc slot; owner của slot không đổi.
- `CardInstanceId` (`A:1…B:10`) được tạo khi chia bài và đi theo card vật lý.
- Sau khi setup khóa, cả hai loại ID đều bất biến; `SWAP` chỉ đổi instance đang
  chiếm mỗi slot.
- Không dùng song song format `A_0` và `A1`.

### 4.4. State không thuộc card

Ownership đã chốt:

- Guard target memory nằm trong `GUARD_PROTECT` ability state dưới `RoleState`
  của source instance và trỏ tới target bằng `CardInstanceId`.
- Revenge target được biểu diễn bằng `REVENGE_MARK` effect trên target card.
- Blood Moon không thuộc board card; unlock/cooldown nằm trong player special-ability state.
- Pending Council, Night, Defense và Purge order nằm trong player submission của game phase.
- Private Seer intel là knowledge của player, vẫn tồn tại nếu Seer chết và trỏ
  tới card vật lý bằng `CardInstanceId` thay vì slot hiện tại.

---

## 5. Player State

```ts
interface PlayerState {
  id: PlayerId;
  board: GameCard[];
  setup: { status: 'ARRANGING' } | { status: 'LOCKED' };
  submissions: {
    council: {
      accusation: CouncilOrder | null;
      reaction: CouncilReactionOrder | null;
    };
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
- Các order đồng thời được gom dưới `submissions`; `null` nghĩa là player chưa khóa slot tương ứng. Council có hai slot độc lập là `accusation` và `reaction`.
- `PurgeOrder` lưu cả rule và target đã khóa để snapshot tự mô tả được resolution từ Vòng 6.
- Không thêm `dayActionSubmitted`: Day là lượt tuần tự do phase machine quản lý và resolve ngay.
- Blood Moon là `PlayerSpecialAbilityState` với `unlockRound`, `cooldownRounds`, `readyRound`.
- Seer intel nằm trong `privateIntel`, tách khỏi card để knowledge vẫn tồn tại
  nếu source Seer chết. Entry giữ source/target instance cùng slot quan sát lịch
  sử để theo đúng card vật lý qua `SWAP`.
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
> Vòng 6. Structured presentation events đã được thêm trong DEV-02D;
> `pendingResolution` sẽ được bổ sung cùng resolution pipeline khi thực sự cần.

```ts
interface GameState {
  gameId: string;
  seed: string;
  round: number;
  phase: GamePhaseState;

  players: Record<PlayerId, PlayerState>;
  result: GameResult | null;
  events: GameEvent[];
}
```

`pendingResolution` sẽ được thêm khi triển khai resolution pipeline, không tạo
placeholder chưa có hành vi.

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

Tạm chốt accusation và Wolf Guard protection là hai submission độc lập:

```ts
interface CouncilSubmissionState {
  accusation: CouncilOrder | null;
  reaction: CouncilReactionOrder | null;
}

type CouncilReactionOrder =
  | { type: 'PASS' }
  | { type: 'WOLF_GUARD_RESCUE'; sourceId: CardId; targetId: CardId };
```

Mỗi player có thể vừa gửi accusation vừa bí mật gửi reaction trong cùng Council.
Council chỉ chuyển sang resolution sau khi cả hai player đã khóa đủ cả hai slot,
tức bốn submission: accusation A/B và reaction A/B. Slot không dùng vẫn phải gửi
`PASS`; không suy diễn `null` thành pass.

Resolution đọc một snapshot chung sau khi đủ bốn slot: xác định accusation hợp
lệ/thành công, áp dụng reaction khớp target, rồi mới tổng hợp các card chết và
revenge chain. Việc một bên submit sớm không được kích hoạt resolution sớm và
đối thủ chỉ được thấy trạng thái đã khóa của từng slot, không thấy payload.

#### Notable cần xử lý hoặc review lại khi port Council

- Đã tách contract/event thành hai command rõ nghĩa:
  `COUNCIL_ACCUSATION_SUBMIT` và `COUNCIL_REACTION_SUBMIT`.
- `PlayerSubmissionState` đã đổi từ một field `council` sang
  `council.accusation` và `council.reaction` trong `game-core` ngày 30/08/2026.
- Cần xác nhận Wolf Guard có tiêu resource và tự lộ khi reaction không khớp bất
  kỳ accusation thành công nào hay chỉ khi cứu thực sự thành công. Khuyến nghị
  hiện tại: chỉ tiêu resource và lộ source khi cứu thành công.
- Với contract 1v1 hiện tại, mỗi target chỉ có thể bị accusation bởi đúng một
  đối thủ; nếu sau này mở rộng số player thì phải review reaction chặn một hay
  toàn bộ accusation cùng nhắm target.
- Cần xác nhận reaction có còn resolve nếu Wolf Guard source đồng thời bị một
  accusation hợp lệ loại. Khuyến nghị hiện tại: có, vì mọi order resolve từ
  snapshot đầu Council.
- Đã test hai accusation cùng thành công, rescue, reaction không khớp không tiêu
  resource, accusation sai tạo `COUNCIL_LOCK`, revenge chain và không rò payload
  qua `PlayerGameView`.
- Sau playtest, review lại UX của bốn lần submit độc lập; có thể gom thao tác ở
  presentation layer nhưng không được làm mất hai slot độc lập trong core.

---

## 8. Action Contract

> **Tiến độ pipeline:** Đã tạo validation/resolution entry point tại
> `packages/game-core/src/rule-pipeline.ts`. Vertical slice đầu tiên đã port:
> Setup lock, Day pass, Council accusation/reaction, Night/Defense pass, Werewolf attack,
> Guard protect, Seer inspect, Witch poison và toàn bộ Day abilities: Shooter,
> Avenger mark/revenge chain, Priest purify, Witch revive. Pipeline validate
> trước khi mutate, khóa order đồng thời, resolve từ snapshot, cập nhật
> role/card/player state, cleanup effect, kiểm tra elimination/Final Duel, phát
> structured events và tự chuyển phase. Poison tiêu charge kể cả khi bị chặn;
> revive giữ visibility; Day death lộ victim. Council resolve đồng thời từ bốn
> slot, hỗ trợ đoán role, reveal voter, `COUNCIL_LOCK`, Wolf Guard rescue và
> information-safe lock view. Blood Moon đã được port theo player-owned ability:
> mở từ Vòng 6, chỉ đánh target đã lộ, cooldown hai vòng, không có source card và
> vẫn vào cooldown khi bị Guard chặn. Purge pipeline cũng đã được port đủ chu kỳ
> `CUT → SWAP → REVEAL → LOCK`. Final Duel guess đã được port với hai submission
> bí mật, reveal đồng thời và kết quả thắng/hòa từ snapshot. Full-match tests và
> smoke parity với prototype được theo dõi tại
> `docs/development/game-core-prototype-parity-audit.md`.
> Policy reveal của Day ability theo prototype: `SHOOT` không reveal source;
> `MARK`, `PURIFY` và `REVIVE` reveal source khi resolve.

Thay `USE_SKILL` chung bằng discriminated union cụ thể:

```ts
type GameAction =
  | SetupLockAction
  | CouncilAccusationSubmitAction
  | CouncilReactionSubmitAction
  | DayAction
  | NightOrderAction
  | DefenseOrderAction
  | PurgeSubmitAction
  | FinalGuessAction
  | SurrenderAction;
```

Ví dụ Day action:

```ts
type DayAction =
  | { type: 'PASS' }
  | { type: 'SHOOT'; sourceId: CardId; targetId: CardId }
  | { type: 'MARK'; sourceId: CardId; targetId: CardId }
  | { type: 'PURIFY'; sourceId: CardId; targetId: CardId }
  | { type: 'REVIVE'; sourceId: CardId; targetId: CardId };

type DaySubmitAction = {
  type: 'DAY_SUBMIT';
  playerId: PlayerId;
  action: DayAction;
};
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

### 9.1. Purge pipeline

Purge dùng rule bắt buộc theo chu kỳ bốn vòng:

| Round | Rule | Resolution |
|---|---|---|
| 6, 10, ... | `CUT` | Mỗi player chọn một card sống bên mình; hai target bị loại đồng thời và được reveal. |
| 7, 11, ... | `SWAP` | Mỗi player chọn một card bên mình và một card đối thủ; bốn vị trí phải khác nhau. Gửi `ownTargetId: null, opponentTargetId: null` khi không còn cặp hợp lệ (bỏ qua swap). |
| 8, 12, ... | `REVEAL` | Mỗi player reveal một card sống còn ẩn; gửi `targetId: null` khi không còn target hợp lệ. |
| 9, 13, ... | `LOCK` | Áp `PURGE_LOCK` lên một card sống bên mình tới hết Night resolution của vòng hiện tại. |

Hai player khóa order độc lập. Core chỉ chuyển `PURGE_PLAN → PURGE_RESOLUTION`
khi đủ hai order và resolve từ snapshot. Rule trong payload phải khớp rule của
round; client không được tự chọn loại Purge.

`PURGE_LOCK` là rule-sourced card effect, không phải lifecycle state. Effect chặn
card làm active ability source và tham gia Council trong vòng đó; Blood Moon vẫn
dùng được vì thuộc player. Theo prototype, passive Avenger revenge vẫn resolve.

Notable cần review sau playtest:

- `SWAP` giữ `CardId`, position và owner của slot, chỉ hoán đổi `occupant`.
  `CardInstanceId`, role, lifecycle, ability resource, memory và effect đi cùng
  card vật lý.
- Seer intel trỏ tới `targetInstanceId`; `observedAtSlotId` chỉ là lịch sử slot
  tại thời điểm soi. Vì vậy intel vẫn nhận diện đúng card sau `SWAP` và không bị
  hiểu nhầm là role mới đang chiếm slot cũ.
- Nếu lệnh `SWAP` của một player trùng vị trí với lệnh đã khóa của đối thủ, hoặc
  player không còn cặp hợp lệ (ví dụ: lá sống duy nhất của đối thủ đã bị chọn
  trước), lệnh đó bị bỏ qua (`PURGE_RESOLVED` với `targetCardId: null`); lệnh
  còn lại vẫn thực thi trên snapshot đầu vòng. Điều này tránh deadlock khi một
  bên chỉ còn đúng một lá sống.
- `PURGE_RESOLVED` là public event sau resolution, nhưng payload order vẫn được
  giữ kín trước khi cả hai bên khóa.
- Việc giữ cả Purge và Blood Moon từ Vòng 6 vẫn chờ GD-08/playtest quyết định.

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

Final Duel được kiểm tra sau mọi death boundary hiện có: Day, Council, Night và
Purge. Khi mỗi bên còn đúng một card:

1. Hai player gửi `FINAL_GUESS_SUBMIT` độc lập; đối thủ chỉ thấy lock state.
2. Core không resolve hoặc reveal sau guess đầu tiên.
3. Khi đủ hai guess, hai card cuối cùng cùng reveal.
4. Một bên đoán đúng thì bên đó thắng.
5. Hai bên cùng đúng hoặc cùng sai đều hòa.

Guess chỉ chứa `CardRole`; target được suy ra là card sống duy nhất của đối thủ.
Theo prototype, mọi role hợp lệ đều được phép đoán, chưa lọc theo deck inference.
Event `FINAL_DUEL_RESOLVED` công khai hai guess và hai kết quả đúng/sai sau khi
resolution hoàn tất.

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

Contract v0.2 chấp nhận đầy đủ `FINAL_DUEL` và `DRAW_FINAL_DUEL`. Legacy
projection tạm trả `winReason: null` cho hai reason mới thay vì map sai thành
`ELIMINATION`; authoritative `GamePlayerView` giữ reason đầy đủ.

Notable cần review:

- Có giới hạn guess theo role còn khả thi trong deck giống Council hay giữ mọi
  `CardRole` hợp lệ như prototype hiện tại?
- Cả “hai bên cùng đúng” và “hai bên cùng sai” dùng chung kết quả
  `DRAW_FINAL_DUEL`; event vẫn giữ `correctA/correctB` để presentation phân biệt.
- Guess được clear khỏi pending submission khi game kết thúc; audit/replay đọc
  payload từ `FINAL_DUEL_RESOLVED`.

Không tự loại Thanh trừng/Calamity khỏi v0.2 trong lúc migration. Prototype hiện dùng chu kỳ Thanh trừng từ Vòng 6 đồng thời với Blood Moon; GD-08 phải chốt sau playtest trước khi Dev port sâu hơn phase spine.

---

## 11. Public và Private View

Không gửi master state trực tiếp cho client.

> **Tiến độ:** DEV-02C đã triển khai serializer nội bộ tại
> `packages/game-core/src/player-view.ts`. Serializer tách private/public card,
> chỉ công khai trạng thái opponent đã khóa submission và loại `effect.id`,
> `effect.source` khỏi view để không rò Night source. Contract Zod/wire v0.2 đã
> được triển khai trong `packages/shared-types/src/game-v2.ts` và được kiểm tra
> bằng output thật của serializer trong `shared-contract.test.ts`.

`GameEngine` chỉ nhận gameplay mutation qua `dispatch(PlayerGameAction)`.
`getState()` trả deep snapshot độc lập thay vì reference nội bộ; caller không
thể dùng state đọc được để bypass validation/resolution pipeline. Facade
invariant được kiểm tra riêng trong `packages/game-core/src/engine.test.ts`.

### 11.1. Public card

```ts
interface PublicCardView {
  id: CardId;
  instanceId: CardInstanceId;
  position: number;
  owner: PlayerId;
  state: CardRuntimeState;
  role: RoleId | null;
  effects: VisibleCardEffect[];
}
```

`life: 'DEAD'` không suy ra `visibility: 'REVEALED'`. Khi visibility là
`HIDDEN`, `role` bắt buộc là `null` kể cả card đã chết. View chỉ gửi effect
`kind`, `appliedRound`, `expires`; không gửi effect ID hoặc source. Các field
action-derived như `councilEligible` sẽ được bổ sung từ validation layer thay vì
lưu hoặc suy diễn sớm trong serializer.

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

> **Tiến độ:** DEV-02D đã triển khai event stream deterministic tại
> `packages/game-core/src/game-events.ts`. Event có sequence, round, phase và
> visibility; player serializer lọc private event. Core không chứa timestamp
> presentation, delay hoặc animation duration.

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
- `COUNCIL_ACCUSATION_RESOLVED`
- `COUNCIL_PASSED`
- `DEFENSE_SKIPPED`
- `WOLF_GUARD_RESCUED`
- `PRIVATE_INSPECTION_RESULT`

Web chịu trách nhiệm dịch event thành nội dung và animation. Structured event cũng phục vụ reconnect, replay và audit rule.

### 12.1. Chính sách legacy log trong thời gian migration

`GameState.events` là event history authoritative duy nhất. Reconnect, replay,
state synchronization, audit rule và presentation mới phải đọc structured
event; không được đọc hoặc suy luận gameplay state từ chuỗi log.

`MasterGameState.logs` và legacy player view chỉ được giữ cho adapter v0.1
trong thời gian consumer migration:

- legacy log **không authoritative** và không đảm bảo phản ánh các action sau
  khi khởi tạo trận;
- `GameEngine.dispatch()` chỉ preserve field này, không derive chuỗi tiếng Việt
  từ structured event;
- legacy logs được khai báo readonly; snapshot và legacy view không nhận mutable
  reference tới array nội bộ;
- core không xây thêm mapper `GameEvent → EventLogEntry`, vì mapper đó là
  presentation concern và sẽ tạo hai event history phải duy trì song song;
- server, test rule và frontend mới không được dùng legacy log cho resolution,
  replay hoặc synchronization;
- `MasterGameState.logs`, `getPlayerView()` và legacy projection liên quan sẽ bị
  xóa sau khi server và `apps/web` đã chuyển sang contract v0.2.

Nếu UI cần activity feed, UI tự map các `GameEvent` đã được lọc theo viewer sang
nội dung bản địa hóa.

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
- So sánh public outcome, private intel và result với executable PO reference.
- Giữ `engine.mjs` và `engine.test.mjs` làm nguồn rule tham khảo của PO; không
  cho UI, CLI hoặc production runtime phụ thuộc vào reference engine này.
- `packages/game-core/src/normalized-trace-parity.test.ts` đã chạy cùng một
  standard deck qua Setup, Seer/Guard, Council, Night, Blood Moon, đủ chu kỳ
  `CUT → SWAP → REVEAL → LOCK` và Final Duel. Comparator normalize slot/instance,
  lifecycle, visibility, finite resources, effects, Guard memory, Seer intel,
  cooldown, phase/round và result; không so các divergence presentation đã chốt.
- Trace phát hiện và khóa regression thứ tự Dawn: sau Night, elimination được
  kiểm tra ở round hiện tại; trạng thái 1–1 chỉ vào Final Duel sau khi
  `DAWN_COMPLETED` đã tăng sang round kế tiếp như prototype.

---

## 15. Kế hoạch triển khai theo PR

### PR 1 — Shared types v0.2

- [x] Role và deck mới.
- [x] Migrate Card State contract để hỗ trợ `DEAD + HIDDEN` theo ADR-0004.
- [x] Phase mới.
- [x] Action union mới.
- [x] Public/private view với invariant hidden role.
- [x] Structured events và private Seer-event invariant.
- [x] Đặt WebSocket v0.2 làm default; giữ schema v0.1 dưới tên `Legacy*`.

> Hoàn thành ngày 30/08/2026. `game-core` dùng trực tiếp shared type cho phase,
> action và order. `apps/web` được chủ động để lại cho PR 4 và có thể chưa
> type-check với default WebSocket contract mới cho tới khi migrate.

### PR 2 — Game core v0.2

- [x] Card runtime state và active-effect collection nội bộ.
- [x] Hỗ trợ `DEAD + HIDDEN`; eliminate/revive không tự reveal và Treo cổ dùng reveal rule riêng.
- [x] Role-owned ability state và generic `ABILITY_USED` transition.
- [x] Legacy projection để chưa tác động frontend web.
- [x] Port engine prototype sang TypeScript.
- [x] Tách role definition, validation và resolution.
- [x] Server-owned night resolution.
- [x] Sửa Final Duel ở mọi death boundary.
- [x] Guard không giới hạn charge; chỉ khóa target vừa bảo vệ liên tiếp.
- [x] Thêm unit, transition và information-leak tests.

### PR 3 — Spec reviewer adapter

- [x] Cho demo import `game-core` qua presentation adapter.
- [x] Bot chỉ sử dụng public view và private view của chính nó.
- [x] Giữ animation/presentation hiện tại, gồm deferred Dawn sequence.
- [x] Chạy prototype parity và adapter integration tests.
- [x] Giữ `engine.mjs` và `engine.test.mjs` làm executable PO reference, tách
  khỏi runtime UI/CLI.

> Tiến độ 31/08/2026: UI và CLI đã chuyển sang `core-adapter.mjs`; adapter map
> action cũ sang shared `PlayerGameAction`, derive presentation log từ public
> structured events và giữ Night outcome trước/sau để phát animation. Reviewer
> dùng Vite để bundle workspace packages. Bot policy chỉ nhận public view và
> private view của B; test xác nhận thay đổi hidden role của A không đổi quyết
> định bot và bot không đọc pending Purge payload của đối thủ. Prototype engine
> chỉ còn được import bởi parity/regression test và được chủ động giữ lại như
> executable source of truth của PO, không phải mục tiêu cleanup.

### PR 4 — Web integration

- [x] Cài và cấu hình `xstate` cùng `@xstate/react`.
- [x] Tạo `gameSessionMachine` và `gamePresentationMachine`.
- [x] Reconcile machine từ authoritative `PlayerGameView` sau reconnect/state update.
- [x] Setup reorder thật.
- [ ] Render player view mới.
- [ ] Action panel theo phase.
- [ ] Event-driven Council, Dusk và Dawn presentation.
- [ ] Loại bỏ toàn bộ mock rule và random outcome.

#### PR 4.1 — Session machine foundation

Mục tiêu của lát đầu tiên là tạo ranh giới client/server có thể kiểm thử trước
khi thay UI mock. PR 4.1 chưa render gameplay v0.2 và chưa chạy `game-core` trong
browser.

- `GameTransport` là port duy nhất giữa session machine và WebSocket. Machine
  chỉ gửi/nhận `ClientWsMessage`/`ServerWsMessage` đã định nghĩa trong
  `shared-types`; test có thể inject fake transport.
- `gameSessionMachine` sở hữu connection lifecycle và snapshot
  `GamePlayerViewV2` mới nhất. Snapshot server luôn authoritative; machine không
  tự resolve rule hoặc tự suy ra phase tiếp theo.
- Connection lifecycle gồm `idle → connecting → connected → reconnecting`, với
  nhánh terminal `closed`. Lỗi protocol/transport được giữ trong context để UI
  hiển thị và có thể reconnect.
- Việc submit action chỉ gửi `PlayerGameAction`; UI có thể biết action đang chờ
  acknowledgement nhưng không optimistic-update board/phase.
- Mỗi `GAME_STATE_UPDATE` thay thế snapshot hiện tại. Snapshot sau reconnect
  cũng đi cùng một đường reconcile, không merge từng field với local state.
- `ACTION_REJECTED` xóa trạng thái submission đang chờ và lưu lỗi có cấu trúc;
  snapshot authoritative gần nhất được giữ nguyên.
- Selector chỉ expose lát dữ liệu React cần (`connection`, `view`, `phase`,
  `canSubmit`, `pendingAction`, `error`) để tránh component subscribe toàn bộ
  context.

Acceptance criteria PR 4.1:

- [x] Cài `xstate`, `@xstate/react` và test runner cho package web.
- [x] Có transport interface độc lập browser và fake transport trong test.
- [x] Machine join được room, nhận snapshot và gửi action v0.2.
- [x] Reconnect dùng `sessionId` hiện tại và snapshot mới thay thế snapshot cũ.
- [x] `ACTION_REJECTED` không mutate authoritative snapshot.
- [x] Snapshot/message sai schema trở thành protocol error, không đi vào UI.
- [x] Unit tests và web typecheck/build pass.

> Hoàn thành PR 4.1 ngày 31/08/2026. `GameSessionActorContext` là React actor
> boundary dùng `@xstate/react`; route gameplay chưa mount provider trong lát
> này. Native WebSocket adapter sẽ được gắn khi endpoint server được triển khai;
> machine hiện được xác minh qua transport port và deterministic fake transport.

#### PR 4.2 — Presentation machine foundation

Presentation machine nhận structured events đã được lọc trong
`GamePlayerViewV2`; nó không nhận authoritative game state và không được phép
thay đổi board, phase hoặc result. Trách nhiệm duy nhất là quyết định event nào
đang được trình bày và event nào chờ tiếp theo.

- `HYDRATE` dùng cho initial load/reconnect: đặt cursor tại event sequence cao
  nhất trong snapshot và không replay lịch sử cũ.
- `INGEST` dùng cho live snapshot tiếp theo: chỉ nhận event có `sequence` lớn
  hơn cursor đã thấy, sort tăng dần và loại duplicate từ snapshot lặp lại.
- `current` chứa đúng một event đang animate; `queue` chứa phần còn lại.
- `PRESENTATION_COMPLETED` hoặc `SKIP_CURRENT` tiến tới event kế tiếp và chỉ lúc
  đó cập nhật `lastPresentedSequence`.
- `SKIP_ALL` fast-forward toàn bộ queue nhưng vẫn tiến cursor, tránh replay các
  event đã bỏ qua.
- `RESET` dành cho lúc actor được tái sử dụng với một game/session khác.
- Presentation kind được derive từ phase (`DAY`, `COUNCIL`, `DEFENSE`, `NIGHT`,
  `DAWN`, `PURGE`, `FINAL_DUEL`, `GENERIC`) thay vì lưu thêm một nguồn state.

Acceptance criteria PR 4.2:

- [x] Có `gamePresentationMachine` tách biệt `gameSessionMachine`.
- [x] Hydrate/reconnect không replay event lịch sử.
- [x] Live events được sort, dedupe và trình bày tuần tự theo `sequence`.
- [x] Event đến trong lúc đang animate được nối vào queue, không cắt current.
- [x] Complete, skip current, skip all và reset giữ cursor nhất quán.
- [x] Có selector hẹp và actor context cho `@xstate/react`.
- [x] Unit tests và web typecheck/build pass.

> Hoàn thành PR 4.2 ngày 31/08/2026. Presentation actor hiện là orchestration
> foundation độc lập, chưa được mount vào gameplay route. Nó nhận event đã lọc
> từ player view, không import `game-core` và không sở hữu board/phase/result.

#### PR 4.3 — Authoritative Setup UI

PR 4.3 mount session/presentation actor boundary vào `/play/$id` và thay riêng
Setup mock bằng player view v0.2. Các gameplay phase chưa migrate tiếp tục dùng
legacy board trong giai đoạn chuyển tiếp.

- Browser transport nhận endpoint từ `VITE_GAME_WS_URL`; client không hard-code
  đường dẫn WebSocket khi backend endpoint chưa được chốt.
- Setup UI đọc duy nhất `view.self.board` và `view.self.setup`; không import hay
  gọi `game-core` để resolve rule.
- Draft order chứa `CardInstanceId[]`, vì occupant identity phải đi theo card
  khi reorder. Board slot ID không được dùng làm identity của draft.
- Reorder chỉ thay local draft. `SETUP_REORDER` gửi tuple đủ 10 instance ID và
  không optimistic-update authoritative board.
- Draft chỉ reset khi sequence instance ID trong snapshot thực sự đổi; snapshot
  mới chỉ thay events hoặc connection metadata không được làm mất chỉnh sửa cục
  bộ chưa lưu.
- Chỉ được gửi `SETUP_LOCK` khi draft khớp snapshot authoritative và không có
  action đang pending. Phase chỉ đổi sau `GAME_STATE_UPDATE` của server.
- `ACTION_REJECTED` giữ nguyên snapshot/draft và hiển thị lỗi từ session actor.

Acceptance criteria PR 4.3:

- [x] Có native browser WebSocket transport implement `GameTransport`.
- [x] Session và presentation actor context được mount tại gameplay route.
- [x] Setup render đủ 10 private cards từ `GamePlayerViewV2`.
- [x] Reorder accessible bằng drag/drop và nút điều hướng.
- [x] Gửi đúng `SETUP_REORDER` và `SETUP_LOCK` v0.2.
- [x] Pending/locked state vô hiệu hóa thao tác phù hợp.
- [x] Snapshot reconciliation không ghi đè unsaved draft khi order không đổi.
- [x] Unit tests và web typecheck/build pass.

> Hoàn thành PR 4.3 ngày 31/08/2026. `/play/$id` chỉ khởi tạo runtime khi có
> `VITE_GAME_WS_URL`; Setup dùng player view/action v0.2, còn các phase sau Setup
> tạm render legacy board cho tới PR 4.4–4.6. Browser transport chỉ làm I/O và
> JSON serialization; inbound schema validation vẫn thuộc session machine.

#### Các lát tiếp theo của PR 4

1. **PR 4.4 — Board/action panels:** render `GamePlayerViewV2` và tạo action form
   theo discriminated phase; component chỉ dispatch `PlayerGameAction`.
2. **PR 4.5 — Structured history:** derive wording/presentation từ
   `GameEventV2`, giữ private event đúng viewer boundary.
3. **PR 4.6 — Mock removal:** xóa local phase/card/log, `Math.random()` và toàn
   bộ contract v0.1 khỏi route gameplay.

### PR 5 — Cleanup và documentation

- [ ] Đánh dấu tài liệu v0.1 là archived.
- [ ] Tạo tài liệu game rules v0.2 chính thức.
- [ ] Xóa `CALAMITY`, role cũ và compatibility adapter không còn dùng.
- [ ] Ghi lại các quyết định rule trong `docs/decisions`.

---

## 16. Decision Log cần review

| ID | Câu hỏi | Khuyến nghị hiện tại | Trạng thái |
|---|---|---|---|
| RULE-001 | Wolf Guard protection có độc lập với accusation không? | Có, dùng reaction order riêng; Council chờ đủ accusation và reaction của cả hai bên | Chốt tạm 30/08/2026; review lại sau playtest |
| RULE-002 | Pass một vòng có gỡ hạn chế guard cùng target không? | Có; Guard không có charge, lưu target/round gần nhất và chỉ cấm cùng target ở hai vòng liên tiếp, không cần reset command | Đã chốt 30/08/2026 |
| RULE-003 | Final Duel có kích hoạt sau mọi resolution tạo trạng thái 1–1 không? | Có; đã áp dụng cho Day, Council, Night và Purge | Chốt tạm theo prototype 30/08/2026; review sau playtest |
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
