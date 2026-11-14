# Device checklist

Thiết bị: iPhone 11, iPhone 16, iPhone 17 Pro. Ghi Đạt / Không đạt, phiên bản iOS và ghi chú.

## Bước 0 — Đăng nhập Google trong PWA standalone (M1)

1. Safari mở `<APP_URL>/dang-nhap` → Chia sẻ → Thêm vào MH chính → mở từ biểu tượng.
2. Bấm "Đăng nhập bằng Google", hoàn tất đăng nhập.
3. Kỳ vọng: quay lại **bên trong** app (không phải tab Safari), trang "Bạn chưa được mời" hiện đúng Gmail.
4. Vuốt tắt hẳn app, mở lại từ biểu tượng. Kỳ vọng: vẫn ở trang có Gmail, không phải trang đăng nhập.

| Máy           | iOS  | Kết quả | Ghi chú                    |
| ------------- | ---- | ------- | -------------------------- |
| iPhone 11     | 16.4 | Đạt     | Đạt cả 4 bước (2026-11-14) |
| iPhone 16     | 18.2 | Đạt     | Đạt cả 4 bước (2026-11-14) |
| iPhone 17 Pro | 26.5 | Đạt     | Đạt cả 4 bước (2026-11-14) |

## Bước 2 — Nhắc bú (M11)

1. Cài đặt → Thông báo: "Máy này đang nhận thông báo.". Cài đặt → Khoảng cách cữ bú: chọn "1 giờ" → Lưu.
2. Nhật ký → "+ Thêm" → Bú bình 30 ml, Thời điểm = bây giờ trừ 59 phút → Lưu. Khóa màn hình.
3. Kỳ vọng: trong ≤ 2 phút nhận thông báo "Đến giờ bú rồi" / "Cữ trước lúc HH:mm (1 giờ … trước)." trên mọi máy đã bật thông báo; bấm vào thì mở trang chủ Bé Yêu.

| Máy           | iOS | Kết quả | Ghi chú                         |
| ------------- | --- | ------- | ------------------------------- |
| iPhone 11     |     |         | Chỉ khi đã lên iOS 16.4 trở lên |
| iPhone 16     |     |         |                                 |
| iPhone 17 Pro |     |         |                                 |

## Bước 4 — Ghi khi offline rồi đồng bộ (M12)

1. Mở Bé Yêu từ màn hình chính khi có mạng, rồi bật chế độ máy bay.
2. Trang chủ → "Tã" → Lưu, làm hai lần. Kỳ vọng: hai dòng tã hiện ngay trong "24 giờ qua".
3. Tắt chế độ máy bay, giữ app mở. Kỳ vọng: trong ≤ 30 giây máy thứ hai (hoặc Supabase → Table Editor → `logs`) thấy đủ hai tã, đúng giờ đã ghi lúc offline.
4. Xóa hai bản ghi tã thử ở Nhật ký.

| Máy           | iOS  | Kết quả | Ghi chú                                                                                                          |
| ------------- | ---- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| iPhone 11     |      | Bỏ qua  | Không thử ở M12                                                                                                  |
| iPhone 16     | 18.2 | Đạt     | Đạt (2026-11-14). Lần đầu máy còn chạy bản cũ: phải mở app khi có mạng, tắt hẳn rồi mở lại trước khi bật máy bay |
| iPhone 17 Pro | 26.5 | Đạt     | Đạt (2026-11-14). Như iPhone 16                                                                                  |

## Bước 7 — Tạm tắt (M11, phần nhắc bú)

1. Cài đặt → Thông báo → "2 giờ".
2. Nhật ký → "+ Thêm" → Bú bình 30 ml, Thời điểm = bây giờ trừ 61 phút → Lưu. Kỳ vọng: 3 phút không có thông báo trên máy này.
3. Bấm "Bật lại". Kỳ vọng: trong ≤ 2 phút nhận "Đến giờ bú rồi".
4. Dọn dẹp: xóa hai bản ghi Bú bình thử; Khoảng cách cữ bú đặt lại giá trị cũ (thường "3 giờ").
5. Phần "nhắc tiêm vẫn đến khi tạm tắt" kiểm ở đợt 2.

| Máy           | iOS | Kết quả | Ghi chú                         |
| ------------- | --- | ------- | ------------------------------- |
| iPhone 11     |     |         | Chỉ khi đã lên iOS 16.4 trở lên |
| iPhone 16     |     |         |                                 |
| iPhone 17 Pro |     |         |                                 |
