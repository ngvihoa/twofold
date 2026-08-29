# 2026-08-29-001 — Thiết lập journey bắt buộc cho mọi implementation

## Metadata

- Ngày: 29/08/2026
- Owner/Agent: Codex
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `b589667`
- Commit implementation: Chưa commit do workspace đang conflict
- Conversation/task source: Yêu cầu “từ giờ cứ mỗi lần implement sẽ viết thêm hành trình vào”
- Trạng thái: Hoàn thành trên working tree, chờ commit

## Yêu cầu

Biến việc ghi hành trình thành quy tắc mặc định của repository. Mỗi lần implement sau này phải lưu cụ thể thay đổi, role/rule impact, cách thử, test fail và quyết định cuối.

## Trạng thái trước khi thay đổi

- `docs/journey/` đã có narrative, role evolution, experiment log và verification log.
- Chưa có instruction bắt buộc mà agent tương lai tự động đọc.
- Chưa có một record riêng cho từng implementation.
- Template chung chưa đủ chi tiết để ghi reproduction và failure lifecycle.

## Giả thuyết

Đặt yêu cầu ở root `AGENTS.md` và coi journey record là Definition of Done sẽ bền hơn một ghi chú chỉ nằm trong journal. Template riêng sẽ giảm tình trạng ghi thiếu before/after hoặc gọi build check là playtest.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Agent instruction | Chỉ có `AGENT.md`, chưa bắt buộc journal | Có `AGENTS.md` root với Journey DoD | `AGENTS.md` | Agent tương lai phải đọc quy tắc |
| Implementation storage | Entry theo ngày/chặng | Một record cho mỗi implementation | `docs/journey/implementations/` | Tra cứu thay đổi chi tiết |
| Template | Template journey tổng quát | Template implementation có before/after, test và failure | `docs/journey/implementation-template.md` | Chuẩn hóa bằng chứng |
| Working method | Khuyến nghị ghi journal | Bắt buộc ghi trước handoff | `docs/journey/working-method.md` | Tránh quên cuối sprint |
| Journey index | Chưa liên kết implementation records | Có link tới index/template | `docs/journey/README.md` | Dễ tìm |

## Thay đổi role/rule

Không thay đổi gameplay role/rule.

Trạng thái: **Đã chốt như quy trình repository**, không phải game rule.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Chỉ ghi trong `working-method.md` | Đánh giá khả năng agent tự tìm file | Không đủ mạnh | Bỏ làm phương án duy nhất | Agent có thể không đọc journal trước code |
| Thêm root `AGENTS.md` | Dùng file instruction chuẩn của repository | Phù hợp | Giữ | Có hiệu lực với công việc tương lai |
| Một entry dài cho mọi thay đổi | So với nhu cầu trace từng implementation | Khó tra cứu | Bỏ | Không map rõ sang commit/test |
| Một file/implementation | Tạo folder, template và index | Phù hợp | Giữ | Dễ review và liên kết commit |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| T-001 | Static file check | `find docs/journey` | Các file mới tồn tại | Tồn tại trong working tree | PASS |
| T-002 | Formatting check | `rg -n "[ \\t]+$" docs/journey` | Không có trailing whitespace | Không có match | PASS |
| T-003 | Repository safety | `git status --short` | Không sửa/resolve `package.json` conflict | Conflict vẫn nguyên, journal là file độc lập | PASS |

### Lệnh đã chạy

```bash
find docs/journey -maxdepth 2 -type f -print | sort
rg -n "[ \t]+$" docs/journey
git status --short docs/journey AGENTS.md package.json
```

### Output quan trọng

```text
AGENTS.md và docs/journey/ là file mới/chưa commit.
package.json vẫn ở trạng thái UU từ công việc monorepo trước đó.
```

## Failure log

### F-001 — Không thể commit an toàn trong workspace hiện tại

- Build/commit/seed: branch `codex/chat-playtest-prototype`, HEAD `b589667`
- Reproduction: chạy `git status --short`
- Expected: worktree đủ sạch để commit journal riêng
- Actual: `package.json` đang `UU`; nhiều thay đổi monorepo đã staged/modified
- Root cause: Một đợt tái cấu trúc/merge khác đang dang dở
- Fix/decision: Không stage, không resolve và không commit thay công việc khác; lưu file độc lập và báo blocker
- Verify lại: Chưa thể commit cho đến khi owner hoàn tất conflict
- Commit fix: Chưa có

## Quyết định sau implementation

### Đã chốt

- Mọi implementation thay đổi repo phải có journey record.
- Thiếu record nghĩa là chưa đạt Definition of Done.
- Test/failure phải ghi đúng loại bằng chứng.
- Role/rule change phải đồng bộ game design và role evolution.

### Tạm giữ để test thêm

- Có nên tự động kiểm tra journey record trong CI hay pre-commit.

### Bị loại/revert

- Chỉ duy trì journal như một narrative không bắt buộc.

### Câu hỏi mở

- Khi monorepo ổn định, journey check nên nằm trong CLI `tf check` hay CI riêng?

## Ảnh hưởng

- Game design: thay đổi role sau này phải có before/after và trạng thái chốt.
- UI/UX: experiment phải lưu phương án giữ/bỏ và loại review.
- Kỹ thuật: implementation DoD thêm journey record.
- Data/analytics: test report phải nói rõ dữ liệu có/không có.
- Scope/roadmap: không thay đổi deadline hiện tại.

## File và artifact liên quan

- Code/instruction: `AGENTS.md`
- Docs: `docs/journey/README.md`, `docs/journey/working-method.md`
- Template: `docs/journey/implementation-template.md`
- Index: `docs/journey/implementations/README.md`
- Commit/PR: Chưa có do conflict

## Bước tiếp theo

- [ ] Hoàn tất conflict monorepo — Owner của thay đổi hiện tại — trước khi commit journal
- [ ] Commit toàn bộ `docs/journey/` và `AGENTS.md` riêng — Agent/Dev — sau khi worktree an toàn
- [ ] Xem xét journey validation trong `tf check` — Developer — sau khi CLI ổn định

## Giới hạn bằng chứng

Quy tắc đã tồn tại trong working tree nhưng chưa được commit/push. Chưa xác minh agent/CI tương lai có tự động enforcement ngoài việc đọc `AGENTS.md`.
