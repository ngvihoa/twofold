# Twofold Monorepo — Agent Instructions

Twofold là game đối kháng chiến thuật 1v1 theo lượt. Monorepo `pnpm` gồm `apps/spec-reviewer`, `apps/web`, `packages/{cli,game-core,shared-types}`, và `docs/`.

## Ranh giới Spec ↔ Runtime

- `apps/spec-reviewer` là spec/playtest; `packages/game-core`, `packages/shared-types`, `apps/web` là runtime snapshot, có thể chậm hơn.
- Không import source/adapter/fixture/test qua hai phía. Không ép parity từng commit. Reviewer changes không tự động sửa runtime; migration cần task riêng với scope/contract/test plan/acceptance criteria rõ ràng.
- Không phân giải conflict bằng chọn phía mới đè phía cũ. Nếu không rõ spec hay runtime và có rủi ro production behavior, hỏi Product Owner.

## Source of truth & PO workflow

- `apps/spec-reviewer/data/roles.json`: 92 roles, 5 factions.
- Plan/progress: `docs/project-management/`. Thiết kế/ADR: `docs/game-design/`, `docs/decisions/`.

```bash
pnpm tf dev -sr      # Spec Reviewer, port 4173
pnpm tf check -sr    # kiểm tra roles/factions/images
pnpm tf check        # toàn monorepo
```

## Agent rules

1. Không xóa/làm đứt `apps/spec-reviewer` hoặc dữ liệu roles.
2. Sau thay đổi roles/package, chạy `pnpm tf check` (hoặc script role-data check) trước khi coi xong.
3. Tạo workspace mới bằng `pnpm tf create <app|package> <name>`; không scaffold tay trừ khi user yêu cầu.
4. Markdown dùng relative path. Node ESM scripts resolve path từ `import.meta.url` + `path.resolve`.
5. Sau sync/task, cập nhật `docs/project-management/task-tracker.md` nếu có thay đổi tiến độ.
6. Không đồng bộ spec → runtime tự động.
