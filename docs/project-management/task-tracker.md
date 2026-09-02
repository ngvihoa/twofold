# Task Tracker

## Cách dùng

- Trạng thái: `Ý tưởng` → `Cần kiểm chứng` → `Tuần này` → `Đang làm` → `Playtest/Review` → `Xong`.
- Mỗi task có đúng một owner chịu trách nhiệm đẩy tới kết quả; người khác có thể hỗ trợ/review.
- Cập nhật file trong buổi sync và commit cùng các tài liệu liên quan.

## Mốc 1 — 07/09/2026

| ID | Epic | Task | Owner | Trạng thái | Điều kiện hoàn thành |
|---|---|---|---|---|---|
| GD-01 | Game Flow | Review và chốt Game Flow v0.1 | Game Designer/PO | Playtest/Review | Cả team mô tả được luồng từ mở web đến đấu lại |
| GD-02 | Core Rule | Chốt hành động Ban ngày/Ban đêm, Vote từ Vòng 2 và pha Thanh trừng từ Vòng 6 | Game Designer/PO | Playtest/Review | Không còn nhánh chính mơ hồ trong một vòng |
| GD-03 | Treo cổ | Paper test cơ chế chọn lá + đoán vai trò | Game Designer/PO | Cần kiểm chứng | Có kết luận giữ/sửa/bỏ và lý do |
| GD-04 | Roles | Chọn một bộ 10 lá cơ bản duy nhất | Game Designer/PO | Playtest/Review | Có số lượng, kỹ năng, giới hạn và ví dụ resolve |
| GD-05 | Information | Lập information map | Game Designer/PO | Playtest/Review | P0.9 recipient projection leak 0; còn typed resolved event map và multiplayer transport |
| GD-06 | Edge cases | Chốt thứ tự resolve v0.1 | Game Designer/PO + Dev | Đang làm | Prototype core 38/38; còn chốt priority Thợ săn/Cắt bỏ và simultaneous death mở rộng |
| UX-01 | Visual | Moodboard và 1–2 hướng visual | UI/UX Game | Tuần này | Team chọn được một hướng để prototype |
| UX-02 | UX Flow | Screen/state inventory | UI/UX Game | Tuần này | Bao phủ toàn bộ state trong Game Flow |
| UX-03 | Prototype | Prototype các state cốt lõi | UI/UX Game | Ý tưởng | Có thể click từ chọn bài qua một vòng và kết quả |
| UX-04 | Information | Thiết kế hierarchy thông tin riêng/công khai | UI/UX Game | Ý tưởng | Người test hiểu pha, lượt, hành động và kết quả |
| DEV-01 | Multiplayer | Nghiên cứu room code và realtime | Developer | Tuần này | Ghi lựa chọn, trade-off và POC plan |
| DEV-02 | Architecture | Phác state machine authoritative | Developer | Tuần này | Có state, event, transition và validation chính |
| DEV-03 | Reliability | Nghiên cứu reconnect/resume | Developer | Ý tưởng | Có proposal window và cách phục hồi state |
| DEV-04 | Delivery | Đề xuất stack, deploy, log | Developer | Ý tưởng | Có ADR draft và rủi ro lớn |
| MIG-01 | Spec → Runtime | Đồng bộ ruleset reviewer tại `b770f7b` sang shared-types/game-core | Developer | Xong | Standard deck dùng Kẻ Thế Mạng; Council/đêm/khiên/Purge khớp spec đã freeze; runtime tests và web typecheck pass; khác biệt còn lại được ghi rõ |
| TEAM-01 | Process | Chốt Definition of Done và nhịp sync | Cả team | Tuần này | Team đồng ý cách cập nhật task/decision/playtest |

## Backlog đến Web Alpha

| ID | Mốc | Task | Owner | Trạng thái | Phụ thuộc |
|---|---:|---|---|---|---|
| TEST-01 | 14/09 | Chơi 10–20 ván paper/Figma và ghi dữ liệu | Cả team | Ý tưởng | GD-02–06, UX-03 |
| DEV-05 | 14/09 | Hai browser join room và đồng bộ state POC | Developer | Ý tưởng | DEV-01, DEV-02 |
| WEB-01 | 21/09 | Build lobby + join room bằng mã | Developer + UI/UX | Ý tưởng | DEV-05 |
| WEB-02 | 21/09 | Build một vòng Day/Night/Bình minh + Vote từ Vòng 2 | Developer | Ý tưởng | GD-06, DEV-02 |
| WEB-03 | 21/09 | Hidden/public state, action lock và bảng Vote trung tâm | Developer | Ý tưởng | WEB-02 |
| WEB-04 | 05/10 | Chọn/gán 10 vai trò và countdown 3 giây | Developer + UI/UX | Ý tưởng | GD-04, UX-03 |
| WEB-05 | 05/10 | Treo cổ, bộ role Alpha và resolution | Developer | Ý tưởng | TEST-01, GD-06 |
| WEB-06 | 05/10 | Thắng/thua, nhận thua, reconnect | Developer | Đang làm | Final Duel/result/rematch local 38/38; còn surrender + reconnect + consent multiplayer |
| WEB-07 | 05/10 | Build pha Thanh trừng màu đỏ từ Vòng 6: Cắt bỏ, Đảo chiến tuyến, Ép lộ diện, Khóa mạch | Developer + Game Designer | Playtest/Review | Local suite 38/38 + browser V6–V9/reaction pass; còn human full-match/balance playtest |
| WEB-08 | 05/10 | Kết quả, đấu lại, đối thủ khác | Developer + UI/UX | Ý tưởng | WEB-06 |
| QA-01 | 19/10 | Test deterministic resolution và desync | Developer | Đang làm | P0.6–P0.9: replay + 11.190 hidden-action projection leak 0; còn serialization/transport/desync hai client |
| PT-01 | 19/10 | Tổ chức ít nhất 10 session với đồng nghiệp | Game Designer/PO | Ý tưởng | Build ổn định |
| PT-02 | 19/10 | Tổng hợp comprehension/completion/duration/rematch | Game Designer/PO | Ý tưởng | PT-01 |
| UX-05 | 19/10 | Sửa các điểm chặn hiểu luật | UI/UX Game | Ý tưởng | PT-01 |
| REL-01 | 30/10 | Feature freeze triage và known issues | Cả team | Ý tưởng | PT-02 |
| REL-02 | 30/10 | Smoke test trình duyệt mục tiêu | Developer + UI/UX | Ý tưởng | Release candidate |
| REL-03 | 30/10 | Deploy Web Alpha và mở kênh feedback | Developer + PO | Ý tưởng | REL-01, REL-02 |

## Log blocker

| Ngày | ID task | Blocker | Người xử lý | Hạn | Trạng thái |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
