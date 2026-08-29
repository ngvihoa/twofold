# 2026-08-29-002 — Chốt nhịp Vote, role và Thanh trừng prototype

## Metadata

- Ngày: 29/08/2026
- Owner/Agent: Game Designer/PO + Claude
- Branch: `codex/chat-playtest-prototype`
- Commit trước khi làm: `f0f0d59`
- Commit implementation: Chưa có; thay đổi tài liệu đang ở working tree.
- Conversation/task source: Thảo luận local playtest game-flow ngày 29/08/2026.
- Trạng thái: Hoàn thành thay đổi tài liệu; chưa triển khai code.

## Yêu cầu

Làm rõ nhịp trận trước khi chỉnh code prototype: dùng Bình minh → Ban ngày → Vote → Ban đêm; đặt Vote trung tâm từ Vòng 2; xác định Bảo vệ, Tiên tri, Dân làng; và thêm giai đoạn ép nhịp màu đỏ từ Vòng 6 mang tên Thanh trừng.

## Trạng thái trước khi thay đổi

- Prototype có `day-A → day-B → night-plan → dusk-defense → night-resolution`; Vote/Hội đồng chỉ mở từ Vòng 3.
- Tài liệu mặc định cho việc dùng kỹ năng lần đầu làm lộ role, chưa tách rõ action ngày và đêm.
- Bảo vệ có charge giới hạn; Tiên tri chỉ soi; Dân làng chưa có vote weight đã chốt.
- Tai họa được mô tả từ Vòng 7 nhưng chưa có chu kỳ luật được chốt.

## Giả thuyết

Tách rõ action công khai ban ngày và action bí mật ban đêm sẽ làm nhịp dễ hiểu hơn. Vote công khai role voter tạo giá phải trả cho quyền lực chính trị. Thanh trừng từ Vòng 6 tạo cao trào có kiểm soát thay vì để cuối trận kéo dài ít quyết định.

## Thay đổi đã thực hiện

| Hạng mục | Trước | Sau | File/Module | Lý do |
|---|---|---|---|---|
| Nhịp vòng | Day/Night, có Chạng vạng trong prototype | Bình minh → Thanh trừng từ V6 → Ban ngày → Vote từ V2 → Ban đêm | `docs/game-design/core-gameplay-v0.1.md`, `docs/game-design/game-flow-v0.1.md` | Phân biệt thời điểm và sub-step engine |
| Vote | Treo cổ theo đoán role; Council từ V3 | Bảng giữa bàn; chọn đúng 3 voter phe dân, sau đó chọn mục tiêu; voter lộ role | Game design, ADR | Tạo cam kết công khai và UX không popup |
| Role core | Chưa chốt cooldown/conditional kill/vote weight | Chốt Bảo vệ, Tiên tri, Dân làng cho prototype | Core gameplay, roles draft, ADR | Chuẩn bị implementation |
| Tai họa | Từ V7, 3 luật recommendation | Thanh trừng màu đỏ từ V6, chu kỳ 4 luật cố định | Core gameplay, game flow, ADR, task tracker | Ép pacing sau Đêm 5 |

## Thay đổi role/rule

| Role/Rule | Timing cũ | Timing mới | Skill/charge/target cũ | Skill/charge/target mới | Counter/ảnh hưởng |
|---|---|---|---|---|---|
| Bảo vệ | Đêm/Chạng vạng, charge giới hạn | Ban đêm | Tự bảo vệ được theo mô tả cũ, chặn rộng | Không tự bảo vệ; cùng card không được bảo vệ hai đêm liên tiếp; chặn kill/skill tấn công trực tiếp | Không chặn soi, debuff, Vote/Treo cổ; UI cooldown cần mờ + tooltip |
| Tiên tri | Ban đêm, soi role | Ban đêm | Charge giới hạn, chỉ lấy thông tin | Không countdown; soi lần đầu đánh dấu; soi lần hai chỉ kết liễu phe bóng tối | Cạnh tranh main order với action giết; phe sáng đã soi bị disable |
| Dân làng | Không có skill rõ ràng | Vote Ban ngày từ V2 | Không có vote weight chốt | Voter Dân làng có 2 vote; voter phe dân lộ role khi xác nhận | Mục tiêu Dân làng vẫn có thể bị treo cổ bình thường |
| Vote | Hội đồng từ V3 | Ban ngày từ V2 | Popup/luồng cũ | Bảng giữa bàn, click chọn/bỏ chọn voter; đúng 3 mới active Xác nhận; chọn mục tiêu sau đủ 3 | Có Bỏ qua, không popup xác nhận |
| Thanh trừng | Tai họa từ V7, chưa chốt | Sau Bình minh từ V6, trước Ban ngày | 3 recommendation | V6 Cắt bỏ; V7 Đảo chiến tuyến; V8 Ép lộ diện; V9 Khóa mạch | Bắt buộc, resolve đồng thời, Win Check; UI tông đỏ |

Trạng thái toàn bộ quyết định trên: `Đã chốt cho prototype`, cần playtest để cân bằng.

## Phương án đã thử

| Phương án | Cách thử | Kết quả | Giữ/Bỏ | Lý do |
|---|---|---|---|---|
| Gọi pha ép nhịp là “Biến cố” | Thảo luận naming | INCONCLUSIVE | Bỏ | Không đúng tone mong muốn |
| Gọi pha ép nhịp là “Thanh trừng” | Thảo luận naming/tone đỏ | PASS về quyết định design | Giữ | Bao quát giai đoạn áp lực, phù hợp phong cách prototype |
| Hoán đổi ownership ở V7 | Phân tích rule | INCONCLUSIVE | Bỏ khỏi spec hiện tại | Chu kỳ chốt hoán đổi vị trí, không đổi ownership/role để giảm rủi ro engine |

## Test log

| Test ID | Loại | Setup/build/seed | Expected | Actual | Kết quả |
|---|---|---|---|---|---|
| D-001 | Design review | Thảo luận dựa trên game-flow prototype local | Luật mới được ghi rõ trước code | Core gameplay, Game Flow, Roles draft, ADR và task tracker đã đồng bộ | PASS |

### Lệnh đã chạy

Không có lệnh test tự động; thay đổi này chỉ cập nhật specification và chưa chỉnh code.

## Failure log

Không có failure được quan sát trong phạm vi cập nhật tài liệu. UI/engine hiện hữu chưa được xác minh theo luật mới.

## Quyết định sau implementation

### Đã chốt

- Thanh trừng từ Vòng 6, sau resolve Đêm trước và Bình minh, trước Ban ngày; tông đỏ.
- Chu kỳ Thanh trừng: Cắt bỏ, Đảo chiến tuyến, Ép lộ diện, Khóa mạch.
- Vote từ Vòng 2; chọn đủ ba voter phe dân trước, rồi chọn mục tiêu; Dân làng có 2 vote.
- Bảo vệ không tự bảo vệ và không lặp cùng card trong hai đêm liên tiếp.
- Tiên tri chỉ có thể kết liễu ở lần soi hai khi mục tiêu là phe bóng tối.

### Tạm giữ để test thêm

- Ngưỡng phiếu thực tế và cân bằng Dân làng 2 vote.
- Ảnh hưởng của Thanh trừng tới thời lượng và tỉ lệ kết thúc trận.
- Danh sách đầy đủ effect được xem là kill/skill tấn công để Bảo vệ chặn.

### Câu hỏi mở

- Thứ tự priority giữa action đêm, Bảo vệ và kill có điều kiện của Tiên tri.
- V7 Đảo chiến tuyến cần mô tả UI/targeting chi tiết trước implementation.

## Ảnh hưởng

- Game design: thay đổi nguồn sự thật về nhịp, Vote, role core và pacing sau Vòng 6.
- UI/UX: cần bảng Vote trung tâm, disabled-card tooltip, presentation Thanh trừng đỏ.
- Kỹ thuật: state machine, engine validation, bot và presentation prototype cần sửa ở implementation kế tiếp.
- Data/analytics: cần log vote weight, reveal do Vote và từng lựa chọn Thanh trừng.
- Scope/roadmap: cập nhật WEB-02, WEB-03, WEB-07.

## File và artifact liên quan

- Code sẽ bị ảnh hưởng: `twofold-game-flow-prototype/game-flow-demo/engine.mjs`, `twofold-game-flow-prototype/game-flow-demo/ui.mjs`, `twofold-game-flow-prototype/game-flow-demo/ui.css`
- Docs/ADR: `docs/game-design/core-gameplay-v0.1.md`, `docs/game-design/game-flow-v0.1.md`, `docs/game-design/roles-draft.md`, `docs/decisions/0001-core-rules-v0.1.md`
- [Case study — Từ nhịp Day/Night đến Thanh trừng](../2026-08-29-case-study-thanh-trung-gameflow.md)
- Commit/PR: Chưa có.

## Bước tiếp theo

- [ ] Implement engine + UI theo spec mới — Developer — trước playtest kế tiếp.
- [ ] Chạy browser interaction và visual review cho Vote, Bảo vệ, Tiên tri và Thanh trừng — Developer + UI/UX — sau implementation.
- [ ] Paper/browser playtest 10–20 ván để đo pacing Round 6+ — Game Designer/PO — khi prototype ổn định.

## Giới hạn bằng chứng

Tài liệu ghi nhận quyết định design, không chứng minh được cân bằng, khả năng hiểu của người chơi hay engine hiện tại có thể resolve đầy đủ chu kỳ mới. Các phần đó chỉ được kết luận sau implementation và playtest.
