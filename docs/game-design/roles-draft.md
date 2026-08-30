# Danh sách vai trò — Draft

- Phiên bản: 0.2
- Ngày cập nhật: 30/08/2026
- Trạng thái: Đã chọn bộ prototype; chưa xác nhận cân bằng bằng human playtest

## Nguyên tắc

- Tên, mô tả và trạng thái ưu tiên tiếng Việt.
- Một vai trò có thể dùng Ban ngày, Ban đêm, bị động hoặc cả ngày lẫn đêm.
- Kỹ năng Ban ngày lộ role khi resolve; nguồn lệnh Ban đêm giữ kín cho tới Bình minh. Voter Hội đồng còn ẩn sẽ lộ khi Vote được xác nhận.
- Vai trò dùng ở cả hai pha cần giới hạn rõ để không mạnh gấp đôi.
- Alpha nên bắt đầu với 4–6 loại dễ hiểu, rồi mới thêm vai trò kiểm soát/đánh lừa phức tạp.

## Bộ 10 lá đang dùng trong prototype

Hai bên dùng bộ đối xứng dưới đây. Đây là cấu hình cần test trước, không phải bộ Alpha đã cân bằng.

| Số lượng | Vai trò | Pha | Giới hạn/state prototype |
|---:|---|---|---|
| 1 | Dân làng | Hội đồng | Trọng số 2; không có main skill |
| 2 | Ma sói | Đêm | Tấn công không giới hạn; mỗi Night Order chỉ chọn một source/action |
| 1 | Tiên tri | Đêm | Soi tối đa 3 lần; lần soi tiếp theo có thể kết liễu mục tiêu phe tối đã biết |
| 1 | Bảo vệ | Chạng vạng/Phòng thủ | Không tự bảo vệ; không chọn cùng target hai vòng liên tiếp; khiên không chặn soi |
| 1 | Phù thủy | Ngày và Đêm | Hồi sinh 1 lần, đầu độc 1 lần |
| 1 | Xạ thủ | Ngày | 1 viên đạn |
| 1 | Kẻ báo thù | Ngày/bị động | Duy trì một dấu Báo thù đang hoạt động |
| 1 | Mục sư | Ngày | 1 lần thanh tẩy; chọn nhầm phe Dân có thể phản sát source |
| 1 | Sói Hộ Vệ | Hội đồng/phản ứng | Cứu 1 lần khỏi Hội đồng |

Các giới hạn trên phản ánh prototype hiện tại và migration plan. Chi tiết resolve vẫn phải được kiểm chứng trong 3–5 full match trước khi đánh dấu `Đã chốt`.

## Các vai trò/biến thể còn đang explore

| Vai trò | Ban ngày | Ban đêm | Bị động / ghi chú | Trạng thái |
|---|---|---|---|---|
| Dân làng | Không có kỹ năng; tham gia Hội đồng từ Vòng 2 | — | Có trọng số 2 khi Vote; voter khác có trọng số 1 | Đang thử trong prototype |
| Ma sói | — | Chọn một lá đối thủ để tấn công | Nguồn và mục tiêu giữ kín tới Bình minh | Đang thử trong prototype |
| Tiên tri | — | Soi một lá đối thủ; lần hai kết liễu lá phe tối đã soi | Kết quả chỉ người dùng biết; khiên không chặn soi | Đang thử trong prototype |
| Bảo vệ | — | Chọn một lá khác của mình để bảo vệ trong đêm | Không tự bảo vệ, không chọn cùng lá hai đêm liên tiếp; vị trí khiên công khai nhưng hai role vẫn ẩn | Đang thử trong prototype |
| Phù thủy | Hồi sinh một lá đã chết | Đầu độc một lá đối thủ | Mỗi kỹ năng 1 lần trong prototype | Đang thử trong prototype |
| Xạ thủ | Bắn một lá đối thủ | — | 1 viên đạn | Đang thử trong prototype |
| Kẻ báo thù | Đánh dấu một lá đối thủ | — | Một dấu đang hoạt động; quan hệ mục tiêu được biểu diễn bằng chỉ đỏ mờ | Đang thử trong prototype |
| Mục sư | Thanh tẩy một lá đối thủ | — | 1 lần; chọn nhầm phe Dân có thể khiến Mục sư chết | Đang thử trong prototype |
| Sói Hộ Vệ | Phản ứng trong Hội đồng | — | Cứu 1 lần khỏi kết quả Hội đồng | Đang thử trong prototype |
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

## Cấu hình cũ đã bị thay thế

Skeleton `2 Dân làng + Thợ săn + Trưởng làng + Kẻ ngụy trang` không còn là bộ test hiện hành. Giữ các role này ở danh sách explore, nhưng không giao Dev/UI triển khai trước khi bộ 10 lá hiện tại có kết quả playtest.

## Riêng Phù thủy

- Ban ngày: hồi sinh một lá đã chết.
- Ban đêm: đầu độc một lá đối thủ.
- Prototype hiện dùng hai tài nguyên riêng: hồi sinh 1 lần và đầu độc 1 lần.
- Hồi sinh giữ trạng thái visibility của lá trước khi chết; bài úp không tự lộ chỉ vì được hồi sinh.
- Đầu độc bị Bảo vệ chặn.
- Còn cần playtest: được dùng cả hai kỹ năng trong cùng một vòng hay không và hồi sinh được chọn xác chết từ vòng nào.

## Tiêu chí chọn vai trò cho Alpha

- Người mới đọc một lần là hiểu.
- Tạo được ít nhất một quyết định “dùng để lấy lợi thế hay giữ kín để sống”.
- Có đối trọng hoặc cách phản ứng.
- Không cần quá nhiều trạng thái phụ.
- Log và giải thích kết quả được rõ ràng.
