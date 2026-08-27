# Game Flow v0.1

- Phiên bản: 0.1
- Ngày cập nhật: 27/08/2026
- Chủ sở hữu: Game Designer / Product Owner
- Trạng thái: Draft để prototype và playtest

## 1. Luồng tổng thể

```text
Mở web
  → Tạo phòng / Vào phòng bằng mã
  → Lobby có đủ A và B
  → Chọn/gán vai trò cho 10 lá
  → Cả hai hoàn tất
  → Đếm ngược 3 giây (có thể hủy)
  → Bắt đầu trận; Host = A
  → Vòng 1: Ban ngày A → B
  → Ban đêm A → B, khóa hành động kín
  → Bình minh: giải quyết và công bố kết quả
  → Kiểm tra thắng/thua
      ├─ Chưa kết thúc: vòng tiếp theo
      └─ Kết thúc: kết quả → Đấu lại / Đối thủ khác / Thoát
```

## 2. Trước trận

### 2.1 Home và phòng

- Người chơi chọn **Tạo phòng** hoặc **Vào phòng**.
- Tạo phòng sinh mã để gửi cho đối thủ.
- Người tạo phòng là **Host / Người chơi A**.
- Người vào bằng mã là **Người chơi B**.
- Alpha dùng guest; không yêu cầu đăng nhập.

### 2.2 Chọn bài và vai trò

- Mỗi người có 10 vị trí lá bài trên sân.
- Người chơi gán vai trò mình sở hữu vào các vị trí; đối thủ không thấy phép gán này.
- Người mới có một bộ cơ bản dựng sẵn.
- Hệ thống mở khóa vai trò là định hướng sau Alpha; Alpha có thể cho sẵn một số vai trò để thử.
- Khi cả hai hoàn tất, hệ thống tự đếm ngược 3 giây.
- Trong thời gian đếm ngược, một người có thể hủy để quay lại trạng thái chưa sẵn sàng.

## 3. Một vòng đấu

### 3.1 Ban ngày

1. Người chơi A thực hiện một hành động.
2. Người chơi B thực hiện một hành động.
3. Mỗi người chọn một trong các hành động hợp lệ:
   - dùng một kỹ năng Ban ngày;
   - Treo cổ (chọn lá và đoán vai trò);
   - bỏ lượt.
4. Hành động công khai được phản hồi rõ trên giao diện.

### 3.2 Ban đêm

1. A chọn một kỹ năng Ban đêm và xác nhận.
2. B không thấy lựa chọn của A, rồi chọn kỹ năng và xác nhận.
3. Hai hành động được khóa; hệ thống giải quyết theo quy tắc ưu tiên chưa chốt.
4. Kết quả không công bố ngay trong đêm.

### 3.3 Bình minh

- Hệ thống công bố các kết quả cần công khai của đêm trước.
- Cập nhật lá bị loại, được bảo vệ, hồi sinh hoặc các trạng thái liên quan.
- Kiểm tra điều kiện kết thúc trận.
- Nếu chưa kết thúc, bắt đầu pha Ban ngày của vòng mới.

### 3.4 Tai họa

- Vòng 1–6 dùng luật thường.
- Từ Vòng 7, mỗi vòng thêm một Tai họa để tăng áp lực và giảm khả năng kéo dài trận.
- Tai họa nên ngẫu nhiên hóa **tình huống/luật**, nhưng vẫn để người chơi có lựa chọn; tránh xóa ngẫu nhiên một lá quan trọng mà không có quyền phản ứng.

Các mẫu đầu tiên để prototype (chưa phải luật chính thức):

- Mỗi bên phải tự lộ một lá.
- Một loại bảo vệ bị vô hiệu trong vòng hiện tại.
- Hệ thống chỉ định hai lá và người chơi phải chọn một lá để hy sinh.

## 4. Kết thúc trận

Một người thắng khi xảy ra một trong các điều kiện:

- đối thủ không còn lá nào trên sân;
- đối thủ chọn **Nhận thua**;
- đối thủ rời/mất kết nối và không quay lại trước khi hết reconnect window.

Mất mạng hoặc refresh ngắn không được tính là thua ngay. Thời lượng reconnect window cần Dev đề xuất và playtest; giả thuyết Alpha là 20–60 giây.

## 5. Sau trận

- Hiện rõ thắng/thua và lý do kết thúc.
- Có thể lộ lại thông tin/diễn biến để người chơi hiểu khoảnh khắc đánh lừa.
- **Đấu lại:** giữ đối thủ, quay về bước chọn/gán vai trò.
- **Đối thủ khác:** quay về luồng tìm/tạo phòng phù hợp.
- **Thoát:** về Home.

## 6. Danh sách trạng thái UI tối thiểu

| Trạng thái | Người chơi thấy | Hành động chính |
|---|---|---|
| Home | Tạo/vào phòng | Chọn luồng |
| Lobby | Hai người và trạng thái kết nối | Chờ hoặc rời |
| Chọn vai trò | 10 vị trí và bộ vai trò | Gán, xác nhận |
| Đếm ngược | 3–2–1 và trạng thái hai bên | Hủy |
| Lượt ngày của mình | Bàn đấu, thông tin công khai | Kỹ năng / Treo cổ / Bỏ lượt |
| Chờ lượt ngày | Bàn đấu và lượt đối thủ | Quan sát |
| Lượt đêm của mình | Mục tiêu/kỹ năng hợp lệ | Chọn, khóa |
| Chờ đêm | Lựa chọn của mình đã khóa | Chờ; không thấy hành động đối thủ |
| Bình minh | Kết quả đêm và lý do | Xác nhận/tiếp tục |
| Mất kết nối | Đồng hồ reconnect | Chờ hoặc rời |
| Kết quả | Thắng/thua và tóm tắt | Đấu lại / đối thủ khác / thoát |

## 7. Giả thuyết cần kiểm chứng

- Host đi trước mọi pha có tạo lợi thế quá lớn không?
- Một hành động/người/pha có đủ lựa chọn nhưng vẫn giữ trận trong 8–15 phút không?
- Công bố vai trò hoàn toàn khi dùng kỹ năng có làm suy luận quá dễ không?
- Treo cổ bằng cách đoán chính xác vai trò có đủ hấp dẫn và công bằng không?
- Tai họa từ Vòng 7 có đẩy nhịp mà không tạo cảm giác game quyết định thay người chơi không?
