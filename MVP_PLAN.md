# MVP Plan — Trợ lý quản trò Ma Sói mobile-first

## 1. Product statement

Một web app/PWA dành cho nhóm bạn đang ngồi cùng nhau, giúp chia vai bí mật và hỗ trợ quản trò điều hành ván Ma Sói mà không cần bộ bài vật lý hoặc ghi chú tay.

MVP không thay thế quản trò. App là một “host cockpit”: người chơi chỉ nhìn điện thoại khi xem vai hoặc nhận chỉ dẫn cần thiết, còn phần tranh luận và kể chuyện vẫn diễn ra trực tiếp.

## 2. Mục tiêu MVP

- Tạo phòng và bắt đầu một ván trong dưới 2 phút.
- Chơi được trọn vẹn với 6–15 người.
- Không cần đăng ký hoặc cài ứng dụng.
- Vai trò luôn được giữ kín trên thiết bị người chơi.
- Quản trò biết chính xác ai là ai, lượt nào đã xử lý và có thể undo khi bấm nhầm.
- Giao diện đủ đẹp để card reveal trở thành khoảnh khắc đáng nhớ.
- Hoạt động tốt trên mobile Safari và Chrome.

## 3. Nguyên tắc sản phẩm

1. **In-person first:** điện thoại hỗ trợ cuộc chơi, không chiếm lấy cuộc chơi.
2. **Host first:** màn hình quản trò phải rõ và đáng tin cậy hơn ghi chú tay.
3. **No account:** dùng nickname, QR và mã phòng.
4. **Privacy by default:** card luôn úp khi mở lại app hoặc chuyển về từ background.
5. **Human override:** host có thể sửa, undo và xử lý house rule.
6. **One obvious action:** mỗi màn hình chỉ có một hành động chính nổi bật.

## 4. Phạm vi MVP

### P0 — Bắt buộc

#### Tạo và vào phòng

- Host tạo phòng không cần đăng nhập.
- Trước khi room được tạo, host chọn số người và tăng/giảm từng role; bộ đếm phải hiển thị tổng lá, số role có năng lực, số Dân làng và phân bố phe.
- Chỉ cho tạo phòng khi tổng số lá bằng số người và bộ bài vượt qua validation tối thiểu.
- Mã phòng ngắn và QR invite.
- Player nhập nickname và join.
- Lobby realtime hiển thị trạng thái đã vào/mất kết nối.
- Host có thể kick, đổi vị trí và khóa phòng.

#### Thiết lập ván

- Hỗ trợ 6–15 người.
- Preset Classic có Dân làng.
- Preset All Special không có Dân thường.
- Custom deck bằng tăng/giảm số lượng role.
- Cảnh báo khi tổng role không khớp số người hoặc đội hình có nguy cơ mất cân bằng.
- Phân vai ngẫu nhiên phía server; không cho host âm thầm reroll sau khi bắt đầu.

#### Trải nghiệm player

- Card úp mặc định.
- Nhấn giữ để reveal, thả tay để úp lại.
- Hiển thị tên role, phe, công dụng và điều kiện thắng.
- Privacy shield khi app quay lại từ background.
- Hiển thị phase hiện tại và trạng thái sống/chết.
- Reconnect vào đúng seat sau refresh.

#### Host cockpit

- Danh sách player với role, phe, sống/chết và trạng thái hành động.
- Phase state machine: Lobby → Role Reveal → Night → Dawn → Discussion → Voting → Resolution → End.
- Night checklist theo đúng thứ tự role.
- Host chọn và ghi mục tiêu thủ công.
- Đánh dấu chết, cứu, hồi sinh hoặc reveal.
- Undo thao tác gần nhất.
- Autosave sau mọi thay đổi quan trọng.
- Timeline sự kiện của ván.
- Kết thúc game và post-game reveal.

### P1 — Chỉ làm nếu P0 ổn định sớm

- Timer thảo luận.
- Haptic và sound cue tùy chọn.
- Host handover bằng recovery code.
- Cài PWA lên màn hình chính.
- Chia sẻ kết quả cuối game dưới dạng ảnh.

### Không làm trong MVP

- Player chọn mục tiêu/attack trực tiếp trên điện thoại.
- Vote trong app.
- Chat phe Sói.
- AI hoặc audio narrator.
- Matchmaking, chơi online với người lạ.
- Account, profile, rank, achievement.
- Shop hoặc monetization.
- Role builder tùy ý.
- Tự động resolve mọi tương tác và tự xác định thắng/thua.
- True offline không có Internet.

## 5. Bộ role ban đầu

### Core roles

1. Dân làng
2. Ma Sói
3. Tiên tri
4. Bảo vệ
5. Phù thủy
6. Thợ săn

### Extended roles

7. Kẻ ngốc
8. Già làng
9. Sói con
10. Sói trắng

MVP hỗ trợ nội dung cho cả 10 role. Chỉ Dân làng là role không có năng lực; 9 role còn lại đều được trình bày là có năng lực, bao gồm cả năng lực chủ động, bị động và trigger. Hệ thống chỉ cần các action archetype cơ bản: chọn mục tiêu, điều tra, bảo vệ, cứu/giết, trigger khi chết và passive effect. Các role đổi phe, đổi bài hoặc tạo quan hệ như Cupid và Kẻ trộm để sau MVP.

## 6. Information architecture và màn hình

### Shared

1. Home — Tạo phòng / Vào phòng.
2. Join — Quét QR hoặc nhập mã, nhập nickname.
3. Lobby — Danh sách người chơi, QR và trạng thái sẵn sàng.

### Host

4. Game setup — số người, preset, bộ đếm và chọn role trước khi tạo room.
5. Host cockpit — phase, player grid, checklist và primary action.
6. Action sheet — chọn mục tiêu, thêm note, confirm.
7. Dawn/Resolution — tổng hợp kết quả trước khi host công bố.
8. End game — kết quả, reveal và timeline.

### Player

9. Role reveal ceremony — card úp và hướng dẫn nhấn giữ.
10. Role card — role, phe, ability, win condition.
11. Waiting/Phase — phase hiện tại, trạng thái sống/chết và lời nhắc ngắn.

## 7. Mobile UX requirements

- Thiết kế ở viewport 390×844 trước, sau đó mở rộng lên tablet/desktop.
- Primary CTA cố định gần ngón cái, tôn trọng safe-area của iPhone.
- Tap target tối thiểu 44×44 px.
- Không dùng hover làm nguồn thông tin duy nhất.
- Host cockpit dùng player grid 2 cột; thông tin chi tiết mở bằng bottom sheet.
- Action nguy hiểm cần confirm và luôn có undo.
- Không dùng màu làm dấu hiệu duy nhất cho phe hoặc trạng thái.
- Text body tối thiểu khoảng 16 px; role title và phase phải đọc được trong phòng tối.
- Card tự che khi tab mất focus, app resume hoặc quá thời gian reveal.
- Giảm animation khi thiết bị bật `prefers-reduced-motion`.
- Mục tiêu performance: tương tác chính phản hồi gần như tức thì và animation giữ 60 fps trên điện thoại tầm trung.

## 8. Visual direction

### Định hướng đề xuất: Vietnamese Nocturne

- Không khí đêm, bí ẩn, giàu chất nghi lễ nhưng không kinh dị quá mức.
- Bảng màu: indigo đen, ivory ánh trăng, đỏ son và một lượng nhỏ vàng đồng.
- UI utility dùng nền phẳng và tương phản rõ; texture chỉ xuất hiện trên card và các khoảnh khắc quan trọng.
- Typography tiếng Việt: sans dễ đọc cho UI, serif có cá tính cho tên role.
- Illustration nguyên bản lấy cảm hứng từ tranh khắc, giấy dó hoặc sơn mài Việt Nam; tránh medieval fantasy châu Âu quen thuộc.
- Icon dùng một bộ nhất quán; không dùng emoji làm icon sản phẩm.

### Ba hướng cần mock trước khi code UI

1. **Sơn mài ánh trăng:** sang, điện ảnh, đỏ son và vàng đồng.
2. **Tranh khắc dân gian:** giàu bản sắc, texture giấy và đường nét thủ công.
3. **Occult editorial:** hiện đại, tương phản mạnh, ít texture và dễ scale thành design system.

Chỉ chọn một hướng sau khi xem đủ Home, Role Card và Host Cockpit ở cả ba phương án.

## 9. Design system tối thiểu

- Color tokens cho surface, text, faction, warning, danger và success.
- Type scale cho display, title, body, label và microcopy.
- Spacing theo lưới 4/8 px.
- Radius, border và elevation thống nhất.
- Button: primary, secondary, ghost, danger.
- Inputs: room code, nickname, stepper role.
- Components: role card, player tile, status pill, phase header, bottom sheet, confirm dialog, toast và timeline item.
- Motion tokens cho reveal, flip, phase transition và feedback.
- Full states: default, pressed, disabled, loading, error, disconnected và completed.

## 10. Kế hoạch thực hiện

### Sprint 1 — Flow và visual target

- Chốt user journey host/player.
- Wireframe 11 màn hình chính.
- Tạo ba visual directions cho Home, Role Card và Host Cockpit.
- Chọn một direction và chốt design tokens.
- Prototype click-through cho create → join → reveal → first night.

**Gate:** test nhanh với 3 host; họ phải điều hướng được mà không cần giải thích.

### Sprint 2 — Room và role reveal

- Dựng mobile shell và design system.
- Create/join room, QR, lobby realtime.
- Role setup và server-side assignment.
- Role reveal, privacy shield và reconnect.
- Hoàn thiện illustration cho 6 core roles trước.

**Gate:** nhóm 6–10 người vào phòng và xem role trong dưới 2 phút.

### Sprint 3 — Host cockpit và full game loop

- Phase state machine.
- Player grid, night checklist và action sheet.
- Alive/dead, notes, resolution, undo và timeline.
- End game và reveal.
- Bổ sung 4 extended roles.

**Gate:** host mới có thể điều hành một ván từ đầu tới cuối mà không cần giấy bút.

### Sprint 4 — Reliability và visual polish

- Test mobile Safari/Chrome và nhiều kích cỡ màn hình.
- Xử lý refresh, background, mất mạng, duplicate tab và host reconnect.
- Accessibility, reduced motion, contrast và low-light mode.
- Polish animation, sound/haptic tùy chọn và card art.
- Chạy 5 buổi beta thực tế, sửa các điểm gây chậm hoặc lộ role.

**Gate:** không có lỗi lộ role hoặc mất state trong các ván beta.

## 11. Kiến trúc kỹ thuật gợi ý

- PWA responsive, mobile-first.
- Frontend React/Next.js hoặc framework web quen thuộc với người build.
- Realtime backend có subscription và persistent state.
- Server là single source of truth cho room, seat, role assignment và game timeline.
- Mỗi player có participant token riêng lưu trên thiết bị; room code không phải identity token.
- QR chỉ chứa invite URL, không chứa role hoặc dữ liệu bí mật.
- Mọi mutation quan trọng có idempotency/version check để tránh double tap và hai tab ghi đè.

MVP chỉ hỗ trợ nhóm ngồi cùng nhau nhưng vẫn có Internet. True offline/local networking là một project riêng.

## 12. Acceptance criteria

- Host tạo phòng và player join không cần account.
- 6–15 player nhận đúng một role, không role nào bị lộ cho sai người.
- Refresh không làm mất seat hoặc role.
- Host thấy đủ role và trạng thái, player không đọc được dữ liệu role của người khác qua API/UI.
- Host chạy được một game loop hoàn chỉnh và undo được action gần nhất.
- Autosave khôi phục được ván sau khi host refresh.
- UI không vỡ tại 360, 390, 430 và 768 px.
- Core flows dùng được bằng một tay và không phụ thuộc hover.
- Card tự úp khi app mất focus hoặc resume.
- Toàn bộ role và event log chỉ được reveal cho tất cả sau khi host kết thúc ván.

## 13. Chỉ số beta

- Median time từ Home đến role reveal dưới 2 phút.
- 0 sự cố lộ role do UI.
- 0 lượt đêm bị bỏ sót trong 5 ván test cuối.
- Reconnect thành công trên 95% tình huống test.
- Ít nhất 80% host beta muốn dùng lại.
- Player dành phần lớn thời gian nhìn nhau, không nhìn điện thoại.

## 14. Quyết định cần giữ để chống scope creep

- MVP hỗ trợ quản trò, không thay quản trò.
- Player action submission là phase sau.
- 6–15 người là phạm vi chính; 4–5 người để mini mode sau.
- 10 role là giới hạn nội dung ban đầu.
- Reliability và privacy có ưu tiên cao hơn thêm role.
- Visual target phải được chọn trước khi bắt đầu code UI production.
