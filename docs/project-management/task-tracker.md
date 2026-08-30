# Task Tracker

## Cách dùng

- Trạng thái: `Ý tưởng` → `Cần kiểm chứng` → `Tuần này` → `Đang làm` → `Playtest/Review` → `Xong`.
- Mỗi task có đúng một owner chịu trách nhiệm đẩy tới kết quả; người khác có thể hỗ trợ/review.
- Cập nhật file trong buổi sync và commit cùng các tài liệu liên quan.

## Mốc 1 — 07/09/2026

| ID | Epic | Task | Owner | Trạng thái | Điều kiện hoàn thành |
|---|---|---|---|---|---|
| GD-01 | Game Flow | Review và chốt Game Flow v0.1 | Game Designer/PO | Playtest/Review | Cả team mô tả được luồng từ mở web đến đấu lại |
| GD-02 | Core Rule | Chốt hành động Ban ngày/Ban đêm và Bỏ lượt | Game Designer/PO | Playtest/Review | Không còn nhánh chính mơ hồ trong một vòng |
| GD-03 | Treo cổ | Test cơ chế Hội đồng 3 voter + đoán vai trò | Game Designer/PO | Playtest/Review | Có kết luận giữ/sửa/bỏ và lý do sau 3–5 trận |
| GD-04 | Roles | Chọn một bộ 10 lá cơ bản duy nhất | Game Designer/PO | Playtest/Review | Có số lượng, kỹ năng, giới hạn và ví dụ resolve |
| GD-05 | Information | Lập information map | Game Designer/PO | Đang làm | Mỗi state ghi rõ ai biết gì và khi nào lộ |
| GD-06 | Edge cases | Chốt thứ tự resolve v0.2 | Game Designer/PO + Dev | Đang làm | Bao phủ protect/poison/revive/death/reaction/win check |
| UX-01 | Visual | Moodboard và hướng visual gameplay | UI/UX Game | Đang làm | Team ghi lại hướng đã chọn từ prototype thành artifact review được |
| UX-02 | UX Flow | Screen/state inventory | UI/UX Game | Đang làm | Bao phủ gameplay hiện tại; Home/Lobby/post-match được đánh dấu chưa làm |
| UX-03 | Prototype | Prototype các state cốt lõi | UI/UX Game | Playtest/Review | Có thể click từ chọn bài qua full match local và kết quả |
| UX-04 | Information | Thiết kế hierarchy thông tin riêng/công khai | UI/UX Game | Playtest/Review | Người test hiểu pha, lượt, hành động và kết quả |
| DEV-01 | Multiplayer | Nghiên cứu room code và realtime | Developer | Cần kiểm chứng | Ghi lựa chọn, trade-off và POC plan |
| DEV-02 | Architecture | Phác state machine authoritative | Developer | Đang làm | Có state, event, transition và validation chính |
| DEV-03 | Reliability | Nghiên cứu reconnect/resume | Developer | Ý tưởng | Có proposal window và cách phục hồi state |
| DEV-04 | Delivery | Đề xuất stack, deploy, log | Developer | Đang làm | Stack đã có ADR; còn bằng chứng deploy và logging |
| TEAM-01 | Process | Chốt Definition of Done và nhịp sync | Cả team | Đang làm | Team đồng ý cách cập nhật task/decision/playtest |

## Lát bàn giao hiện tại — 30/08 đến 07/09

Thứ tự trong mỗi nhóm là thứ tự làm. Chỉ kéo tối đa hai task Dev và hai task UI/UX vào `Đang làm` cùng lúc.

### Game Designer/PO

| ID | Task | Trạng thái | Đầu ra vừa đủ | Phụ thuộc |
|---|---|---|---|---|
| GD-07 | Chơi 3–5 full match trên game-flow demo | Tuần này | Ghi thời lượng, vòng kết thúc, điểm không hiểu và rule gây tranh cãi từng trận | Prototype hiện tại |
| GD-08 | Chốt tạm ba rule đang được code bám theo | Cần kiểm chứng | Một quyết định rõ cho Council từ Vòng 2, bài úp chết vẫn ẩn và Thanh trừng từ Vòng 6 | GD-07 |

### Developer

| ID | Task | Trạng thái | Điều kiện hoàn thành | Phụ thuộc |
|---|---|---|---|---|
| DEV-02A | Cho `game-core` biểu diễn bài chết nhưng chưa lộ | Tuần này | `life` và `visibility` độc lập; eliminate/revive giữ đúng visibility; unit test cho bài ẩn và bài đã lộ | ADR-0004 |
| DEV-02B | Dựng xương sống phase v0.2 tới Vòng 6 | Tuần này | Test tất định đi qua Setup → Day A/B → Council từ Vòng 2 → Night/Defense/Dawn → Purge Vòng 6; role có thể Pass | DEV-02A, GD-08 |
| DEV-02C | Tạo serializer view riêng cho A và B | Cần kiểm chứng | Test chứng minh role bài úp, target đêm và Seer intel không rò sang view đối thủ | DEV-02A |
| DEV-02D | Định nghĩa structured event cho presentation | Cần kiểm chứng | Fixture có thứ tự reveal source → effect → death/revive → Dawn complete; core không chứa duration animation | DEV-02B |

### UI/UX Game

| ID | Task | Trạng thái | Điều kiện hoàn thành | Phụ thuộc |
|---|---|---|---|---|
| UX-02A | Chụp state inventory của gameplay hiện tại | Tuần này | Một bảng gồm Setup, Day, Council, Night plan, Defense, Dawn, Purge, Result; mỗi state ghi CTA, feedback và trạng thái chờ | Prototype hiện tại |
| UX-04A | Annotation information hierarchy | Tuần này | Với mỗi card state: owner thấy gì, đối thủ thấy gì, vị trí hand/lane và treatment alive/dead/revealed/hidden/shielded | UX-02A, ADR-0004 |
| UX-03A | Motion spec cho năm transition quan trọng | Cần kiểm chứng | Có timing/easing/stagger/reduced-motion cho chia bài, chọn skill, source reveal, death và progressive Dawn | UX-02A |
| UX-04B | Usability review trên 3–5 trận | Cần kiểm chứng | Danh sách vấn đề có severity và bằng chứng; không redesign toàn bộ khi chưa có playtest | GD-07, UX-04A |

### Ngoài phạm vi lát này

- Không thêm role mới hoặc cân bằng toàn bộ 92 role.
- Không thiết kế lại Home, Lobby, reconnect, post-match hoặc branding hoàn chỉnh.
- Không port toàn bộ skill từ prototype sang `game-core` trong một task.
- Không làm analytics, audio, matchmaking hoặc production deployment ở lát hiện tại.
- Không xóa engine prototype trước khi parity test giữa demo và `game-core` pass.

## Backlog đến Web Alpha

| ID | Mốc | Task | Owner | Trạng thái | Phụ thuộc |
|---|---:|---|---|---|---|
| TEST-01 | 14/09 | Chơi 10–20 ván prototype và ghi dữ liệu | Cả team | Ý tưởng | GD-07–08, UX-04B |
| DEV-05 | 14/09 | Hai browser join room và đồng bộ state POC | Developer | Ý tưởng | DEV-01, DEV-02 |
| WEB-01 | 21/09 | Build lobby + join room bằng mã | Developer + UI/UX | Ý tưởng | DEV-05 |
| WEB-02 | 21/09 | Build một vòng Day/Night/Bình minh | Developer | Ý tưởng | GD-06, DEV-02 |
| WEB-03 | 21/09 | Hidden/public state và action lock | Developer | Ý tưởng | WEB-02 |
| WEB-04 | 05/10 | Chọn/gán 10 vai trò và countdown 3 giây | Developer + UI/UX | Ý tưởng | GD-04, UX-03 |
| WEB-05 | 05/10 | Treo cổ, bộ role Alpha và resolution | Developer | Ý tưởng | TEST-01, GD-06 |
| WEB-06 | 05/10 | Thắng/thua, nhận thua, reconnect | Developer | Ý tưởng | DEV-03 |
| WEB-07 | 05/10 | Cơ chế ép late-game theo quyết định sau playtest | Developer + Game Designer | Ý tưởng | GD-08; chưa mặc định Vòng 7 |
| WEB-08 | 05/10 | Kết quả, đấu lại, đối thủ khác | Developer + UI/UX | Ý tưởng | WEB-06 |
| QA-01 | 19/10 | Test deterministic resolution và desync | Developer | Ý tưởng | Full match |
| PT-01 | 19/10 | Tổ chức ít nhất 10 session với đồng nghiệp | Game Designer/PO | Ý tưởng | Build ổn định |
| PT-02 | 19/10 | Tổng hợp comprehension/completion/duration/rematch | Game Designer/PO | Ý tưởng | PT-01 |
| UX-05 | 19/10 | Sửa các điểm chặn hiểu luật | UI/UX Game | Ý tưởng | PT-01 |
| REL-01 | 30/10 | Feature freeze triage và known issues | Cả team | Ý tưởng | PT-02 |
| REL-02 | 30/10 | Smoke test trình duyệt mục tiêu | Developer + UI/UX | Ý tưởng | Release candidate |
| REL-03 | 30/10 | Deploy Web Alpha và mở kênh feedback | Developer + PO | Ý tưởng | REL-01, REL-02 |

## Log blocker

| Ngày | ID task | Blocker | Người xử lý | Hạn | Trạng thái |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

## Kiểm tra trạng thái — 30/08/2026

| Khu vực | Bằng chứng hiện có | Kết luận |
|---|---|---|
| Game-flow demo | Full loop local, bot B, UI/motion gameplay, match clock và mirrored opening deal | Playtest/Review; không phải production multiplayer |
| `packages/game-core` | Model role/card/player và một số test nền | Đang làm; chưa có phase machine v0.2 và đang ép card chết phải lộ |
| `packages/shared-types` | Enum/schema/room và WebSocket DTO sơ bộ | Đang làm; chưa có action/view/event v0.2 đầy đủ |
| `apps/web` | Home/room/play routes với mock state | Graybox/scaffold; chưa nối authoritative server, còn random outcome |
| Human playtest | Chưa có record 3–5 trận theo build hiện tại | Chưa xác minh cân bằng và comprehension |
