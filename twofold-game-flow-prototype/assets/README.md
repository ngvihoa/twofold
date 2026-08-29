# Assets

Nơi lưu tài sản dùng chung của project.

```text
assets/
├── audio/        # Âm thanh, nhạc thử nghiệm và license
├── brand/        # Logo, màu, font và hướng dẫn thương hiệu
├── game/         # Card art, icon vai trò, hiệu ứng
└── ui/           # Export UI, wireframe tham chiếu
```

Quy ước:

- Không commit file nguồn/tài sản có license không rõ.
- Ghi nguồn và license trong file `LICENSES.md` khi thêm asset bên thứ ba.
- Ưu tiên Git LFS cho file nhị phân lớn nếu repo bắt đầu chứa nhiều ảnh/âm thanh.
- Không dùng thư mục này cho export tạm; file tạm nằm ngoài repo hoặc trong thư mục bị ignore.
