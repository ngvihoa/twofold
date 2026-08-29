# 28/08/2026 — Từ tài liệu đến prototype

## Bối cảnh

Sau khi nền móng tài liệu được thiết lập, trọng tâm chuyển từ “viết game là gì” sang “tạo artifact để nhìn, chạy và chơi thử”. Entry này được tái dựng từ Git history và các artifact trong repo; nó không khẳng định chi tiết hội thoại không còn nguồn trực tiếp.

## 1. Role Atlas: biến nghiên cứu vai trò thành công cụ

Commit `94ff835` thêm một Role Atlas tương tác. Bộ công cụ sau đó phát triển thành `apps/spec-reviewer`, gồm:

- dữ liệu vai trò;
- artwork tham chiếu;
- bộ lọc/tra cứu;
- shortlist để review;
- script kiểm tra và annotate dữ liệu.

Đây là chuyển biến quan trọng: thay vì giữ danh sách role trong một tài liệu dài, team tạo một công cụ giúp PO tra cứu, so sánh và chuẩn bị buổi chốt luật.

Bài học: khi số lượng phương án tăng, tài liệu tuyến tính không còn đủ; cần một bề mặt review phù hợp với quyết định.

## 2. Monorepo và ranh giới sản phẩm

Các commit `b6e182f`, `c070334`, `aaa6cdd`, `5367737` và merge `e27bdc5` thiết lập hướng monorepo:

- `apps/spec-reviewer`: công cụ đặc tả/review;
- `apps/web`: Web Alpha client;
- `packages/game-core`: luật và state machine dùng chung;
- `packages/shared-types`: schema/type chung;
- `packages/cli`: CLI quản lý workspace;
- `docs/`: tri thức sản phẩm.

CLI `tf/twofold` được thêm để list, dev, check, create và xem info theo một cách thống nhất.

Điểm giá trị của kiến trúc này không phải số folder. Nó làm rõ ba loại artifact thường bị trộn:

1. công cụ giúp team suy nghĩ;
2. game người chơi sử dụng;
3. logic luật có thể kiểm thử độc lập.

## 3. Tạo playtest state machine

Chuỗi prototype bắt đầu từ commit `d2a5274`:

- thêm state machine cho chat playtest;
- thêm UI local;
- sửa council không xuất hiện ở Vòng 1;
- rebalance deck cho pha ngày;
- tạo phong cách card đấu 1v1;
- thêm battlefield có thứ tự và bot đối thủ;
- đưa action trực tiếp lên card;
- thêm animation/reveal;
- mở council từ Vòng 3;
- stage hành động đêm trước resolution;
- cho Dân làng ẩn tham gia council;
- thu gọn layout về một bàn đấu thẳng hàng;
- fit một viewport;
- tăng atmosphere ngày/đêm và pacing Bình minh;
- thêm lá áp lực sau Vòng 6.

Chuỗi commit kết thúc ở `b589667 feat(prototype): add round six pressure card`.

Chi tiết before/after, failure signal và trạng thái từng thử nghiệm được lưu tại [Nhật ký thử nghiệm prototype](prototype-experiment-log.md). Thay đổi riêng của từng role được lưu tại [Lịch sử thay đổi role](role-evolution.md).

## 4. Cách làm thể hiện qua Git history

Git history cho thấy một loop tốt:

```text
State machine tối thiểu
→ UI chơi được
→ phát hiện rule/pacing problem
→ sửa một vấn đề mỗi commit
→ giảm layout thừa
→ thêm feedback và áp lực cuối trận
```

Đặc biệt, một số commit là hành động **bỏ bớt** (`keep only aligned duel board`) thay vì chỉ thêm. Đây là tín hiệu đúng với mục tiêu Alpha: prototype dùng để học và loại bỏ, không phải tích lũy feature.

## 5. Điều cần thận trọng

- Prototype có thể chạy nhanh hơn game design document. Sau mỗi playtest, rule thay đổi cần quay lại ADR/game design.
- Tên `chat-playtest` có thể làm artifact bị hiểu là tạm bợ; nếu tiếp tục sử dụng, cần xác định nó thuộc spec reviewer, game core hay web client.
- Bot giúp test flow nhưng không chứng minh được mind game giữa hai người thật.
- Atmosphere và animation có ích cho cảm giác pha, nhưng không thay thế đo comprehension, match completion và rematch.

## Kết quả cuối chặng

- Từ một bộ Markdown, Twofold đã có công cụ review role và prototype có thể tương tác.
- Kiến trúc monorepo bắt đầu định hình ranh giới giữa spec tool, game client và core logic.
- Core loop được diễn đạt bằng state machine và đã trải qua nhiều vòng chỉnh nhỏ.

## Mức độ bằng chứng

Không có test report định lượng hoặc automated test suite được commit trong ngày 28/08. Vì vậy:

- “đã implement” được xác nhận bằng diff/commit;
- “thử không đạt” chỉ được ghi khi có commit sửa hoặc bỏ phương án ngay sau đó;
- không khẳng định số người test, số ván, win rate hay mức độ vui vì repo không lưu dữ liệu đó;
- ngày 29/08 state machine cuối chặng được smoke test lại 11 case, xem [Nhật ký kiểm tra](verification-log.md).

## Bước tiếp theo hợp lý

- Đồng bộ luật prototype ngược về `docs/game-design/` và ADR.
- Chọn một version playable làm baseline playtest.
- Chơi với hai người thật và ghi dữ liệu, không chỉ test với bot.
- Hoàn tất tái cấu trúc monorepo trước khi mở thêm nhánh feature.
