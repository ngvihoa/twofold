# MIG-01 — Đồng bộ ruleset reviewer đã freeze sang runtime core

## Metadata

- Ngày: 01/09/2026
- Trạng thái: Xong
- Owner: Developer / Codex
- Spec source: commit `b770f7b`, `apps/spec-reviewer/game-flow-demo/engine.mjs` và ADR-0001 tại commit này
- Runtime baseline: commit `b770f7b`, `packages/shared-types` + `packages/game-core`
- Policy: `docs/development/spec-runtime-migration-policy.md`

## Mục tiêu

Chuyển behavior đã được khóa bằng regression suite của reviewer sang contract và
engine runtime mà không tạo dependency source giữa hai workspace. Chỉ commit
`b770f7b` là nguồn cho migration này; thay đổi reviewer phát sinh sau mốc đó
không tự động nằm trong scope.

## Scope

- Standard deck runtime dùng Kẻ Thế Mạng; Sói Hộ Vệ vẫn tồn tại trong enum,
  registry/catalog và ngoài standard deck hiện tại.
- Council dùng 1–3 voter với tổng trọng số tối thiểu 3; Dân làng = 2, role Dân
  khác = 1.
- Kẻ Thế Mạng có reaction kín Có/Không sau khi án Treo cổ hợp lệ; khi dùng sẽ
  lộ và chết thay target, giữ charge khi từ chối, không cứu chính mình và không
  bị Purge LOCK vô hiệu.
- Card đã dùng Day skill không được vote hoặc dùng skill khác trong cùng round;
  Phù thủy không hồi sinh và đầu độc trong cùng round.
- Shooter lộ khi dùng Day skill.
- Night source/action/target giữ kín; soi Tiên tri thường chỉ tạo private intel.
  Tiên tri chỉ lộ khi lần soi phe tối thứ hai trở thành lệnh kết liễu, kể cả khi
  khiên chặn.
- Target Guard giữ kín; public chỉ nhận vị trí được cứu khi block thành công,
  không nhận source hoặc loại đòn bị chặn.
- Guard chặn direct elimination và Avenger death reaction, không chặn soi đầu.
- Purge SWAP resolve theo batch: bất kỳ overlap nào làm cả batch fizzle; không
  resolve một cặp rồi bỏ cặp sau.
- Giữ các behavior đã khớp: phase spine, hidden night death, stable instance qua
  SWAP, Final Duel, rematch/result contract trong phạm vi core hiện có.

## Out of scope

- Không thêm Sói Hộ Vệ vào standard deck hiện tại và không xóa role này khỏi
  catalog/registry.
- Không redesign React UI, animation hoặc wording ngoài thay đổi bắt buộc để
  compile với contract/event mới.
- Không import engine/test/fixture từ reviewer vào runtime.
- Không đồng bộ thay đổi spec mới hơn commit đã freeze.

## Known differences trước migration

| Khu vực | Reviewer `b770f7b` | Runtime baseline |
|---|---|---|
| Deck reaction role | Kẻ Thế Mạng | Sói Hộ Vệ |
| Council voter | 1–3 card, đủ ≥3 phiếu | Đúng 3 card |
| Reaction timing | Sau án hợp lệ, Có/Không | Pre-submit target bảo kê |
| Day exhaustion | Chặn vote và Night skill cùng round | Chưa biểu diễn |
| Night source | Giữ kín, trừ Seer execution | Source bị reveal khi resolve |
| Guard target | Private tới lúc block | Protection event/effect công khai |
| Shooter | Lộ khi bắn | Không lộ |
| Purge SWAP overlap | Cả batch fizzle | Giữ cặp đầu, bỏ overlap sau |

## Contract changes dự kiến

- Thêm `CardRole.SUBSTITUTE` và `AbilityId.SUBSTITUTE_SACRIFICE`; giữ
  `WOLF_GUARD`/`WOLF_GUARD_RESCUE` để catalog/runtime compatibility nhưng không
  dùng trong standard deck.
- Council voter IDs chuyển từ tuple đúng ba sang array giới hạn 1–3.
- Council reaction chuyển sang `SUBSTITUTE_SACRIFICE` hoặc `PASS` và chỉ mở cho
  defender có án hợp lệ.
- Structured event mới cho việc chết thay; event Night public không chứa
  source/action bí mật.
- Effect/state theo round để chặn một card dùng Day skill rồi vote/Night skill.

## Test plan

- Port regression tương ứng từ reviewer vào `game-core` bằng fixture core-native.
- Contract parse/reject cho voter 1–3, Substitute action/event và hidden payload.
- Player-view test không rò Night order, Guard target, Seer target hoặc source.
- Full match/phase regression và Purge simultaneous batch.
- `pnpm --filter @twofold/game-core test`.
- `pnpm --filter @twofold/web check`.
- `pnpm check` và boundary check.

## Rollout / rollback

- Migration nằm trong một commit riêng sau commit docs/policy.
- Nếu contract làm web không compile, cập nhật consumer tối thiểu trong cùng
  migration; không giữ schema nửa cũ nửa mới.
- Rollback bằng revert commit migration; reviewer không bị ảnh hưởng vì không có
  dependency runtime.

## Acceptance criteria

- Runtime standard deck và behavior trong scope khớp spec source `b770f7b`.
- Sói Hộ Vệ vẫn tra cứu được nhưng không xuất hiện trong standard deck.
- Không còn known difference trong bảng scope, hoặc difference còn lại được PO
  chấp nhận và ghi rõ tại record này.
- Tất cả test/check nêu trên pass.
- Record cập nhật commit implementation và trạng thái `Xong`.

## Kết quả implementation

- Implementation commit: commit chứa migration record này.
- Không còn known difference nào trong scope đã freeze. Sói Hộ Vệ vẫn có trong
  enum/registry/catalog nhưng standard deck dùng Kẻ Thế Mạng.
- Shared contract, core phase machine, filtered player view và web action UI đã
  được cập nhật cùng một migration; không tạo dependency source với reviewer.
- Regression bổ sung bao phủ Council có trọng số, Substitute accept/decline,
  self-save/Purge LOCK, Day exhaustion, Shooter reveal, privacy của Seer/Guard,
  Guard chặn Avenger và SWAP batch fizzle.

## Verification

- `pnpm --filter @twofold/game-core test`: 11 files, 83/83 tests pass.
- `pnpm --filter @twofold/web check`: 13 files, 62/62 tests pass; TypeScript
  typecheck và production build pass.
- `pnpm check`: cả 4 workspace pass; boundary reviewer ↔ runtime vẫn hợp lệ.
