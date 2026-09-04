# Chỉ mục cuộc trò chuyện

File này giúp team biết cuộc trò chuyện nào đã được chuyển thành tri thức trong repo, tránh thất lạc hoặc tổng hợp trùng.

## Trạng thái

- `Chưa đọc`: mới ghi nhận nguồn.
- `Đã đọc`: đã xem nhưng chưa chuyển thành tài liệu.
- `Đã tổng hợp`: nội dung quan trọng đã đi vào journey/game design/ADR/task.
- `Cần xem lại`: có mâu thuẫn hoặc quyết định mới làm nội dung cũ lỗi thời.

## Danh sách nguồn

| ID | Thời gian | Nguồn | Chủ đề | Trạng thái | Đã lưu tại |
|---|---:|---|---|---|---|
| CONV-001 | 27/08/2026 | [Đặt tên nhóm startup game](chatgpt-conversation://6a90324f-de40-83ec-a726-cfc3e80569ba) | Đặt tên Twofold; cấu trúc team; scope Alpha; timeline; flow 1v1; vai trò ẩn; Day/Night; Tai họa; 15 role draft | Đã tổng hợp | Journey 27/08, game design v0.1, ADR-0001/0002, roadmap |
| CONV-002 | 27/08/2026 | Codex task tạo project và GitHub repo | Dựng tài liệu, tạo `gnas-design/twofold`, thay remote cũ, dọn prototype không đúng hướng | Đã tổng hợp | Journey 27/08, Git commits `a73274f` và lịch sử repo |
| CONV-003 | 28/08/2026 | Các phiên Codex thể hiện qua Git history | Role Atlas, dữ liệu vai trò, monorepo, CLI và prototype playtest | Đã tổng hợp từ artifact/commit | Journey 28/08, role evolution, experiment log, verification log |
| CONV-005 | 29/08/2026 | Thảo luận local playtest game-flow | Chốt nhịp Bình minh/Ngày/Vote/Đêm, Vote từ V2, Bảo vệ/Tiên tri/Dân làng và Thanh trừng từ V6; được đánh dấu case study về pacing | Đã tổng hợp | [Case study Thanh trừng](2026-08-29-case-study-thanh-trung-gameflow.md), Implementation 2026-08-29-002, game design v0.1, ADR-0001, task tracker |
| CONV-004 | 29/08/2026 | Codex task hiện tại | Yêu cầu lưu các cuộc đối thoại và cách làm thành hành trình xây app | Đã tổng hợp | Journey 29/08 và bộ khung `docs/journey/` |
| CONV-006 | 30/08/2026 | Thảo luận cân bằng 10 lá hiện tại | Chốt skill đêm mặc định không lộ source; Tiên tri chỉ lộ khi ra lệnh kết liễu; thay Sói Hộ Vệ bằng Kẻ Thế Mạng thuộc Phe Hắc Ám | Đã tổng hợp | ADR-0001, core gameplay, game flow, roles draft, role evolution, Implementation 2026-08-30-003 |
| CONV-007 | 31/08–03/09/2026 | Chuỗi task hoàn tất Phase 0 và bắt đầu Phase 1 | Fix deadlock Purge Swap; hoàn tất P0.5–P0.10; đồng bộ remote; migrate replay, recipient digest và typed outcomes vào runtime | Đã tổng hợp | Journey đóng Phase 0, implementation P0.5–P0.10, MIG-02, task tracker và verification log |
| CONV-008 | 04/09/2026 | Làm rõ phạm vi Product/UX sau MIG-02 | Room/matchmaking/realtime backend do Developer làm; track hiện tại chỉ làm gameflow và UX từ entry tới kết thúc, rematch hoặc tạo room mới | Đã tổng hợp | [Player Journey & Screen Inventory](../game-design/player-journey-and-screen-inventory-v0.1.md), Implementation 2026-09-04-001, task tracker |
| CONV-009 | 04/09/2026 | Bắt đầu build flow khi user vào website | Implement Home → create/join intent → Room waiting/setup bằng mock state; không chạm backend room | Đã tổng hợp | Implementation 2026-09-04-002, `apps/web`, task tracker và verification log |
| CONV-010 | 04/09/2026 | Tiếp tục player journey sau entry | Implement opponent arrival → setup reorder → ready hai phía → countdown → Match Intro bằng mock state; không chạm backend room | Đã tổng hợp | Implementation 2026-09-04-003, `apps/web`, task tracker và verification log |
| CONV-011 | 04/09/2026 | Tiếp tục sau Match Intro rồi commit/push | Build guided Day A gameplay preview, khóa action không có target và kiểm chứng handoff Day B; không chạm backend room | Đã tổng hợp | Implementation 2026-09-04-004, `apps/web`, task tracker và verification log |

## Cách thêm một nguồn mới

Thêm một dòng với ID tăng dần và tối thiểu các thông tin:

```text
CONV-NNN | ngày | link/tên task | câu hỏi trung tâm | trạng thái | file đã nhận tri thức
```

Nếu không có link ổn định, ghi tên task, ngày và phạm vi. Không dán toàn bộ transcript vào repo; chỉ lưu transcript thô khi có lý do pháp lý/nghiên cứu rõ ràng và đã loại bỏ dữ liệu nhạy cảm.

## Checklist tổng hợp hội thoại

- [ ] Ghi nguồn vào chỉ mục.
- [ ] Tách câu nói thành: quyết định / giả thuyết / câu hỏi mở / task.
- [ ] Cập nhật entry hành trình.
- [ ] Cập nhật ADR nếu có quyết định quan trọng.
- [ ] Cập nhật tài liệu game design nếu luật hiện hành thay đổi.
- [ ] Cập nhật task tracker nếu phát sinh công việc.
- [ ] Gắn commit hoặc artifact làm bằng chứng.
- [ ] Với role/rule: ghi giá trị trước → sau, lý do và trạng thái chốt.
- [ ] Với test fail: ghi expected, actual, root cause, fix và verify result.
