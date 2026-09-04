# Player Journey & Screen/State Inventory v0.1

- Phiên bản: 0.1
- Ngày cập nhật: 04/09/2026
- Owner: UI/UX Game + Game Designer/PO
- Trạng thái: Playtest/Review
- Nguồn luật: [Game Flow v0.1](game-flow-v0.1.md)

## 1. Mục tiêu và ranh giới

Tài liệu này chuyển Game Flow v0.1 thành hành trình người dùng và inventory màn hình/trạng thái để UI/UX có thể thiết kế, prototype và review từ lúc người chơi vào game tới khi kết thúc, đấu lại hoặc bắt đầu với đối thủ khác.

Phạm vi của track UI/UX:

- đường đi, thứ bậc thông tin, CTA và phản hồi trên màn hình;
- trạng thái loading, waiting, empty, disabled, error và xác nhận;
- cách người chơi hiểu pha, lượt, lựa chọn kín/công khai và kết quả;
- UX của tạo/vào phòng, lobby, rematch và tạo phòng mới ở mức trải nghiệm.

Ngoài phạm vi, do Developer sở hữu:

- cách tạo room code, matchmaking và gán seat ở backend;
- giao thức realtime, participant token, reconnect, retry, versioning và persistence;
- API, transport, database, hosting và chống desync.

UI chỉ phát **ý định người dùng** và hiển thị **kết quả/trạng thái đã được cung cấp**. Tài liệu này không áp đặt protocol hay kiến trúc backend.

## 2. Journey tổng thể

```text
VÀO GAME
  → HOME
      ├─ Tạo phòng → LOBBY / CHỜ ĐỐI THỦ
      └─ Vào bằng mã → JOIN VALIDATION → LOBBY
  → LOADOUT SETUP
  → READY / COUNTDOWN
  → MATCH INTRO
  → GAMEPLAY SHELL
      ├─ Ngày của mình / chờ đối thủ
      ├─ Hội đồng từ Vòng 2
      ├─ Đêm của mình / chờ đối thủ
      ├─ Bình minh
      ├─ Thanh trừng từ Vòng 6
      └─ Final Duel khi còn 1–1
  → MATCH RESULT
      ├─ Đấu lại → chờ đồng ý → LOADOUT SETUP
      ├─ Đối thủ khác → HOME
      └─ Tạo phòng mới → HOME / CREATE ROOM INTENT
```

Ba nguyên tắc xuyên suốt:

1. Người chơi luôn biết **đang ở vòng nào, pha nào, lượt của ai và cần làm gì tiếp theo**.
2. Trạng thái chờ không được vô tình tiết lộ role, source, target hoặc loại action kín qua copy, animation hay thời lượng khác nhau.
3. Hành động không thể hoàn tác luôn có bước xem lại/xác nhận; sau khi khóa, UI nói rõ lựa chọn đã được ghi nhận.

## 3. Khung gameplay dùng chung

Mọi state trong trận dùng cùng một gameplay shell để giảm việc người chơi phải học lại bố cục:

| Vùng | Nội dung bắt buộc | Quy tắc UX |
|---|---|---|
| Header | Vòng, pha, lượt, trạng thái kết nối | Pha là nhãn nổi bật nhất; không chỉ dựa vào màu |
| Board đối thủ | Card sống/chết/lộ, effect công khai | Không render dữ liệu riêng hoặc placeholder có thể suy ra role |
| Bàn/timeline giữa | Event công khai, Vote/Thanh trừng khi active | Event mới có thứ tự; có thể xem lại nhưng không chặn thao tác |
| Board của mình | Role, charge, trạng thái dùng/khóa/bảo vệ riêng | Giải thích vì sao card không thể chọn |
| Action tray | Action hợp lệ, bước chọn, tóm tắt, CTA | Chỉ một primary CTA; disable phải có lý do đọc được |
| Status layer | Đang chờ, reconnect, resolve, reaction | Không thay layout theo việc đối thủ có role kín hay không |

## 4. Inventory trước trận

### UX-ENTRY-01 — Home

- **Mục tiêu:** bắt đầu nhanh bằng tạo phòng hoặc mã mời.
- **Thông tin:** tên game, mô tả ngắn “đấu suy luận 1v1”, hai lựa chọn rõ ràng.
- **Primary CTA:** `Tạo phòng`.
- **Secondary CTA:** `Vào bằng mã`.
- **Biến thể:** mặc định; đang khởi tạo; form nhập mã; mã trống/sai/hết hạn/phòng đầy/trận đã bắt đầu; mất mạng.
- **Quy tắc:** lỗi nằm cạnh trường hoặc CTA gây lỗi; không xóa mã người dùng vừa nhập; cho thử lại.
- **Thoát state:** tạo phòng thành công hoặc vào phòng thành công → Lobby.

### UX-ENTRY-02 — Join validation

- **Mục tiêu:** biết yêu cầu vào phòng đang được xử lý.
- **UI:** giữ nguyên Home, khóa submit lặp và đổi CTA thành trạng thái xử lý.
- **Success:** chuyển Lobby và công bố seat khi đã có.
- **Failure:** quay về form có lỗi cụ thể và CTA thử lại.
- **Developer handoff:** UI cần trạng thái `pending/success/failure` và lý do có thể hiển thị; không quy định API.

### UX-LOBBY-01 — Lobby / chờ đối thủ

- **Mục tiêu:** mời đúng người và hiểu khi nào có thể tiếp tục.
- **Thông tin:** mã phòng, thao tác sao chép/chia sẻ, seat của mình, ô đối thủ, trạng thái chờ.
- **Primary CTA:** `Sao chép mã` khi thiếu đối thủ; tự chuyển sang setup khi đủ hai người.
- **Secondary CTA:** `Rời phòng`.
- **Biến thể:** chỉ có mình; đối thủ vừa vào; đủ hai người; đối thủ tạm offline; đối thủ rời; phòng đóng.
- **Quy tắc:** không hiển thị loadout/role; không dùng spinner vô hạn như phản hồi duy nhất; có câu “Bạn có thể rời phòng bất cứ lúc nào”.

### UX-SETUP-01 — Loadout setup

- **Mục tiêu:** gán đủ 10 role vào 10 vị trí và hiểu bộ bài của mình.
- **Thông tin:** 10 slot, role chưa gán, phe, mô tả skill/timing/reveal/charge, trạng thái hợp lệ.
- **Primary CTA:** `Xác nhận đội hình`.
- **Secondary CTA:** `Dùng bộ cơ bản`, `Đặt lại`, `Rời phòng`.
- **Biến thể:** trống; đang gán; thiếu/vị trí không hợp lệ; hợp lệ; đã xác nhận; đang chờ đối thủ; đối thủ hủy sẵn sàng.
- **Disabled:** CTA xác nhận bị khóa khi chưa đủ 10 vị trí, kèm checklist lý do thay vì chỉ đổi màu.
- **Sau xác nhận:** board chuyển read-only, hiển thị “Đội hình đã khóa cho countdown”; cho `Hủy sẵn sàng` trước khi countdown kết thúc.

### UX-SETUP-02 — Ready countdown

- **Mục tiêu:** nhận biết trận sắp bắt đầu và còn cơ hội hủy.
- **UI:** 3–2–1, hai trạng thái ready, CTA `Hủy sẵn sàng`.
- **Biến thể:** đang đếm; mình hủy; đối thủ hủy; gián đoạn kết nối.
- **Quy tắc:** animation không phải nguồn thời gian duy nhất; nếu hủy, nói rõ ai cần xác nhận lại mà không lộ loadout.

### UX-SETUP-03 — Match intro

- **Mục tiêu:** hiểu seat và thứ tự đi trước.
- **Thông tin:** “Bạn là A/B”, “A đi trước”, Vòng 1 bắt đầu Ban ngày.
- **CTA:** không bắt buộc; tự chuyển sau animation ngắn, có `Bỏ qua` nếu animation dài hơn 2 giây.
- **Quy tắc:** presentation không trì hoãn state game hoặc tạo lợi thế do thiết bị nhanh/chậm.

## 5. Inventory trong trận

### UX-MATCH-01 — Bắt đầu vòng

- **Mục tiêu:** nhận biết vòng mới và effect nào vừa hết hạn/tiếp tục.
- **UI:** chuyển pha ngắn trong gameplay shell; không dùng màn chặn dài.
- **Biến thể:** Vòng 1–5 đi vào Ngày; Vòng 6+ đi vào Thanh trừng trước Ngày.

### UX-DAY-01 — Lượt ngày của mình

- **Mục tiêu:** chọn một trong ba nhánh: skill Ban ngày, Treo cổ hoặc Bỏ lượt.
- **Primary CTA:** thay theo nhánh đang chọn: `Tiếp tục` rồi `Xác nhận`.
- **Secondary CTA:** `Quay lại chọn hành động` trước khi khóa.
- **Biến thể:** chưa chọn action; chọn source; chọn target; chọn role đoán; xem lại; đang gửi; đã khóa; validation fail.
- **Quy tắc:** card không hợp lệ giải thích tại chỗ như “Đã dùng skill vòng này”, “Bị Khóa mạch”, “Không đúng target”; không cho click rồi chỉ báo lỗi cuối flow.

### UX-DAY-02 — Xác nhận hành động ngày

- **Tóm tắt:** action, source nếu có, target, role đoán nếu Treo cổ, điều sẽ công khai, charge bị dùng.
- **Primary CTA:** `Xác nhận — không thể hoàn tác`.
- **Secondary CTA:** `Chỉnh lại`.
- **Success:** đóng tray, timeline nhận outcome công khai, chuyển state phù hợp.
- **Failure:** giữ ngữ cảnh lựa chọn nếu còn hợp lệ; nếu state đã đổi, giải thích và cập nhật board.

### UX-DAY-03 — Chờ lượt ngày đối thủ

- **Mục tiêu:** theo dõi board/timeline mà không hiểu nhầm là game treo.
- **UI:** “Đang tới lượt đối thủ”, chỉ báo online/offline, có thể inspect role của mình và event cũ.
- **Không được hiển thị:** đối thủ đang chọn skill nào, source/target hay số bước còn lại.

### UX-COUNCIL-01 — Hội đồng từ Vòng 2

- **Mục tiêu:** tạo đủ trọng số phiếu, chọn target/role đoán hoặc bỏ qua.
- **UI:** bảng giữa bàn; danh sách voter hợp lệ; bộ đếm `x/3 phiếu`; target; role đoán; CTA xác nhận và bỏ qua.
- **Quy tắc trọng số:** Dân làng = 2; role Dân khác = 1; không yêu cầu đúng ba card. Dân làng + một role Dân khác là đủ 3 phiếu.
- **Biến thể:** chưa đủ phiếu; đủ phiếu; voter exhausted/Khóa mạch; đang chờ đối thủ khóa; cả hai đã khóa; passed; resolved.
- **Reveal:** nói rõ voter được chọn sẽ lộ role sau xác nhận.
- **Privacy:** không hiển thị lựa chọn kín của đối thủ trước batch resolve.

### UX-REACTION-01 — Reaction Treo cổ

- **Mục tiêu:** chủ Kẻ Thế Mạng chọn dùng/không dùng phản ứng chết thay.
- **Owner UI:** target bị kết tội, hậu quả của Có/Không, CTA `Dùng Kẻ Thế Mạng` và `Không dùng`.
- **Opponent UI:** lớp chờ trung tính “Đang xử lý kết quả Hội đồng”.
- **Anti-leak:** cùng copy, motion và khung thời gian public dù đối thủ có Kẻ Thế Mạng hay không.
- **Biến thể:** một reaction; hai phía có reaction kín; đã khóa; resolve.

### UX-NIGHT-01 — Lượt đêm của mình

- **Mục tiêu:** chọn một action đêm hợp lệ hoặc bỏ lượt.
- **UI:** tông đêm nhưng giữ nguyên layout; nhãn rõ “Lựa chọn kín”; source/target riêng; giải thích reveal rule của action.
- **Primary CTA:** `Khóa lựa chọn`.
- **Secondary CTA:** `Bỏ lượt đêm`, `Chỉnh lại` trước khi khóa.
- **Biến thể:** chọn source/target; private result cần đọc; đã khóa; target không hợp lệ; source exhausted/Khóa mạch.
- **Sau khóa:** không cho sửa và không hiện chi tiết action trên vùng công khai.

### UX-NIGHT-02 — Chờ đêm / resolve

- **Mục tiêu:** hiểu lựa chọn đã được nhận và game đang chờ hoặc xử lý.
- **Owner copy:** “Lựa chọn của bạn đã khóa”.
- **Opponent-safe copy:** chỉ “Đối thủ đã khóa/chưa khóa”, không nói loại action.
- **Resolve:** một trạng thái ngắn, không cho thao tác; nếu lâu bất thường chuyển sang messaging phục hồi do Developer cung cấp.

### UX-DAWN-01 — Bình minh

- **Mục tiêu:** hiểu điều gì đã thay đổi sau đêm mà không lộ dữ liệu kín.
- **UI:** event theo thứ tự resolve; board animate theo cùng thứ tự; private result tách nhãn “Chỉ bạn thấy”.
- **Biến thể:** không có thay đổi công khai; một event; nhiều event; được cứu; hồi sinh; fizzle; Tiên tri kết liễu; match ended.
- **Privacy:** soi thường chỉ ở private result; Ma Sói/Tiên tri soi thường không lộ source; block chỉ công bố thông tin được phép.
- **CTA:** `Tiếp tục` chỉ dùng nếu cần bảo đảm người chơi đọc; nếu tự chuyển phải cho xem lại timeline.

### UX-PURGE-01 — Thanh trừng từ Vòng 6

- **Mục tiêu:** hiểu đây là pha bắt buộc và hoàn thành đúng lựa chọn của luật vòng.
- **UI:** tông đỏ + icon/nhãn, không chỉ dựa vào màu; tên luật, hậu quả, lựa chọn hợp lệ và tiến độ khóa.
- **Primary CTA:** `Khóa lựa chọn`.
- **Không có:** Bỏ qua.
- **Biến thể:** V6 Cắt bỏ; V7 Đảo chiến tuyến; V8 Ép lộ diện; V9 Khóa mạch; đã khóa/chờ; resolve; batch fizzle.
- **Deadlock guard UX:** nếu engine xác định phía còn lại không còn lựa chọn hợp lệ, batch tự fizzle và UI chuyển sang outcome; không giữ spinner “đang cân nhắc” vô hạn.

### UX-FINAL-01 — Final Duel

- **Mục tiêu:** đoán role lá cuối đối thủ trong một quyết định kín cuối cùng.
- **UI:** hai card cuối, danh sách role hợp lệ, cảnh báo lựa chọn không thể sửa.
- **Primary CTA:** `Khóa dự đoán`.
- **Biến thể:** đang chọn; đã khóa/chờ; cả hai khóa; reveal cùng đúng/một đúng/cùng sai.
- **Privacy:** không hiển thị guess đối thủ trước resolve.

### UX-INTERRUPT-01 — Mất kết nối / phục hồi

- **Mục tiêu:** biết game chưa mất và lựa chọn đã khóa không cần làm lại.
- **Biến thể UI:** mình đang nối lại; đối thủ mất kết nối; sắp hết thời gian; phục hồi thành công; trận kết thúc do hết hạn.
- **Quy tắc UX:** overlay không phá board; chỉ hiển thị deadline khi backend cung cấp; không tự suy đoán thắng/thua.
- **Developer handoff:** toàn bộ reconnect window, seat recovery và snapshot consistency thuộc Developer.

### UX-INTERRUPT-02 — Nhận thua

- **Entry:** menu phụ trong trận, không đặt cạnh primary action để tránh bấm nhầm.
- **Xác nhận 1:** giải thích trận kết thúc ngay.
- **Xác nhận 2:** CTA nguy hiểm `Xác nhận nhận thua` và `Tiếp tục chơi`.
- **Success:** chuyển Match Result với lý do nhận thua.

## 6. Inventory sau trận

### UX-RESULT-01 — Match result

- **Mục tiêu:** hiểu kết quả, học từ trận và chọn bước tiếp theo.
- **Thông tin:** thắng/thua/hòa, lý do, số vòng/thời lượng, toàn bộ role đã lộ, timeline tóm tắt.
- **Primary CTA:** `Đấu lại`.
- **Secondary CTA:** `Đối thủ khác`, `Tạo phòng mới`, `Về trang chính`.
- **Biến thể:** thắng; thua; hòa; Final Duel; hết bài; nhận thua; mất kết nối.
- **Quy tắc:** lý do kết thúc phải là câu người chơi hiểu, không chỉ mã kỹ thuật.

### UX-REMATCH-01 — Gửi yêu cầu đấu lại

- **Mục tiêu:** biết yêu cầu đã gửi và mình chưa bị kẹt.
- **UI:** giữ Match Result làm nền; trạng thái “Đang chờ đối thủ”; CTA `Hủy yêu cầu`.
- **Biến thể:** đã gửi; đối thủ cũng đồng ý; đối thủ từ chối; đối thủ rời; mình hủy; lỗi gửi.
- **Accepted:** quay về Loadout setup; seat A/B giữ nguyên trong v0.1.
- **Declined/left:** đóng trạng thái chờ, đưa `Đối thủ khác` và `Tạo phòng mới` lên rõ ràng.

### UX-REMATCH-02 — Nhận yêu cầu đấu lại

- **Mục tiêu:** quyết định mà không mất quyền xem kết quả.
- **UI:** banner/panel không che timeline; `Đấu lại` và `Không đấu lại`.
- **Không phản hồi:** người gửi vẫn có thể hủy; cách timeout thuộc quyết định sản phẩm/Developer.

### UX-EXIT-01 — Đối thủ khác / tạo phòng mới

- **Mục tiêu:** bắt đầu một session mới mà không nhầm là rematch.
- **Đối thủ khác:** về Home với lựa chọn tạo/vào phòng; matchmaking tự động chưa nằm trong scope.
- **Tạo phòng mới:** phát create-room intent từ Home hoặc Result; UI chờ kết quả rồi vào Lobby.
- **Quy tắc:** nói rõ đội hình và seat cũ không được giữ; không tự tạo phòng chỉ vì đối thủ từ chối rematch.

## 7. Ma trận state bắt buộc cho prototype UX

| Nhóm | State phải có | Empty/loading | Waiting/locked | Error/recovery |
|---|---|---:|---:|---:|
| Entry | Home, join validation | Có | Có | Có |
| Lobby | Chờ/đủ đối thủ | Có | Có | Có |
| Setup | Loadout, ready, countdown, intro | Có | Có | Có |
| Day | Own turn, confirmation, opponent turn | Có | Có | Có |
| Council | Vote, pass, resolve, reaction | Có | Có | Có |
| Night | Own commit, wait, resolve, dawn | Có | Có | Có |
| Purge | V6–V9, fizzle | Không áp dụng | Có | Có |
| Endgame | Final Duel, result | Không áp dụng | Có | Có |
| Rematch | Request, receive, accepted/declined/left | Không áp dụng | Có | Có |

## 8. Handoff UI/UX ↔ Developer

UI/UX bàn giao theo ngôn ngữ intent và outcome:

| UX cần | Developer cung cấp | UX không quyết định |
|---|---|---|
| Người chơi bấm tạo/vào phòng | pending/success/failure + message hiển thị được | API, room allocation, token |
| Biết action nào hợp lệ | danh sách action/target hợp lệ + lý do disabled | validation authority |
| Hiển thị đang chờ | phase/turn/commit status an toàn để công khai | transport/retry |
| Hiển thị outcome | public events + private result đúng recipient | event persistence/projection internals |
| Phục hồi sau gián đoạn | trạng thái reconnect và snapshot mới nhất | timeout, resume protocol |
| Rematch | pending/accepted/declined/left | room lifecycle và consent storage |

Các screen phải thiết kế được bằng dữ liệu giả lập. Việc nối dữ liệu thật, đảm bảo đồng bộ hai client và xử lý session thuộc backlog Developer.

## 9. Scenario review UX

1. Người mới tạo phòng, sao chép mã, chờ B, dùng bộ cơ bản và vào trận mà không cần giải thích miệng.
2. Người chơi nhập mã sai, sửa và thử lại mà không mất ngữ cảnh.
3. Một bên xác nhận loadout rồi hủy; cả hai hiểu ai đang ready.
4. Trong Day, người chơi phân biệt được skill, Treo cổ và Bỏ lượt; biết điều gì sẽ lộ trước khi khóa.
5. Hội đồng đạt 3 phiếu bằng Dân làng + một role Dân khác; UI không yêu cầu ba card.
6. Action đêm đã khóa không lộ source/target qua màn chờ; kết quả soi chỉ chủ sở hữu thấy.
7. Reaction Kẻ Thế Mạng không bị lộ cho đối thủ qua copy/layout/timing.
8. Purge Swap không còn lựa chọn hợp lệ tự fizzle thay vì chờ vô hạn.
9. Final Duel giải thích rõ dự đoán kín và ba outcome.
10. Sau Match Result: cả hai rematch; một người từ chối; đối thủ rời; người còn lại tạo phòng mới.

## 10. Câu hỏi mở cần playtest

| ID | Câu hỏi | Owner | Không chặn |
|---|---|---|---|
| UXQ-01 | Home ưu tiên Tạo phòng hay Vào bằng mã theo hành vi thật? | UI/UX + PO | Backend room implementation |
| UXQ-02 | Có cần nickname ở Alpha hay chỉ seat A/B? | PO | Core gameplay |
| UXQ-03 | Match intro nên tự chuyển bao lâu để không làm chậm rematch? | UI/UX | State machine |
| UXQ-04 | Bình minh tự chuyển hay chờ cả hai xác nhận đã đọc? | GD + UI/UX | Outcome contract |
| UXQ-05 | Rematch giữ A đi trước hay luân phiên A/B? | GD | Result layout |
| UXQ-06 | `Đối thủ khác` chỉ về Home hay có matchmaking sau Alpha? | PO + Developer | UX Alpha hiện tại |

## 11. Definition of Done cho UX-02

- Mọi state trong Game Flow v0.1 có screen hoặc presentation state tương ứng.
- Mỗi state có mục tiêu, CTA, thông tin bắt buộc và các biến thể chính.
- Privacy rule được diễn đạt ở các màn Day/Council/Night/Dawn/Reaction.
- Result, rematch, từ chối/rời và tạo phòng mới có đường thoát rõ ràng.
- Prototype có thể dùng dữ liệu giả, không chờ room/matchmaking backend.
- Một người không tham gia viết flow có thể đi qua 10 scenario ở mục 9 mà không tự bịa nhánh chính.
