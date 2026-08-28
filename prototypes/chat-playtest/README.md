# PROTOTYPE - Twofold chat playtest

Prototype này trả lời một câu hỏi: nhịp `Hội đồng -> Ban ngày -> khóa lệnh đêm -> lộ nguồn -> Phòng thủ -> xử lý đêm -> Bình minh` có tạo ra đủ thông tin để phản ứng mà không biến phòng thủ thành đáp án hoàn hảo hay không?

Hai vòng mở màn bắt đầu thẳng ở Ban ngày, chưa có Hội đồng/treo cổ. Hội đồng đầu tiên xuất hiện tại bình minh Vòng 3 và là hành động phụ trước Ban ngày, không tiêu lượt chính.

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
http://127.0.0.1:4173/prototypes/chat-playtest/ui.html
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

Hội đồng chỉ mở từ Vòng 3 và cần đúng ba role phe Dân còn sống. Có thể chọn các lá còn úp ở hàng dưới; ba người tham gia sẽ bước lên và lộ diện khi Hội đồng xử lý. Treo cổ không tiêu quyền loại bỏ, không làm mất lượt chính và ba người tham gia vẫn được dùng kỹ năng Ban ngày. Đoán sai khóa ba người đó khỏi Hội đồng kế tiếp. Sói Hộ Vệ có thể bí mật bảo kê trước một lá và lộ diện nếu chặn đúng án treo cổ.

Nếu mục tiêu Hội đồng đã nằm ngửa trên sân, án treo được xử lý ngay và không cần đoán role. Nếu mục tiêu còn úp, người chơi chỉ được chọn trong các role chưa lộ đủ số lượng của bộ bài; ví dụ Ma sói vẫn còn trong danh sách sau khi mới lộ một trong hai lá.

Kẻ báo thù công khai đánh dấu một mục tiêu Ban ngày; nếu chết trước bình minh kế tiếp, mục tiêu chết theo. Mục sư có một lần thanh tẩy: giết đúng phe Sói, nhưng tự chết nếu chọn nhầm phe Dân.

Bảo vệ chỉ công khai vị trí có khiên. Role của mục tiêu và vị trí Bảo vệ vẫn giữ kín; không được bảo vệ cùng vị trí hai vòng liên tiếp. Khi một lá chết, role thật của nó được công khai.

Sau Ban ngày, hai bên bí mật khóa lệnh đêm. Khi cả hai đã chọn, card nguồn bước lên và lộ role nhưng mục tiêu vẫn được giữ kín. Hai bên sau đó mới chọn khiên; card được bảo hộ tiến về giữa sân nhưng không lật. Bàn giữ trạng thái khoảng 3,2 giây rồi xử lý đồng thời; pha Bình minh tiếp tục khóa thao tác thêm 3 giây để công khai kết quả. Khiên chặn một hiệu ứng đêm bất lợi gồm cắn, độc hoặc soi.

Từ Vòng 6, mỗi bên mở khóa card chiến thuật **Huyết Nguyệt**. Card này dùng Main Order để tấn công một role đối thủ đã lộ, vẫn bị khiên chặn và hồi lại sau hai vòng. Nó tạo áp lực cuối game khi các role attack ban đầu đã chết hoặc hết charge, nhưng vẫn giữ giới hạn một nguồn loại bỏ trong vòng.

Lệnh `chat` tạo snapshot công khai ngắn để gửi nguyên văn vào cuộc trò chuyện. Mỗi người chỉ cần giữ bí mật tay riêng của mình và gửi action; một người chạy CLI làm trọng tài/state keeper.
