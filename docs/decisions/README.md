# Decision Log / ADR

Thư mục này lưu các quyết định ảnh hưởng đến luật, scope hoặc kiến trúc để team biết **đã chọn gì, vì sao và khi nào cần xem lại**.

## Quy ước

- Tên file: `NNNN-ten-ngan-gon.md`.
- Trạng thái: `Đề xuất`, `Đã chấp nhận`, `Đã thay thế`, `Đã hủy`.
- Quyết định mới không sửa lịch sử của ADR cũ; tạo ADR mới và liên kết mục “Thay thế”.
- Quyết định nhỏ, dễ đảo ngược có thể ghi ở bảng log dưới đây.

## ADR hiện có

| ID | Quyết định | Trạng thái | Ngày |
|---|---|---|---:|
| [ADR-0001](0001-core-rules-v0.1.md) | Chọn bộ core rules để dựng Alpha | Đã chấp nhận cho v0.1 | 27/08/2026 |
| [ADR-0002](0002-alpha-scope-and-milestones.md) | Khóa phạm vi và milestone Web Alpha | Đã chấp nhận | 27/08/2026 |
| [ADR-0003](0003-tech-stack-tanstack-start-orpc.md) | Chọn Tech Stack: TanStack Start, oRPC và All-in-One Realtime | Đã chấp nhận | 28/08/2026 |
| [ADR-0004](0004-hidden-night-death-information.md) | Bài úp chết trong đêm không tự lộ danh tính | Đã chấp nhận cho prototype | 30/08/2026 |

## Decision log nhỏ

| Ngày | Quyết định | Người quyết định | Lý do / ghi chú |
|---:|---|---|---|
| 27/08/2026 | Ưu tiên tiếng Việt cho rule, vai trò và tài liệu | Game Designer/PO | Team đọc nhanh và thống nhất thuật ngữ |
| 27/08/2026 | Dùng tạo/vào phòng bằng mã cho Alpha, chưa làm matchmaking | Team, cần Dev xác nhận kỹ thuật | Giảm scope và dễ test nội bộ |

## Mẫu ADR

```md
# ADR-NNNN: Tên quyết định

- Ngày: YYYY-MM-DD
- Trạng thái: Đề xuất / Đã chấp nhận / Đã thay thế / Đã hủy
- Chủ sở hữu: ...

## Bối cảnh

## Quyết định

## Hệ quả

## Cách kiểm chứng / Khi nào xem lại
```
