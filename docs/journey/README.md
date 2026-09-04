# Hành trình xây dựng Twofold

Thư mục này lưu câu chuyện phát triển Twofold theo thời gian: vấn đề đã gặp, các cuộc đối thoại quan trọng, lựa chọn đã đưa ra, sản phẩm đã tạo và điều team học được.

Mục tiêu không phải chép nguyên transcript. Mỗi entry cần giúp một thành viên mới trả lời được:

- Lúc đó team đang cố giải quyết vấn đề gì?
- Những hướng nào đã được thảo luận?
- Điều gì đã được quyết định, điều gì vẫn chỉ là giả thuyết?
- Kết quả cụ thể nằm ở file, prototype hay commit nào?
- Bài học nào ảnh hưởng đến bước tiếp theo?

## Bản đồ hành trình

| Ngày | Chặng | Kết quả nổi bật |
|---:|---|---|
| [27/08/2026](2026-08-27-khoi-dong-twofold.md) | Từ ý tưởng startup đến nền móng Twofold | Tên team, team 3 người, scope Web Alpha, game flow và core rules v0.1, repo mới |
| [28/08/2026](2026-08-28-tu-tai-lieu-den-prototype.md) | Từ tài liệu sang công cụ và prototype | Role Atlas, monorepo, CLI, state machine và nhiều vòng playtest UI |
| [29/08/2026 — Case study Thanh trừng](2026-08-29-case-study-thanh-trung-gameflow.md) | Thay đổi nhịp Game Flow | Từ Day/Night + Tai họa rời rạc sang Bình minh → Thanh trừng → Ngày → Vote → Đêm; đánh dấu làm case study về pacing và reveal economy |
| [29/08/2026](2026-08-29-xay-he-thong-luu-tru-hanh-trinh.md) | Biến lịch sử thành tài sản của team | Thiết lập conversation index, build journal và quy trình cập nhật |
| [02/09/2026 — Đóng Phase 0](2026-09-02-dong-phase-0.md) | Từ luật prototype tới contract kiểm chứng được | P0.1–P0.10 hoàn tất; 54/54 test và typed outcome audit leak 0; sẵn sàng vào authoritative room P1 |
| [02/09/2026 — MIG-02](implementations/2026-09-02-004-migrate-outcome-command-contract.md) | Đưa information boundary vào runtime Phase 1 | Runtime có projected outcome, state version và command idempotency; full check 4/4 workspace |
| [04/09/2026 — Scope gameflow/UX](implementations/2026-09-04-001-realign-gameflow-ux-scope.md) | Tách Product/UX khỏi backend room/matchmaking | Screen inventory end-to-end từ Home đến Result/rematch/create room; backend để Developer sở hữu |
| [04/09/2026 - Website entry](implementations/2026-09-04-002-build-website-entry-flow.md) | Từ screen inventory sang flow chạy được | Home create/join, validation/loading, Room waiting và setup preview bằng mock state |
| [04/09/2026 - Room setup đến Match Intro](implementations/2026-09-04-003-build-room-setup-countdown-intro-flow.md) | Hoàn tất lát pre-match UX | Đối thủ xuất hiện, đổi vị trí 10 lá, ready hai phía, countdown có thể hủy và intro nêu quyền đi trước |
| [04/09/2026 - Guided first Day turn](implementations/2026-09-04-004-build-guided-first-day-turn.md) | Từ Match Intro vào gameplay | First-turn fixture giữ privacy, chỉ mở action có target, hướng dẫn skill/source/target và xác nhận sang Day B |

## Các tài liệu hỗ trợ

- [Chỉ mục cuộc trò chuyện](conversation-index.md): nguồn, phạm vi và trạng thái tổng hợp.
- [Lịch sử thay đổi role](role-evolution.md): role đã đổi từ ý tưởng sang prototype như thế nào.
- [Nhật ký thử nghiệm prototype](prototype-experiment-log.md): từng lần thử, failure signal và quyết định sau đó.
- [Nhật ký kiểm tra](verification-log.md): lệnh kiểm tra, kết quả pass/fail và giới hạn bằng chứng.
- [Implementation records](implementations/README.md): một hồ sơ chi tiết cho mỗi lần implement từ 29/08/2026.
- [Mẫu implementation](implementation-template.md): before/after, role/rule impact, test và failure log bắt buộc.
- [Cách duy trì nhật ký](working-method.md): quy trình sau mỗi cuộc trò chuyện hoặc playtest.
- [Mẫu entry](template.md): cấu trúc dùng cho các ngày/chặng tiếp theo.

## Phân biệt các loại tài liệu

| Loại | Trả lời câu hỏi | Nơi lưu |
|---|---|---|
| Journey | Chúng ta đã đi đến đây như thế nào? | `docs/journey/` |
| ADR / decision log | Team đã quyết định gì và vì sao? | `docs/decisions/` |
| Game design | Game hiện được định nghĩa như thế nào? | `docs/game-design/` |
| Roadmap / task tracker | Tiếp theo ai làm gì, khi nào? | `docs/project-management/` |
| Git history | Sản phẩm thay đổi chính xác ở commit nào? | Git |

## Nguyên tắc biên tập

1. Ưu tiên tiếng Việt và thuật ngữ thống nhất với game design.
2. Tóm tắt trung thực; không biến đề xuất trong hội thoại thành quyết định đã chốt.
3. Liên kết đến tài liệu/commit thay vì sao chép nội dung dài.
4. Không lưu mật khẩu, token, mã xác thực, dữ liệu cá nhân hoặc transcript riêng tư không cần thiết.
5. Nếu một quyết định thay đổi luật hoặc kiến trúc, tạo/cập nhật ADR riêng rồi liên kết từ journey.
6. Một entry nên đủ ngắn để đọc trong 5–10 phút nhưng đủ bối cảnh để hiểu lựa chọn.
7. Từ 29/08/2026, mỗi implementation phải có record riêng; thiếu record nghĩa là implementation chưa hoàn thành.

## Trạng thái cập nhật

- Nguồn hội thoại khởi đầu đã được tổng hợp đến 27/08/2026.
- Lịch sử Git đã được tổng hợp đến commit `b589667` ngày 28/08/2026.
- State machine tại `b589667` đã được chạy smoke test lại ngày 29/08/2026: 11/11 case pass.
- Dataset Role Atlas đã được kiểm tra lại ngày 29/08/2026: 92 role, 5 phe, 80 ảnh.
- Ngày 29/08/2026 repo đang có một đợt tái cấu trúc monorepo chưa hoàn tất; journal không can thiệp vào đợt thay đổi đó.
- Ngày 02/09/2026 Phase 0 của spec reviewer đóng tại P0.10; bước tiếp theo là migration audit với runtime/P1 track hiện có, không phải mở thêm P0 mặc định hay tự tuyên bố parity.
- MIG-02 đã hoàn tất tại `20581b2`: runtime tách internal event khỏi recipient outcome, thêm state version và command idempotency; full replay/digest và persistence vẫn là phần việc sau.
- Ngày 04/09/2026 scope Product/UX được chốt: track hiện tại đặc tả gameflow/screen state; room, matchmaking và reliability backend thuộc Developer.
- Ngày 04/09/2026 lát entry UX đầu tiên được build trong `apps/web`: mock flow chạy từ Home tới Room waiting/setup mà không triển khai backend room.
- Ngày 04/09/2026 lát pre-match UX nối tiếp đã chạy được từ opponent arrival qua setup/ready/countdown tới Match Intro; browser interaction xác nhận swap giữ identity và hủy countdown quay lại setup.
- Ngày 04/09/2026 gameplay preview đã nối liền từ Room tới Day A: action không có target bị khóa, browser hoàn tất Đánh dấu báo thù từ A8 lên B3 và chuyển đúng trạng thái Day B.
