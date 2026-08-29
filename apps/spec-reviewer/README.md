# Twofold Spec Reviewer & Role Atlas (`@twofold/spec-reviewer`)

Ứng dụng nội bộ phục vụ tra cứu, đặc tả (specification) và thẩm định (review) bộ vai trò (role) cho dự án Twofold do Product Owner xây dựng.

## Mục đích sử dụng

- **Khám phá & phân loại role (`index.html`)**: Xem toàn bộ 92 vai trò theo phe (Phe Dân Làng, Phe Ma Sói, Solo...), mức độ ưu tiên (`core`, `prototype`, `consider`, `adapt`, `later`, `event`) và giai đoạn xuất hiện (`main`, `round6`, `hold`).
- **Gợi ý bộ test**: Cung cấp cấu hình 10 vai trò khởi đầu cho các đợt playtest Alpha.
- **Role Shortlist Review (`shortlist.html`)**: Cho phép PO & Game Designer chọn lọc danh sách vai trò mong muốn, xem tổng hợp và sao chép định dạng text để mang vào các buổi họp thống nhất luật game.
- **Game Flow Demo (`game-flow-demo/ui.html`)**: Prototype tương tác 1v1 để review trực tiếp nhịp Hội đồng → Ban ngày → Khóa lệnh đêm → Chạng vạng → Bình minh, gồm bot B và card đặc biệt từ Vòng 6.
- **Review Notes (`/notes`)**: Ghi note chung hoặc note gắn với role, giữ cache khi offline và đồng bộ nhiều thiết bị qua Postgres.

## Cấu trúc thư mục

```text
apps/spec-reviewer/
├── assets/
│   ├── game/wwo-reference/  # Hình ảnh tham chiếu vai trò
│   └── ui/                  # Hình ảnh banner & hero UI
├── data/
│   └── roles.json           # Dữ liệu 92 vai trò chi tiết
├── scripts/
│   ├── check-role-data.mjs         # Kiểm tra tính toàn vẹn của dữ liệu roles
│   ├── annotate-role-gameplay.mjs  # Tự động gán mã và kỹ năng ngày/đêm
│   ├── extract-wwo-roles.mjs       # Script trích xuất vai trò từ nguồn wikitext
│   └── prepare-role-art.mjs        # Chuẩn bị asset hình ảnh tham chiếu
├── game-flow-demo/          # Spec demo game flow 1v1 chạy local
├── api/notes.mjs            # Vercel Function CRUD và đồng bộ notes
├── db/                      # Migrations Postgres cho notes
├── lib/note-store.js        # Cache, outbox và sync phía trình duyệt
├── notes/index.html         # Trang /notes
├── notes.js                 # UI quản lý notes
├── index.html               # Giao diện chính Role Atlas
├── shortlist.html           # Giao diện xem danh sách đã chọn
├── app.js                   # Logic render, tìm kiếm và lọc vai trò
├── shortlist.js             # Logic quản lý shortlist và copy clipboard
├── styles.css               # Design system & CSS styles
└── package.json
```

## Hướng dẫn chạy

Từ thư mục gốc dự án hoặc trong thư mục `apps/spec-reviewer`:

```bash
# Khởi chạy dev server (cổng 4173)
pnpm --filter @twofold/spec-reviewer dev
# hoặc
npm run --prefix apps/spec-reviewer dev

# Chạy kiểm tra dữ liệu vai trò
pnpm --filter @twofold/spec-reviewer check
# hoặc
npm run --prefix apps/spec-reviewer check
```

Sau khi dev server chạy, mở `http://127.0.0.1:4173/game-flow-demo/ui.html` để playtest spec game flow.

## Cấu hình Review Notes

Notes dùng Vercel Function làm API và Neon-compatible Postgres làm nguồn dữ liệu chính. `localStorage` chỉ là cache và outbox để PO vẫn ghi được khi tạm mất mạng.

1. Tạo một Postgres database từ Vercel Marketplace (khuyến nghị Neon) và bảo đảm project có biến `DATABASE_URL`.
2. Chạy lần lượt migrations trong `db/` bằng SQL console. Database mới chỉ cần `001`; database đã có bảng notes chạy thêm `002`, rồi `003` để hỗ trợ trạng thái Done.
3. Sinh token dùng chung, ví dụ `openssl rand -hex 32`, rồi đặt giá trị đó vào biến môi trường `NOTES_WORKSPACE_TOKEN` trên Vercel.
4. Deploy lại project. Mở `/notes`, nhập token một lần trên mỗi thiết bị rồi nhấn **Lưu & đồng bộ**.

Không đưa `DATABASE_URL` hoặc secret key của database vào JavaScript phía trình duyệt. File [`.env.example`](.env.example) mô tả các biến cần thiết; `.env.local` không được commit.

Vercel project đã được chuẩn hóa là `ngvihoas-projects/twofold-reviewer`. Lần đầu trên một máy, link project rồi pull Preview env (environment hiện chứa Neon credentials) về `.env.local`:

```bash
pnpm env:link:spec
pnpm env:pull:spec
pnpm --filter @twofold/spec-reviewer db:migrate
pnpm --filter @twofold/spec-reviewer dev:vercel
```

Sau khi env trên Vercel thay đổi, chỉ cần chạy lại `pnpm env:pull:spec`. Có thể dùng `env:pull:development`, `env:pull:preview` hoặc `env:pull:production` trong workspace khi cần tách file theo environment.

`pnpm --filter @twofold/spec-reviewer dev` vẫn chạy static server nhẹ; note sẽ được giữ local nhưng API đồng bộ không hoạt động trong chế độ đó.
