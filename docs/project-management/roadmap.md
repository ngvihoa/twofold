# Roadmap Web Alpha — 2026

- Ngày lập: 27/08/2026
- Mục tiêu phát hành: 30/10/2026
- Team: Game Designer/PO, UI/UX Game, Developer

## Nguyên tắc điều hành

- Mỗi tuần trả lời một câu hỏi sản phẩm lớn, không đo tiến độ bằng số màn hình đã vẽ hoặc số feature đã code.
- Paper/Figma test trước, rồi mới tăng chi phí implementation.
- Game engine/state machine là nguồn luật; UI chỉ hiển thị trạng thái.
- Đóng feature đủ sớm để tháng 10 dành cho playtest, sửa lỗi, đơn giản hóa và cân bằng.

## Các milestone

| Mốc | Ngày | Câu hỏi cần trả lời | Deliverable bắt buộc |
|---|---:|---|---|
| M1 — Nền móng | 07/09 | Một trận chơi từ đầu đến cuối như thế nào? | Game flow, round/turn flow, rule v0.1, bộ role test; moodboard + hướng visual + screen inventory; nghiên cứu room/realtime/state sync và rủi ro kỹ thuật |
| M2 — Prototype | 14/09 | Luật có chơi được và tạo quyết định không? | Paper/Figma playable; kết quả playtest đầu; room/realtime POC; kiến trúc state machine sơ bộ |
| M3 — Một vòng thật | 21/09 | Day/Night và hidden information có chạy đúng trên web? | Hai client vào cùng room và chơi trọn 1 vòng Day → Night → Bình minh |
| M4 — Full match | 05/10 | Có thể chơi một trận hoàn chỉnh không cần dev can thiệp? | Chọn 10 lá, full loop, thắng/thua, Tai họa tối thiểu, reconnect cơ bản, rematch, log trận |
| M5 — Internal Alpha | 19/10 | Đồng nghiệp có tự hiểu và muốn chơi lại không? | Build ổn định; onboarding tối thiểu; ít nhất 10 session quan sát; tổng hợp lỗi, UX và cân bằng |
| M6 — Web Alpha | 30/10 | Bản Alpha có đủ ổn định để chia sẻ nội bộ rộng hơn? | Release web, checklist smoke test, analytics/log tối thiểu, known issues và kế hoạch vòng sau |

## Kế hoạch theo giai đoạn

### 27/08–07/09 — Chốt nền móng

**Game Designer/PO**

- Chốt flow, luật hành động ngày/đêm, Treo cổ, thắng/thua.
- Chọn đúng một bộ 10 lá để test và ghi giới hạn kỹ năng.
- Viết information map: tôi biết gì, đối thủ biết gì, lúc nào thông tin lộ.
- Chốt 3 Tai họa để prototype hoặc ghi quyết định hoãn có deadline.

**UI/UX Game**

- Moodboard và 1–2 hướng visual.
- Screen/state inventory dựa trên game flow.
- Prototype chọn vai trò, lượt ngày, lượt đêm, bình minh và kết quả.
- Liệt kê UX risk: lượt ai, hành động hợp lệ, thông tin riêng/công khai, lý do hiệu ứng.

**Developer**

- So sánh tạo phòng bằng mã với matchmaking; Alpha chọn room code.
- Nghiên cứu authoritative game state, realtime transport, reconnect và deployment.
- Phác state machine và event log.
- Chứng minh hai browser session có thể join cùng room và nhận state đồng bộ.

### 08/09–14/09 — Prototype có thể chơi

- Chơi tối thiểu 10–20 ván paper/Figma nội bộ.
- Ghi thời lượng, điểm bối rối, quyết định thú vị và luật gây tranh cãi.
- Dev hoàn thành room/realtime POC và spike các rủi ro lớn.
- Chốt ADR cho nền tảng/stack sau khi có bằng chứng POC.

### 15/09–21/09 — Vertical slice một vòng

- Build đúng một vòng Day/Night/Bình minh với hai client.
- Có hidden/public state, target validation, action lock và event log.
- UI graybox nhưng phải giải thích rõ lượt, pha, mục tiêu và kết quả.

### 22/09–05/10 — Full match và feature freeze

- Nối pre-match → full match → post-match.
- Thêm bộ role Alpha, Treo cổ, thắng/thua, Tai họa, reconnect, rematch.
- Kiểm tra edge case và deterministic resolution.
- **Feature freeze ở M4 (05/10):** sau mốc này chỉ thêm mechanic nếu có quyết định thay đổi scope rõ ràng.

### 06/10–19/10 — Internal Alpha

- Mời đồng nghiệp chơi theo cặp; team quan sát, hạn chế giải thích.
- Sau mỗi trận phỏng vấn 5–10 phút.
- Ưu tiên lỗi chặn trận, hiểu sai luật, thông tin không rõ và mất đồng bộ.
- Đo thời lượng, completion, rematch và deception moment.

### 20/10–30/10 — Cân bằng, ổn định, release

- Không mở rộng scope.
- Sửa lỗi, rút gọn luật, cân bằng bộ role và Tai họa.
- Smoke test trên trình duyệt mục tiêu.
- Chuẩn bị known issues, cách gửi feedback và kế hoạch sau Alpha.

## Nhịp làm việc gợi ý

- **Thứ 2 — Planning (30 phút):** chốt câu hỏi tuần, task và owner.
- **Thứ 4 — Review nhanh (20 phút):** demo bằng chứng đang có, tháo blocker.
- **Thứ 6 — Playtest/Review (60–90 phút):** chơi build mới, ghi kết quả, cập nhật quyết định.

## Tiêu chí thành công Alpha

- Người ngoài team bắt đầu chơi được trong dưới 5 phút.
- Phần lớn trận hoàn thành, không cần dev sửa state thủ công.
- Thời lượng gần khoảng 8–15 phút.
- Có người chủ động chọn Đấu lại.
- Người chơi kể được ít nhất một khoảnh khắc họ đọc hoặc bị đối thủ đánh lừa.
