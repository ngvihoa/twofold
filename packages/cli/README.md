# Twofold Centralized CLI (`@twofold/cli`)

Công cụ CLI tập trung (`tf` / `twofold`) phục vụ phát triển, điều phối và mở rộng (scale) các ứng dụng (`apps/`) và thư viện (`packages/`) trong Twofold Monorepo.

## Định dạng Cú pháp Chuẩn

```bash
pnpm tf <feat> [--filter <project_name> | -<shorten>]
```

## Bảng tra cứu Mã rút gọn (Aliases)

| Project | Location | Tên đầy đủ | Mã rút gọn (`-<short>`) |
|---|---|---|---|
| **Spec Reviewer** | `apps/spec-reviewer` | `spec-reviewer` | `-sr` |
| **Web Alpha Client** | `apps/web` | `web` | `-w` |
| **Game Core** | `packages/game-core` | `game-core` | `-gc` |
| **Shared Types** | `packages/shared-types` | `shared-types` | `-st` |
| **CLI** | `packages/cli` | `cli` | `-c` |

## Các lệnh thường dùng

```bash
# 1. Liệt kê workspaces và mã rút gọn
pnpm tf list

# 2. Khởi chạy dev server (Spec Reviewer)
pnpm tf dev --filter spec-reviewer
pnpm tf dev -sr

# 3. Kiểm tra dữ liệu vai trò / tests
pnpm tf check --filter spec-reviewer
pnpm tf check -sr
pnpm tf check # Toàn bộ monorepo

# 4. Mở rộng tạo mới app/package
pnpm tf create app admin-portal "Admin dashboard"
pnpm tf create package audio-manager "Quản lý âm thanh"
```
