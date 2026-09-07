# Thử nghiệm chuẩn bị đêm với ba lựa chọn

- Ngày: 07/09/2026. PO đồng ý thử sau brainstorm. Trạng thái: prototype thử nghiệm, chưa chốt cân bằng.
- Phạm vi: `apps/spec-reviewer/game-flow-demo`; không migration runtime.
- Luật thử: mỗi đêm một main order (Ma sói, độc hoặc Huyết Nguyệt), một lệnh Tiên tri và một lệnh Bảo vệ. Các mục có thể bỏ qua. Resource, target và giới hạn loại bỏ của main order giữ nguyên.
- UI giữ bản nháp, cho đổi/xóa từng mục và khóa chung. Lá nguồn hiện Đã đặt lệnh/Đã khóa lệnh. Không chạy skill khi chọn nháp. BOT sử dụng cùng bundle; hai bên khóa mới đặt khiên và chuyển sang phân giải bình minh.
- Engine bổ sung `night.bundle`; giữ các command cũ để các scenario baseline vẫn chạy. Thứ tự chọn không quyết định thứ tự xử lý. Mọi đòn chết được gom sau xử lý các lệnh.
- Kiểm chứng: hai regression mới cho attack + seer + guard cùng đêm, khóa một lần, bỏ toàn bộ, guard không hợp lệ bị từ chối nguyên tử. `pnpm tf check -sr`: 53/53 pass; syntax UI pass.
- Playtest nhanh: `/game-flow-demo/ui.html?qa=night-privacy`.
- Giới hạn: chưa có đánh giá cân bằng hoặc browser click-through đầy đủ của bundle. Pipeline replay/transcript baseline chưa được mở rộng audit bundle. Đây là thử nghiệm luật riêng, không tuyên bố parity với runtime hay audit P0 trước đó.
