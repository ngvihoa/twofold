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
  → Từ Vòng 2: Hội đồng → Ban đêm A → B, khóa hành động kín
  → Bình minh: giải quyết và công bố kết quả
  → Từ Vòng 6: Thanh trừng bắt buộc → Ban ngày vòng mới
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
   - bỏ lượt.
4. Hành động công khai được phản hồi rõ trên giao diện.
5. Từ Vòng 2, sau lượt ngày của B là Hội đồng: chọn đúng 3 lá phe Dân còn sống làm voter. Dân làng có trọng số 2; voter khác có trọng số 1. Lá voter còn ẩn sẽ lộ khi Vote được xác nhận.
6. Nếu mục tiêu đã lộ thì xử lý Treo cổ ngay; mục tiêu còn úp mới cần đoán một role chưa bị loại trừ bởi các lá công khai.

### 3.2 Ban đêm

1. A chọn một kỹ năng Ban đêm và xác nhận.
2. B chỉ biết A đã khóa lệnh, không thấy nguồn, mục tiêu hay loại action, rồi chọn kỹ năng và xác nhận.
3. Hai hành động được khóa; vị trí có khiên được công khai ở Chạng vạng, còn nguồn và mục tiêu lệnh đêm chỉ công bố ở Bình minh.
4. Kết quả không công bố ngay trong đêm.

### 3.3 Bình minh

- Hệ thống công bố các kết quả cần công khai của đêm trước.
- Lá còn ẩn bị loại trong đêm chết ngay tại vị trí trên tay; không tự di chuyển vào lane công khai và không lộ phe/role.
- Lá đã lộ trước khi bị loại vẫn nằm ở lane công khai với trạng thái chết.
- Cập nhật lá bị loại, được bảo vệ, hồi sinh hoặc các trạng thái liên quan.
- Kiểm tra điều kiện kết thúc trận.
- Nếu chưa kết thúc, bắt đầu pha Ban ngày của vòng mới.

### 3.4 Thanh trừng

- Vòng 1–5 dùng luật thường.
- Từ Vòng 6, sau Bình minh và trước Ban ngày, hai bên bắt buộc chọn bí mật rồi resolve đồng thời một luật Thanh trừng.
- Chu kỳ prototype: Vòng 6 **Cắt bỏ**, Vòng 7 **Đảo chiến tuyến**, Vòng 8 **Ép lộ diện**, Vòng 9 **Khóa mạch**, sau đó lặp lại.
- Khóa mạch vô hiệu cả kỹ năng lẫn quyền Vote của lá bị chọn trong vòng đó.

Đây là luật prototype cần human playtest, chưa phải kết luận cân bằng cuối cùng.

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
