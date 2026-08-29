# ADR-0001: Core rules cho prototype v0.1

- Ngày: 27/08/2026
- Trạng thái: Đã chấp nhận cho v0.1
- Chủ sở hữu: Game Designer / Product Owner

## Bối cảnh

Team cần một bộ luật đủ cụ thể để UI/UX dựng prototype và Dev thiết kế state machine, trong khi nhiều chi tiết cân bằng vẫn cần playtest.

## Quyết định

- Trận 1v1; mỗi bên có 10 lá trên sân.
- Vai trò ẩn với đối thủ. Kỹ năng Ban ngày lộ role ngay khi xác nhận; kỹ năng Ban đêm giữ kín tới Bình minh. Các lá phe dân được chọn làm voter lộ role khi Vote xác nhận.
- Vai trò có thể dùng Ban ngày, Ban đêm hoặc cả hai.
- Phù thủy hồi sinh ban ngày và đầu độc ban đêm.
- Host là A và đi trước trong v0.1.
- Vòng 1: Ban ngày A → B, rồi Ban đêm A → B; kết quả đêm công bố vào Bình minh hôm sau.
- Từ Vòng 2 mở Vote/Hội đồng: bảng hiển thị giữa bàn, chọn đúng 3 voter phe dân bằng click chọn/bỏ chọn; đủ 3 mới bật Xác nhận, có thể Bỏ qua. Dân làng có trọng số 2. Vote vào lá Dân làng đối thủ vẫn là Treo cổ bình thường.
- Từ Vòng 6, sau resolve Đêm và Bình minh, chạy pha **Thanh trừng** màu đỏ trước Ban ngày; pha bắt buộc, resolve đồng thời, không có Bỏ qua. Chu kỳ prototype: V6 Cắt bỏ, V7 Đảo chiến tuyến, V8 Ép lộ diện, V9 Khóa mạch.
- Mỗi người tối đa một hành động chính mỗi pha.
- Ban ngày có Kỹ năng / Vote-Treo cổ / Bỏ lượt; Ban đêm có skill bí mật hoặc Bỏ lượt.
- Bảo vệ chỉ chọn lá khác, không tự bảo vệ; một card không được bảo vệ ở hai đêm liên tiếp. Bảo vệ chặn kill/skill tấn công nhắm trực tiếp nhưng không chặn soi, debuff hoặc Treo cổ Ban ngày.
- Tiên tri không có countdown riêng; mỗi đêm người chơi phải chọn Tiên tri hoặc action giết khác. Lần soi đầu làm lộ role; chỉ lá phe bóng tối đã soi mới có thể được soi lần hai để kết liễu. Lá phe sáng đã soi bị disable khỏi mục tiêu soi lại.
- Mỗi lá chỉ kích hoạt kỹ năng một lần/vòng; mỗi role có thể có giới hạn lần dùng/trận và ngưỡng lộ riêng. Usage và trạng thái lộ không reset khi hồi sinh.
- Hai bên cùng hết bài sau một batch resolve thì hòa.
- Thắng khi đối thủ hết bài, nhận thua, hoặc không trở lại trong reconnect window.
- Từ Vòng 6 có Thanh trừng màu đỏ để tăng nhịp, diễn ra sau Bình minh và trước Ban ngày; chu kỳ prototype là V6 Cắt bỏ, V7 Đảo chiến tuyến, V8 Ép lộ diện, V9 Khóa mạch.
- Post-match có Đấu lại, Đối thủ khác và Thoát.

## Hệ quả

- Dùng kỹ năng tạo trade-off trực tiếp giữa sức mạnh và an toàn thông tin.
- Game engine cần phân tách public/private state và resolve hành động đêm theo event order.
- First-player advantage và mức phạt Treo cổ sai phải được đo trong playtest.
- Các giới hạn kỹ năng, Thanh trừng, Vote và thứ tự resolve vẫn là điều kiện trước khi build full match.

## Cách kiểm chứng / Khi nào xem lại

Xem lại sau 10–20 ván paper/Figma hoặc sớm hơn nếu không thể resolve một tình huống mà không tranh luận. Đặc biệt đo:

- lợi thế của A;
- tỷ lệ dùng kỹ năng so với giữ ẩn;
- số lần Treo cổ và tỷ lệ đoán đúng;
- thời lượng trận;
- số trận cần Tai họa.
