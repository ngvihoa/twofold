# Hướng dẫn AI Agent & Nhà phát triển — Twofold Monorepo

Tài liệu này cung cấp toàn bộ bối cảnh kiến trúc, quy chuẩn mã nguồn, danh mục workspaces, công cụ dòng lệnh (CLI), và tài liệu tham chiếu quản lý dự án dành cho **Product Owner (PO)**, **AI Agent**, cùng các kỹ sư tham gia phát triển dự án **Twofold**.

---

## 0. Ranh giới bắt buộc giữa Spec và Runtime

Mọi agent phải đọc và tuân thủ [Spec → Runtime Migration Policy](docs/development/spec-runtime-migration-policy.md) trước khi thay đổi rule, engine, shared contract hoặc gameplay web.

- `apps/spec-reviewer` là nguồn thử nghiệm rule mới hơn dành cho PO, game design và playtest.
- `packages/game-core`, `packages/shared-types` và `apps/web` là snapshot runtime có thể chậm hơn spec.
- Không giả định hai phía có logic giống nhau và không cố ép parity ở mọi commit.
- Không import source, adapter, fixture hoặc test trực tiếp qua ranh giới reviewer ↔ runtime.
- Thay đổi trong reviewer không cấp quyền tự động sửa runtime. Muốn chuyển rule sang web/core phải tạo một task migration có kế hoạch, freeze mốc spec nguồn, ghi scope/out-of-scope, contract changes, test plan và acceptance criteria.
- Không resolve conflict bằng cách chọn toàn bộ logic của một phía đè lên phía còn lại chỉ vì phía đó mới hơn.

Nếu task không nói rõ đang thay đổi spec hay runtime, agent phải xác định phạm vi từ file/task hiện có; khi quyết định có thể làm thay đổi behavior production, phải hỏi lại Product Owner.

---

## 1. Tổng quan Dự án (Project Overview)

- **Tên dự án:** Twofold
- **Thể loại:** Game đối kháng chiến thuật **1v1 theo lượt**, lấy cảm hứng từ cơ chế Ma Sói (vai trò ẩn, suy luận, đánh lừa, kỹ năng ngày/đêm, treo cổ).
- **Mục tiêu cốt lõi:** Người chơi chiến thắng nhờ khả năng đọc vị và đánh lừa đối thủ thật trong một trận đấu có thông tin bất đối xứng.
- **Trạng thái & Mốc thời gian:**
  - Giai đoạn: **Tiền sản xuất / Luật v0.1**
  - Mốc gần nhất (M1): **07/09/2026**
  - Mục tiêu phát hành (M6): **Web Alpha nội bộ trước 30/10/2026**

---

## 2. Cấu trúc Monorepo & Danh mục Workspace

Dự án được tổ chức dưới dạng **pnpm / npm Monorepo** chuẩn mực:

```text
twofold/
├── apps/
│   ├── spec-reviewer/               # [PO SPEC & REVIEW] Công cụ tra cứu, đặc tả và review 92 vai trò (-sr)
│   │   ├── assets/                  # Artwork tham chiếu và UI banner
│   │   ├── data/roles.json          # Dữ liệu 92 vai trò (bộ chính 70, vòng 6: 19, chưa dùng: 3)
│   │   ├── scripts/                 # Scripts kiểm tra dữ liệu và gán kỹ năng
│   │   ├── index.html               # Giao diện Role Atlas & 10 role gợi ý test ban đầu
│   │   ├── shortlist.html           # Giao diện xem/tinh gọn danh sách role đã chọn cho buổi họp
│   │   ├── app.js                   # Logic render, tìm kiếm, lọc theo phe/fit/stage
│   │   ├── shortlist.js             # Logic quản lý shortlist và copy clipboard
│   │   ├── styles.css               # Design system & CSS styles
│   │   └── package.json             # @twofold/spec-reviewer
│   └── web/                         # [UPCOMING] Web Alpha Game Client chính thức (-w)
│       ├── package.json             # @twofold/web
│       └── README.md
├── packages/
│   ├── cli/                         # Centralized Monorepo Management CLI (@twofold/cli, -c)
│   │   ├── bin/twofold.mjs          # Entrypoint thực thi CLI
│   │   ├── src/                     # Commands & utilities (Node.js ESM thuần)
│   │   └── package.json             # @twofold/cli
│   ├── game-core/                   # Shared ruleset v0.1 & turn state machine (-gc)
│   │   ├── package.json             # @twofold/game-core
│   │   └── README.md
│   └── shared-types/                # Shared data models, type definitions & schemas (-st)
│       ├── package.json             # @twofold/shared-types
│       └── README.md
├── bin/
│   ├── tf                           # Executable wrapper cho Twofold CLI
│   └── twofold                      # Executable wrapper cho Twofold CLI
├── docs/                            # Toàn bộ tài liệu thiết kế game và quản lý dự án
│   ├── decisions/                   # Architectural Decision Records (ADRs)
│   ├── game-design/                 # Flow, rules, roles draft
│   └── project-management/          # Roadmap, task tracker dành cho PO & Team
├── pnpm-workspace.yaml              # Cấu hình pnpm workspace
├── package.json                     # Root package scripts
├── AGENTS.md                        # Chỉ dẫn tự động áp dụng cho agent trong toàn repo
└── README.md                        # Tài liệu tổng quan dự án
```

---

## 3. Tham chiếu Quản lý Dự án cho PO (Project Management)

Toàn bộ kế hoạch, mốc thời gian và tiến độ thực thi được quản lý tập trung (Single Source of Truth) tại thư mục [`docs/project-management/`](docs/project-management):

- **Lộ trình & Milestones:** Tra cứu chi tiết tại [`docs/project-management/roadmap.md`](docs/project-management/roadmap.md) (mục tiêu sản phẩm, mốc phát hành và câu hỏi trọng tâm từng giai đoạn).
- **Theo dõi Tiến độ & Tasks:** Cập nhật và theo dõi trạng thái công việc tại [`docs/project-management/task-tracker.md`](docs/project-management/task-tracker.md).

### Quy trình PO sử dụng Công cụ `apps/spec-reviewer` và CLI:
1. **Khởi chạy giao diện duyệt vai trò:**
   ```bash
   pnpm tf dev -sr
   ```
2. **Thao tác trên giao diện:**
   - Mở `http://localhost:4173/` để tra cứu, lọc và phân loại 92 role theo phe và mức độ phù hợp (`fit`).
   - Mở `http://localhost:4173/shortlist.html` để tinh gọn danh sách role dự kiến đưa vào Alpha, sau đó nhấn **Sao chép** để lấy văn bản đưa vào buổi họp thống nhất luật.
3. **Khi PO chỉnh sửa dữ liệu trong [`apps/spec-reviewer/data/roles.json`](apps/spec-reviewer/data/roles.json):**
   ```bash
   pnpm tf check -sr
   ```
   Lệnh này tự động kiểm tra tính toàn vẹn của 92 roles, 5 factions và hình ảnh tham chiếu.

---

## 4. Centralized CLI (`tf` / `twofold`)

Monorepo sở hữu công cụ CLI tập trung viết bằng **Node.js ESM thuần (Zero External Dependencies)**, cung cấp cú pháp chuẩn hóa:

```bash
pnpm tf <feat> [--filter <project_name> | -<shorten>]
```

### Bảng Mã Rút Gọn (Workspace Aliases)

| Project Name | Thư mục | Tên gói | Mã rút gọn (`-<short>`) |
|---|---|---|---|
| **Spec Reviewer** | `apps/spec-reviewer` | `@twofold/spec-reviewer` | **`-sr`** |
| **Web Client** | `apps/web` | `@twofold/web` | **`-web`** / **`-w`** |
| **Game Core** | `packages/game-core` | `@twofold/game-core` | **`-gc`** |
| **Shared Types** | `packages/shared-types` | `@twofold/shared-types` | **`-st`** |
| **CLI Tool** | `packages/cli` | `@twofold/cli` | **`-cli`** / **`-c`** |

### Các Lệnh Thao Tác Chính

```bash
# 1. Liệt kê mọi workspace và mã alias
pnpm tf list

# 2. Khởi chạy dev server (mặc định mở Spec Reviewer trên cổng 4173)
pnpm tf dev -sr
# hoặc: pnpm tf dev --filter spec-reviewer

# 3. Kiểm tra tính toàn vẹn dữ liệu roles và code test
pnpm tf check -sr                # Kiểm tra riêng spec-reviewer
pnpm tf check                    # Kiểm tra toàn bộ monorepo

# 4. Tự động sinh boilerplate app hoặc package mới (Scaffolding)
pnpm tf create app admin-portal "Admin management dashboard"
pnpm tf create package network-sync "State sync over websocket"

# 5. Chạy một script tùy ý trong một project
pnpm tf run spec-reviewer check

# 6. Xem thông tin dự án & mốc roadmap
pnpm tf info
```

---

## 5. Nguyên tắc & Quy chuẩn Dành cho Agent (Agent Guidelines)

Khi thao tác hoặc mở rộng codebase trong repository này, Agent cần tuân thủ các nguyên tắc sau:

1. **Bảo toàn Specification & Review Tools của PO**:
   - Tuyệt đối không xóa hoặc làm đứt gãy liên kết dữ liệu trong [`apps/spec-reviewer`](apps/spec-reviewer).
   - Bộ dữ liệu [`apps/spec-reviewer/data/roles.json`](apps/spec-reviewer/data/roles.json) là nguồn sự thật (source of truth) cho 92 vai trò hiện tại.
2. **Kiểm tra Tự động (Verification First)**:
   - Sau bất kỳ thay đổi nào liên quan đến cấu trúc dữ liệu vai trò hoặc package, luôn chạy `pnpm tf check` hoặc `node apps/spec-reviewer/scripts/check-role-data.mjs` để xác nhận `OK: 92 roles, 5 factions, 80 images`.
3. **Phân giải Đường dẫn Linh hoạt (Relative & URL-based Paths)**:
   - Trong tài liệu markdown, sử dụng đường dẫn tương đối (relative paths) thay vì đường dẫn tuyệt đối (absolute paths).
   - Khi viết scripts Node.js ESM, luôn phân giải đường dẫn dựa trên `import.meta.url` kết hợp `path.resolve` để đảm bảo script có thể chạy độc lập từ root repo hoặc từ thư mục con của package.
4. **Quy chuẩn Tạo Workspace Mới**:
   - Khi tạo thêm module, ưu tiên sử dụng `pnpm tf create <app|package> <name>` để tuân thủ quy chuẩn đặt tên (`@twofold/<name>`), cấu trúc `src/`, `package.json` và `README.md`.
5. **Tham chiếu Tài liệu Thiết kế & Quản lý Dự án**:
   - Trước khi thay đổi luật hoặc cơ chế game, hãy đối chiếu các quyết định trong [`docs/decisions/`](docs/decisions/) và tài liệu [`docs/game-design/`](docs/game-design/).
   - Sau mỗi buổi sync hoặc khi hoàn thành task, cập nhật tiến độ tương ứng trong [`docs/project-management/task-tracker.md`](docs/project-management/task-tracker.md).
6. **Không tự động đồng bộ Spec → Runtime**:
   - Mọi thay đổi xuyên `apps/spec-reviewer` → `packages/game-core`/`packages/shared-types`/`apps/web` phải có task migration riêng theo policy tại [`docs/development/spec-runtime-migration-policy.md`](docs/development/spec-runtime-migration-policy.md).
   - Test pass độc lập ở hai workspace không phải bằng chứng parity.
