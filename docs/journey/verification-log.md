# Nhật ký kiểm tra

## 29/08/2026 — Xác minh state machine tại `b589667`

### Mục tiêu

Kiểm tra behavior hiện có bằng code thay vì suy luận hoàn toàn từ commit message.

### Đối tượng

- Historical blob: `b589667:prototypes/chat-playtest/engine.mjs`
- Working-tree path: `apps/spec-reviewer/game-flow-demo/engine.mjs`
- Blob hash hai file: `040005cc0fb726db05a78624e1107deedb42e911`
- Kết luận: engine đang chạy giống hệt snapshot cuối chuỗi prototype.

### Cách chạy

Dùng Node.js import trực tiếp `createGame`, `dispatch`, `ROLE_DEFS`. Test chỉ gọi public engine API, ngoại trừ một case hồi sinh cần dựng fixture bằng cách đánh dấu một lá đã chết trước action.

### Kết quả

| # | Case | Kết quả |
|---:|---|---|
| 1 | Hai bộ đối xứng có đúng 10 lá và 9 loại role | PASS |
| 2 | Hai vòng đầu không có Hội đồng; Vòng 3 mới mở | PASS |
| 3 | Ba role Dân đang ẩn được vote và tự lộ khi Hội đồng resolve | PASS |
| 4 | Đoán Council sai không giết target và khóa voter | PASS |
| 5 | Khiên chặn đòn cắn ban đêm | PASS |
| 6 | Phù thủy hồi sinh, lộ role và tiêu charge | PASS |
| 7 | Kẻ báo thù chết trước bình minh kéo target chết theo | PASS |
| 8 | Mục sư chọn đúng Sói: Sói chết, Mục sư sống | PASS |
| 9 | Mục sư chọn nhầm Dân: Mục sư chết, target sống | PASS |
| 10 | Huyết Nguyệt bị từ chối trước Vòng 6 | PASS |
| 11 | Huyết Nguyệt dùng Vòng 6, target lộ chết, cooldown tới Vòng 8 | PASS |

Tổng: **11/11 pass**.

### Điều test này không chứng minh

- Không chứng minh game vui.
- Không đo balance hoặc first-player advantage.
- Không kiểm tra UI/animation/timing bằng browser.
- Không kiểm tra multiplayer/reconnect/network.
- Không kiểm tra mọi combination của simultaneous death, revive và Final Duel.
- Không thay thế automated regression suite vì script chưa được commit thành test chính thức.

## 29/08/2026 — Xác minh Role Atlas

### Lệnh

```bash
node apps/spec-reviewer/scripts/check-role-data.mjs
```

### Kết quả

```text
OK: 92 roles, 5 factions, 80 images
```

### Ý nghĩa

- Dataset parse được.
- Có 92 record role.
- Có 5 faction.
- 80 role có image theo checker hiện tại.

### Không chứng minh

- Không xác minh quyền sử dụng từng artwork ngoài thông tin license/source đã ghi.
- Không chứng minh 92 role phù hợp với Twofold.
- Không chứng minh annotation gameplay đã được PO duyệt.

## Historical test evidence còn thiếu

Repo không có:

- log output của các lần chạy prototype ngày 28/08;
- automated test files cho engine;
- biên bản playtest có số người/số ván;
- screenshot comparison cho layout A/B/C;
- danh sách bug/failure ngoài điều có thể tái dựng từ commit.

Do đó journal dùng ngôn ngữ thận trọng:

- commit `fix` hoặc removal = failure signal;
- smoke test 29/08 = logic hiện tại pass các case đã liệt kê;
- mọi tuyên bố về fun/balance vẫn là `chưa xác minh`.

## Đề xuất để lần sau có bằng chứng tốt hơn

1. Chuyển 11 smoke case thành test suite nằm trong `packages/game-core`.
2. Mỗi playtest tạo file `docs/playtests/YYYY-MM-DD-<build>.md`.
3. Ghi commit/build, seed, action log và kết quả từng ván.
4. Với UI experiment, lưu screenshot và tiêu chí chọn/bỏ.
5. Khi test fail, ghi expected/actual/root cause/fix/commit verify.
