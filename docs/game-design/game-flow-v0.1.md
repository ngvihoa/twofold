# Game Flow v0.1

- Phiên bản tài liệu: 0.1 — review draft 2
- Ngày cập nhật: 01/09/2026
- Chủ sở hữu: Game Designer / Product Owner
- Trạng thái: Playtest/Review

## 1. Mục tiêu của flow

Tài liệu này mô tả đường đi đầy đủ của một người chơi từ lúc mở web đến khi kết thúc hoặc đấu lại. Đây là đầu vào chung cho UI/UX lập screen/state inventory, Game Designer kiểm tra luật, Developer dựng state machine và QA viết scenario.

Flow chốt **trình tự và trách nhiệm của từng state**. Timer, giới hạn kỹ năng, thứ tự resolve chi tiết và bộ 10 lá vẫn là các quyết định riêng cần được chốt trước khi build full match.

## 2. Luồng tổng thể

```text
HOME
  ├─ Tạo phòng ──────────────┐
  └─ Vào phòng bằng mã ──────┤
                             ↓
                           LOBBY
                             ↓ đủ A + B
                         LOADOUT_SETUP
                             ↓ cả hai xác nhận
                       READY_COUNTDOWN (3 giây)
                         ├─ hủy → LOADOUT_SETUP
                         └─ hết giờ
                             ↓
                          MATCH_INTRO
                             ↓
                    ROUND_START (Vòng 1)
                             ↓
                    DAY_A → DAY_B
                             ↓
                    NIGHT_A → NIGHT_B
                             ↓
                       NIGHT_RESOLVE
                             ↓
                       DAWN_REVEAL
                         ├─ chưa kết thúc → ROUND_START (vòng +1)
                         └─ có kết quả → MATCH_RESULT
                                           ├─ Đấu lại → LOADOUT_SETUP
                                           ├─ Đối thủ khác → HOME
                                           └─ Thoát → HOME
```

Sau mọi hành động có thể kết thúc trận, hệ thống chạy `WIN_CHECK`. Nếu đã có kết quả, flow đi thẳng tới `MATCH_RESULT`; các lượt còn lại của vòng không diễn ra.

## 3. Quy ước state machine

- Server là nguồn sự thật duy nhất cho room, seat, phase, turn, board, action đã khóa và kết quả.
- A là người tạo phòng/Host; B là người vào bằng mã. Trong v0.1, A đi trước.
- Client chỉ hiển thị hành động hợp lệ mà server trả về; server vẫn validate lại khi submit.
- Một hành động chỉ có hiệu lực sau bước xác nhận. Sau khi server chấp nhận, người chơi không thể hoàn tác.
- Mỗi command cần có `commandId` để retry không tạo hành động trùng.
- Mỗi state có `version`; command gửi từ state cũ bị từ chối và client phải đồng bộ lại.
- Mất kết nối không tự đổi phase hoặc hủy hành động đã khóa.
- Authoritative action transcript chứa payload đầy đủ chỉ tồn tại ở server/internal tooling; không gửi raw transcript, match seed hoặc full-state digest cho client.
- Payload theo recipient được project từ public state và private state của đúng seat. Action commit kín của đối thủ chỉ phát trạng thái đã khóa; resolved outcome công khai được phát bằng event riêng theo information map.
- Public checksum/digest chỉ được tính từ public view. Checksum của A/B có thể thêm private view của đúng seat nhưng không được hash hidden state của đối thủ.

## 4. Trước trận

### 4.1 `HOME`

- **Tạo phòng:** server tạo room code, gán người tạo vào seat A và chuyển tới `LOBBY`.
- **Vào phòng:** nhập room code; nếu phòng hợp lệ và còn seat B, server gán người chơi vào seat B rồi chuyển tới `LOBBY`.

Các lỗi phải xử lý tại đây: mã không tồn tại/hết hạn, phòng đã đủ người, trận đã bắt đầu nhưng thiết bị không có participant token, lỗi mạng và nickname không hợp lệ nếu Alpha dùng nickname.

Room code chỉ là địa chỉ mời, không phải thông tin xác thực. Mỗi người giữ một participant token riêng để lấy lại đúng seat sau refresh.

### 4.2 `LOBBY`

Lobby hiển thị seat A/B, nickname, trạng thái online và sẵn sàng.

- Chỉ chuyển tiếp khi đủ A và B.
- Một người rời trước trận sẽ giải phóng seat của họ.
- A rời trước trận: phòng đóng trong v0.1; B nhận thông báo và quay về `HOME`.
- B rời trước trận: A ở lại phòng và có thể mời người khác.
- Khi đủ hai người, cả hai chuyển tới `LOADOUT_SETUP`.

Host không có quyền xem loadout bí mật của B hoặc sửa trạng thái game của B.

### 4.3 `LOADOUT_SETUP`

Mỗi người gán vai trò vào 10 vị trí trên sân. Chỉ chủ sở hữu thấy phép gán.

- Người mới có thể dùng bộ cơ bản dựng sẵn.
- Nút **Xác nhận** chỉ bật khi đủ 10 vị trí và loadout hợp lệ.
- Xác nhận khóa loadout của người đó nhưng vẫn cho phép **Hủy sẵn sàng** trước countdown.
- Người đã xác nhận thấy “Đang chờ đối thủ”, không thấy lựa chọn của đối thủ.
- Khi cả hai xác nhận, server chuyển sang `READY_COUNTDOWN`.

### 4.4 `READY_COUNTDOWN`

- Đếm ngược 3 giây theo thời gian server.
- Một trong hai người có thể hủy; cả hai quay lại `LOADOUT_SETUP`, người hủy trở thành chưa sẵn sàng.
- Hết giờ, server khóa hai loadout cho cả trận, tạo event `MATCH_STARTED` và chuyển sang `MATCH_INTRO`.
- Refresh hoặc reconnect không tự hủy countdown.

### 4.5 `MATCH_INTRO`

Màn chuyển cảnh ngắn công bố người chơi là A hay B, A đi trước, mỗi bên có 10 lá và trận bắt đầu ở Ban ngày Vòng 1. Đây là presentation state; server không chờ animation của hai client.

## 5. Vòng đấu chuẩn

### 5.1 Sơ đồ một vòng

```text
ROUND_START
  ↓
DAY_A → ACTION_RESOLVE → WIN_CHECK
  ↓ chưa kết thúc
DAY_B → ACTION_RESOLVE → WIN_CHECK
  ↓ chưa kết thúc
VOTE / HỘI ĐỒNG (từ Vòng 2)
  ↓
NIGHT_A_COMMIT
  ↓
NIGHT_B_COMMIT
  ↓
NIGHT_RESOLVE
  ↓
DAWN_REVEAL
  ↓ nếu Vòng kế tiếp ≥ 6
PURGE / THANH_TRỪNG
  ↓
PURGE_RESOLVE → WIN_CHECK
  ↓ chưa kết thúc
ROUND_START (vòng +1)
```

`ACTION_RESOLVE` và `WIN_CHECK` là system state, không nhất thiết là màn hình riêng.

### 5.2 `ROUND_START`

Server dọn hiệu ứng hết hạn, ghi event mở vòng rồi chuyển sang `PURGE` nếu là Vòng 6 trở đi; nếu là Vòng 1–5 thì chuyển quyền hành động cho A ở `DAY_A`.

Nếu Thanh trừng yêu cầu lựa chọn, flow tạm dừng ở `PURGE` cho tới khi cả hai lựa chọn hợp lệ. Bốn luật và thứ tự resolve đã được chốt cho prototype ở mục 6.

### 5.3 `DAY_A` và `DAY_B`

Người có lượt chọn đúng một hành động chính: dùng kỹ năng Ban ngày, Treo cổ hoặc Bỏ lượt.

```text
Chọn action
  → chọn source/target hoặc vai trò đoán nếu cần
  → xem tóm tắt hậu quả công khai
  → Xác nhận
  → server validate
      ├─ không hợp lệ: giữ lượt, trả lý do và state mới nhất
      └─ hợp lệ: khóa action → resolve → ghi event → WIN_CHECK
```

Sau hành động hợp lệ của B, nếu chưa kết thúc thì tới Vote/Hội đồng từ Vòng 2; sau khi Vote resolve thì tới `NIGHT_A_COMMIT`. Từ Vòng 6, sau `DAWN_REVEAL` của đêm trước sẽ chạy `PURGE` bắt buộc rồi mới vào `DAY_A`.

#### Vote / Hội đồng từ Vòng 2

Vote hiển thị thành bảng ở giữa màn hình, không dùng popup. Người chơi chọn lần lượt tối đa ba lá phe dân còn sống đủ điều kiện của mình làm voter; click lần đầu chọn, click lần hai bỏ chọn. UI hiển thị cả số nhân vật và tổng trọng số `x/3 phiếu`; mục tiêu và nút Xác nhận bị disable cho tới khi tổng trọng số đạt ít nhất 3. Dân làng có trọng số 2, role Dân khác có trọng số 1, nên Dân làng + 1 role Dân khác đã đủ. Nút Bỏ qua là lựa chọn hợp lệ. Khi xác nhận, các voter được chọn lộ role. Vote vào Dân làng đối thủ vẫn là Treo cổ bình thường.

Một card đã dùng skill Ban ngày trong vòng hiện tại mang trạng thái exhausted và không còn đủ điều kiện làm voter trong Hội đồng cùng vòng. UI, BOT, commit validation, resolve revalidation và public view phải cùng dùng invariant này.

#### Thanh trừng từ Vòng 6

Sau `DAWN_REVEAL` của đêm Vòng 5, trước action Ban ngày Vòng 6, trận chuyển sang `PURGE` — **Thanh trừng**. Pha này có tông đỏ, là bắt buộc và không có Bỏ qua. Hai bên chọn bí mật và resolve đồng thời. Prototype dùng chu kỳ cố định:

- Vòng 6 — **Cắt bỏ**: mỗi bên loại một lá phe mình còn sống.
- Vòng 7 — **Đảo chiến tuyến**: mỗi bên chọn một lá để hoán đổi vị trí với đối thủ; ownership và role giữ nguyên.
- Vòng 8 — **Ép lộ diện**: mỗi bên chọn một lá chưa lộ của mình để công khai role.
- Vòng 9 — **Khóa mạch**: mỗi bên chọn một lá còn sống để khóa skill và vote trong vòng hiện tại.

`PURGE_RESOLVE` chạy `WIN_CHECK`; nếu chưa kết thúc mới vào `DAY_A`.

- Source phải còn trên sân, thuộc người chơi và còn quyền dùng kỹ năng Ban ngày.
- Target phải hợp lệ tại đúng version server chấp nhận.
- Mỗi lá chỉ được kích hoạt kỹ năng tối đa một lần trong cùng một vòng, kể cả role có cả kỹ năng ngày và đêm.
- Mỗi role có thể định nghĩa thêm `chargesPerMatch` và `revealRule` riêng.
- Mặc định skill Ban ngày dùng `revealRule = onSuccess`; skill Ban đêm dùng `revealRule = neverOnNormalUse`. Ngoại lệ phải được khai báo theo action, như Tiên tri dùng `onExecutionResolve` cho lệnh kết liễu.
- Khi đã lộ thì role giữ trạng thái lộ đến hết trận.
- Số lần đã dùng và trạng thái đã lộ không được reset khi lá chết rồi hồi sinh.
- Kết quả công khai được ghi vào timeline ngay sau resolve.

#### Treo cổ

1. Chọn một lá còn trên sân của đối thủ.
2. Chọn một vai trò để đoán.
3. Xác nhận target và dự đoán.
4. Nếu đúng: target lộ vai trò và bị loại.
5. Nếu sai: không lá nào bị loại; hành động Ban ngày đã được dùng.
6. Kết quả đúng/sai và vai trò được đoán là thông tin công khai.

Treo cổ không phải kỹ năng của một lá, nên không làm lộ lá nào của người thực hiện.

Sau khi một án Treo cổ hợp lệ xác nhận đúng role và công khai role target nhưng trước khi loại target, server đi qua một reaction window trung tính. Nếu bên phòng thủ còn một Kẻ Thế Mạng sống và chưa dùng phản ứng, chủ sở hữu nhận `COUNCIL_REACTION_CHOICE` riêng với lựa chọn Có/Không; phía còn lại chỉ thấy trạng thái chờ. Presentation và thời lượng public của reaction window phải giống nhau dù có Kẻ Thế Mạng hay không, tránh làm lộ sự tồn tại của role qua timing.

- Chọn Không: không tiêu phản ứng; Treo cổ target như thường.
- Chọn Có: Kẻ Thế Mạng lộ và bị loại thay target; target sống nhưng vẫn ở trạng thái đã lộ; phản ứng bị tiêu vĩnh viễn.
- Không mở reaction khi buộc tội sai, target chính là Kẻ Thế Mạng, Kẻ Thế Mạng đã chết/đã dùng, hoặc nguồn loại bỏ không phải Treo cổ.
- Nếu cả hai bên có án Treo cổ hợp lệ, server thu và khóa kín cả hai reaction choice trước khi resolve; lựa chọn của bên này không được lộ cho bên kia giữa batch.
- Resolve death reaction phát sinh từ cái chết của Kẻ Thế Mạng nếu có, rồi mới chạy `WIN_CHECK`.

#### Bỏ lượt ngày

Bỏ lượt cần xác nhận, tạo event công khai `DAY_PASSED` và chuyển lượt như một hành động hợp lệ.

### 5.4 `NIGHT_A_COMMIT` và `NIGHT_B_COMMIT`

Mỗi người chọn đúng một action Ban đêm. **Bỏ lượt đêm được phép** và được xử lý như một action hợp lệ.

- A chọn và khóa trước.
- B chỉ biết A đã khóa, không biết source, target hay loại action.
- Khi server nhận action của B, cả hai action được khóa và flow chuyển sang `NIGHT_RESOLVE`.
- Action đêm chưa tạo timeline công khai cho tới `DAWN_REVEAL`.
- Người đã khóa không thể đổi action, kể cả khi đối thủ mất kết nối.
- Nếu source bị loại bởi action có priority cao hơn, action đã khóa của source vẫn tiếp tục resolve từ snapshot lúc commit.
- Việc dùng kỹ năng đêm vẫn tính vào giới hạn một lần/vòng. Source không tự lộ tại `DAWN_REVEAL`; chỉ action có `revealRule` riêng mới công bố source. Tiên tri lộ tại Bình minh khi lệnh kết liễu resolve, kể cả nếu bị Bảo vệ chặn.

Validation khi commit dựa trên state hiện tại. Nếu target trở thành không hợp lệ trong lúc resolve do action ưu tiên cao hơn, action sau **fizzle** và log ghi lý do; không yêu cầu chọn lại giữa đêm.

### 5.5 `NIGHT_RESOLVE`

Đây là system state. Server chuyển hai action thành event nội bộ, sắp xếp theo priority, resolve tuần tự, chạy reaction bắt buộc, chạy `WIN_CHECK` và tạo payload cho Bình minh.

Luật resolve đã chốt:

- Bảo vệ chặn mọi nguồn loại bỏ trong thời gian hiệu lực, gồm Ma Sói, độc, Thợ săn và hiệu ứng tương tự.
- Bảo vệ Ban đêm không chặn Treo cổ Ban ngày.
- Một target được bảo vệ không bị loại dù nhận nhiều hiệu ứng loại bỏ trong cùng đêm.
- Action đêm đã khóa vẫn resolve kể cả source bị loại trước lượt resolve của nó.
- Nếu cả hai bên cùng hết bài sau khi toàn bộ action và reaction hoàn tất, kết quả là hòa.
- `WIN_CHECK` chỉ chạy sau khi toàn bộ batch action chính và death reaction đã hoàn tất.

#### Thứ tự resolve đề xuất — chờ xác nhận

1. Chụp snapshot hai action đã khóa.
2. Áp dụng Protection và các effect phòng thủ.
3. Resolve các action chính từ snapshot; source chết không hủy action. Kết quả điều tra vẫn được tạo nếu target chết cùng đêm.
4. Đưa các passive khi chết vào hàng đợi và xử lý death reaction.
5. Chạy `WIN_CHECK`; nếu hai board cùng rỗng thì hòa.
6. Tạo timeline công khai và private result cho `DAWN_REVEAL`.

#### Recommendation cho Thợ săn — chờ xác nhận

- Khi Thợ săn bị loại, lá lộ vai trò và tạo một death reaction bắt buộc, tối đa một lần trong cả trận.
- Nếu chết Ban ngày, reaction diễn ra ngay sau action hiện tại. Nếu chết Ban đêm, các action đêm đã khóa resolve xong trước, rồi mới xử lý reaction.
- Chủ sở hữu chọn một lá đối thủ còn sống để kéo theo. Trận tạm dừng ở `DEATH_REACTION_CHOICE` cho tới khi lựa chọn hợp lệ được xác nhận.
- Protection còn hiệu lực có thể chặn phát bắn của Thợ săn.
- Hồi sinh Thợ săn không reset death reaction nếu nó đã được dùng.

### 5.6 `DAWN_REVEAL`

Bình minh công bố event theo thứ tự resolve, nhưng chỉ lộ trường được phép công khai: lá bị loại/hồi sinh, effect công khai, source có luật lộ riêng, action fizzle và thay đổi board công khai. Ma sói tấn công và Tiên tri soi thường không làm lộ source.

Hai client nhận cùng một public timeline. Thông tin điều tra như kết quả Tiên tri chỉ xuất hiện trong private payload của chủ sở hữu.

Target khiên chỉ hiển thị cho chủ sở hữu trong lúc Phòng thủ. Nếu block thành công, public timeline chỉ công bố vị trí được cứu; loại lệnh và source vẫn kín. Soi thường không tạo public replay/timeline item; chỉ lệnh kết liễu Tiên tri mới công khai source theo rule riêng.

- Nếu đã có kết quả, sau reveal chuyển tới `MATCH_RESULT`.
- Nếu chưa kết thúc, hoàn tất `ROUND_END`, tăng số vòng và quay lại `ROUND_START`.

### 5.7 Hồi sinh

- Hồi sinh của Phù thủy là action Ban ngày và resolve ngay sau khi server chấp nhận, trước `WIN_CHECK`.
- Target là một lá của mình đang ở vùng đã chết; lá trở lại vị trí ban đầu với trạng thái sống.
- Lá được hồi sinh có thể tham gia các pha còn lại của vòng nếu hợp lệ.
- Bộ đếm dùng kỹ năng, trạng thái đã lộ và passive đã tiêu hao được giữ nguyên; hồi sinh không tạo một bản sao mới của lá.

## 6. Thanh trừng

- Vòng 1–5 dùng luật thường.
- Từ Vòng 6, sau `DAWN_REVEAL` và trước action Ban ngày, mỗi vòng có một pha **Thanh trừng** màu đỏ.
- Thanh trừng là bắt buộc, hai bên chọn bí mật và resolve đồng thời; không có Bỏ qua.
- Chu kỳ prototype cố định: Vòng 6 **Cắt bỏ**, Vòng 7 **Đảo chiến tuyến**, Vòng 8 **Ép lộ diện**, Vòng 9 **Khóa mạch**. Chu kỳ lặp lại hoặc mở rộng sau playtest.
- Thanh trừng chạy `WIN_CHECK`; nếu trận chưa kết thúc mới vào `DAY_A`.

### 6.1 Quy tắc từng vòng

1. **Vòng 6 — Cắt bỏ:** mỗi bên chọn một lá phe mình còn sống để loại; death reaction hợp lệ vẫn chạy.
2. **Vòng 7 — Đảo chiến tuyến:** mỗi bên chọn một lá của mình để hoán đổi vị trí với một lá đối thủ; card identity, ownership và role giữ nguyên, chỉ position ID đổi. Nếu bốn lựa chọn có vị trí trùng nhau, toàn bộ batch fizzle, không đổi vị trí và không yêu cầu chọn lại. Sau lựa chọn đầu tiên, nếu phía còn lại không còn một cặp own/enemy không trùng hai vị trí đã khóa, engine tự fizzle batch ngay để không chờ một response bất khả thi.
3. **Vòng 8 — Ép lộ diện:** mỗi bên chọn một lá phe mình chưa lộ để công khai role.
4. **Vòng 9 — Khóa mạch:** mỗi bên chọn một lá còn sống; lá đó không được dùng active skill hoặc tham gia Vote trong vòng hiện tại. Death reaction/passive đã đủ điều kiện vẫn hoạt động, gồm Kẻ Thế Mạng và Kẻ báo thù.

Engine validate mọi target tại commit. Swap conflict làm toàn batch fizzle và ghi log để không lộ lựa chọn qua một lượt reselect giữa pha kín. Các death reaction phát sinh từ Cắt bỏ vẫn cần chốt priority đầy đủ trong GD-06.

## 7. Kết thúc trận

### 7.1 Final Duel

Sau mỗi resolution, nếu chưa có bên hết bài nhưng mỗi bên còn đúng một lá, server chuyển tới `FINAL_DUEL` trước phase kế tiếp.

- Hai bên khóa kín đúng một dự đoán role của lá cuối đối thủ; dự đoán đã khóa không được sửa.
- Hai bên cùng đúng: hòa.
- Chỉ một bên đúng: bên đó thắng.
- Hai bên cùng sai: hòa.
- Sau resolve, toàn bộ role hai board được công khai và trận chuyển tới `MATCH_RESULT`.

### 7.2 `WIN_CHECK`

Chạy sau mỗi action Ban ngày, toàn bộ batch Ban đêm, Thanh trừng có thể loại lá, nhận thua và khi reconnect window hết hạn.

Một người thua khi không còn lá trên sân, xác nhận Nhận thua hoặc không reconnect trước deadline.

Win-check giữa đêm không công bố ngay; kết quả đi qua `DAWN_REVEAL` trước `MATCH_RESULT`, trừ nhận thua hoặc timeout kết nối cần kết thúc ngay.

### 7.3 Nhận thua

- Có thể mở từ menu trong trận và cần confirm hai bước.
- Sau khi server chấp nhận, trận kết thúc ngay; action chưa resolve bị hủy.
- Đối thủ thấy lý do `OPPONENT_SURRENDERED`.

### 7.4 `MATCH_RESULT`

Hiển thị thắng/thua/hòa, lý do kết thúc, toàn bộ vai trò, timeline tóm tắt, thời lượng và số vòng. Nếu cả hai cùng hết bài trong một batch resolve, lý do là `DRAW_BOTH_BOARDS_EMPTY`.

- **Đấu lại:** khi cả hai đồng ý, quay về `LOADOUT_SETUP`; seat A/B giữ nguyên ở v0.1.
- **Đối thủ khác:** rời room và về `HOME` để tạo/vào phòng mới.
- **Thoát:** rời room và về `HOME`.

Nếu chỉ một người chọn Đấu lại, họ ở trạng thái chờ và có thể hủy. Nếu đối thủ rời, yêu cầu rematch hết hiệu lực.

Trong prototype local một người đấu BOT, nút **Chơi lại** xem như BOT đồng ý ngay và tạo một state `LOADOUT_SETUP` mới; query QA hiện tại không được áp lại lên rematch state.

## 8. Reconnect và trạng thái bất thường

### 8.1 Mất kết nối ngắn

- Server giữ seat, loadout, action đã khóa và deadline.
- Người còn lại thấy banner cùng đồng hồ reconnect.
- Match tạm dừng timer lượt; state game không tự tiến.
- Người chơi quay lại bằng participant token nhận snapshot mới nhất.
- Giả thuyết Alpha là 45 giây; DEV-03 cần kiểm chứng trong khoảng 20–60 giây.

### 8.2 Hết reconnect window

- Server tạo event `PLAYER_FORFEITED_BY_DISCONNECT`.
- Người mất kết nối thua; người còn lại tới `MATCH_RESULT`.
- Nếu cả hai cùng offline, server giữ room tới deadline. Cách xử lý khi cả hai cùng hết hạn cần Dev đề xuất.

### 8.3 Refresh, nhiều tab và command trễ

- Refresh là reconnect, không phải rời trận.
- Mỗi participant chỉ có một connection điều khiển active; tab cũ thành read-only hoặc bị thu hồi quyền submit.
- Command trùng `commandId` trả kết quả cũ, không resolve lần hai.
- Command từ phase/turn/version cũ bị từ chối; client đồng bộ snapshot và giải thích ngắn.

## 9. Information map tối thiểu

| State | Công khai cho cả hai | Riêng người chơi | Chưa lộ |
|---|---|---|---|
| `LOBBY` | Seat, nickname, online | Participant token của mình | Token đối thủ |
| `LOADOUT_SETUP` | Ready/chưa ready | 10 vai trò và vị trí của mình | Loadout đối thủ |
| `DAY_*` | Vòng, pha, lượt, board và timeline public | Vai trò, action hợp lệ của mình | Vai trò ẩn đối thủ |
| `NIGHT_*_COMMIT` | Ai đã/đang chờ khóa | Lựa chọn đêm của mình | Action đêm đối thủ |
| `NIGHT_RESOLVE` | Đang resolve | Không thêm thông tin | Outcome trước Bình minh |
| `DAWN_REVEAL` | Public outcome | Private effect của mình | Private outcome đối thủ |
| `MATCH_RESULT` | Toàn bộ vai trò và timeline | — | — |

Chi tiết field-level cho từng role sẽ được mở rộng trong GD-05.

## 10. Screen/state inventory tối thiểu

| UI state | Biến thể bắt buộc | Hành động chính |
|---|---|---|
| Home | mặc định, loading, lỗi vào phòng | Tạo / Vào phòng |
| Lobby | thiếu B, đủ người, đối thủ offline | Chờ / Rời |
| Chọn vai trò | chưa đủ, hợp lệ, đã xác nhận | Gán / Xác nhận |
| Đếm ngược | 3–2–1, bị hủy | Hủy |
| Match intro | A đi trước / B đi sau | Tự tiếp tục |
| Lượt ngày của mình | kỹ năng, Treo cổ, bỏ lượt, lỗi | Chọn / Xác nhận |
| Chờ lượt ngày | đối thủ online/offline | Quan sát |
| Lượt đêm của mình | chọn source/target, bỏ lượt, đã khóa | Khóa lựa chọn |
| Chờ đêm | đối thủ chưa khóa/offline | Chờ |
| Bình minh | một/nhiều event, private result | Xem kết quả |
| Thanh trừng | thông báo, cần chọn, đã chọn | Chọn bắt buộc / chờ resolve |
| Reconnect | đang nối lại, đối thủ mất mạng, hết hạn | Chờ / Rời |
| Kết quả | thắng, thua, hòa, các lý do | Đấu lại / Đối thủ khác / Thoát |
| Chờ đấu lại | đã gửi, đối thủ rời/từ chối | Hủy chờ / Thoát |

## 11. Scenario dùng để review flow

Flow đạt trạng thái “Xong” khi cả team đi qua được các scenario sau mà không phải tự bịa thêm nhánh chính:

1. A tạo phòng, B vào, cả hai dùng loadout mặc định và chơi hết một vòng bằng Bỏ lượt.
2. A Treo cổ đúng và loại lá cuối của B; trận kết thúc trước lượt B.
3. A Treo cổ sai; B dùng kỹ năng Ban ngày và source của B bị lộ.
4. Hai action đêm xung đột; action sau fizzle và log giải thích được.
5. Tiên tri nhận kết quả riêng ở Bình minh mà đối thủ không thấy.
6. B refresh sau khi khóa action đêm và quay lại đúng trạng thái chờ.
7. A mất mạng giữa lượt rồi quay lại trước deadline.
8. Một người hết reconnect window và thua với đúng lý do.
9. Một người nhận thua khi action đêm chưa resolve.
10. Cả hai Đấu lại và quay về chọn vai trò với seat A/B được giữ.

## 12. Quyết định còn mở và owner

| ID | Quyết định | Owner | Chặn |
|---|---|---|---|
| GF-01 | Timer lượt và pause khi reconnect | GD + Dev | Prototype web |
| GF-02 | Thợ săn reaction theo recommendation ở mục 5.5 | GD | Engine |
| GF-03 | Priority giữa kill/poison khi cùng target; protection chặn tất cả | GD + Dev | Engine |
| GF-06 | Bốn luật Thanh trừng và chi tiết priority/resolve | GD + Dev | Engine |
| GF-07 | Reconnect window và hai bên cùng offline | Dev + GD | Internal Alpha |
| GF-08 | Rematch có đổi người đi trước hay giữ A/B | GD | Playtest lợi thế A |

## 13. Recommendation để review sau Game Flow

### 13.1 Bộ 10 lá cơ bản

“Loại vai trò nào được dùng” nghĩa là chọn đúng các role xuất hiện trong bộ bài test, thay vì đưa toàn bộ role draft vào trận. Vì mỗi role đặc biệt chỉ có một lá, recommendation đơn giản nhất là:

| Số lượng | Vai trò | Giới hạn đề xuất |
|---:|---|---|
| 1 | Dân làng | 2 phiếu Hội đồng; không có skill |
| 2 | Ma Sói | Tấn công Ban đêm không làm lộ source |
| 1 | Tiên tri | Soi thường giữ kín; lệnh kết liễu làm lộ source tại Bình minh kể cả nếu bị chặn |
| 1 | Bảo vệ | Không giới hạn tổng số; không tự bảo vệ; cùng card không được bảo vệ hai đêm liên tiếp |
| 1 | Phù thủy | Hồi sinh 1 lần + đầu độc 1 lần/trận; không dùng cả hai trong cùng vòng |
| 1 | Xạ thủ | Bắn Ban ngày 1 lần/trận vào role đã lộ |
| 1 | Kẻ báo thù | Đánh dấu Ban ngày; death reaction hết hạn ở Bình minh kế tiếp |
| 1 | Mục sư | Thanh tẩy Ban ngày 1 lần/trận |
| 1 | Kẻ Thế Mạng | Phe Hắc Ám; chết thay một án Treo cổ hợp lệ 1 lần/trận |

Đặc tả reveal, target và edge case đầy đủ của bộ này nằm trong `roles-draft.md`. Bộ bài đã được chốt để sửa prototype nhưng chưa có human playtest chứng minh cân bằng.

### 13.2 Information map đề xuất

- Action ngày, target và kết quả: công khai ngay.
- Outcome action đêm: chỉ công khai phần được phép ở Bình minh.
- Source action đêm: mặc định không công khai, kể cả ở Bình minh; ngoại lệ được ghi theo action.
- Kết quả soi thường của Tiên tri: chỉ chủ sở hữu biết; đối thủ không biết Tiên tri nào đã dùng. Khi Tiên tri ra lệnh kết liễu, source lộ tại Bình minh dù target sống nhờ khiên.
- Target của Bảo vệ: giữ riêng nếu không bị tấn công; nếu chặn thành công, Bình minh công bố vị trí được cứu nhưng không công bố loại đòn bị chặn.
- Sau trận: lộ toàn bộ role, action và private result để người chơi hiểu màn đánh lừa.

### 13.3 Treo cổ đề xuất

- Đoán sai chỉ mất action Ban ngày, không tự mất lá ở bản test đầu.
- Danh sách dự đoán chỉ gồm các role có trong bộ 10 lá hiện tại.
- Vai trò đã lộ vẫn có thể bị Treo cổ bằng cách đoán đúng; đây là cái giá của việc dùng skill.
- Treo cổ kích hoạt passive khi chết, gồm Thợ săn.
- Sau 10–20 ván, đo tỷ lệ đoán mò. Chỉ tăng hình phạt nếu người chơi Treo cổ gần như mọi vòng mà không cần thông tin.

## 14. Giả thuyết cần kiểm chứng

- Host đi trước mọi pha có tạo lợi thế quá lớn không?
- Một hành động/người/pha có giữ trận trong 8–15 phút không?
- Công bố vai trò khi dùng kỹ năng có làm suy luận quá dễ không?
- Treo cổ bằng cách đoán vai trò có đủ hấp dẫn và công bằng không?
- Khóa A trước nhưng giấu action có tạo lợi thế cho B không?
- Thanh trừng từ Vòng 6 có đẩy nhịp mà không tạo cảm giác game quyết định thay người chơi không?
