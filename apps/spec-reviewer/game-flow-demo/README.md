# PROTOTYPE - Twofold chat playtest

Prototype này trả lời một câu hỏi: nhịp `Ban ngày -> Hội đồng -> khóa lệnh đêm kín -> Phòng thủ mù -> xử lý đêm -> Bình minh` có tạo ra đủ thông tin để phản ứng mà vẫn giữ được suy luận role ẩn hay không?

Vòng 1 bắt đầu thẳng ở Ban ngày, chưa có Hội đồng/treo cổ. Từ Vòng 2, Hội đồng diễn ra sau khi cả A và B hoàn tất lượt Ban ngày, trước khi hai bên khóa lệnh đêm.

Trước Vòng 1, mỗi bên bí mật sắp xếp thứ tự 10 lá rồi khóa đội hình. Vị trí ban đầu trở thành mã A1–A10 hoặc B1–B10; từ Vòng 7, Đảo chiến tuyến có thể đổi mã vị trí nhưng không đổi chủ sở hữu, identity hay role của lá.

Bản web hiện là chế độ một người: người chơi điều khiển bên A, còn B là bot local. Bot tự xếp đội hình và chỉ ra quyết định từ thông tin công khai cùng kết quả Tiên tri riêng của chính nó.

Đây là code throwaway. State chỉ nằm trong bộ nhớ và biến mất khi thoát.

## Chạy

```bash
npm run prototype:chat -- --seat=A --seed=twofold-01
```

## Seed fuzzing P0.6

Chạy full-match simulation deterministic để kiểm tra transition, BOT action và invariant state:

```bash
npm run fuzz:game --workspace=@twofold/spec-reviewer -- --count=500 --prefix=local
```

Mỗi seed phải kết thúc trong `250` transition. Khi fail, lỗi in seed, round, phase, action và trace gần nhất để tái hiện. Có thể đổi giới hạn bằng `--max-steps=<n>`.

P0.7 có thể fuzz thêm action sai và replay action đã khóa. Mọi rejection phải giữ state đầu vào nguyên vẹn:

```bash
npm run fuzz:game --workspace=@twofold/spec-reviewer -- --count=500 --invalid-count=200 --prefix=local
```

P0.8 ghi action stream kèm canonical state digest rồi replay từ cùng seed. Digest lệch sẽ báo đúng event đầu tiên:

```bash
npm run fuzz:game --workspace=@twofold/spec-reviewer -- --count=500 --replay-count=200 --prefix=local
```

### Bản web trực quan

Chạy reviewer bằng Vite:

```bash
pnpm --filter @twofold/spec-reviewer dev
```

Sau đó mở:

```text
http://127.0.0.1:4173/game-flow-demo/ui.html
```

Để QA trực tiếp một luật Thanh trừng mà không phải chơi lại từ Vòng 1, local browser có thể thêm `?purgeRound=6`, `7`, `8` hoặc `9`. Fixture này chỉ hoạt động trên `127.0.0.1`/`localhost`, khóa setup hai bên và mở thẳng phase Thanh trừng tương ứng; không phải save game hay đường dẫn dùng trong production.

Hai fixture local khác phục vụ hardening: `?qa=night-privacy` mở phase khóa lệnh đêm V2 để kiểm tra public/private payload; `?qa=final-duel` mở trạng thái 1–1 để kiểm tra dự đoán, kết quả và Chơi lại.

Bố cục A — Bàn đối đầu là phương án duy nhất đã được giữ lại. Trên desktop, toàn bộ bàn được khóa trong một màn hình: khu trái chỉ gồm đội B, card đã lộ ở giữa và đội A; diễn biến nằm góc phải trên, còn hướng dẫn/thao tác được neo ở góc phải dưới. Toàn bộ state vẫn chỉ nằm trong bộ nhớ của tab.

Ánh sáng sân đổi theo nhịp Ngày, Chạng vạng và Đêm. Sau khi xử lý lệnh đêm, UI khóa tương tác trong 3 giây Bình minh để quét sáng và công khai kết quả trước khi bước sang lượt mới.

`--seat=A` chỉ định tay riêng được hiển thị. Dùng `view B` nếu hai người đang thử chung một máy. Chế độ chat hiện dùng honor mode, chưa chống nhìn trộm tay đối phương.

## Bộ bài mỗi bên

- 1 Dân làng — có thể tham gia Hội đồng sau khi đã lộ diện
- 2 Ma sói
- 1 Tiên tri
- 1 Bảo vệ
- 1 Phù thủy
- 1 Xạ thủ
- 1 Kẻ báo thù
- 1 Mục sư
- 1 Kẻ Thế Mạng

## Lệnh chính

```text
council A pass
council A B3 A1 A2 A3
council A B3 guard A1 A2 A3
day A pass
day A shoot A9 B3
day A revive A8 A2
defend A pass
defend A A4
night A pass
night A attack A5 B4
night A inspect A7 B4
night A poison A8 B4
night A bloodmoon B4
resolve
final A guard
view A
chat
public
quit
```

Hội đồng mở từ Vòng 2 và cần tổng trọng số ít nhất 3 phiếu từ tối đa ba role phe Dân còn sống. Dân làng đóng góp 2 phiếu, role Dân khác đóng góp 1 phiếu, nên Dân làng + 1 role Dân khác đã đủ. Có thể chọn các lá còn úp ở hàng dưới; các voter được chọn sẽ bước lên và lộ diện khi Hội đồng xử lý. Đoán sai khóa các voter đó khỏi Hội đồng kế tiếp. Khi một án Treo cổ hợp lệ đã làm lộ target, Kẻ Thế Mạng còn sống được hỏi kín Có/Không để chết thay một lần; target được cứu vẫn nằm ngửa.

Nếu mục tiêu Hội đồng đã nằm ngửa trên sân, án treo được xử lý ngay và không cần đoán role. Nếu mục tiêu còn úp, người chơi chỉ được chọn trong các role chưa lộ đủ số lượng của bộ bài; ví dụ Ma sói vẫn còn trong danh sách sau khi mới lộ một trong hai lá.

Kẻ báo thù công khai đánh dấu một mục tiêu Ban ngày; nếu chết trước bình minh kế tiếp, mục tiêu chết theo. Mục sư có một lần thanh tẩy: giết đúng phe Sói, nhưng tự chết nếu chọn nhầm phe Dân.

Bảo vệ không giới hạn số lần dùng, không được tự bảo vệ và không được bảo vệ cùng vị trí hai vòng liên tiếp. Khiên chặn các hiệu ứng loại bỏ trực tiếp và death reaction, nhưng không chặn lần soi đầu của Tiên tri. Role của mục tiêu và vị trí Bảo vệ vẫn giữ kín.

Sau Ban ngày và Hội đồng, hai bên bí mật khóa lệnh đêm. Source, loại action và target đều không lộ trước khi hai bên chọn khiên. Lần soi đầu của Tiên tri ghi nhận phe sáng/tối riêng; phe sáng không thể bị soi lại, còn phe tối có thể bị chọn lại để kết liễu. Khiên không chặn lần soi đầu nhưng chặn đòn kết liễu. Soi thường không làm lộ Tiên tri; ra lệnh kết liễu làm Tiên tri lộ tại Bình minh kể cả khi bị chặn. Ma sói và Phù thủy không lộ source chỉ vì dùng skill đêm.

Target khiên chỉ hiện cho chủ sở hữu. Nếu block thành công, Bình minh công bố vị trí được cứu nhưng không công bố loại lệnh hay source. Soi thường không tạo replay công khai; kết quả chỉ nằm trong ghi chú riêng.

Từ Vòng 6, mỗi bên mở khóa card chiến thuật **Huyết Nguyệt**. Card này dùng Main Order để tấn công một role đối thủ đã lộ, vẫn bị khiên chặn và hồi lại sau hai vòng. Nó tạo áp lực cuối game khi các role attack ban đầu đã chết hoặc hết charge, nhưng vẫn giữ giới hạn một nguồn loại bỏ trong vòng.

Sau Bình minh từ Vòng 6, trước Ban ngày có **Thanh trừng** bắt buộc: V6 Cắt bỏ, V7 Đảo chiến tuyến, V8 Ép lộ diện, V9 Khóa mạch. Hai bên khóa lựa chọn kín rồi resolve đồng thời; không có Bỏ qua. Prototype tạm lặp chu kỳ này từ V10. Nếu lựa chọn Swap đụng cùng vị trí, cả batch fizzle để không làm lộ thông tin qua reselect. Khi lựa chọn đầu tiên không chừa lại bất kỳ cặp target không xung đột nào cho đối phương, engine auto-fizzle ngay và tiếp tục trận.

Lệnh `chat` tạo snapshot công khai ngắn để gửi nguyên văn vào cuộc trò chuyện. Mỗi người chỉ cần giữ bí mật tay riêng của mình và gửi action; một người chạy CLI làm trọng tài/state keeper.

Khi mỗi bên còn đúng một lá sau resolution, trận vào Final Duel. Hai bên khóa một dự đoán role cuối; cùng đúng hoặc cùng sai thì hòa, chỉ một bên đúng thì bên đó thắng. Kết thúc trận lộ toàn bộ role; **Chơi lại** tạo setup mới.
