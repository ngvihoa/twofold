# Danh sách vai trò — Draft

- Phiên bản: 0.1
- Ngày cập nhật: 27/08/2026
- Trạng thái: Ý tưởng để chọn bộ prototype; chưa cân bằng

## Nguyên tắc

- Tên, mô tả và trạng thái ưu tiên tiếng Việt.
- Một vai trò có thể dùng Ban ngày, Ban đêm, bị động hoặc cả ngày lẫn đêm.
- Mặc định, kỹ năng Ban ngày lộ role ngay khi xác nhận thành công; kỹ năng Ban đêm giữ kín tới Bình minh. Các lá phe dân được chọn làm voter cũng lộ role khi Vote được xác nhận.
- Vai trò dùng ở cả hai pha cần giới hạn rõ để không mạnh gấp đôi.
- Alpha nên bắt đầu với 4–6 loại dễ hiểu, rồi mới thêm vai trò kiểm soát/đánh lừa phức tạp.

## Bộ 15 vai trò đang explore

| Vai trò | Ban ngày | Ban đêm | Bị động / ghi chú | Trạng thái |
|---|---|---|---|---|
| Dân làng | Không có kỹ năng; có thể làm voter trong Vote từ Vòng 2 và sẽ lộ diện khi được chọn | — | Voter Dân làng có trọng số 2; vote vào Dân làng đối thủ vẫn là Treo cổ bình thường | Đã chốt cho prototype |
| Ma sói | — | Chọn một lá đối thủ để tấn công | Action giết cạnh tranh với Tiên tri trong cùng một main order đêm | Đã chốt hướng prototype |
| Tiên tri | — | Soi một lá đối thủ chưa từng soi | Lần soi đầu làm lộ role; chỉ lá phe bóng tối đã soi mới có thể bị soi lần hai để kết liễu; lá phe sáng bị disable | Đã chốt hướng prototype |
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
| Kẻ thế thân | — | — | Hy sinh lá này thay cho một lá khác; một lần | Draft |
| Kẻ phá đám | Chọn một lá đối thủ; lá đó không thể là mục tiêu kỹ năng trong đêm kế | — | Có thể vô tình bảo vệ đối thủ | Draft |

## Bộ cơ bản để bắt đầu playtest

Hai bên nên dùng bộ đối xứng. Skeleton đã được đề xuất:

| Số lượng | Vai trò |
|---:|---|
| 2 | Dân làng |
| 2 | Ma sói |
| 1 | Tiên tri |
| 1 | Bảo vệ |
| 1 | Phù thủy |
| 1 | Thợ săn |
| 1 | Trưởng làng |
| 1 | Kẻ ngụy trang |

Đây là **đầu vào playtest**, chưa phải bộ bài đã cân bằng. Một phương án đơn giản hơn từng được nêu là dùng 4 Dân làng và chỉ 6 loại vai trò cốt lõi. Game Designer/PO cần chọn một cấu hình duy nhất trước mốc paper/Figma playable.

## Riêng Phù thủy

- Ban ngày: hồi sinh một lá đã chết.
- Ban đêm: đầu độc một lá đối thủ.
- Chưa chốt:
  - mỗi kỹ năng một lần/trận hay dùng chung một tài nguyên;
  - hồi sinh lá chết ở vòng hiện tại hay bất kỳ lá nào;
  - có được dùng cả hai kỹ năng trong cùng một vòng không;
  - đầu độc có xuyên Bảo vệ không.

Giả thuyết nên test đầu tiên: mỗi kỹ năng dùng một lần/trận và một lá chỉ kích hoạt tối đa một lần trong cùng vòng.

## Tiêu chí chọn vai trò cho Alpha

- Người mới đọc một lần là hiểu.
- Tạo được ít nhất một quyết định “dùng để lấy lợi thế hay giữ kín để sống”.
- Có đối trọng hoặc cách phản ứng.
- Không cần quá nhiều trạng thái phụ.
- Log và giải thích kết quả được rõ ràng.
