# 27/08/2026 — Khởi động Twofold

## Bối cảnh

Ý tưởng ban đầu là một nhóm nhỏ làm startup game/app. Team có ba người:

- Game Designer kiêm Product Owner;
- UI/UX Game;
- Developer.

Game đầu tiên lấy cảm hứng từ Ma Sói nhưng chuyển thành đối kháng 1v1 theo lượt. Câu hỏi lớn không phải “có làm được không”, mà là làm sao giữ được cảm giác đọc người và đánh lừa khi không còn thảo luận/vote đông người.

Nguồn hội thoại chính: [Đặt tên nhóm startup game](chatgpt-conversation://6a90324f-de40-83ec-a726-cfc3e80569ba).

## 1. Từ tên gọi đến bản sắc

Cuộc trò chuyện đi qua các tên như Double Blind, False Signal, Second Face và Twofold. Twofold được chọn làm tên làm việc của team/studio vì chứa nhiều lớp nghĩa:

- hai người chơi;
- hai pha ngày/đêm;
- mặt thật và mặt ẩn;
- một hành động có bề mặt và ý đồ phía sau.

Một phân biệt quan trọng xuất hiện sớm: **Twofold là tên có thể sống lâu hơn game đầu tiên**, không nhất thiết là tên thương mại cuối cùng của game.

## 2. Chia ownership cho team 3 người

Team không làm theo kiểu “Game Designer viết xong rồi UI/UX vẽ, Dev code”. Ownership được chia nhưng cả ba cùng tham gia vòng lặp:

> Thiết kế → Prototype → Chơi → Học → Sửa

- Game Designer/PO sở hữu WHAT + WHY: vision, luật, scope, ưu tiên, balance và playtest.
- UI/UX Game sở hữu cách người chơi trải nghiệm: hierarchy, interaction, feedback, prototype và visual.
- Developer sở hữu cách hệ thống vận hành: state machine, multiplayer, room, reconnect, log và deploy.

Bài học đầu tiên: với team nhỏ, việc quan trọng không phải sản xuất nhiều feature mà là kiểm chứng đúng giả thuyết mỗi tuần.

## 3. Khóa mục tiêu Web Alpha

Mục tiêu được đặt thành một outcome rõ:

> Đến cuối tháng 10/2026, hai người mở web, vào cùng phòng, chơi trọn một trận, hiểu thắng/thua và có thể đấu lại.

Mốc đầu tiên là 07/09/2026. Roadmap sau đó được chia thành các cổng:

- 07/09: flow/rule, moodboard/UX direction, research kỹ thuật;
- 14/09: paper/Figma playable và room/realtime POC;
- 21/09: một vòng Day/Night thật trên web;
- 05/10: full match và feature freeze;
- 19/10: internal Alpha với đồng nghiệp;
- 30/10: Web Alpha.

Scope bị loại khỏi Alpha: account, matchmaking tự động, ranked, shop, progression thật, mobile app và nhiều mode.

## 4. Xương sống gameplay v0.1

Các quyết định đã được đưa vào tài liệu game design:

- Mỗi bên có 10 lá trên sân.
- Người chơi tự gán vai trò; đối thủ không biết.
- Dùng kỹ năng làm lộ vai trò theo rule hiện tại.
- Host là A và đi trước trong v0.1.
- Vòng 1 bắt đầu Ban ngày: A rồi B.
- Ban đêm: A rồi B; lựa chọn kín, khóa lại và công bố kết quả vào sáng hôm sau.
- Vai trò có thể có kỹ năng ngày, đêm hoặc cả hai.
- Phù thủy: ban ngày hồi sinh, ban đêm đầu độc.
- Treo cổ được prototype theo cách chọn một lá và đoán đúng vai trò.
- Thắng khi đối thủ hết bài, nhận thua hoặc không quay lại sau reconnect window.
- Từ Vòng 7 có Tai họa để làm bàn chơi sụp nhanh hơn.
- Post-match có đấu lại hoặc tìm đối thủ khác.

Điểm thiết kế quan trọng nhất là trade-off:

> Dùng kỹ năng để có lợi thế ngay, hay giữ vai trò ẩn để tránh bị đối thủ suy luận và treo cổ?

## 5. Role draft và ranh giới giữa “đã chốt” với “đang explore”

15 vai trò được đề xuất để mở không gian thiết kế, nhưng không phải cả 15 đều là scope Alpha. Các role đơn giản như Dân làng, Ma sói, Tiên tri, Bảo vệ, Phù thủy và Thợ săn được ưu tiên cho bộ test. Các role kiểm soát/đánh lừa như Kẻ tráo đổi hoặc Kẻ câm lặng để sau khi core loop chứng minh được là vui.

Bài học tài liệu: đề xuất trong hội thoại phải được đánh dấu là draft/hypothesis. Nếu không, team rất dễ hiểu nhầm brainstorm thành luật đã duyệt.

## 6. Tạo repo mới và sửa một sai lầm lưu trữ

Project ban đầu được dựng thành tài liệu Markdown, Git repo và commit. Khi push, local workspace vẫn chứa prototype Ma Sói cũ từ repo `game-first`. Remote cũ đã bị xóa, nên repo Private mới `gnas-design/twofold` được tạo.

Sau khi phát hiện nội dung cũ không đúng hướng Twofold 1v1, team đã:

1. xác định chính xác `app/` và `MVP_PLAN.md` là prototype cũ;
2. xóa chúng khỏi nhánh hiện tại nhưng giữ khả năng khôi phục qua Git history;
3. đưa `README.md`, `docs/` và `assets/` Twofold vào;
4. push commit thay thế cấu trúc.

Commit mốc: `a73274f docs: replace legacy prototype with Twofold project`.

Bài học: trước khi push một repo “mới”, phải kiểm tra `git status`, `git log`, `git remote -v` và tree hiện tại; tên remote mới không tự động làm nội dung local trở thành project mới.

## Kết quả cuối ngày

- Có repository riêng cho Twofold.
- Có vision, scope, roadmap, task tracker và ADR ban đầu.
- Có game flow/core gameplay/roles draft bằng tiếng Việt.
- Có danh sách câu hỏi mở đủ rõ để bước sang paper test và prototype.

## Câu hỏi được mang sang chặng tiếp theo

- Thứ tự resolve kỹ năng chính xác là gì?
- Host đi trước mọi pha có quá lợi không?
- Bộ 10 lá nào tạo trận đấu dễ hiểu nhất?
- Treo cổ bằng đoán role có vui sau nhiều ván không?
- Tai họa nào đẩy nhịp nhưng vẫn giữ agency?
