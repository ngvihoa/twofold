# Nhật ký thử nghiệm prototype

Phạm vi: chuỗi commit từ `d2a5274` đến `b589667` ngày 28/08/2026.

## Chuẩn bằng chứng

| Nhãn | Nghĩa |
|---|---|
| Implemented | Diff xác nhận behavior/UI đã được thêm |
| Failure signal | Có commit `fix`, removal hoặc thay rule ngay sau thử nghiệm |
| Verified 29/08 | Đã chạy smoke test trực tiếp trên state machine cuối chặng |
| Unknown | Không có transcript/test report đủ để khẳng định |

Không có số ván, danh sách tester, video, win rate hoặc survey được commit. Vì vậy “fail” dưới đây nghĩa là **phương án không được giữ lại hoặc tạo ra lỗi/giới hạn đủ rõ để có commit sửa**, không đồng nghĩa với kết luận thống kê từ người chơi.

## E-001 — State machine chat đầu tiên

- Commit: `d2a5274 prototype: add chat playtest state machine`
- Câu hỏi: loop Hội đồng → Ngày → Phòng thủ → Đêm → Bình minh có chạy được và tự kết thúc không?
- Thêm: engine 455 dòng, CLI, public/private view, seeded shuffle, 10 lá đối xứng, winner/final duel.
- Bộ bài: 4 Dân làng, 2 Ma sói, Tiên tri, Bảo vệ, Phù thủy, Xạ thủ.
- Giới hạn đã biết: state chỉ trong memory; chat dùng honor mode; chưa chống xem tay đối thủ.
- Kết quả: tạo baseline chạy được để các commit sau sửa rule.
- Chốt: giữ state machine throwaway làm dụng cụ playtest, không coi là production engine.

## E-002 — UI web với ba bố cục A/B/C

- Commit: `d030045 prototype: add visual local playtest`
- Câu hỏi: biểu diễn bàn 1v1 bằng layout nào dễ theo dõi?
- Thêm: UI local, CSS, ba bố cục trên cùng route, đổi bằng thanh nổi/phím mũi tên.
- Kiểm tra: manual visual exploration; repo không lưu ảnh test hay score.
- Failure signal về sau: `318aba5` xóa 147 dòng và bỏ B/C, chỉ giữ layout A.
- Chốt cuối chuỗi: B/C bị loại, layout A là baseline.

## E-003 — Bỏ Hội đồng ở Vòng 1

- Commit: `6d59543 fix(prototype): skip council in round one`
- Trước: game tạo state ở phase `council`; log nói vào Hội đồng sáng Vòng 1.
- Sau: phase đầu là `day-A`; Hội đồng dự kiến mở ở Vòng 2.
- Failure signal: treo cổ ngay khi chưa có thông tin làm mở màn không hợp lý; commit được ghi rõ là `fix`.
- Chốt tạm: Vòng 1 phải bắt đầu Ban ngày.
- Thay đổi tiếp theo: sau đó Hội đồng còn bị dời thêm sang Vòng 3.

## E-004 — Rebalance bộ bài cho pha ngày

- Commit: `768da1b prototype: rebalance deck for day play`
- Trước: 4 Dân làng, ít kỹ năng Ban ngày.
- Sau: còn 1 Dân làng; thêm Kẻ báo thù, Mục sư và Sói Hộ Vệ.
- Dân làng thử trọng số 2 phiếu.
- Thêm action:
  - Kẻ báo thù đánh dấu;
  - Mục sư thanh tẩy;
  - Sói Hộ Vệ bảo kê án treo.
- Failure signal: tên commit xác nhận mục tiêu rebalance “day play”; ba vanilla card bị thay bằng action/counter.
- Chốt tạm: prototype cần nhiều decision Ban ngày hơn.
- Không chốt: ba role mới chưa có dữ liệu balance.

## E-005 — Card styling riêng cho đấu 1v1

- Commit: `5544f73 prototype: style roles as original duel cards`
- Thay đổi: 58 dòng thêm/19 dòng bỏ trong UI/CSS; card được chuyển khỏi cách trình bày role list chung sang ngôn ngữ duel card.
- Loại kiểm tra: visual/manual, không có test report.
- Kết quả: direction được giữ qua các commit UI tiếp theo.

## E-006 — Khóa thứ tự battlefield và thêm bot

- Commit: `648e4f8 prototype: add ordered battlefield and bot opponent`
- Trước: deck được shuffle thành vị trí ngay khi tạo game; test cần hai người/honor mode.
- Sau:
  - mỗi bên bí mật sắp 10 lá;
  - khóa vị trí A1–A10/B1–B10 cho cả ván;
  - web mode cho người chơi A đấu bot B;
  - bot chỉ dùng public info và note Tiên tri riêng.
- Lợi ích: test flow một người nhanh hơn và vị trí trở thành thông tin ổn định để suy luận.
- Giới hạn: bot không chứng minh được mind game giữa hai người thật.
- Chốt: giữ setup ordering và bot như tool test, không coi bot là validation multiplayer.

## E-007 — Đưa action lên card battlefield

- Commit: `2925c39 prototype: move actions onto battlefield cards`
- Trước: phần action/control tách khỏi đối tượng trên sân.
- Sau: thao tác được neo trực tiếp vào card/target trên battlefield.
- Mục tiêu UX: giảm chuyển ngữ cảnh giữa “tôi muốn dùng lá nào” và panel lệnh.
- Loại kiểm tra: manual interaction; không có metric misclick hoặc completion.
- Chốt: pattern được giữ.

## E-008 — Animation và vùng card đã lộ

- Commit: `321d682 prototype: animate moves and center revealed roles`
- Thêm: animation khi card di chuyển; role đã lộ được đưa vào khu giữa.
- Mục tiêu: làm quá trình reveal/stage dễ đọc hơn thay vì state đổi tức thời.
- Loại kiểm tra: visual/manual.
- Chốt: ý tưởng sân giữa cho card public tiếp tục tồn tại.

## E-009 — Dời Hội đồng sang Vòng 3 và tách khỏi lượt chính

- Commit: `24ab34b prototype: open council from round three`
- Trước:
  - Hội đồng mở ở Vòng 2;
  - dùng quyền loại bỏ của vòng;
  - voter bị `dayExhausted` và không dùng skill Ban ngày;
  - Dân làng có 2 phiếu; có thể chọn 1–3 voter miễn đủ 3 điểm.
- Sau:
  - hai vòng đầu không có Hội đồng;
  - Vòng 3 mới mở;
  - Hội đồng là action phụ trước Ban ngày;
  - không tiêu quyền loại bỏ;
  - voter vẫn được dùng skill ngày;
  - đúng 3 voter, mỗi role 1 phiếu;
  - tại thời điểm commit này voter phải đã lộ.
- Failure signal: phiên bản Vòng 2 + tiêu action tạo quá nhiều cost/pressure quá sớm nên rule bị đơn giản hóa và trì hoãn.
- Chốt tạm: Vòng 3 và 3 voter bằng nhau.

## E-010 — Khóa lệnh đêm trước, phòng thủ sau khi thấy nguồn

- Commit: `af173e3 prototype: stage night orders before resolution`
- Trước:
  - sau Ban ngày đi thẳng sang đặt khiên;
  - hai lệnh đêm resolve ngay khi đủ hai bên;
  - Tiên tri soi không bị khiên chặn.
- Sau:
  1. hai bên khóa Main Order kín;
  2. source card lộ, target vẫn kín;
  3. hai bên đặt khiên;
  4. explicit `night.resolve` sau nhịp chờ;
  5. khiên chặn cả soi.
- Failure signal: flow cũ không cho người phòng thủ phản ứng với loại nguồn, đồng thời resolve quá nhanh để UI trình bày suspense.
- Chốt prototype: reveal source, hide target, defense, then simultaneous resolution.

## E-011 — Cho voter ẩn tham gia Hội đồng

- Commit: `3a4d551 fix(prototype): allow hidden villagers to join council`
- Trước: cần đúng 3 role phe Dân **đã lộ**.
- Sau: chọn được role phe Dân còn ẩn; những voter hợp lệ tự lộ khi resolve.
- Failure signal: điều kiện lộ sẵn có thể khiến Hội đồng không thực hiện được dù người chơi còn đủ role phe Dân.
- Chốt prototype: Council chính là một nguồn reveal; không cần reveal trước.
- Verified 29/08: case 3 voter ẩn buộc tội đúng pass.

## E-012 — Loại layout B/C, chỉ giữ bàn đấu thẳng hàng

- Commit: `318aba5 prototype: keep only aligned duel board`
- Trước: ba layout A/B/C và control đổi layout.
- Sau: chỉ layout A; xóa 147 dòng, thêm 41 dòng.
- Failure signal: B/C không được giữ sau exploration. Repo không lưu lý do định tính chi tiết; “aligned duel board” và commit tiếp theo về viewport cho thấy ưu tiên là đọc bàn rõ, ít phân mảnh.
- Chốt: một layout baseline duy nhất để tiếp tục test flow.

## E-013 — Fit toàn bộ bàn trong một viewport

- Commit: `5edd188 fix(prototype): fit duel board in one viewport`
- Trước: layout A vẫn chưa fit desktop; control/log có thể cạnh tranh không gian với bàn.
- Sau: bàn ở trái; log góc phải trên; hướng dẫn/action góc phải dưới; toàn bộ bàn khóa trong một màn hình.
- Failure signal: commit `fix` xác nhận layout trước chưa đạt tiêu chí one-viewport.
- Chốt prototype: tránh scroll cho state chính của trận.

## E-014 — Atmosphere pha và nhịp Bình minh

- Commit: `55f44ff feat(prototype): add phase atmosphere and dawn pacing`
- Thêm:
  - ánh sáng Ngày/Chạng vạng/Đêm;
  - stage đêm tăng từ khoảng 2,4s lên 3,2s;
  - Bình minh khóa thao tác thêm 3s để quét sáng/công bố.
- Mục tiêu: người chơi nhận biết pha và có thời gian đọc resolution.
- Loại kiểm tra: visual/manual; chưa có metric liệu 3 giây quá nhanh/chậm.
- Chốt tạm: giữ pacing này cho playtest tiếp theo.

## E-015 — Huyết Nguyệt và sửa Hội đồng late game

- Commit: `b589667 feat(prototype): add round six pressure card`
- Failure được ghi thẳng trong commit body:
  - Council bắt đoán role kể cả khi target đã lộ;
  - danh sách đoán vẫn chứa role đã lộ hết;
  - bộ bài không còn nguồn attack late game khi attack role chết/hết charge.
- Sửa:
  - target đã lộ được treo trực tiếp, không cần đoán;
  - target ẩn chỉ cho đoán role còn khả năng theo số lượng chưa lộ;
  - thêm Huyết Nguyệt ở Vòng 6, target role đã lộ, bị khiên chặn, cooldown 2 vòng.
- Verified 29/08:
  - dùng sớm bị reject;
  - Vòng 6 dùng được;
  - target chết nếu không có khiên;
  - cooldown tới Vòng 8.
- Chốt prototype: giữ Huyết Nguyệt như pressure card, nhưng chưa đồng bộ với ADR Tai họa từ Vòng 7.

## E-016 — Chuyển Game Flow sang Thanh trừng từ Vòng 6 (design case study)

- Ngày: 29/08/2026.
- Nguồn: CONV-005 và [case study Thanh trừng](2026-08-29-case-study-thanh-trung-gameflow.md).
- Trước: prototype dùng `day-A → day-B → night-plan → dusk-defense → night-resolution`; Council mở từ Vòng 3; Huyết Nguyệt là pressure card Vòng 6.
- Sau ở mức design: action Đêm 5 resolve → Bình minh → Thanh trừng Vòng 6 → Ban ngày; Vote mở từ Vòng 2; Thanh trừng màu đỏ, bắt buộc, chu kỳ V6 Cắt bỏ / V7 Đảo chiến tuyến / V8 Ép lộ diện / V9 Khóa mạch.
- Lý do: tách thời điểm khỏi sub-step kỹ thuật và tạo cao trào late game có cấu trúc.
- Loại bằng chứng: design review; **chưa implement, chưa browser test, chưa human playtest**.
- Trạng thái: **Design decision / case study candidate**; cần cập nhật sau implementation.



| Failure/giới hạn | Thay đổi | Bằng chứng | Trạng thái |
|---|---|---|---|
| Hội đồng quá sớm khi chưa có info | Bỏ V1, sau đó bỏ cả V2 | `6d59543`, `24ab34b` | Giữ V3 trong prototype |
| 4 Dân làng làm pha ngày ít quyết định | Giảm còn 1, thêm 3 role ngày/counter | `768da1b` | Đang thử |
| Dân làng 2 phiếu làm rule vote đặc biệt | Mọi voter = 1, cần đúng 3 | `24ab34b` | Giữ trong prototype |
| Voter phải lộ sẵn làm Council bị khóa | Voter ẩn được chọn và tự lộ | `3a4d551` | Verified |
| Council vừa giết vừa tiêu main action | Tách thành action phụ trước ngày | `24ab34b` | Giữ trong prototype |
| Đêm resolve trước khi defense có thông tin | Khóa nguồn → lộ source → đặt khiên → resolve | `af173e3` | Giữ trong prototype |
| Ba layout làm exploration phân tán | Chỉ giữ layout A | `318aba5` | Giữ |
| Layout A vẫn tràn khỏi viewport | Dồn board/log/action vào một màn hình | `5edd188` | Giữ |
| State change thiếu nhịp đọc | Thêm phase atmosphere và 3s Bình minh | `55f44ff` | Chưa đo timing |
| Council bắt đoán target đã lộ | Treo trực tiếp | `b589667` | Giữ |
| Guess list chứa role không còn khả năng | Trừ số role đã lộ khỏi danh sách | `b589667` | Giữ |
| Late game thiếu nguồn kết thúc | Huyết Nguyệt V6/cooldown 2 | `b589667` | Verified logic, chưa balance |

## Những test còn thiếu

- Hai người thật chơi 10–20 ván với cùng build.
- First-player advantage của A.
- Tỷ lệ chọn Council/kỹ năng/pass.
- Match duration và số trận chạm Vòng 6.
- Huyết Nguyệt có tạo comeback hay chỉ snowball.
- Khiên chặn soi có làm Bảo vệ quá mạnh.
- Sói Hộ Vệ chặn Council có gây bế tắc.
- Bot decision quality không được dùng thay bằng chứng multiplayer.
