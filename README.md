# Twofold — Web Alpha 2026

> Trạng thái: **tiền sản xuất / luật v0.1**
>
> Mốc gần nhất: **07/09/2026**
>
> Mục tiêu: **phát hành Web Alpha nội bộ trước 30/10/2026**

Twofold hiện là tên làm việc của studio/team 3 người. Project đầu tiên là game đối kháng chiến thuật **1v1 theo lượt**, lấy cảm hứng từ hành vi quen thuộc của Ma Sói: vai trò ẩn, suy luận, đánh lừa, treo cổ và kỹ năng ban đêm.

Mục tiêu trải nghiệm cốt lõi:

> Người chơi thắng vì đọc được và đánh lừa một người chơi thật.

Ba trụ cột thiết kế:

- **Đọc:** quan sát hành động và thông tin đã lộ của đối thủ.
- **Đánh lừa:** khiến đối thủ diễn giải sai ý đồ hoặc vai trò.
- **Cam kết:** mỗi lựa chọn có hậu quả; không hoàn tác sau khi xác nhận.

---

## Cấu trúc Monorepo

Repository được tổ chức theo kiến trúc Monorepo để tách biệt rõ ràng giữa công cụ đặc tả & thẩm định vai trò (PO prototype), game client Web Alpha và các gói logic cốt lõi dùng chung:

```text
twofold/
├── apps/
│   ├── spec-reviewer/               # [PO SPEC & REVIEW] Công cụ tra cứu, đặc tả và review 92 vai trò
│   │   ├── assets/                  # Artwork tham chiếu và UI banner
│   │   ├── data/                    # roles.json (92 roles dataset)
│   │   ├── scripts/                 # Data checkers & annotation scripts
│   │   ├── index.html               # Trang Role Atlas chính & bộ test
│   │   ├── shortlist.html           # Trang Shortlist Review phục vụ họp thống nhất luật
│   │   └── package.json             # @twofold/spec-reviewer
│   └── web/                         # [UPCOMING] Web Alpha Client chính thức (target 07/09/2026)
│       └── package.json             # @twofold/web
├── packages/
│   ├── game-core/                   # Shared ruleset v0.1 & turn state machine
│   │   └── package.json             # @twofold/game-core
│   └── shared-types/                # Shared data schemas & type definitions
│       └── package.json             # @twofold/shared-types
├── docs/                            # Game design docs, ADRs & Project management
│   ├── decisions/                   # Architectural & game rule decision records
│   ├── game-design/                 # Flow, rules, roles draft
│   └── project-management/          # Roadmap, task tracker
├── pnpm-workspace.yaml              # Cấu hình workspace
└── package.json                     # Root package scripts
```

---

## Hướng dẫn Chạy Nhanh

### 1. Xem công cụ Spec Reviewer & Role Atlas của PO

```bash
# Khởi chạy dev server Spec Reviewer (mặc định cổng 4173)
npm run dev
# hoặc
pnpm dev

# Mở trình duyệt tại:
# http://localhost:4173/ -> Khám phá 92 vai trò, lọc phe và xem bộ 10 role gợi ý
# http://localhost:4173/shortlist.html -> Review và sao chép danh sách role đã chọn cho buổi họp
```

### 2. Kiểm tra tính toàn vẹn của dữ liệu Roles

```bash
npm run check
# hoặc
pnpm check
```

---

## Phạm vi Web Alpha

Alpha cần chứng minh được vòng chơi chính, không phải là sản phẩm thương mại hoàn chỉnh.

### Phải có

- Web ưu tiên desktop, chơi online 1v1 bằng khách (guest).
- Tạo phòng / vào phòng bằng mã.
- Mỗi bên có 10 lá và tự gán vai trò trước trận; có bộ cơ bản cho người mới.
- Vai trò được giấu với đối thủ và lộ hoàn toàn khi dùng kỹ năng theo luật hiện tại.
- Chu kỳ Ban ngày → Ban đêm → Bình minh/công bố kết quả.
- Thắng/thua, nhận thua, xử lý mất kết nối với khoảng chờ kết nối lại.
- Tai họa từ sau Vòng 6 để tăng nhịp trận.
- Màn kết quả, đấu lại hoặc tìm đối thủ khác.
- Nhật ký trận cơ bản để debug và hỗ trợ playtest.

### Chưa thuộc Alpha

- Ứng dụng mobile native, tài khoản, hồ sơ, bạn bè.
- Matchmaking tự động, xếp hạng, bảng xếp hạng.
- Shop, skin, battle pass, nhiệm vụ hằng ngày.
- Hệ thống mở khóa thật hoặc 20–30 vai trò đã cân bằng.
- Nhiều chế độ chơi và tutorial dài.

## Quy tắc v0.1 đã thống nhất

- Mỗi người bắt đầu với **10 lá trên sân**.
- Host là Người chơi A và **đi trước** ở các pha theo luật v0.1.
- Vòng 1 bắt đầu vào **Ban ngày**: A hành động, rồi B.
- Sau đó là **Ban đêm**: A chọn hành động, rồi B; hành động đêm được giữ kín và giải quyết sau khi cả hai khóa lựa chọn.
- Sáng hôm sau công bố kết quả đêm trước rồi bắt đầu vòng mới.
- Một vai trò có thể có kỹ năng Ban ngày, Ban đêm hoặc cả hai.
- **Phù thủy:** Ban ngày hồi sinh; Ban đêm đầu độc.
- Người chơi thắng khi đối thủ hết bài, nhận thua, hoặc rời trận quá thời hạn kết nối lại.
- Từ Vòng 7 (sau Vòng 6), hệ thống **Tai họa** tạo áp lực để trận kết thúc nhanh hơn.

Các chi tiết chưa chốt được ghi rõ là “cần xác nhận” hoặc “giả thuyết playtest” trong tài liệu, thay vì ngầm coi là luật cuối.

## Team và ownership

| Vai trò | Chịu trách nhiệm chính |
|---|---|
| Game Designer / Product Owner | Tầm nhìn, luật, core loop, vai trò, cân bằng, scope, ưu tiên, playtest |
| UI/UX Game | Luồng trải nghiệm, phân cấp thông tin, tương tác, visual, prototype, onboarding |
| Developer | Game engine/state machine, multiplayer, đồng bộ, room, reconnect, deploy, log/analytics |

Cả ba cùng review luật và playtest theo vòng lặp: **Thiết kế → Prototype → Chơi → Học → Sửa**.

## Cách làm việc với tài liệu

1. Mỗi thay đổi luật phải cập nhật tài liệu game design tương ứng.
2. Quyết định ảnh hưởng nhiều phần hoặc khó đảo ngược phải có ADR trong `docs/decisions/`.
3. Task chỉ được coi là xong khi thỏa “Điều kiện hoàn thành”.
4. Từ feature freeze, ưu tiên sửa lỗi, đơn giản hóa, cân bằng và UX; không thêm mechanic mới nếu chưa có quyết định scope.
5. Commit nhỏ, mô tả rõ; ví dụ: `docs: chốt luật treo cổ v0.1`.

## Chỉ số Alpha cần theo dõi

- Người mới bắt đầu chơi được trong dưới 5 phút.
- Tỷ lệ trận được chơi đến cuối.
- Thời lượng mục tiêu ban đầu: 8–15 phút/trận.
- Tỷ lệ bấm đấu lại.
- Người chơi có kể lại được một “khoảnh khắc đánh lừa/đọc vị” hay không.

## Bắt đầu từ đâu

- Game Designer/PO: đọc `docs/game-design/` và tra cứu role tại `apps/spec-reviewer`.
- UI/UX Game: chuyển `game-flow-v0.1.md` thành screen/state inventory và prototype.
- Developer: dùng flow làm đầu vào cho state machine, room/realtime POC và reconnect.
- Cả team: theo `docs/project-management/roadmap.md` và cập nhật `task-tracker.md` trong mỗi buổi sync.
