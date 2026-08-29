# PROTOTYPE - Twofold chat playtest

Prototype này trả lời một câu hỏi: nhịp `Bình minh -> Thanh trừng (V6+) -> Ban ngày -> Vote (V2+) -> khóa lệnh đêm -> Phòng thủ -> xử lý đêm` có tạo ra đủ thông tin để phản ứng mà không biến phòng thủ thành đáp án hoàn hảo hay không?

Vòng 1 bắt đầu thẳng ở Ban ngày và chưa có Vote. Từ Vòng 2, Vote diễn ra sau khi hai bên hoàn tất hành động Ban ngày và trước Ban đêm; nó không tiêu Main Order.

Trước Vòng 1, mỗi bên bí mật sắp xếp thứ tự 10 lá rồi khóa đội hình. Vị trí đã khóa trở thành mã A1–A10 hoặc B1–B10 trong suốt ván.

Bản web hiện là chế độ một người: người chơi điều khiển bên A, còn B là bot local. Bot tự xếp đội hình và chỉ ra quyết định từ thông tin công khai cùng kết quả Tiên tri riêng của chính nó.

Đây là code throwaway. State chỉ nằm trong bộ nhớ và biến mất khi thoát.

## Chạy

```bash
npm run prototype:chat -- --seat=A --seed=twofold-01
```

### Bản web trực quan

Khi local server đang chạy, mở:

```text
http://127.0.0.1:4173/game-flow-demo/ui.html
```

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
- 1 Sói Hộ Vệ

## Lệnh chính

```text
begin
purge A A3
purge A A3 B4
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

Hội đồng mở từ Vòng 2 sau Ban ngày và cần đúng ba role phe Dân còn sống. Dân làng đóng góp 2 phiếu nhưng vẫn chỉ tính là một trong ba nhân vật. Có thể chọn các lá còn úp; ba người tham gia sẽ bước lên và lộ diện khi Hội đồng xử lý. Treo cổ không tiêu Main Order. Đoán sai khóa ba người đó khỏi Hội đồng kế tiếp. Sói Hộ Vệ có thể bí mật bảo kê trước một lá và lộ diện nếu chặn đúng án treo cổ.

Nếu mục tiêu Hội đồng đã nằm ngửa trên sân, án treo được xử lý ngay và không cần đoán role. Nếu mục tiêu còn úp, người chơi chỉ được chọn trong các role chưa lộ đủ số lượng của bộ bài; ví dụ Ma sói vẫn còn trong danh sách sau khi mới lộ một trong hai lá.

Kẻ báo thù công khai đánh dấu một mục tiêu Ban ngày; nếu chết trước bình minh kế tiếp, mục tiêu chết theo. Mục sư có một lần thanh tẩy: giết đúng phe Sói, nhưng tự chết nếu chọn nhầm phe Dân.

Bảo vệ chỉ công khai vị trí có khiên. Role của mục tiêu và Bảo vệ vẫn giữ kín; không được tự bảo vệ hoặc bảo vệ cùng một lá trong hai đêm liên tiếp. Khiên chặn cắn, độc và Huyết Nguyệt, nhưng không chặn Tiên tri.

Sau Vote, hai bên bí mật khóa lệnh đêm rồi chọn khiên. Nguồn và mục tiêu của lệnh đêm đều giữ kín tới Bình minh; chỉ vị trí có khiên được công khai trước. Bình minh khóa thao tác và lần lượt trình bày từng nguồn, mục tiêu và kết quả.

Từ Vòng 6 có pha bắt buộc **Thanh trừng** trước Ban ngày: V6 Cắt bỏ, V7 Đảo chiến tuyến, V8 Ép lộ diện và V9 Khóa mạch. Khóa mạch vô hiệu kỹ năng và quyền Vote của lá được chọn trong vòng hiện tại.

Từ Vòng 6, mỗi bên mở khóa card chiến thuật **Huyết Nguyệt**. Card này dùng Main Order để tấn công một role đối thủ đã lộ, vẫn bị khiên chặn và hồi lại sau hai vòng. Nó tạo áp lực cuối game khi các role attack ban đầu đã chết hoặc hết charge, nhưng vẫn giữ giới hạn một nguồn loại bỏ trong pha đêm. Quyền loại bỏ của Ban ngày và Ban đêm được tính riêng theo giới hạn một hành động chính trong mỗi pha.

Lệnh `chat` tạo snapshot công khai ngắn để gửi nguyên văn vào cuộc trò chuyện. Mỗi người chỉ cần giữ bí mật tay riêng của mình và gửi action; một người chạy CLI làm trọng tài/state keeper.
