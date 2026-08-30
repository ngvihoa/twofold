# Lịch sử thay đổi role

Tài liệu ghi các thay đổi role/rule đã được đưa vào prototype. Đây không phải kết luận cân bằng cuối cùng; mục `Trạng thái` phân biệt rõ điều đang thử.

## Snapshot 30/08/2026 — canonical game-flow demo

| Role/Rule | Thay đổi đang chạy | Trạng thái | Điều cần playtest |
|---|---|---|---|
| Dân làng | Còn một lá trong bộ prototype; khi làm voter có trọng số 2 | Prototype | Hội đồng có quá dễ đạt ngưỡng không |
| Hội đồng | Từ Vòng 2; đúng 3 voter phe Dân còn sống; voter ẩn sẽ lộ | Prototype | Nhịp ngày và lợi thế của bên lộ nhiều bài |
| Tiên tri | Soi xuyên khiên; lần đầu ghi phe, chỉ phe tối đã soi mới có thể bị kết liễu ở lần hai | Prototype | Áp lực thông tin có quá mạnh không |
| Bảo vệ | Không tự bảo vệ, không bảo vệ cùng lá hai đêm liên tiếp; khiên không chặn Tiên tri | Prototype | Khả năng chống số lượng attack tăng dần |
| Kẻ báo thù | Mục tiêu bị đánh dấu có nhãn và sợi chỉ đỏ mờ nối với Kẻ báo thù cho tới Bình minh hoặc khi nguồn chết | Prototype · UI clarity | Đường nối có còn dễ đọc khi nhiều role cùng lộ không |
| Lệnh đêm | Nguồn và mục tiêu đều giữ kín tới Bình minh; chỉ vị trí có khiên công khai ở Chạng vạng | Prototype | Người chơi có theo dõi được nguyên nhân–kết quả không |
| Thanh trừng | Bắt đầu Vòng 6, chu kỳ Cắt bỏ → Đảo chiến tuyến → Ép lộ diện → Khóa mạch | Prototype | Có giảm thế bị động cuối trận mà không tạo snowball không |
| Khóa mạch | Lá bị chọn không dùng skill và không làm voter trong vòng hiện tại | Prototype | Có khóa cứng một bên khi số lá ít không |

Các thay đổi này được kiểm tra ở mức engine regression; cảm nhận nhịp, độ rõ của animation và cân bằng vẫn cần human playtest.
