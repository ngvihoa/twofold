# ADR-0004: Bài úp chết trong đêm không tự lộ danh tính

- Ngày: 30/08/2026
- Trạng thái: Đã chấp nhận cho prototype
- Chủ sở hữu: Game Designer / Product Owner

## Bối cảnh

Prototype trước đây đồng nhất “bị loại” với “lộ role”: mọi lá chết đều di chuyển lên lane công khai và mở toàn bộ danh tính. Với một game 1v1 thông tin bất đối xứng, cách này khiến một đòn tấn công đêm vừa loại quân vừa xác nhận phe/role, thưởng quá nhiều thông tin cho bên tấn công và làm nhịp Bình minh khó theo dõi.

## Quyết định

- Cái chết và lộ danh tính là hai state transition độc lập.
- Lá còn úp bị loại trong đêm chết tại đúng vị trí trên tay; đối thủ thấy vị trí, trạng thái chết và nguyên nhân công khai, nhưng không thấy phe hoặc role.
- Lá đã công khai trước khi chết tiếp tục giữ nguyên phe/role công khai và chết tại lane đang đứng.
- Nguồn dùng kỹ năng vẫn lộ theo rule của kỹ năng hiện tại.
- Các cơ chế có rule lộ riêng — Treo cổ đoán đúng, Ép lộ diện và các kỹ năng tương lai — không bị thay đổi bởi quyết định này.
- Sau trận có thể mở toàn bộ danh tính trong recap; chưa nằm trong scope implementation này.

## Hệ quả

- Ban đêm giữ vai trò sát thương/bí mật thay vì đồng thời trở thành công cụ điều tra miễn phí.
- Bình minh vẫn công bố nguyên nhân và thương vong theo từng bước nhưng không phá information economy.
- UI phải render được một card `alive=false, revealed=false` ngay trong hand.
- Public log không được ghi tên role của một thi thể còn ẩn.
- Hồi sinh giữ nguyên trạng thái công khai trước khi chết thay vì bắt buộc lộ role.

## Cách kiểm chứng / Khi nào xem lại

Playtest ít nhất 10 ván và đo:

- người chơi có hiểu rõ lá nào chết dù mặt bài vẫn úp không;
- việc không nhận xác nhận phe/role có làm đòn đêm thiếu phản hồi không;
- Tiên tri và Hội đồng có tăng giá trị hợp lý hay trở nên bắt buộc;
- số lần người chơi suy luận sai vì các role chết còn ẩn;
- thời lượng trận và snowball thông tin so với build tự lộ role khi chết.

Xem lại nếu người chơi liên tục không phân biệt được “đã chết nhưng còn ẩn” với “đang sống”, hoặc nếu cuối trận có quá nhiều khả năng role không thể suy luận hữu ích.
