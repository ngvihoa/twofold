# Core Gameplay v0.1

- Phiên bản: 0.1
- Ngày cập nhật: 01/09/2026
- Trạng thái: Draft có thể chơi thử

## 1. Tầm nhìn

Game chiến thuật 1v1 nơi mỗi bên điều khiển 10 lá có vai trò ẩn. Người chơi dùng kỹ năng để lấy lợi thế; năng lực Ban ngày làm lộ role ngay khi xác nhận, còn năng lực Ban đêm mặc định không tự làm lộ source. Hội đồng cũng tạo thông tin công khai vì các lá phe dân được chọn làm voter sẽ lộ role.

Game không dùng ATK/DEF/HP như card battler truyền thống ở v0.1. Trọng tâm là trạng thái, thông tin, lựa chọn mục tiêu và hậu quả.

## 2. Trạng thái lá bài

| Trạng thái | Ý nghĩa |
|---|---|
| Ẩn | Đối thủ chưa biết vai trò thật |
| Đã lộ | Vai trò thật được công khai |
| Được bảo vệ | Có hiệu ứng ngăn bị loại theo phạm vi kỹ năng |
| Đã chết / bị loại | Không còn hành động, trừ hiệu ứng bị động; lá ẩn ở lại vị trí tay, lá đã lộ ở lại lane công khai |

Các trạng thái như bị câm lặng, bị đánh dấu hoặc ngụy trang chỉ thêm sau khi rule tương ứng được chọn cho prototype.

## 3. Luật thông tin

- Chủ sở hữu luôn biết vai trò của 10 lá mình.
- Đối thủ chỉ thấy vị trí và trạng thái công khai của lá đang ẩn.
- Năng lực Ban ngày lộ role ngay khi xác nhận thành công. Action Ban đêm, gồm source và target, được giữ kín khi commit; tới Bình minh chỉ công bố outcome được phép công khai, source vẫn ẩn trừ ngoại lệ ghi rõ theo role.
- Ma sói tấn công và Tiên tri soi thường không làm lộ source. Lệnh kết liễu của Tiên tri là ngoại lệ: Tiên tri lộ tại Bình minh khi lệnh resolve, kể cả nếu bị chặn.
- Vote lộ role của mọi lá phe dân được chọn làm voter khi tổng trọng số đạt đủ 3 phiếu và Hội đồng được xác nhận.
- Hành động Ban ngày thiên về công khai và suy luận.
- Hành động Ban đêm thiên về bí mật và can thiệp; đối thủ không thấy lựa chọn trước khi khóa.
- Cái chết không tự động tiết lộ danh tính: lá còn ẩn bị loại trong đêm chết tại vị trí trên tay và đối thủ không biết phe hoặc role.
- Lá đã công khai trước khi chết tiếp tục giữ nguyên thông tin công khai. Các cơ chế công khai như Treo cổ đoán đúng hoặc Ép lộ diện vẫn lộ role theo rule riêng.
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
- Vote hiển thị giữa bàn; người chơi chọn tối đa 3 lá phe dân của mình làm voter. Click lần đầu chọn, click lần hai bỏ chọn; mục tiêu và nút Xác nhận chỉ mở khi tổng trọng số đạt ít nhất 3 phiếu. Nút Bỏ qua luôn có thể dùng.
- Sau khi xác nhận, các voter phe dân được chọn lộ role. Dân làng đóng góp 2 phiếu, role Dân khác đóng góp 1 phiếu. Vì vậy Dân làng + 1 role Dân khác đã đủ 3 phiếu. Mục tiêu đối thủ vẫn bị xử lý như Treo cổ bình thường.
- Một lá đã dùng kỹ năng Ban ngày trong vòng hiện tại không được dùng lại làm voter ở Hội đồng cùng vòng. Trạng thái này được validate ở cả lúc khóa lựa chọn và lúc resolve.
- Bỏ lượt.

### Ban đêm

- Dùng một kỹ năng Ban đêm hợp lệ; action, source và target được giữ bí mật khi commit. Bình minh công bố outcome nhưng không tự động công bố source.
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

Từ Vòng 2, Vote mở trong phiên Ban ngày. Người chơi chọn từ một đến tối đa ba lá phe dân còn sống, đủ điều kiện, cho tới khi tổng trọng số đạt ít nhất 3 phiếu; sau đó chọn một lá đối thủ làm mục tiêu treo cổ. Các voter được chọn lộ role khi xác nhận. Dân làng có trọng số 2, role Dân khác có trọng số 1. Vote vào lá Dân làng của đối thủ vẫn là Treo cổ bình thường; role của mục tiêu lộ theo quy tắc Treo cổ và không được miễn loại.

- Click voter lần đầu để chọn, click lần hai để bỏ chọn.
- Nút Xác nhận bị disable cho tới khi tổng trọng số đạt ít nhất 3 phiếu; không dùng popup xác nhận.
- Nút Bỏ qua là lựa chọn hợp lệ.
- Mục tiêu treo cổ chỉ được chọn sau khi đã đủ 3 phiếu.

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
- Soi thường không làm lộ Tiên tri; kết quả sáng/tối và dấu đã soi chỉ hiện cho chủ sở hữu.
- Lá Phe Hắc Ám đã bị soi có thể được chọn lại ở lần sau để ra lệnh kết liễu có điều kiện.
- Khi lệnh kết liễu resolve, Tiên tri lộ tại Bình minh kể cả nếu Bảo vệ chặn; target chỉ chết khi không được bảo vệ.
- Lá phe sáng sau lần soi đầu bị disable khỏi mục tiêu soi lại; UI làm mờ và giải thích rằng lá này đã được xác định là phe sáng.
- Mỗi đêm chỉ có một main order, nên người chơi phải chọn Tiên tri hoặc action giết khác.

### Kẻ Thế Mạng

- Thuộc Phe Hắc Ám và thay Sói Hộ Vệ trong bộ 10 lá prototype hiện tại. Sói Hộ Vệ vẫn được giữ trong catalog để cân nhắc cho phase sau, không bị xóa khỏi danh sách role.
- Không chọn trước một target để bảo kê. Khi một lá khác bên mình sắp bị Treo cổ bởi một Hội đồng hợp lệ, hệ thống mở một lựa chọn kín Có/Không cho chủ sở hữu Kẻ Thế Mạng.
- Nếu đồng ý, Kẻ Thế Mạng tiêu phản ứng một lần/trận, chết thay target và lộ role; target sống nhưng vẫn lộ role vì án Treo cổ đã xác nhận đúng. Nếu từ chối, phản ứng chưa bị tiêu và án Treo cổ resolve bình thường.
- Không kích hoạt khi chính Kẻ Thế Mạng là target, khi buộc tội sai, hoặc khi một lá chết bởi skill, Thanh trừng hay death reaction khác.
- Phản ứng resolve trước khi loại target và trước `WIN_CHECK`. Hồi sinh không hoàn lại phản ứng đã dùng.
- Nếu hai bên cùng tạo án Treo cổ hợp lệ trong một Hội đồng, hai lựa chọn Có/Không được khóa kín trước rồi mới resolve trong cùng batch; không bên nào được phản ứng dựa trên lựa chọn của đối thủ.

## 8. Phân giải xung đột

Các luật đã chốt:

- Bảo vệ chặn các nguồn loại bỏ và skill tấn công nhắm trực tiếp trong thời gian hiệu lực, gồm tấn công, độc và death reaction tương ứng; không chặn soi, debuff hoặc Treo cổ Ban ngày.
- Kẻ Thế Mạng không chặn Treo cổ; nó thay đổi lá nhận kết quả loại bỏ từ target sang chính nó.
- Action đêm đã khóa vẫn resolve nếu source bị loại trước lượt resolve.
- Hồi sinh Ban ngày resolve ngay trước win-check và giữ nguyên usage/reveal state của lá.
- Nếu hai bên cùng hết bài sau toàn bộ action và reaction của batch, kết quả là hòa.
- Khóa mạch chỉ vô hiệu active skill và quyền Vote trong vòng hiện tại; không vô hiệu death reaction/passive đã đủ điều kiện, gồm Kẻ Thế Mạng và Kẻ báo thù.
- Target Bảo vệ chỉ hiện trong private payload của chủ sở hữu. Nếu khiên chặn thành công, Bình minh công bố vị trí được cứu nhưng không công bố loại lệnh hay source bị chặn.
- Soi thường của Tiên tri không tạo public timeline item; target, action kind và kết quả chỉ nằm trong private payload. Lệnh kết liễu vẫn là ngoại lệ công khai đã chốt.

Thứ tự cụ thể giữa các action chính và death reaction Thợ săn vẫn cần xác nhận theo recommendation trong Game Flow.

Dev nên biểu diễn hành động thành event có thứ tự ưu tiên, không để UI tự quyết rule.

## 8. Điều kiện thắng và rời trận

- Hết bài trên sân: thua.
- Nhận thua: thua ngay sau xác nhận.
- Mất kết nối: mở reconnect window; hết thời hạn mới xử thua.
- Kết quả được kiểm tra sau mỗi resolution và sau các hành động có thể kết thúc trận.
- Nếu chưa có bên hết bài nhưng mỗi bên còn đúng một lá, chuyển ngay sang Final Duel trước lượt/phase kế tiếp.
- Mỗi bên khóa một dự đoán role cuối của đối thủ và không được đổi. Hai bên cùng đúng hoặc cùng sai thì hòa; chỉ một bên đúng thì bên đó thắng.
- Khi có kết quả, toàn bộ role hai board được lộ để giải thích trận đấu.

## 9. Thanh trừng

- Vòng 1–5 dùng luật thường.
- Từ Vòng 6, sau Bình minh và trước Ban ngày, mỗi vòng thêm một pha Thanh trừng màu đỏ để tăng áp lực.
- Thanh trừng bắt buộc, không có Bỏ qua, và cần được resolve trước Win Check.
- Chu kỳ cố định: V6 Cắt bỏ, V7 Đảo chiến tuyến, V8 Ép lộ diện, V9 Khóa mạch.
- Đảo chiến tuyến giữ nguyên card identity, owner và role; chỉ position ID đổi. Nếu các lựa chọn vị trí trùng nhau, cả batch fizzle và không reselect. Nếu lựa chọn đầu tiên khiến phía còn lại không còn cặp own/enemy nào không xung đột, engine auto-fizzle thay vì chờ vô hạn.

## 10. Câu hỏi mở ưu tiên cao

| ID | Câu hỏi | Cần chốt trước |
|---|---|---|
| OQ-01 | Timer mỗi lượt là bao lâu? | Prototype web nhiều người |
| OQ-02 | Thứ tự resolve toàn bộ kỹ năng | Game engine v0.1 |
| OQ-03 | Bộ 10 lá cơ bản cuối cùng và số bản sao | Paper/Figma playable |
| OQ-04 | Giới hạn dùng kỹ năng theo lá/trận/vòng | Paper playtest |
| OQ-06 | Priority death reaction của Cắt bỏ và việc cycle có lặp từ V10 | Full match |
| OQ-08 | Reconnect window cụ thể | Internal Alpha |
