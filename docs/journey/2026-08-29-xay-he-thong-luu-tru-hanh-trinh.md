# 29/08/2026 — Xây hệ thống lưu trữ hành trình

## Yêu cầu

Chủ project muốn các cuộc đối thoại và cách làm không biến mất sau mỗi phiên chat, mà trở thành một hành trình xây dựng app có thể đọc lại.

## Vấn đề được nhận ra

Git lưu rất tốt **cái gì thay đổi**, nhưng commit message thường không đủ để giải thích:

- tại sao một hướng được chọn;
- lựa chọn nào đã bị bỏ;
- giả thuyết nào dẫn đến prototype;
- team học được gì từ một sai lầm;
- cuộc trò chuyện nào là nguồn của quyết định.

Ngược lại, transcript chat chứa nhiều chi tiết nhưng khó tra cứu, lặp lại và dễ trộn brainstorm với quyết định.

## Giải pháp

Thêm lớp `docs/journey/` ở giữa transcript và tài liệu chính thức:

```text
Cuộc trò chuyện / playtest / quan sát
        ↓ tổng hợp
Journey entry theo ngày hoặc chặng
        ├─ quyết định quan trọng → ADR
        ├─ luật hiện hành → game design
        ├─ công việc → task tracker
        └─ artifact thực thi → commit/prototype
```

Bộ khung gồm:

- `README.md`: mục đích và bản đồ hành trình;
- `conversation-index.md`: theo dõi nguồn nào đã được tổng hợp;
- entry ngày 27/08: hình thành Twofold;
- entry ngày 28/08: đi từ docs đến role tool/monorepo/prototype;
- `working-method.md`: quy trình duy trì;
- `template.md`: mẫu cho entry mới.

Sau yêu cầu bổ sung, bộ khung được mở rộng thêm:

- `role-evolution.md`: before/after từng role và các điểm lệch design;
- `prototype-experiment-log.md`: 15 thử nghiệm theo commit, failure signal và trạng thái giữ/bỏ;
- `verification-log.md`: kết quả smoke test 11/11 và data check Role Atlas.

Quy tắc vận hành tiếp tục được nâng thành yêu cầu bắt buộc của repository:

- root `AGENTS.md` yêu cầu mọi agent cập nhật journey sau mỗi implementation;
- mỗi implementation có record riêng tại `docs/journey/implementations/`;
- `implementation-template.md` bắt buộc ghi before/after, role/rule impact, test log, failure log và quyết định;
- thiếu journey record đồng nghĩa implementation chưa đạt Definition of Done.

## Nguyên tắc được chọn

- Không lưu transcript thô mặc định.
- Không lưu credential hoặc thông tin nhạy cảm.
- Mỗi nguồn có trạng thái tổng hợp.
- Journey kể bối cảnh và bài học; ADR mới là nguồn quyết định chính thức.
- Mỗi kết luận nên có đường dẫn đến file hoặc commit làm bằng chứng.
- Nếu không có nguồn hội thoại đầy đủ, nói rõ entry được tái dựng từ Git/artifact.

## Tình trạng repository tại thời điểm ghi

Nhánh hiện tại là `codex/chat-playtest-prototype`. Workspace đang có một đợt tái cấu trúc monorepo được stage dở và `package.json` còn conflict. Vì vậy task này chỉ thêm file mới trong `docs/journey/`, không sửa, stage, commit hay giải quyết thay công việc đang diễn ra.

Đây cũng là một bài học vận hành: nhật ký phải **không phá vỡ công việc đang chạy**. Khi worktree bẩn hoặc conflict, có thể ghi entry độc lập nhưng việc commit nên chờ owner của thay đổi hiện tại hoàn tất merge.

## Kết quả

Twofold có một cơ chế để biến hội thoại thành bộ nhớ tổ chức, thay vì phụ thuộc vào việc một người nhớ hoặc tìm lại lịch sử chat.

## Bước tiếp theo

- Sau khi conflict monorepo được giải quyết, review và commit `docs/journey/` riêng.
- Thêm link “Hành trình” vào README root khi README ổn định.
- Sau mỗi buổi playtest, tạo entry hoặc cập nhật entry ngày hiện tại.
- Cuối mỗi milestone, viết một entry tổng kết: điều đã tin, điều đã học, điều thay đổi.
