# Danh sách vai trò — Draft

- Phiên bản: 0.1
- Ngày cập nhật: 01/09/2026
- Trạng thái: Bộ 10 lá đã chốt để sửa prototype; chưa cân bằng

## Nguyên tắc

- Tên, mô tả và trạng thái ưu tiên tiếng Việt.
- Một vai trò có thể dùng Ban ngày, Ban đêm, bị động hoặc cả ngày lẫn đêm.
- Mặc định, kỹ năng Ban ngày lộ role ngay khi xác nhận thành công; kỹ năng Ban đêm không tự làm lộ source. Ngoại lệ lộ phải ghi rõ theo role. Các lá phe dân được chọn làm voter cũng lộ role khi Vote được xác nhận.
- Vai trò dùng ở cả hai pha cần giới hạn rõ để không mạnh gấp đôi.
- Alpha nên bắt đầu với 4–6 loại dễ hiểu, rồi mới thêm vai trò kiểm soát/đánh lừa phức tạp.

## Bộ 15 vai trò đang explore

| Vai trò | Ban ngày | Ban đêm | Bị động / ghi chú | Trạng thái |
|---|---|---|---|---|
| Dân làng | Không có kỹ năng; có thể làm voter trong Vote từ Vòng 2 và sẽ lộ diện khi được chọn | — | Voter Dân làng có trọng số 2; vote vào Dân làng đối thủ vẫn là Treo cổ bình thường | Đã chốt cho prototype |
| Ma sói | — | Chọn một lá đối thủ để tấn công | Action giết cạnh tranh với Tiên tri trong cùng một main order đêm; dùng skill không làm lộ Ma sói | Đã chốt hướng prototype |
| Tiên tri | — | Soi kín một lá đối thủ; có thể kết liễu lá tối đã soi | Soi thường không lộ; khi ra lệnh kết liễu thì Tiên tri lộ ở Bình minh kể cả nếu bị chặn | Đã chốt hướng prototype |
| Bảo vệ | — | Chọn một lá khác để bảo vệ trong đêm | Không tự bảo vệ; card vừa được bảo vệ không thể chọn lại ở đêm kế; chặn kill/skill tấn công nhưng không chặn soi/debuff | Đã chốt hướng prototype |
| Phù thủy | Hồi sinh một lá đã chết | Đầu độc một lá đối thủ | Hai kỹ năng khác nhau; giới hạn cần chốt | Đã chốt hướng kỹ năng |
| Thợ săn | — | — | Khi bị loại, chọn một lá đối thủ kéo theo | Ứng viên bộ cơ bản |
| Trưởng làng | Một lần trong trận, Treo cổ sai mà không mất lượt (đề xuất) | — | Cần playtest để tránh vòng lặp hành động | Draft |
| Kẻ ngụy trang | Có thể đổi vị trí hai lá (biến thể đề xuất) | Che vai trò một lá khỏi Tiên tri | Hai biến thể chưa chốt | Draft |
| Kẻ câm lặng | — | Chọn một lá đối thủ; lá đó không dùng kỹ năng ở lượt kế | Cần định nghĩa thời hạn chính xác | Draft |
| Kẻ tráo đổi | — | Đổi vị trí hai lá của mình mà đối thủ không biết | Tác động vào thông tin vị trí | Draft |
| Thầy bói | Chọn hai lá đối thủ; biết ít nhất một lá thuộc nhóm đặc biệt | — | Cần định nghĩa “đặc biệt” | Draft |
| Kẻ tố cáo | Chọn một lá và đoán vai trò; đúng thì lộ nhưng chưa bị loại | — | Dễ trùng với Treo cổ; cần làm rõ khác biệt | Draft/rủi ro cao |
| Người báo thù | — | — | Nếu bị Treo cổ, đối thủ phải lộ một lá | Draft |
| Kẻ Thế Mạng | — | — | Phe Hắc Ám; một lần tự nguyện chết thay cho lá khác bên mình sắp bị Treo cổ hợp lệ | Đã chốt cho bộ prototype hiện tại; Sói Hộ Vệ vẫn nằm trong catalog nhưng chưa dùng ở phase này |
| Kẻ phá đám | Chọn một lá đối thủ; lá đó không thể là mục tiêu kỹ năng trong đêm kế | — | Có thể vô tình bảo vệ đối thủ | Draft |

## Bộ 10 lá prototype đang chốt

Hai bên dùng bộ đối xứng sau:

| Số lượng | Vai trò | Phe | Timing và giới hạn | Luật lộ |
|---:|---|---|---|---|
| 1 | Dân làng | Dân | Không có skill; đóng 2 phiếu trong Hội đồng | Lộ khi được xác nhận làm voter |
| 2 | Ma sói | Hắc Ám | Mỗi đêm có thể dùng một Ma sói làm main order để tấn công một lá đối thủ | Không lộ chỉ vì tấn công |
| 1 | Tiên tri | Dân | Soi mỗi đêm, không charge; phe sáng không soi lại, phe tối có thể bị kết liễu ở một đêm sau | Soi thường không lộ; ra lệnh kết liễu thì lộ tại Bình minh dù bị chặn |
| 1 | Bảo vệ | Dân | Mỗi đêm chọn một lá khác; không tự bảo vệ và không chọn cùng target hai đêm liên tiếp | Source và target giữ kín; outcome cứu được công bố theo information map |
| 1 | Phù thủy | Dân | Hồi sinh Ban ngày 1 lần; đầu độc Ban đêm 1 lần; không dùng cả hai trong cùng vòng | Hồi sinh làm lộ; đầu độc không tự làm lộ vì là skill đêm |
| 1 | Xạ thủ | Dân | Ban ngày bắn một role đối thủ đã lộ; 1 lần/trận và cần ít nhất hai role đối thủ đã lộ | Lộ khi bắn |
| 1 | Kẻ báo thù | Dân | Ban ngày đánh dấu một target; nếu chết trước Bình minh kế tiếp thì target chết theo nếu không được bảo vệ | Lộ khi đánh dấu |
| 1 | Mục sư | Dân | Ban ngày thanh tẩy 1 lần: target Hắc Ám chết; chọn phe Dân thì Mục sư chết | Lộ khi dùng |
| 1 | Kẻ Thế Mạng | Hắc Ám | Reaction 1 lần/trận; được hỏi Có/Không khi một lá khác bên mình sắp bị Treo cổ hợp lệ; target được cứu mạng nhưng vẫn lộ role; reaction không bị Khóa mạch vô hiệu | Lộ và chết khi chấp nhận chết thay |

Đây là **bộ luật đã chốt để đưa vào prototype**, chưa phải bộ bài đã được chứng minh cân bằng bằng human playtest.

## Riêng Phù thủy

- Ban ngày: hồi sinh một lá đã chết.
- Ban đêm: đầu độc một lá đối thủ.
- Mỗi kỹ năng có một charge riêng, mỗi charge dùng một lần/trận.
- Có thể hồi sinh bất kỳ lá nào bên mình đang ở vùng chết; usage và trạng thái lộ của target không reset.
- Không được hồi sinh và đầu độc trong cùng một vòng.
- Đầu độc là hiệu ứng loại bỏ trực tiếp nên bị Bảo vệ chặn.
- Hồi sinh Ban ngày làm lộ Phù thủy; đầu độc Ban đêm không tự làm lộ source.

## Ranh giới thông tin role đêm

- Bảo vệ: source và target chỉ có trong private payload của chủ sở hữu. Khi block thành công, public chỉ biết vị trí được cứu, không biết đòn cắn/độc hay source.
- Tiên tri: soi thường không tạo public timeline/replay; ghi chú role/phe chỉ thuộc người soi. Kết liễu là ngoại lệ và làm lộ Tiên tri tại Bình minh.

## Tiêu chí chọn vai trò cho Alpha

- Người mới đọc một lần là hiểu.
- Tạo được ít nhất một quyết định “dùng để lấy lợi thế hay giữ kín để sống”.
- Có đối trọng hoặc cách phản ứng.
- Không cần quá nhiều trạng thái phụ.
- Log và giải thích kết quả được rõ ràng.
