# Core Gameplay v0.1

- Phiên bản: 0.1
- Ngày cập nhật: 27/08/2026
- Trạng thái: Draft có thể chơi thử

## 1. Tầm nhìn

Game chiến thuật 1v1 nơi mỗi bên điều khiển 10 lá có vai trò ẩn. Người chơi dùng kỹ năng để lấy lợi thế nhưng việc dùng kỹ năng làm lộ vai trò, khiến lá đó dễ bị suy luận và treo cổ ở các lượt sau.

Game không dùng ATK/DEF/HP như card battler truyền thống ở v0.1. Trọng tâm là trạng thái, thông tin, lựa chọn mục tiêu và hậu quả.

## 2. Trạng thái lá bài

| Trạng thái | Ý nghĩa |
|---|---|
| Ẩn | Đối thủ chưa biết vai trò thật |
| Đã lộ | Vai trò thật được công khai |
| Được bảo vệ | Có hiệu ứng ngăn bị loại theo phạm vi kỹ năng |
| Đã chết / bị loại | Không còn trên sân và không hành động, trừ hiệu ứng bị động |

Các trạng thái như bị câm lặng, bị đánh dấu hoặc ngụy trang chỉ thêm sau khi rule tương ứng được chọn cho prototype.

## 3. Luật thông tin

- Chủ sở hữu luôn biết vai trò của 10 lá mình.
- Đối thủ chỉ thấy vị trí và trạng thái công khai của lá đang ẩn.
- Theo rule hiện tại, **lá dùng kỹ năng sẽ lộ hoàn toàn vai trò thật**.
- Hành động Ban ngày thiên về công khai và suy luận.
- Hành động Ban đêm thiên về bí mật và can thiệp; đối thủ không thấy lựa chọn trước khi khóa.
- Vai trò nâng cao sau này có thể phá luật lộ: che, giả hoặc tráo thông tin. Đây chưa phải mặc định.

## 4. Hành động mỗi pha

Mỗi người chỉ thực hiện tối đa **một hành động chính trong mỗi pha** để tránh 20 lá khiến vòng kéo dài.

### Ban ngày

- Dùng một kỹ năng Ban ngày hợp lệ.
- Treo cổ.
- Bỏ lượt.

### Ban đêm

- Dùng một kỹ năng Ban đêm hợp lệ.
- Bỏ lượt, nếu luật cuối cho phép.

Vai trò có kỹ năng cả ngày và đêm vẫn tuân theo giới hạn hành động của pha. Giới hạn “mỗi vai trò chỉ kích hoạt một lần trong cùng vòng” là đề xuất cần playtest, chưa chốt thành luật toàn cục.

## 5. Treo cổ v0.1

Trong lượt Ban ngày, người chơi có thể:

1. Chọn một lá của đối thủ.
2. Đoán vai trò thật của lá đó.
3. Nếu đúng: lá lộ vai trò và bị loại.
4. Nếu sai: không lá nào bị loại; người chơi đã mất hành động Ban ngày.

Mục đích của cơ chế này là biến thông tin đã quan sát thành quyết định có rủi ro, đồng thời khiến việc dùng kỹ năng mạnh có cái giá rõ ràng.

## 6. Nhóm cơ chế

| Nhóm | Chức năng | Ví dụ |
|---|---|---|
| Loại bỏ | Loại một lá khỏi sân | Ma sói, Phù thủy |
| Bảo vệ | Chặn hoặc chuyển hiệu ứng loại bỏ | Bảo vệ, Kẻ thế thân |
| Thu thập thông tin | Tìm vai trò hoặc nhóm vai trò | Tiên tri, Thầy bói |
| Kiểm soát | Khóa, ép hoặc đổi hành động | Kẻ câm lặng |
| Đánh lừa | Giấu, giả, tráo thông tin/vị trí | Kẻ ngụy trang, Kẻ tráo đổi |
| Phản ứng | Kích hoạt khi bị nhắm hoặc bị loại | Thợ săn, Người báo thù |

Hệ tương khắc cần hướng tới:

- Loại bỏ ↔ Bảo vệ
- Thông tin ↔ Đánh lừa
- Kiểm soát ↔ Phản ứng/khắc chế
- Treo cổ ↔ Vai trò ẩn

## 7. Phân giải xung đột

Thứ tự phân giải kỹ năng đêm chưa được chốt. Trước khi code game engine, team phải định nghĩa ít nhất:

- bảo vệ có chặn đầu độc và mọi nguồn loại bỏ không;
- hồi sinh diễn ra trước hay sau kiểm tra thắng;
- hai lá cùng loại bỏ nhau có tạo hòa hay không;
- phản ứng khi chết diễn ra trước hay sau công bố bình minh;
- mục tiêu chết trước khi kỹ năng của nó resolve thì kỹ năng còn hiệu lực không.

Dev nên biểu diễn hành động thành event có thứ tự ưu tiên, không để UI tự quyết rule.

## 8. Điều kiện thắng và rời trận

- Hết bài trên sân: thua.
- Nhận thua: thua ngay sau xác nhận.
- Mất kết nối: mở reconnect window; hết thời hạn mới xử thua.
- Kết quả được kiểm tra sau mỗi resolution và sau các hành động có thể kết thúc trận.

## 9. Tai họa / Calamity

- Kích hoạt từ Vòng 7.
- Mục tiêu: làm bàn chơi thu hẹp nhanh hơn và tăng quyết định khó.
- Tai họa không nên tự chọn ngẫu nhiên một lá rồi xóa mà không cho phản ứng.
- Bộ Alpha chỉ cần 3 Tai họa đủ khác nhau để đo pacing.

## 10. Câu hỏi mở ưu tiên cao

| ID | Câu hỏi | Cần chốt trước |
|---|---|---|
| OQ-01 | Timer mỗi lượt là bao lâu? | Prototype web nhiều người |
| OQ-02 | Thứ tự resolve toàn bộ kỹ năng | Game engine v0.1 |
| OQ-03 | Bộ 10 lá cơ bản cuối cùng và số bản sao | Paper/Figma playable |
| OQ-04 | Giới hạn dùng kỹ năng theo lá/trận/vòng | Paper playtest |
| OQ-05 | Bỏ lượt đêm có được phép không? | Rule v0.1 |
| OQ-06 | 3 Tai họa chính xác cho Alpha | Full match |
| OQ-07 | Có trường hợp hòa không? | Game engine v0.1 |
| OQ-08 | Reconnect window cụ thể | Internal Alpha |
