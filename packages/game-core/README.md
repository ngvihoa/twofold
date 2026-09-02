# Twofold Game Core (`@twofold/game-core`)

Gói thư viện chứa authoritative ruleset v0.2, state machine trận đấu 1v1 và logic phân giải toàn bộ phase từ Setup đến Final Duel.

> Đây là authoritative snapshot cho runtime hiện tại, không bảo đảm khớp
> `apps/spec-reviewer`—nguồn thử nghiệm rule mới hơn. Không port rule hoặc tạo
> parity dependency trực tiếp nếu chưa có task theo
> [Spec → Runtime Migration Policy](../../docs/development/spec-runtime-migration-policy.md).

## Kiến trúc ruleset v0.2

- Mỗi người bắt đầu với **10 lá trên sân**.
- `GameEngine` chỉ nhận `PlayerGameAction` v0.2 và trả filtered player view.
- Structured events là history nội bộ; player view chỉ nhận public outcome đã
  allowlist và private feedback của đúng viewer.
- `GameState.version` tăng sau mỗi command hợp lệ; WebSocket dùng
  `commandId` + `expectedVersion` để dedupe/reconcile retry.
- Day A/B chạy tuần tự; Council, Night, Defense và Purge khóa lệnh hai bên trước khi phân giải.
- Chi tiết migration và decision log nằm trong `docs/development/ruleset-v0.2-migration-plan.md`.
