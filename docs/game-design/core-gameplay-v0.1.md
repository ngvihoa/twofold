# Core Gameplay v0.1

- Phiên bản: 0.1
- Ngày cập nhật: 27/08/2026
- Trạng thái: Draft có thể chơi thử

## 1. Tầm nhìn

Game chiến thuật 1v1 nơi mỗi bên điều khiển 10 lá có vai trò ẩn. Người chơi dùng kỹ năng để lấy lợi thế; năng lực Ban ngày làm lộ role ngay khi xác nhận, còn năng lực Ban đêm được giữ bí mật tới Bình minh. Vote cũng tạo thông tin công khai vì các lá phe dân được chọn làm voter sẽ lộ role.

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
- Mỗi role có một ngưỡng lộ theo phase. Năng lực Ban ngày lộ role ngay khi xác nhận thành công; action Ban đêm giữ kín tới Bình minh. Vote lộ role của mọi lá phe dân được chọn làm voter khi xác nhận đủ ba lá.
- Hành động Ban ngày thiên về công khai và suy luận.
- Hành động Ban đêm thiên về bí mật và can thiệp; đối thủ không thấy lựa chọn trước khi khóa.
- Vai trò nâng cao sau này có thể phá luật lộ: che, giả hoặc tráo thông tin. Đây chưa phải mặc định.

## 4. Hành động mỗi pha

Mỗi người chỉ thực hiện tối đa **một hành động chính trong mỗi pha** để tránh 20 lá khiến vòng kéo dài.

### Bình minh

- Resolve toàn bộ action Ban đêm của vòng trước.
- Công bố lá bị loại, nguyên nhân và các effect được phép công khai.
- Từ Vòng 6, sau reveal sẽ chuyển sang pha **Thanh trừng** trước khi vào Ban ngày.

### Ban ngày

- Dùng một kỹ năng Ban ngày hợp lệ; xác nhận thành công làm lộ role của source.
- Từ Vòng 2, mở Vote/Hội đồng.
- Vote hiển thị giữa bàn; người chơi chọn đúng 3 lá phe dân của mình làm voter. Click lần đầu chọn, click lần hai bỏ chọn; nút Xác nhận chỉ bật khi đủ 3. Nút Bỏ qua luôn có thể dùng.
- Sau khi xác nhận, các voter phe dân được chọn lộ role. Dân làng đóng góp 2 vote. Mục tiêu đối thủ được chọn sau khi đủ 3 voter và vẫn bị xử lý như Treo cổ bình thường.
- Bỏ lượt.

### Ban đêm

- Dùng một kỹ năng Ban đêm hợp lệ; action và source được giữ bí mật tới Bình minh.
- Mỗi bên chỉ chọn một main order; Tiên tri vì vậy cạnh tranh trực tiếp với action giết của Ma sói hoặc role đêm khác.
- Bỏ lượt.

### Thanh trừng

Từ Vòng 6, Thanh trừng diễn ra sau khi resolve Đêm của vòng trước và sau Bình minh, trước action Ban ngày. Đây là pha bắt buộc, tông màu đỏ, hai bên phải hoàn thành lựa chọn; không có Bỏ qua. Các luật dùng chu kỳ cố định trong prototype:

- Vòng 6 — **Cắt bỏ**: mỗi bên chọn một lá phe mình còn sống để loại.
- Vòng 7 — **Đảo chiến tuyến**: mỗi bên chọn một lá để hoán đổi vị trí với đối thủ; ownership và role giữ nguyên.
- Vòng 8 — **Ép lộ diện**: mỗi bên chọn một lá chưa lộ của mình để công khai role.
- Vòng 9 — **Khóa mạch**: mỗi bên chọn một lá còn sống để khóa skill và vote trong vòng hiện tại.

Thanh trừng vẫn chạy Win Check sau khi resolve; nếu trận kết thúc thì không vào action Ban ngày.

Mỗi lá chỉ kích hoạt kỹ năng tối đa một lần trong cùng vòng, kể cả role có kỹ năng ở cả hai pha. Giới hạn dùng được ghi riêng theo role; rule lộ mặc định được xác định theo phase, không dùng ngưỡng lộ chung.

## 5. Vote và Treo cổ v0.1

Từ Vòng 2, Vote mở trong phiên Ban ngày. Người chơi chọn đúng ba lá phe dân còn sống, đủ điều kiện, của mình làm voter; sau đó chọn một lá đối thủ làm mục tiêu treo cổ. Các voter phe dân được chọn lộ role khi xác nhận. Dân làng có trọng số 2, role khác có trọng số 1. Vote vào lá Dân làng của đối thủ vẫn là Treo cổ bình thường; role của mục tiêu lộ theo quy tắc Treo cổ và không được miễn loại.

- Click voter lần đầu để chọn, click lần hai để bỏ chọn.
- Nút Xác nhận bị disable cho tới khi đủ đúng 3 voter; không dùng popup xác nhận.
- Nút Bỏ qua là lựa chọn hợp lệ.
- Mục tiêu treo cổ chỉ được chọn sau khi đã đủ 3 voter.

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

## 7. Role trọng tâm prototype

### Bảo vệ

- Chỉ bảo vệ lá khác, không được tự bảo vệ.
- Tính theo card ID: một lá có thể được bảo vệ lại ở các đêm sau nhưng không được bảo vệ trong hai đêm liên tiếp.
- Lá vừa được bảo vệ bị disable ở đêm kế; UI làm mờ và tooltip giải thích cooldown.
- Bảo vệ chặn hiệu ứng tấn công/kết liễu nhắm trực tiếp, gồm skill giết và death reaction tương ứng; không chặn soi, debuff hoặc Treo cổ Ban ngày.

### Tiên tri

- Chỉ dùng Ban đêm và không có countdown riêng.
- Lần soi đầu làm lộ role mục tiêu cho người dùng và đánh dấu card.
- Lá phe bóng tối đã bị soi có thể được chọn lại ở lần sau để kết liễu có điều kiện.
- Lá phe sáng sau lần soi đầu bị disable khỏi mục tiêu soi lại; UI làm mờ và giải thích rằng lá này đã lộ phe sáng.
- Mỗi đêm chỉ có một main order, nên người chơi phải chọn Tiên tri hoặc action giết khác.

## 8. Phân giải xung đột

Các luật đã chốt:

- Bảo vệ chặn các nguồn loại bỏ và skill tấn công nhắm trực tiếp trong thời gian hiệu lực, gồm tấn công, độc và death reaction tương ứng; không chặn soi, debuff hoặc Treo cổ Ban ngày.
- Action đêm đã khóa vẫn resolve nếu source bị loại trước lượt resolve.
- Hồi sinh Ban ngày resolve ngay trước win-check và giữ nguyên usage/reveal state của lá.
- Nếu hai bên cùng hết bài sau toàn bộ action và reaction của batch, kết quả là hòa.

Thứ tự cụ thể giữa các action chính và death reaction Thợ săn vẫn cần xác nhận theo recommendation trong Game Flow.

Dev nên biểu diễn hành động thành event có thứ tự ưu tiên, không để UI tự quyết rule.

## 8. Điều kiện thắng và rời trận

- Hết bài trên sân: thua.
- Nhận thua: thua ngay sau xác nhận.
- Mất kết nối: mở reconnect window; hết thời hạn mới xử thua.
- Kết quả được kiểm tra sau mỗi resolution và sau các hành động có thể kết thúc trận.

## 9. Thanh trừng

- Vòng 1–5 dùng luật thường.
- Từ Vòng 6, sau Bình minh và trước Ban ngày, mỗi vòng thêm một pha Thanh trừng màu đỏ để tăng áp lực.
- Thanh trừng bắt buộc, không có Bỏ qua, và cần được resolve trước Win Check.
- Chu kỳ cố định: V6 Cắt bỏ, V7 Đảo chiến tuyến, V8 Ép lộ diện, V9 Khóa mạch.

## 10. Câu hỏi mở ưu tiên cao

| ID | Câu hỏi | Cần chốt trước |
|---|---|---|
| OQ-01 | Timer mỗi lượt là bao lâu? | Prototype web nhiều người |
| OQ-02 | Thứ tự resolve toàn bộ kỹ năng | Game engine v0.1 |
| OQ-03 | Bộ 10 lá cơ bản cuối cùng và số bản sao | Paper/Figma playable |
| OQ-04 | Giới hạn dùng kỹ năng theo lá/trận/vòng | Paper playtest |
| OQ-06 | Chi tiết effect và priority trong bốn luật Thanh trừng | Full match |
| OQ-08 | Reconnect window cụ thể | Internal Alpha |
