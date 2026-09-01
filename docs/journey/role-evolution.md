# Lịch sử thay đổi role

Tài liệu này theo dõi role từ lúc được nói trong hội thoại, qua bộ draft, đến behavior thực sự được implement trong prototype tại commit `b589667`.

## Cách đọc trạng thái

- **Đã thống nhất trong design v0.1:** có trong hội thoại/tài liệu chính thức.
- **Đã implement trong prototype:** state machine có behavior chạy được.
- **Đang thử:** có implementation nhưng chưa có playtest data đủ để chốt balance.
- **Chưa đưa vào prototype:** vẫn chỉ là backlog/draft.
- **Lệch design:** prototype đã chọn behavior khác draft; cần ADR hoặc quyết định đồng bộ.

## 1. Quá trình thay đổi bộ 10 lá

### Bộ skeleton trong hội thoại

Hai cấu hình từng được đề xuất:

**Cấu hình đơn giản:**

- 4 Dân làng;
- 2 Ma sói;
- 1 Tiên tri;
- 1 Bảo vệ;
- 1 Phù thủy;
- 1 Thợ săn.

**Cấu hình 10 lá đa dạng hơn:**

- 2 Dân làng;
- 2 Ma sói;
- 1 Tiên tri;
- 1 Bảo vệ;
- 1 Phù thủy;
- 1 Thợ săn;
- 1 Trưởng làng;
- 1 Kẻ ngụy trang.

Cả hai chỉ là đầu vào playtest, chưa được balance.

### Bộ prototype đầu tiên — commit `d2a5274`

- 4 Dân làng;
- 2 Ma sói;
- 1 Tiên tri;
- 1 Bảo vệ;
- 1 Phù thủy;
- 1 Xạ thủ.

Thay đổi đáng chú ý: **Thợ săn bị đổi thành Xạ thủ chủ động**, không còn là phản ứng “chết thì kéo theo”.

### Bộ prototype sau rebalance — commit `768da1b`

- 1 Dân làng;
- 2 Ma sói;
- 1 Tiên tri;
- 1 Bảo vệ;
- 1 Phù thủy;
- 1 Xạ thủ;
- 1 Kẻ báo thù;
- 1 Mục sư;
- 1 Sói Hộ Vệ.

Ba Dân làng bị thay bằng ba role có hành động ngày/counter để pha ngày tạo nhiều quyết định hơn. Đây là **rebalance của prototype**, chưa phải starter deck chính thức trong game design.

## 2. Dân làng

### Ý tưởng ban đầu

- Không có kỹ năng riêng.
- Giá trị nằm ở bluff, làm mồi nhử và che vai trò quan trọng.
- Dùng luật Treo cổ chung vào Ban ngày.

### Các lần thay đổi

1. `d2a5274`: có 4 Dân làng trong mỗi bộ.
2. `768da1b`: giảm còn 1; khi tham gia Hội đồng đã lộ thì được tính **2 phiếu**.
3. `24ab34b`: bỏ trọng số 2 phiếu; mọi role phe Dân có đúng 1 phiếu và Hội đồng cần đúng 3 role.
4. `24ab34b`: chỉ role đã lộ mới được bỏ phiếu.
5. `3a4d551`: rule trên bị sửa; role phe Dân còn ẩn được chọn làm voter và tự lộ khi Hội đồng resolve.

### Failure signal

- Việc giảm từ 4 xuống 1 trong commit có tên `rebalance deck for day play` cho thấy bộ nhiều vanilla card không tạo đủ action ở pha ngày.
- Rule “phải lộ sẵn mới vote” bị sửa bằng commit `allow hidden villagers to join council`, cho thấy Hội đồng dễ bị khóa vì thiếu ba voter đã lộ.

### Trạng thái hiện tại

- Prototype: 1 lá, không có skill riêng, có thể tham gia Hội đồng khi còn ẩn và sẽ lộ khi vote.
- Chưa chốt cho Alpha: số lượng Dân làng cuối cùng.

## 3. Ma sói

### Ý tưởng ban đầu

- Ban đêm chọn một lá đối thủ để tấn công.

### Prototype tại `b589667`

- Có 2 lá mỗi bên.
- `attack` là Main Order ban đêm.
- Nguồn Ma sói lộ khi hai bên đã khóa lệnh đêm.
- Mục tiêu vẫn bí mật cho đến resolution.
- Khiên chặn được cắn.
- Attack tiêu quyền loại bỏ của vòng; không thể cộng thêm poison/Huyết Nguyệt trong cùng vòng.

### Điều chưa chốt

- Ma sói có giới hạn số lần cắn hay không. Prototype không gắn charge cho attack.
- Hai Ma sói tạo khác biệt gì ngoài redundancy/ẩn danh.

## 4. Tiên tri

### Ý tưởng ban đầu

- Ban đêm xem vai trò thật của một lá đối thủ.

### Prototype

- Có 3 lượt soi.
- Kết quả được lưu riêng trong `notes` của người chơi.
- Nguồn Tiên tri lộ ở bước stage night.
- Từ `af173e3`, khiên có thể chặn cả lượt soi; trước đó soi luôn thành công sau khi resolve.

### Failure signal và quyết định

Commit `stage night orders before resolution` chuyển phòng thủ sang sau khi nguồn hành động lộ. Nếu khiên chỉ chặn kill mà không chặn intel, phòng thủ có ít lựa chọn hơn và Tiên tri thiếu counter. Prototype hiện chọn khiên chặn soi.

### Trạng thái

Đã implement; số charge và việc khiên chặn soi vẫn là balance hypothesis.

## 5. Bảo vệ

### Ý tưởng ban đầu

- Ban đêm chọn một lá bên mình để bảo vệ khỏi bị loại.

### Prototype ban đầu

- Bảo vệ có 3 charge.
- Không được bảo vệ cùng một vị trí hai vòng liên tiếp.
- Chỉ vị trí có khiên là public; role mục tiêu và vị trí lá Bảo vệ vẫn ẩn.

### Thay đổi quan trọng — `af173e3`

**Trước:** đặt khiên trước, rồi Main Order ban đêm được chọn/resolve.

**Sau:**

1. Hai bên khóa Main Order và mục tiêu bí mật.
2. Nguồn hành động bước lên, lộ role.
3. Hai bên mới đặt khiên.
4. Khiên và nguồn được trình bày trên sân.
5. Resolution chạy sau một nhịp chờ.

### Phạm vi chặn tại `b589667`

- Ma sói cắn;
- Phù thủy đầu độc;
- Tiên tri soi;
- Huyết Nguyệt.

### Trạng thái

Đã implement và smoke test xác nhận chặn cắn. Việc phòng thủ sau khi thấy nguồn có quá mạnh hay không chưa có playtest metric.

## 6. Phù thủy

### Quyết định từ hội thoại

- Ban ngày: hồi sinh.
- Ban đêm: đầu độc.
- Có thể hoạt động ở cả hai pha.

### Prototype

- `revive`: 1 charge; chỉ hồi sinh lá đã chết bên mình; Phù thủy lộ; role hồi sinh vẫn public.
- `poison`: 1 charge; là Main Order đêm; Phù thủy lộ; khiên chặn được.
- Poison dùng quyền loại bỏ của vòng.

### Đã kiểm tra

Smoke test 29/08 xác nhận hồi sinh làm mục tiêu sống lại, Phù thủy lộ và charge giảm về 0.

### Chưa chốt

- Có được revive lá chết từ bất kỳ vòng nào không.
- Có giới hạn “mỗi role tối đa một lần trong một vòng” hay chỉ giới hạn action theo pha.
- Poison có nên xuyên khiên không; prototype hiện chọn **không**.

## 7. Xạ thủ / Thợ săn

### Draft hội thoại

Thợ săn là role bị động: khi bị loại, chọn một lá đối thủ kéo theo.

### Prototype

Role được đổi thành **Xạ thủ**:

- hành động Ban ngày chủ động;
- 1 viên đạn;
- chỉ bắn role đối thủ đã lộ;
- chỉ kích hoạt khi đối thủ có ít nhất 2 role đã lộ;
- dùng quyền loại bỏ của vòng;
- nguồn có thể vẫn ẩn khi bắn theo log “Xạ thủ ẩn”.

### Trạng thái

**Lệch design.** Prototype đã bỏ behavior phản ứng của Thợ săn. Cần chốt tên và fantasy cuối cùng, hoặc tách thành hai role khác nhau.

## 8. Kẻ báo thù

### Draft hội thoại

“Người báo thù”: nếu bị treo cổ, đối thủ phải để lộ một lá.

### Prototype từ `768da1b`

- Chủ động Ban ngày công khai đánh dấu một mục tiêu đối thủ.
- Nếu Kẻ báo thù chết trước bình minh kế tiếp, mục tiêu chết theo.
- Dấu hết hiệu lực tại bình minh nếu Kẻ báo thù còn sống.

### Đã kiểm tra

Smoke test 29/08 xác nhận: đánh dấu → bị Ma sói giết trong đêm → mục tiêu chết theo.

### Trạng thái

**Lệch mạnh so với draft.** Behavior prototype gần với Thợ săn phản ứng hơn “Người báo thù” cũ. Cần quyết định đổi tên hoặc cập nhật role design.

## 9. Mục sư

### Nguồn

Được thêm trong `768da1b` để pha ngày có quyết định rủi ro.

### Prototype

- 1 lần dùng `purify` Ban ngày.
- Chọn đúng target phe Sói: target chết.
- Chọn nhầm phe Dân: Mục sư tự chết, target sống.
- Mục sư lộ khi dùng.
- Dùng quyền loại bỏ của vòng.

### Đã kiểm tra

- Case chọn Ma sói: pass.
- Case chọn role phe Dân: pass, Mục sư tự chết và target sống.

### Trạng thái

Đang thử; chưa có trong `roles-draft.md` ban đầu và chưa có balance data.

## 10. Sói Hộ Vệ

### Nguồn

Được thêm trong `768da1b` làm counter cho Hội đồng.

### Prototype

- Thuộc phe Sói.
- 1 lần bí mật bảo kê một lá bên mình trong pha Hội đồng.
- Nếu đối thủ buộc tội đúng target được bảo kê, Sói Hộ Vệ lộ và cứu target.
- Nếu không chặn đúng, log chỉ cho biết bên đó đã khóa một mục tiêu bảo kê; behavior reveal phụ thuộc resolution.

### Trạng thái

Đã implement, chưa có smoke case riêng và chưa có playtest balance.

## 11. Các role draft chưa vào prototype

| Role draft | Hướng ban đầu | Trạng thái |
|---|---|---|
| Trưởng làng | Treo cổ sai một lần không mất lượt | Chưa implement |
| Kẻ ngụy trang | Che role/đổi vị trí | Chưa implement |
| Kẻ câm lặng | Khóa kỹ năng lượt kế | Chưa implement |
| Kẻ tráo đổi | Đổi vị trí hai lá bí mật | Chưa implement |
| Thầy bói | Kiểm tra hai lá theo nhóm | Chưa implement |
| Kẻ tố cáo | Đoán đúng thì lộ nhưng chưa chết | Chưa implement; trùng vùng với Hội đồng |
| Người báo thù bản cũ | Bị treo thì ép đối thủ lộ bài | Không phải behavior prototype |
| Kẻ thế thân | Chết thay một lá khác | Chưa implement |
| Kẻ phá đám | Chặn target khỏi skill đêm | Chưa implement |

## 12. Huyết Nguyệt — special card, không phải role

### Vấn đề

Commit `b589667` ghi rõ: bộ bài cơ bản không còn nguồn attack ở late game nếu role tấn công chết hoặc hết charge.

### Giải pháp prototype

- Mở từ **Vòng 6**.
- Dùng Main Order ban đêm.
- Chỉ target role đã lộ.
- Bị khiên chặn.
- Cooldown 2 vòng.
- Vẫn tuân giới hạn một nguồn loại bỏ trong vòng.

### Đã kiểm tra

- Dùng trước Vòng 6 bị từ chối: pass.
- Dùng tại Vòng 6 lên role đã lộ: target chết và card hồi lại ở Vòng 8: pass.

### Mâu thuẫn cần giải quyết

Game design/ADR ban đầu nói Tai họa bắt đầu **sau Vòng 6, tức Vòng 7**. Prototype mở Huyết Nguyệt ở Vòng 6. Đây chưa phải quyết định cuối; cần đồng bộ bằng playtest và ADR.

## 13. Kết luận role tại snapshot `b589667`

| Role | Số lượng | Pha | Charge | Lộ khi dùng | Trạng thái |
|---|---:|---|---:|---|---|
| Dân làng | 1 | Hội đồng | — | Có, khi vote | Prototype |
| Ma sói | 2 | Đêm | Không giới hạn trong code | Có | Prototype |
| Tiên tri | 1 | Đêm | 3 | Có | Prototype |
| Bảo vệ | 1 | Chạng vạng/phòng thủ | 3 | Vị trí nguồn vẫn ẩn | Prototype |
| Phù thủy | 1 | Ngày + Đêm | 1 hồi sinh + 1 độc | Có | Khớp hướng design |
| Xạ thủ | 1 | Ngày | 1 | Không bắt buộc lộ nguồn | Lệch Thợ săn draft |
| Kẻ báo thù | 1 | Ngày + phản ứng chết | Dấu hết ở bình minh | Có khi đánh dấu | Lệch role draft cũ |
| Mục sư | 1 | Ngày | 1 | Có | Role mới đang thử |
| Sói Hộ Vệ | 1 | Hội đồng | 1 | Lộ nếu cứu thành công | Role mới đang thử |

Snapshot này mô tả prototype, không tự động thay thế `roles-draft.md` hay ADR.

## 14. Đồng bộ implementation ngày 30/08/2026

Audit tại `75b104c` phát hiện snapshot engine trong monorepo vẫn dùng nhiều behavior cũ. Implementation `2026-08-30-001` đồng bộ lại theo ADR-0001:

| Role/rule | Behavior sau đồng bộ | Bằng chứng automated |
|---|---|---|
| Dân làng | 2 phiếu trong Hội đồng; Dân làng + 1 role Dân khác đạt ngưỡng 3 phiếu | PASS |
| Hội đồng | Mở từ Vòng 2 sau Day A/B; resolve xong sang Night | PASS |
| Tiên tri | Không countdown; soi đầu gắn sáng/tối; sáng khóa target; tối soi hai để kết liễu | PASS |
| Bảo vệ | Không giới hạn; cấm tự bảo vệ; không chặn soi đầu; chặn kết liễu và death reaction | PASS |
| Phù thủy | Không được hồi sinh và đầu độc trong cùng vòng | PASS |
| Xạ thủ | Source lộ khi bắn Ban ngày | PASS |
| Kẻ báo thù | Death reaction bị khiên chặn khi Protection còn hiệu lực | PASS |

Đây là trạng thái engine prototype sau implementation, thay thế phần “trạng thái hiện tại” của snapshot `b589667` cho các role/rule trên. Balance và browser behavior vẫn chưa được human playtest xác minh.

## 15. Chốt reveal đêm và Kẻ Thế Mạng ngày 30/08/2026

### Tiên tri

- Trước: prototype làm lộ source Tiên tri ở bước stage night; game-design cũ dùng ngưỡng lộ mặc định ở lần dùng đầu.
- Vấn đề: soi tạo thông tin riêng nhưng việc lộ source ngay trong đêm phá vai trò ẩn; đồng thời Tiên tri soi vô hạn, kết liễu và luôn ẩn sẽ quá mạnh.
- Sau: soi thường không làm lộ Tiên tri. Lá Hắc Ám đã soi có thể bị kết liễu ở đêm sau; khi lệnh kết liễu resolve, Tiên tri lộ tại Bình minh kể cả nếu bị Bảo vệ chặn.
- Trạng thái: **Đã implement trong prototype; automated regression PASS**. Soi thường và source tấn công/độc đêm không leak; kết liễu làm lộ Tiên tri kể cả khi bị chặn.

### Kẻ Thế Mạng

- Trước: Sói Hộ Vệ bí mật chọn trước một target để bảo kê trong pha Hội đồng; chỉ lộ nếu đoán trúng target bị Treo cổ.
- Vấn đề: cơ chế chọn trước trùng ngôn ngữ Bảo vệ và yêu cầu một action phụ ngay cả khi không có án Treo cổ cần cứu.
- Sau: đổi tên thành **Kẻ Thế Mạng**, thuộc Phe Hắc Ám. Khi một lá khác bên mình sắp bị Treo cổ hợp lệ, chủ sở hữu được hỏi kín Có/Không. Chọn Có làm Kẻ Thế Mạng lộ và chết thay; chọn Không không tiêu quyền. Chỉ dùng một lần/trận và không áp dụng cho nguồn loại bỏ khác.
- Edge case đã chốt: reaction diễn ra sau khi án Treo xác nhận/lộ role target nhưng trước bước loại và `WIN_CHECK`; target được cứu vẫn nằm ngửa; không tự cứu chính mình; hồi sinh không hoàn lại quyền đã dùng; hai reaction cùng Hội đồng được khóa kín rồi resolve cùng batch.
- Trạng thái: **Đã implement trong prototype; thay Sói Hộ Vệ; automated regression PASS**. UI/bot đã dùng reaction Có/Không thay cho preselection.

## 16. Đồng bộ Thanh trừng ngày 31/08/2026

P0.2 được implement lại thay vì port nguyên implementation lịch sử:

- V6 Cắt bỏ, V7 Đảo chiến tuyến, V8 Ép lộ diện, V9 Khóa mạch chạy bắt buộc sau Bình minh và trước Ban ngày.
- Mỗi card có `instanceId` và `owner` bất biến; position `id` có thể đổi ở V7.
- Guard cooldown và ghi chú Tiên tri đi theo card identity qua Swap.
- Khóa mạch chặn active skill và Vote trong vòng hiện tại.
- Bốn lựa chọn Swap trùng vị trí làm cả batch fizzle để giữ bí mật lựa chọn.

Automated suite: **24/24 pass**, gồm regression auto-fizzle khi không tồn tại response Swap, guard Final Duel ở trạng thái 1–1 và BOT Council pass khi đã tiêu quyền loại trực tiếp. Browser interaction xác nhận Cut V6, Swap V7 và Reveal V8 qua full flow; Lock V9 pass bằng fixture local deterministic. Chưa có human playtest full match hoặc số liệu balance.

## 17. Harden exhausted/reaction/batch ngày 01/09/2026

P0.3 làm rõ và implement hai invariant nối giữa role, Hội đồng và Khóa mạch:

- Card đã dùng skill Ban ngày không thể dùng lại làm voter trong Hội đồng cùng vòng. Engine validate lúc submit và revalidate lúc resolve; BOT, UI và public status dùng cùng điều kiện.
- Khóa mạch chỉ khóa active skill và Vote, không khóa death reaction. Kẻ Thế Mạng bị Khóa mạch vẫn có thể tự nguyện chết thay khi án Treo cổ hợp lệ mở reaction window.

Suite tăng lên **30/30 pass**. Các characterization test cũng xác nhận hai lệnh đêm đã khóa cùng resolve dù source chết trong batch, Cắt bỏ hai lá cuối cho kết quả hòa, và hồi sinh Kẻ Thế Mạng không hoàn lại reaction đã dùng. Browser fixture V9 xác nhận A7 đã dùng Đánh dấu không còn voter action và A4 bị Khóa mạch vẫn chết thay thành công.

## 18. P0.4 — Ranh giới public/private ngày 01/09/2026

- Target khiên được chuyển khỏi public view sang private hand; đối thủ chỉ thấy bên kia đã khóa Phòng thủ.
- Block thành công công bố vị trí được cứu nhưng giữ kín loại đòn và source.
- Soi thường không ghi public timeline và không tạo opponent replay; ghi chú chỉ thuộc người dùng Tiên tri.
- UI overlay khiên từ private payload cho owner, trong khi replay BOT hiển thị `Mục tiêu bí mật`.

Ba red test ban đầu fail 0/3; sau fix toàn suite **33/33 pass** ở checkpoint P0.4. Browser fixture Night Privacy xác nhận A thấy khiên A2, B không lộ badge/target.

## 19. P0.5 — Final Duel và kết thúc trận ngày 01/09/2026

- Trạng thái 1–1 đi Final Duel sau Day, Council, Night hoặc Purge trước phase kế tiếp.
- Mỗi seat chỉ khóa một dự đoán; cùng đúng/cùng sai hòa, một bên đúng thì thắng.
- Một finalizer chung lộ toàn bộ role khi trận kết thúc.
- `match.rematch` chỉ hợp lệ từ `ended` và tạo setup mới; UI Chơi lại dùng action này.

Suite cuối **38/38 pass**. Browser fixture Final Duel xác nhận không còn `Bí danh`, result hiển thị đúng và Chơi lại trả về setup 20 lá sống.
