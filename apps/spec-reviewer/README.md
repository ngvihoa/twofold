# Twofold Spec Reviewer & Role Atlas (`@twofold/spec-reviewer`)

Ứng dụng nội bộ phục vụ tra cứu, đặc tả (specification) và thẩm định (review) bộ vai trò (role) cho dự án Twofold do Product Owner xây dựng.

## Mục đích sử dụng

- **Khám phá & phân loại role (`index.html`)**: Xem toàn bộ 92 vai trò theo phe (Phe Dân Làng, Phe Ma Sói, Solo...), mức độ ưu tiên (`core`, `prototype`, `consider`, `adapt`, `later`, `event`) và giai đoạn xuất hiện (`main`, `round6`, `hold`).
- **Gợi ý bộ test**: Cung cấp cấu hình 10 vai trò khởi đầu cho các đợt playtest Alpha.
- **Role Shortlist Review (`shortlist.html`)**: Cho phép PO & Game Designer chọn lọc danh sách vai trò mong muốn, xem tổng hợp và sao chép định dạng text để mang vào các buổi họp thống nhất luật game.

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
