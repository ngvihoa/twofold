# ADR-0001: Core rules cho prototype v0.1

- Ngày: 27/08/2026
- Trạng thái: Đã chấp nhận cho v0.1
- Chủ sở hữu: Game Designer / Product Owner

## Bối cảnh

Team cần một bộ luật đủ cụ thể để UI/UX dựng prototype và Dev thiết kế state machine, trong khi nhiều chi tiết cân bằng vẫn cần playtest.

## Quyết định

- Trận 1v1; mỗi bên có 10 lá trên sân.
- Vai trò ẩn với đối thủ; dùng kỹ năng làm lộ hoàn toàn vai trò theo rule hiện tại.
- Vai trò có thể dùng Ban ngày, Ban đêm hoặc cả hai.
- Phù thủy hồi sinh ban ngày và đầu độc ban đêm.
- Host là A và đi trước trong v0.1.
- Vòng 1: Ban ngày A → B, rồi Ban đêm A → B; kết quả đêm công bố vào sáng hôm sau.
- Mỗi người tối đa một hành động chính mỗi pha.
- Ban ngày có Kỹ năng / Treo cổ / Bỏ lượt; Treo cổ yêu cầu chọn lá và đoán vai trò.
- Thắng khi đối thủ hết bài, nhận thua, hoặc không trở lại trong reconnect window.
- Từ Vòng 7 có Tai họa để tăng nhịp.
- Post-match có Đấu lại, Đối thủ khác và Thoát.

## Hệ quả

- Dùng kỹ năng tạo trade-off trực tiếp giữa sức mạnh và an toàn thông tin.
- Game engine cần phân tách public/private state và resolve hành động đêm theo event order.
- First-player advantage và mức phạt Treo cổ sai phải được đo trong playtest.
- Các giới hạn kỹ năng và thứ tự resolve vẫn là điều kiện trước khi build full match.

## Cách kiểm chứng / Khi nào xem lại

Xem lại sau 10–20 ván paper/Figma hoặc sớm hơn nếu không thể resolve một tình huống mà không tranh luận. Đặc biệt đo:

- lợi thế của A;
- tỷ lệ dùng kỹ năng so với giữ ẩn;
- số lần Treo cổ và tỷ lệ đoán đúng;
- thời lượng trận;
- số trận cần Tai họa.
