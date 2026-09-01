# Spec → Runtime Migration Policy

- Ngày áp dụng: 01/09/2026
- Trạng thái: Hiện hành
- Liên quan: [ADR-0005](../decisions/0005-decouple-spec-reviewer-from-runtime-core.md)

## Tóm tắt bắt buộc cho agent

1. `apps/spec-reviewer` là **nguồn thử nghiệm rule mới hơn** dùng cho PO, game design và playtest.
2. `packages/game-core`, `packages/shared-types` và `apps/web` là **snapshot runtime cũ hơn** tại một mốc đồng bộ đã chọn.
3. Hai phía **không được giả định có logic giống nhau** và không cần đạt parity ở mọi commit.
4. Không import source, adapter, fixture hoặc test trực tiếp qua ranh giới reviewer ↔ runtime.
5. Không sửa web/core chỉ để “bắt kịp spec” nếu chưa có một task migration được lập kế hoạch và phê duyệt.

## Nguồn sự thật theo mục đích

| Câu hỏi | Nguồn cần đọc |
|---|---|
| Rule đang được thử hoặc vừa được PO điều chỉnh là gì? | `apps/spec-reviewer/game-flow-demo`, `docs/game-design`, ADR rule và journey record mới nhất |
| Web hiện đang chạy logic nào? | `packages/game-core`, `packages/shared-types`, `apps/web` và test tại các workspace đó |
| Hai phía hiện có giống nhau không? | Mặc định là **không biết/không đảm bảo** cho tới khi có migration audit tại một mốc cụ thể |
| Có nên sửa runtime theo thay đổi spec vừa thấy không? | Chỉ khi task migration tương ứng đã được tạo, chốt scope và được đưa vào thực hiện |

`spec-reviewer` là nguồn thử nghiệm mới hơn, nhưng không tự động là
authoritative implementation cho production. `game-core` là authoritative cho
runtime đang chạy, nhưng không được dùng để phủ định một thử nghiệm mới hơn ở
reviewer.

## Những việc agent không được tự động làm

- Không thêm lại dependency từ `spec-reviewer` tới `game-core`/`shared-types`.
- Không thêm test trong `game-core` import trực tiếp engine của reviewer.
- Không resolve merge conflict bằng cách chọn toàn bộ logic runtime đè lên spec, hoặc ngược lại, chỉ vì một phía “mới hơn”.
- Không đổi role, information boundary, phase order hoặc resolution behavior của web/core trong một task chỉ sửa reviewer.
- Không tuyên bố parity chỉ vì cả hai test suite đều pass độc lập.

Boundary check tại `apps/spec-reviewer/scripts/check-workspace-boundaries.mjs`
sẽ fail nếu dependency/import trực tiếp này xuất hiện lại.

## Khi nào được tạo migration

Một rule đủ điều kiện xem xét migration khi có tối thiểu:

- ADR hoặc game-design section mô tả behavior đã chốt tạm;
- test deterministic trong reviewer cho happy path và edge case quan trọng;
- kết quả playtest hoặc lý do PO muốn đưa rule vào runtime;
- danh sách khác biệt với snapshot runtime hiện tại;
- owner và mốc thực hiện rõ ràng.

Nếu chưa đủ các điều kiện trên, tiếp tục thử nghiệm trong reviewer và ghi lại
khoảng lệch; không port nửa chừng sang runtime.

## Template task migration bắt buộc

Mỗi lần đồng bộ phải có một task riêng trong task tracker hoặc implementation
record với các trường sau:

```md
### MIG-XX — Tên rule/vertical slice

- Spec source: ADR/file/commit dùng làm nguồn
- Runtime baseline: commit hoặc version hiện tại của game-core/web
- Owner:
- Scope: role, phase, validation, resolution, visibility, event, UI nào được chuyển
- Out of scope:
- Known differences before migration:
- Contract changes: shared-types/action/view/event cần đổi
- Data migration/backward compatibility:
- Test plan: unit, trace, player-view leak, UI/server integration
- Rollout/rollback:
- Acceptance: điều kiện nào cho phép tuyên bố snapshot runtime đã đồng bộ
```

Task migration phải chỉ rõ **mốc spec nguồn**. Không dùng cụm “đồng bộ bản mới
nhất” vì reviewer có thể tiếp tục thay đổi trong lúc runtime đang được port.

## Trình tự thực hiện migration

1. Freeze một commit/ADR của reviewer làm nguồn cho task.
2. Lập bảng khác biệt behavior; không so implementation line-by-line.
3. Chốt thay đổi contract trong `shared-types` nếu có.
4. Port validation/resolution/state vào `game-core` và viết test tại core.
5. Port transport/presentation/UI vào `apps/web` theo structured event mới.
6. Chạy player-view/privacy test, full workspace check và các scenario migration.
7. Cập nhật task/ADR với commit runtime đã đồng bộ và các khác biệt cố ý còn lại.

Sau bước 7 chỉ được tuyên bố parity cho **phạm vi và hai commit đã ghi**, không
tuyên bố hai workspace sẽ tiếp tục tự động giống nhau trong tương lai.

## Trạng thái tại thời điểm ban hành

- Reviewer đang dùng Kẻ Thế Mạng trong bộ 10 lá; Sói Hộ Vệ vẫn còn trong catalog với trạng thái `Chưa dùng`.
- Runtime core/web vẫn có snapshot dùng Sói Hộ Vệ.
- Một số behavior Council và information visibility cũng có thể khác.
- Đây là khoảng lệch được chấp nhận, chưa phải bug merge. Muốn thay đổi runtime phải tạo task migration theo policy này.
