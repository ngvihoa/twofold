# Cách duy trì hành trình xây dựng

## Quy tắc bắt buộc từ 29/08/2026

Mỗi implementation làm thay đổi repo phải tạo một record tại `docs/journey/implementations/` theo `implementation-template.md`. Đây là một phần của Definition of Done, không phải bước tài liệu tùy chọn.

Record phải được viết trong khi implementation còn mới, trước khi handoff. Không chờ cuối sprint mới nhớ lại hàng loạt thay đổi.

## Khi nào cần ghi

Tạo hoặc cập nhật journey khi có ít nhất một trong các sự kiện:

- một cuộc trò chuyện làm thay đổi hướng sản phẩm;
- chốt/sửa luật;
- chọn hoặc bỏ một kiến trúc;
- hoàn thành prototype/playtest đáng kể;
- gặp sai lầm khiến team thay đổi cách làm;
- kết thúc milestone;
- scope hoặc deadline thay đổi.

Không cần tạo entry cho mỗi chỉnh sửa nhỏ hoặc bug fix không tạo ra bài học mới.

## Quy trình 15 phút sau một cuộc trò chuyện

### Bước 1 — Ghi nguồn

Thêm vào `conversation-index.md`:

- ngày;
- tên/link cuộc trò chuyện;
- câu hỏi trung tâm;
- trạng thái `Chưa đọc` hoặc `Đã đọc`.

### Bước 2 — Phân loại nội dung

Đọc cuộc trò chuyện và gắn từng ý vào một trong bốn nhóm:

| Nhóm | Ví dụ | Đi đâu |
|---|---|---|
| Quyết định | “Alpha dùng room code, chưa làm matchmaking” | ADR/decision log + journey |
| Giả thuyết | “Host đi trước có thể tạo lợi thế” | Journey + playtest plan |
| Câu hỏi mở | “Poison có xuyên bảo vệ không?” | Game design open questions/task |
| Công việc | “Dev làm room POC trước 14/09” | Task tracker |

### Bước 3 — Viết entry

Tạo entry theo ngày hoặc cập nhật entry hiện tại. Tập trung vào diễn biến:

1. Bối cảnh.
2. Điều đã thảo luận/thử.
3. Điều đã chọn và chưa chọn.
4. Artifact/commit được tạo.
5. Bài học.
6. Bước tiếp theo.

### Bước 4 — Đồng bộ nguồn sự thật

- Luật thay đổi → sửa `docs/game-design/`.
- Quyết định lớn → tạo ADR.
- Deadline/owner thay đổi → sửa roadmap/task tracker.
- Code/prototype thay đổi → liên kết commit.

Journey không được là nơi duy nhất chứa một luật đang có hiệu lực.

### Bước 5 — Commit riêng

Khi worktree sạch hoặc đã tách đúng scope:

```text
journey: record <chủ đề> on YYYY-MM-DD
```

Không gom journey với một refactor lớn nếu không cần thiết. Commit riêng giúp review câu chuyện độc lập với code.

## Sau một buổi playtest

Ghi tối thiểu:

- build/commit được test;
- ai chơi (ẩn danh nếu cần);
- số trận;
- thời lượng;
- nơi người chơi bối rối;
- khoảnh khắc đọc/lừa;
- tỷ lệ hoàn thành/đấu lại;
- thay đổi team dự định làm;
- thay đổi nào chỉ là giả thuyết.

## Khi role hoặc rule thay đổi

Không chỉ ghi “đã sửa role”. Phải lưu đủ:

| Trường | Nội dung |
|---|---|
| Trước | Behavior, charge, target, timing cũ |
| Vấn đề | Điều gì không hoạt động hoặc giả thuyết nào cần test |
| Sau | Behavior mới, bao gồm edge case |
| Bằng chứng | Conversation, commit, action log hoặc test |
| Trạng thái | Draft / prototype / đã chốt / bị thay thế |
| Ảnh hưởng | Role/counter/UI/state machine nào bị tác động |

Nếu prototype lệch game-design document, phải ghi là **lệch design**, không âm thầm sửa lịch sử.

## Khi test fail

Mỗi failure đáng giữ phải có record:

```text
Test ID:
Build/commit:
Setup/seed:
Expected:
Actual:
Reproduction steps:
Root cause: xác định / chưa xác định
Decision: fix / revert / giữ để test thêm
Fix commit:
Verify result: pass / fail / chưa chạy lại
```

Không dùng từ “đã test” nếu chỉ mới đọc code hoặc build thành công. Ghi đúng loại kiểm tra: unit, smoke, browser interaction, visual review hay human playtest.

## Cuối milestone

Viết một entry tổng kết theo ba cột:

| Trước milestone tin rằng | Bằng chứng thu được | Sau milestone thay đổi gì |
|---|---|---|
| … | … | … |

Đây là cách journey phản ánh học hỏi, không chỉ là changelog đẹp hơn.

## Quy tắc bảo mật và riêng tư

- Không commit token, mật khẩu, OTP, mã thiết bị hoặc credential.
- Không ghi tên đầy đủ/thông tin cá nhân của tester nếu không cần.
- Không chép nguyên transcript riêng tư.
- Với quote, chỉ giữ câu ngắn có giá trị sản phẩm và ghi nguồn.
- Nếu tài liệu cần chia sẻ public, review lại toàn bộ link hội thoại và dữ liệu tester.

## Definition of Done cho một nguồn hội thoại

Một nguồn được đánh dấu `Đã tổng hợp` khi:

- đã có dòng trong conversation index;
- quyết định đã vào ADR/decision log nếu cần;
- luật hiện tại đã được cập nhật;
- câu hỏi mở/task đã có owner hoặc backlog;
- journey entry liên kết được đến artifact/commit liên quan.
